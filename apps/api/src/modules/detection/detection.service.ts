import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  Cadence,
  CommitmentCategory,
  CommitmentStatus,
  CommitmentType,
  CommitmentSource,
  VerificationState,
  DetectionReviewStatus,
} from '@subguard/types';
import { ConfirmCandidateInput } from '@subguard/validation';
import { daysBetween, parseDate, getNextDueDate } from '@subguard/utils';

@Injectable()
export class DetectionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deterministic recurrence detection scan across all user debit transactions.
   */
  async runDetection(userId: string) {
    const debits = await this.prisma.transaction.findMany({
      where: {
        userId,
        direction: 'DEBIT',
        isExcludedFromDetection: false,
      },
      orderBy: { transactionDate: 'asc' },
    });

    if (debits.length < 2) {
      return {
        scannedTransactions: debits.length,
        candidatesFound: 0,
        candidates: [],
      };
    }

    // Group transactions by merchantKey
    const groups = new Map<string, typeof debits>();
    for (const txn of debits) {
      const key = txn.merchantKey;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(txn);
    }

    // Fetch existing commitments and candidates to prevent duplicates
    const [existingCommitments, existingCandidates] = await Promise.all([
      this.prisma.commitment.findMany({
        where: { userId },
        select: { merchant: true, name: true },
      }),
      this.prisma.detectionCandidate.findMany({
        where: { userId },
        select: { merchantKey: true, reviewStatus: true },
      }),
    ]);

    const activeMerchantSet = new Set(
      existingCommitments.map((c) => c.merchant.toLowerCase().trim())
    );
    const handledKeySet = new Set(
      existingCandidates
        .filter(
          (c) =>
            c.reviewStatus === DetectionReviewStatus.DISMISSED ||
            c.reviewStatus === DetectionReviewStatus.CONFIRMED
        )
        .map((c) => c.merchantKey)
    );

    const newCandidates: Array<{
      merchantKey: string;
      merchantDisplayName: string;
      proposedCadence: Cadence;
      proposedAmountMinor: bigint;
      amountIsVariable: boolean;
      minAmountMinor: bigint;
      maxAmountMinor: bigint;
      confidence: number;
      evidence: any;
    }> = [];

    for (const [merchantKey, txs] of groups.entries()) {
      // Skip if previously reviewed (dismissed or confirmed) by user
      if (handledKeySet.has(merchantKey)) {
        continue;
      }

      // Need at least 2 transactions to form an interval
      if (txs.length < 2) {
        continue;
      }

      const displayName = txs[0].merchantNormalized;

      // Skip if already tracked as an active subscription
      if (activeMerchantSet.has(displayName.toLowerCase().trim())) {
        continue;
      }

      // Compute intervals between consecutive transactions
      const intervals: number[] = [];
      for (let i = 0; i < txs.length - 1; i++) {
        const d1 = txs[i].transactionDate.toISOString().slice(0, 10);
        const d2 = txs[i + 1].transactionDate.toISOString().slice(0, 10);
        intervals.push(daysBetween(d1, d2));
      }

      const avgInterval =
        intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

      // Classify cadence hypothesis
      let cadence: Cadence | null = null;
      if (avgInterval >= 6 && avgInterval <= 9) {
        cadence = Cadence.WEEKLY;
      } else if (avgInterval >= 26 && avgInterval <= 34) {
        cadence = Cadence.MONTHLY;
      } else if (avgInterval >= 85 && avgInterval <= 96) {
        cadence = Cadence.QUARTERLY;
      } else if (avgInterval >= 355 && avgInterval <= 375) {
        cadence = Cadence.ANNUALLY;
      }

      if (!cadence) {
        continue; // Non-recurring irregular purchases
      }

      // Analyze amounts
      const amounts = txs.map((t) => Number(t.amountMinor));
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);
      const isVariable = minAmount !== maxAmount;
      const varianceRatio = (maxAmount - minAmount) / maxAmount;

      // If amounts fluctuate wildly (> 35%), likely unrelated shopping purchases, not subscription
      if (varianceRatio > 0.35) {
        continue;
      }

      // Compute explainable confidence score
      let confidence = 0.5;
      const reasons: string[] = [
        `Detected ${txs.length} transactions with an average interval of ${Math.round(avgInterval)} days (consistent with ${cadence} cadence).`,
      ];

      if (txs.length >= 3) {
        confidence += 0.2;
        reasons.push(`Pattern reinforced across ${txs.length} consecutive billing cycles.`);
      }

      if (!isVariable) {
        confidence += 0.2;
        reasons.push('Exact identical debited amounts across all transactions.');
      } else {
        confidence += 0.05;
        reasons.push(
          `Slight amount variance (${Math.round(varianceRatio * 100)}%), typical for utility, usage-based, or foreign currency billing.`
        );
      }

      confidence = Math.min(0.95, Math.max(0.4, confidence));

      const latestTx = txs[txs.length - 1];
      const proposedAmount = BigInt(amounts[amounts.length - 1]); // Most recent charge

      newCandidates.push({
        merchantKey,
        merchantDisplayName: displayName,
        proposedCadence: cadence,
        proposedAmountMinor: proposedAmount,
        amountIsVariable: isVariable,
        minAmountMinor: BigInt(minAmount),
        maxAmountMinor: BigInt(maxAmount),
        confidence,
        evidence: {
          matchedTransactionCount: txs.length,
          transactionDates: txs.map((t) =>
            t.transactionDate.toISOString().slice(0, 10)
          ),
          averageIntervalDays: Math.round(avgInterval),
          amountVariancePercent: Math.round(varianceRatio * 100),
          reasons,
        },
      });
    }

    // Persist discovered candidates in DB
    for (const candidate of newCandidates) {
      await this.prisma.detectionCandidate.upsert({
        where: {
          id:
            (
              await this.prisma.detectionCandidate.findFirst({
                where: { userId, merchantKey: candidate.merchantKey },
              })
            )?.id || '00000000-0000-0000-0000-000000000000',
        },
        create: {
          userId,
          ...candidate,
          reviewStatus: DetectionReviewStatus.PENDING,
        },
        update: {
          proposedCadence: candidate.proposedCadence,
          proposedAmountMinor: candidate.proposedAmountMinor,
          amountIsVariable: candidate.amountIsVariable,
          minAmountMinor: candidate.minAmountMinor,
          maxAmountMinor: candidate.maxAmountMinor,
          confidence: candidate.confidence,
          evidence: candidate.evidence,
        },
      });
    }

    return {
      scannedTransactions: debits.length,
      candidatesFound: newCandidates.length,
      candidates: newCandidates.map((c) => ({
        ...c,
        proposedAmountMinor: Number(c.proposedAmountMinor),
        minAmountMinor: Number(c.minAmountMinor),
        maxAmountMinor: Number(c.maxAmountMinor),
      })),
    };
  }

  async listCandidates(userId: string) {
    const items = await this.prisma.detectionCandidate.findMany({
      where: { userId, reviewStatus: DetectionReviewStatus.PENDING },
      orderBy: { confidence: 'desc' },
    });

    return items.map((c) => ({
      ...c,
      proposedAmountMinor: Number(c.proposedAmountMinor),
      minAmountMinor: c.minAmountMinor ? Number(c.minAmountMinor) : null,
      maxAmountMinor: c.maxAmountMinor ? Number(c.maxAmountMinor) : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async confirmCandidate(
    userId: string,
    candidateId: string,
    input: ConfirmCandidateInput
  ) {
    const candidate = await this.prisma.detectionCandidate.findFirst({
      where: { id: candidateId, userId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create confirmed commitment
      const commitment = await tx.commitment.create({
        data: {
          userId,
          name: input.name,
          merchant: input.merchant,
          category: input.category,
          type: CommitmentType.SUBSCRIPTION,
          amountMinor: BigInt(input.amountMinor),
          currency: 'INR',
          cadence: input.cadence,
          nextDueAt: parseDate(input.nextDueAt),
          status: CommitmentStatus.ACTIVE,
          source: CommitmentSource.DETECTED_IMPORT,
          verificationState: VerificationState.USER_VERIFIED,
          confidence: candidate.confidence,
          paymentMethodLabel: input.paymentMethodLabel || null,
          cancellationUrl: input.cancellationUrl || null,
        },
      });

      // Mark candidate confirmed and link commitment
      await tx.detectionCandidate.update({
        where: { id: candidateId },
        data: {
          reviewStatus: DetectionReviewStatus.CONFIRMED,
          linkedCommitmentId: commitment.id,
        },
      });

      // Add default reminder
      await tx.reminder.create({
        data: {
          userId,
          commitmentId: commitment.id,
          offsetDays: 3,
          enabled: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          userId,
          action: 'CANDIDATE_CONFIRMED',
          entityType: 'Commitment',
          entityId: commitment.id,
          metadata: { candidateId, name: commitment.name },
        },
      });

      return {
        ...commitment,
        amountMinor: Number(commitment.amountMinor),
        nextDueAt: commitment.nextDueAt.toISOString().slice(0, 10),
      };
    });
  }

  async dismissCandidate(userId: string, candidateId: string) {
    const candidate = await this.prisma.detectionCandidate.findFirst({
      where: { id: candidateId, userId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    await this.prisma.detectionCandidate.update({
      where: { id: candidateId },
      data: { reviewStatus: DetectionReviewStatus.DISMISSED },
    });

    return { success: true };
  }
}

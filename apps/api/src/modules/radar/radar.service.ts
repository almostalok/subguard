import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  EvidenceLevel,
  CommitmentStatus,
  CommitmentType,
  VerificationState,
  DetectionReviewStatus,
  RadarItemDto,
  Cadence,
} from '@subguard/types';
import {
  formatDate,
  addDays,
  getNextDueDate,
  daysBetween,
} from '@subguard/utils';

@Injectable()
export class RadarService {
  constructor(private readonly prisma: PrismaService) {}

  async getForecast(userId: string, daysAhead: number = 30): Promise<RadarItemDto[]> {
    const today = new Date();
    const todayStr = formatDate(today);
    const horizonStr = addDays(todayStr, Math.min(90, Math.max(7, daysAhead)));

    // 1. Fetch active commitments
    const commitments = await this.prisma.commitment.findMany({
      where: {
        userId,
        status: CommitmentStatus.ACTIVE,
      },
      include: {
        mandates: true,
      },
    });

    // 2. Fetch pending candidates
    const candidates = await this.prisma.detectionCandidate.findMany({
      where: {
        userId,
        reviewStatus: DetectionReviewStatus.PENDING,
      },
    });

    const radarItems: RadarItemDto[] = [];

    // Project commitments into future timeline
    for (const comm of commitments) {
      let currentDue = comm.nextDueAt.toISOString().slice(0, 10);
      const isTrial = comm.type === CommitmentType.FREE_TRIAL;

      // Check if overdue without recent matched debit
      if (currentDue < todayStr) {
        const daysPast = daysBetween(currentDue, todayStr);
        if (daysPast <= 14) {
          radarItems.push({
            id: `overdue-${comm.id}`,
            title: `${comm.name} (Past Due / Unreconciled)`,
            merchant: comm.merchant,
            category: comm.category,
            dueDate: currentDue,
            amountMinor: Number(comm.amountMinor),
            currency: comm.currency,
            cadence: comm.cadence,
            evidenceLevel: EvidenceLevel.NEEDS_REVIEW,
            sourceType: comm.type,
            sourceId: comm.id,
            verificationState: comm.verificationState,
            paymentMethodLabel: comm.paymentMethodLabel,
            cancellationUrl: comm.cancellationUrl,
            notes: `Due ${daysPast} day(s) ago. No matching debit recorded in statement yet.`,
          });
        }
      }

      // Advance due date if in past until within or past horizon
      let iterations = 0;
      while (currentDue < todayStr && iterations < 50) {
        currentDue = getNextDueDate(currentDue, comm.cadence, comm.customCadenceDays);
        iterations++;
      }

      // Collect all occurrences within the horizon window
      iterations = 0;
      while (currentDue <= horizonStr && iterations < 12) {
        let evidenceLevel: EvidenceLevel =
          comm.verificationState === VerificationState.USER_VERIFIED
            ? EvidenceLevel.CONFIRMED
            : EvidenceLevel.EXPECTED;

        if (isTrial) {
          evidenceLevel = EvidenceLevel.NEEDS_REVIEW;
        }

        radarItems.push({
          id: `comm-${comm.id}-${currentDue}`,
          title: isTrial ? `${comm.name} (Trial Ending)` : comm.name,
          merchant: comm.merchant,
          category: comm.category,
          dueDate: currentDue,
          amountMinor: Number(comm.amountMinor),
          currency: comm.currency,
          cadence: comm.cadence,
          evidenceLevel,
          sourceType: comm.type,
          sourceId: comm.id,
          verificationState: comm.verificationState,
          paymentMethodLabel: comm.paymentMethodLabel,
          cancellationUrl: comm.cancellationUrl,
          isExpiringTrial: isTrial,
          notes: comm.notes,
        });

        // Advance to next cycle
        currentDue = getNextDueDate(currentDue, comm.cadence, comm.customCadenceDays);
        iterations++;
      }
    }

    // Project pending detected candidates
    for (const cand of candidates) {
      const evidence = cand.evidence as { transactionDates?: string[] };
      const lastTxnDate =
        evidence?.transactionDates?.[evidence.transactionDates.length - 1];

      if (lastTxnDate) {
        let nextEstimated = getNextDueDate(lastTxnDate, cand.proposedCadence);
        let count = 0;
        while (nextEstimated < todayStr && count < 20) {
          nextEstimated = getNextDueDate(nextEstimated, cand.proposedCadence);
          count++;
        }

        if (nextEstimated <= horizonStr) {
          radarItems.push({
            id: `cand-${cand.id}-${nextEstimated}`,
            title: `${cand.merchantDisplayName} (Detected Candidate)`,
            merchant: cand.merchantDisplayName,
            category: 'OTHER' as any,
            dueDate: nextEstimated,
            amountMinor: Number(cand.proposedAmountMinor),
            currency: 'INR',
            cadence: cand.proposedCadence,
            evidenceLevel: EvidenceLevel.POTENTIAL,
            sourceType: 'DETECTED_CANDIDATE',
            sourceId: cand.id,
            verificationState: VerificationState.UNVERIFIED_ESTIMATE,
            notes: `Candidate identified from past statement frequency (${Math.round(cand.confidence * 100)}% confidence). Needs confirmation.`,
          });
        }
      }
    }

    // Sort timeline strictly chronologically by dueDate
    radarItems.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return radarItems;
  }
}

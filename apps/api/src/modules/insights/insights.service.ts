import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CommitmentStatus,
  CommitmentCategory,
  FinancialSummaryDto,
  CategoryBreakdownDto,
  DetectionReviewStatus,
  CommitmentType,
} from '@subguard/types';
import {
  toMonthlyMinor,
  toAnnualMinor,
  formatDate,
  addDays,
  getNextDueDate,
} from '@subguard/utils';

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<FinancialSummaryDto> {
    const today = new Date();
    const todayStr = formatDate(today);
    const in7DaysStr = addDays(todayStr, 7);
    const in30DaysStr = addDays(todayStr, 30);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [activeCommitments, candidatesCount, expiringTrialsCount, recentDebits] =
      await Promise.all([
        this.prisma.commitment.findMany({
          where: { userId, status: CommitmentStatus.ACTIVE },
        }),
        this.prisma.detectionCandidate.count({
          where: { userId, reviewStatus: DetectionReviewStatus.PENDING },
        }),
        this.prisma.commitment.count({
          where: {
            userId,
            status: CommitmentStatus.ACTIVE,
            type: CommitmentType.FREE_TRIAL,
            nextDueAt: { lte: new Date(in7DaysStr) },
          },
        }),
        this.prisma.transaction.findMany({
          where: {
            userId,
            direction: 'DEBIT',
            transactionDate: { gte: thirtyDaysAgo },
          },
          select: { amountMinor: true },
        }),
      ]);

    let monthlyTotal = 0;
    let annualTotal = 0;
    let next7DaysMinor = 0;
    let next30DaysMinor = 0;

    for (const comm of activeCommitments) {
      const amt = Number(comm.amountMinor);
      monthlyTotal += toMonthlyMinor(amt, comm.cadence, comm.customCadenceDays);
      annualTotal += toAnnualMinor(amt, comm.cadence, comm.customCadenceDays);

      // Check all occurrences falling in 7 days and 30 days
      let due = comm.nextDueAt.toISOString().slice(0, 10);
      let count = 0;
      while (due < todayStr && count < 50) {
        due = getNextDueDate(due, comm.cadence, comm.customCadenceDays);
        count++;
      }

      let occurrenceDue = due;
      let occCount = 0;
      while (occurrenceDue <= in30DaysStr && occCount < 20) {
        if (occurrenceDue <= in7DaysStr) {
          next7DaysMinor += amt;
        }
        next30DaysMinor += amt;
        occurrenceDue = getNextDueDate(
          occurrenceDue,
          comm.cadence,
          comm.customCadenceDays
        );
        occCount++;
      }
    }

    const totalRecordedSpendPast30DaysMinor = recentDebits.reduce(
      (sum, t) => sum + Number(t.amountMinor),
      0
    );

    return {
      currency: 'INR',
      monthlyCommitmentMinor: monthlyTotal,
      annualCommitmentMinor: annualTotal,
      next7DaysMinor,
      next30DaysMinor,
      activeCommitmentsCount: activeCommitments.length,
      itemsRequiringReviewCount: candidatesCount + expiringTrialsCount,
      totalRecordedSpendPast30DaysMinor,
    };
  }

  async getCategoryBreakdown(userId: string): Promise<CategoryBreakdownDto[]> {
    const activeCommitments = await this.prisma.commitment.findMany({
      where: { userId, status: CommitmentStatus.ACTIVE },
    });

    const categoryMap = new Map<
      CommitmentCategory,
      { monthlyMinor: number; annualMinor: number; count: number }
    >();

    let totalMonthly = 0;

    for (const comm of activeCommitments) {
      const amt = Number(comm.amountMinor);
      const m = toMonthlyMinor(amt, comm.cadence, comm.customCadenceDays);
      const a = toAnnualMinor(amt, comm.cadence, comm.customCadenceDays);
      totalMonthly += m;

      const current = categoryMap.get(comm.category) || {
        monthlyMinor: 0,
        annualMinor: 0,
        count: 0,
      };
      current.monthlyMinor += m;
      current.annualMinor += a;
      current.count += 1;
      categoryMap.set(comm.category, current);
    }

    const breakdown: CategoryBreakdownDto[] = [];
    for (const [category, val] of categoryMap.entries()) {
      breakdown.push({
        category,
        monthlyEquivalentMinor: val.monthlyMinor,
        annualizedMinor: val.annualMinor,
        commitmentCount: val.count,
        percentageOfTotal:
          totalMonthly > 0 ? Math.round((val.monthlyMinor / totalMonthly) * 100) : 0,
      });
    }

    breakdown.sort((a, b) => b.monthlyEquivalentMinor - a.monthlyEquivalentMinor);
    return breakdown;
  }

  async getReconciliation(userId: string) {
    const commitments = await this.prisma.commitment.findMany({
      where: { userId, status: CommitmentStatus.ACTIVE },
      include: {
        transactionMatches: {
          include: { transaction: true },
          take: 5,
        },
      },
    });

    return commitments.map((c) => {
      const expectedMinor = Number(c.amountMinor);
      const lastMatch = c.transactionMatches[0];
      const actualMinor = lastMatch ? Number(lastMatch.transaction.amountMinor) : null;
      const differenceMinor = actualMinor !== null ? actualMinor - expectedMinor : 0;

      return {
        commitmentId: c.id,
        name: c.name,
        merchant: c.merchant,
        expectedAmountMinor: expectedMinor,
        lastDebitedAmountMinor: actualMinor,
        differenceMinor,
        hasPriceDiscrepancy: Math.abs(differenceMinor) > 0,
        lastDebitedDate: lastMatch
          ? lastMatch.transaction.transactionDate.toISOString().slice(0, 10)
          : null,
      };
    });
  }
}

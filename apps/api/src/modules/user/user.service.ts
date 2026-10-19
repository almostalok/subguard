import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateProfileInput } from '@subguard/validation';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        timezone: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name !== undefined ? input.name : undefined,
        currency: input.currency !== undefined ? input.currency : undefined,
        timezone: input.timezone !== undefined ? input.timezone : undefined,
        onboardingCompleted:
          input.onboardingCompleted !== undefined
            ? input.onboardingCompleted
            : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        timezone: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async exportUserData(userId: string) {
    const [
      user,
      commitments,
      mandates,
      imports,
      transactions,
      candidates,
      reminders,
      notifications,
      auditEvents,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          currency: true,
          timezone: true,
          createdAt: true,
        },
      }),
      this.prisma.commitment.findMany({ where: { userId } }),
      this.prisma.mandate.findMany({ where: { userId } }),
      this.prisma.transactionImport.findMany({ where: { userId } }),
      this.prisma.transaction.findMany({ where: { userId } }),
      this.prisma.detectionCandidate.findMany({ where: { userId } }),
      this.prisma.reminder.findMany({ where: { userId } }),
      this.prisma.notification.findMany({ where: { userId } }),
      this.prisma.auditEvent.findMany({ where: { userId } }),
    ]);

    await this.prisma.auditEvent.create({
      data: {
        userId,
        action: 'DATA_EXPORTED',
        entityType: 'User',
        entityId: userId,
      },
    });

    return {
      exportVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      user,
      commitments: commitments.map((c) => ({
        ...c,
        amountMinor: Number(c.amountMinor),
        nextDueAt: c.nextDueAt.toISOString().slice(0, 10),
      })),
      mandates: mandates.map((m) => ({
        ...m,
        maximumAmountMinor: m.maximumAmountMinor ? Number(m.maximumAmountMinor) : null,
      })),
      transactionImports: imports,
      transactions: transactions.map((t) => ({
        ...t,
        amountMinor: Number(t.amountMinor),
        transactionDate: t.transactionDate.toISOString().slice(0, 10),
      })),
      detectionCandidates: candidates.map((d) => ({
        ...d,
        proposedAmountMinor: Number(d.proposedAmountMinor),
      })),
      reminders,
      notifications,
      auditEvents,
    };
  }

  async deleteAccount(userId: string) {
    // Delete all user data transactionally (cascading through Prisma onDelete: Cascade)
    await this.prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { success: true, message: 'Account and all associated records permanently deleted' };
  }
}

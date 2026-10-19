import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from '@subguard/validation';
import { CommitmentCategory, CommitmentStatus, Cadence } from '@subguard/types';
import { parseDate } from '@subguard/utils';

@Injectable()
export class CommitmentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: {
      status?: CommitmentStatus;
      category?: CommitmentCategory;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (query.status) {
      where.status = query.status;
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { merchant: { contains: query.search, mode: 'insensitive' } },
        { paymentMethodLabel: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.commitment.findMany({
        where,
        orderBy: { nextDueAt: 'asc' },
        skip,
        take: limit,
        include: {
          mandates: {
            select: {
              id: true,
              kind: true,
              providerReference: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.commitment.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        amountMinor: Number(c.amountMinor),
        nextDueAt: c.nextDueAt.toISOString().slice(0, 10),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.commitment.findFirst({
      where: { id, userId },
      include: {
        mandates: true,
        transactionMatches: {
          include: {
            transaction: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Commitment not found');
    }

    return {
      ...item,
      amountMinor: Number(item.amountMinor),
      nextDueAt: item.nextDueAt.toISOString().slice(0, 10),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      mandates: item.mandates.map((m) => ({
        ...m,
        maximumAmountMinor: m.maximumAmountMinor ? Number(m.maximumAmountMinor) : null,
        nextExpectedAt: m.nextExpectedAt ? m.nextExpectedAt.toISOString().slice(0, 10) : null,
      })),
      transactionMatches: item.transactionMatches.map((tm) => ({
        ...tm,
        transaction: {
          ...tm.transaction,
          amountMinor: Number(tm.transaction.amountMinor),
          transactionDate: tm.transaction.transactionDate.toISOString().slice(0, 10),
        },
      })),
    };
  }

  async create(userId: string, input: CreateCommitmentInput) {
    const item = await this.prisma.commitment.create({
      data: {
        userId,
        name: input.name,
        merchant: input.merchant,
        category: input.category,
        type: input.type,
        amountMinor: BigInt(input.amountMinor),
        currency: input.currency,
        cadence: input.cadence,
        customCadenceDays: input.customCadenceDays || null,
        nextDueAt: parseDate(input.nextDueAt),
        status: input.status || CommitmentStatus.ACTIVE,
        paymentMethodLabel: input.paymentMethodLabel || null,
        cancellationUrl: input.cancellationUrl || null,
        notes: input.notes || null,
      },
    });

    // Auto-create a default 3-day advance reminder
    await this.prisma.reminder.create({
      data: {
        userId,
        commitmentId: item.id,
        offsetDays: 3,
        enabled: true,
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        userId,
        action: 'COMMITMENT_CREATED',
        entityType: 'Commitment',
        entityId: item.id,
        metadata: { name: item.name, merchant: item.merchant },
      },
    });

    return {
      ...item,
      amountMinor: Number(item.amountMinor),
      nextDueAt: item.nextDueAt.toISOString().slice(0, 10),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async update(userId: string, id: string, input: UpdateCommitmentInput) {
    const existing = await this.prisma.commitment.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Commitment not found');
    }

    const updated = await this.prisma.commitment.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : undefined,
        merchant: input.merchant !== undefined ? input.merchant : undefined,
        category: input.category !== undefined ? input.category : undefined,
        type: input.type !== undefined ? input.type : undefined,
        amountMinor:
          input.amountMinor !== undefined ? BigInt(input.amountMinor) : undefined,
        currency: input.currency !== undefined ? input.currency : undefined,
        cadence: input.cadence !== undefined ? input.cadence : undefined,
        customCadenceDays:
          input.customCadenceDays !== undefined
            ? input.customCadenceDays
            : undefined,
        nextDueAt:
          input.nextDueAt !== undefined ? parseDate(input.nextDueAt) : undefined,
        status: input.status !== undefined ? input.status : undefined,
        paymentMethodLabel:
          input.paymentMethodLabel !== undefined
            ? input.paymentMethodLabel
            : undefined,
        cancellationUrl:
          input.cancellationUrl !== undefined ? input.cancellationUrl : undefined,
        notes: input.notes !== undefined ? input.notes : undefined,
      },
    });

    return {
      ...updated,
      amountMinor: Number(updated.amountMinor),
      nextDueAt: updated.nextDueAt.toISOString().slice(0, 10),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.commitment.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Commitment not found');
    }

    await this.prisma.commitment.delete({
      where: { id },
    });

    await this.prisma.auditEvent.create({
      data: {
        userId,
        action: 'COMMITMENT_DELETED',
        entityType: 'Commitment',
        entityId: id,
      },
    });

    return { success: true };
  }
}

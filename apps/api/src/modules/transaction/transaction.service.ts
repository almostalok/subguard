import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TransactionDirection } from '@subguard/types';
import { parseDate } from '@subguard/utils';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: {
      direction?: TransactionDirection;
      search?: string;
      startDate?: string;
      endDate?: string;
      importId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (query.direction) {
      where.direction = query.direction;
    }
    if (query.importId) {
      where.importId = query.importId;
    }
    if (query.search) {
      where.OR = [
        { merchantNormalized: { contains: query.search, mode: 'insensitive' } },
        { descriptionOriginal: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) dateFilter.gte = parseDate(query.startDate);
      if (query.endDate) dateFilter.lte = parseDate(query.endDate);
      where.transactionDate = dateFilter;
    }

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
        include: {
          import: {
            select: { filename: true },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        ...t,
        amountMinor: Number(t.amountMinor),
        transactionDate: t.transactionDate.toISOString().slice(0, 10),
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleExclude(userId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Transaction not found');
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: { isExcludedFromDetection: !existing.isExcludedFromDetection },
    });

    return {
      id: updated.id,
      isExcludedFromDetection: updated.isExcludedFromDetection,
    };
  }
}

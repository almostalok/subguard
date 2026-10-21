import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateMandateInput,
  UpdateMandateInput,
} from '@subguard/validation';
import { MandateStatus, MandateVerificationState } from '@subguard/types';
import { parseDate } from '@subguard/utils';

@Injectable()
export class MandateService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.mandate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        commitment: {
          select: {
            id: true,
            name: true,
            merchant: true,
            category: true,
            amountMinor: true,
            cadence: true,
            status: true,
          },
        },
      },
    });

    return items.map((m) => ({
      ...m,
      maximumAmountMinor: m.maximumAmountMinor ? Number(m.maximumAmountMinor) : null,
      nextExpectedAt: m.nextExpectedAt ? m.nextExpectedAt.toISOString().slice(0, 10) : null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      commitment: m.commitment
        ? {
            ...m.commitment,
            amountMinor: Number(m.commitment.amountMinor),
          }
        : null,
    }));
  }

  async create(userId: string, input: CreateMandateInput) {
    if (input.commitmentId) {
      const commitment = await this.prisma.commitment.findFirst({
        where: { id: input.commitmentId, userId },
      });
      if (!commitment) {
        throw new BadRequestException('Referenced commitment not found or unauthorized');
      }
    }

    const mandate = await this.prisma.mandate.create({
      data: {
        userId,
        commitmentId: input.commitmentId || null,
        kind: input.kind,
        providerReference: input.providerReference || null,
        maximumAmountMinor: input.maximumAmountMinor
          ? BigInt(input.maximumAmountMinor)
          : null,
        currency: input.currency || 'INR',
        frequency: input.frequency,
        status: input.status || MandateStatus.ACTIVE,
        verificationState: MandateVerificationState.MANUAL_UNVERIFIED,
        nextExpectedAt: input.nextExpectedAt ? parseDate(input.nextExpectedAt) : null,
        cancellationInstructions:
          input.cancellationInstructions ||
          'To cancel this mandate, visit your issuing bank portal or UPI app (e.g. PhonePe/GooglePay/BHIM > Autopay > Cancel Mandate).',
      },
      include: {
        commitment: true,
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        userId,
        action: 'MANDATE_CREATED',
        entityType: 'Mandate',
        entityId: mandate.id,
        metadata: { kind: mandate.kind, reference: mandate.providerReference },
      },
    });

    return {
      ...mandate,
      maximumAmountMinor: mandate.maximumAmountMinor
        ? Number(mandate.maximumAmountMinor)
        : null,
      nextExpectedAt: mandate.nextExpectedAt
        ? mandate.nextExpectedAt.toISOString().slice(0, 10)
        : null,
      createdAt: mandate.createdAt.toISOString(),
      updatedAt: mandate.updatedAt.toISOString(),
    };
  }

  async update(userId: string, id: string, input: UpdateMandateInput) {
    const existing = await this.prisma.mandate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Mandate not found');
    }

    if (input.commitmentId !== undefined && input.commitmentId !== null) {
      const commitment = await this.prisma.commitment.findFirst({
        where: { id: input.commitmentId, userId },
      });
      if (!commitment) {
        throw new BadRequestException('Referenced commitment not found or unauthorized');
      }
    }

    const updated = await this.prisma.mandate.update({
      where: { id },
      data: {
        commitmentId:
          input.commitmentId !== undefined ? input.commitmentId : undefined,
        kind: input.kind !== undefined ? input.kind : undefined,
        providerReference:
          input.providerReference !== undefined
            ? input.providerReference
            : undefined,
        maximumAmountMinor:
          input.maximumAmountMinor !== undefined
            ? input.maximumAmountMinor
              ? BigInt(input.maximumAmountMinor)
              : null
            : undefined,
        frequency: input.frequency !== undefined ? input.frequency : undefined,
        status: input.status !== undefined ? input.status : undefined,
        nextExpectedAt:
          input.nextExpectedAt !== undefined
            ? input.nextExpectedAt
              ? parseDate(input.nextExpectedAt)
              : null
            : undefined,
        cancellationInstructions:
          input.cancellationInstructions !== undefined
            ? input.cancellationInstructions
            : undefined,
      },
    });

    return {
      ...updated,
      maximumAmountMinor: updated.maximumAmountMinor
        ? Number(updated.maximumAmountMinor)
        : null,
      nextExpectedAt: updated.nextExpectedAt
        ? updated.nextExpectedAt.toISOString().slice(0, 10)
        : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.mandate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Mandate not found');
    }

    await this.prisma.mandate.delete({ where: { id } });

    await this.prisma.auditEvent.create({
      data: {
        userId,
        action: 'MANDATE_DELETED',
        entityType: 'Mandate',
        entityId: id,
      },
    });

    return { success: true };
  }
}

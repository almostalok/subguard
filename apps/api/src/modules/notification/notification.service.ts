import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  NotificationStatus,
  CommitmentStatus,
  CommitmentType,
} from '@subguard/types';
import { CreateReminderInput } from '@subguard/validation';
import {
  formatDate,
  addDays,
  formatCurrency,
} from '@subguard/utils';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
      include: {
        commitment: {
          select: {
            id: true,
            name: true,
            merchant: true,
            amountMinor: true,
          },
        },
      },
    });

    return items.map((n) => ({
      ...n,
      scheduledAt: n.scheduledAt.toISOString(),
      deliveredAt: n.deliveredAt ? n.deliveredAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
      commitment: n.commitment
        ? {
            ...n.commitment,
            amountMinor: Number(n.commitment.amountMinor),
          }
        : null,
    }));
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createReminder(userId: string, input: CreateReminderInput) {
    const commitment = await this.prisma.commitment.findFirst({
      where: { id: input.commitmentId, userId },
    });

    if (!commitment) {
      throw new BadRequestException('Referenced commitment not found or unauthorized');
    }

    const reminder = await this.prisma.reminder.create({
      data: {
        userId,
        commitmentId: input.commitmentId,
        reminderType: input.reminderType,
        offsetDays: input.offsetDays,
        enabled: input.enabled,
        channel: input.channel,
      },
    });

    return reminder;
  }

  async listReminders(userId: string) {
    return this.prisma.reminder.findMany({
      where: { userId },
      include: {
        commitment: {
          select: {
            id: true,
            name: true,
            merchant: true,
            amountMinor: true,
            nextDueAt: true,
          },
        },
      },
    });
  }

  async deleteReminder(userId: string, id: string) {
    await this.prisma.reminder.deleteMany({
      where: { id, userId },
    });
    return { success: true };
  }

  /**
   * Evaluates all active commitments and reminders, generating idempotent notifications.
   * Runs on schedule or can be triggered manually.
   */
  async processDueNotifications() {
    const today = new Date();
    const todayStr = formatDate(today);

    // 1. Process advance reminders for commitments
    const reminders = await this.prisma.reminder.findMany({
      where: {
        enabled: true,
        commitment: { status: CommitmentStatus.ACTIVE },
      },
      include: {
        commitment: true,
        user: true,
      },
    });

    let generatedCount = 0;

    for (const rem of reminders) {
      const comm = rem.commitment;
      const dueStr = comm.nextDueAt.toISOString().slice(0, 10);
      const triggerDateStr = addDays(dueStr, -rem.offsetDays);

      // Check if today is on or past the trigger date, but before or on the due date
      if (todayStr >= triggerDateStr && todayStr <= dueStr) {
        const dedupeKey = `rem_${comm.id}_due_${dueStr}_offset_${rem.offsetDays}`;

        const isTrial = comm.type === CommitmentType.FREE_TRIAL;
        const formattedAmount = formatCurrency(Number(comm.amountMinor), comm.currency);

        const title = isTrial
          ? `Trial Expiring: ${comm.name}`
          : rem.offsetDays === 0
          ? `Payment Due Today: ${comm.name}`
          : `Upcoming Deduction: ${comm.name} in ${rem.offsetDays} days`;

        const message = isTrial
          ? `Your free trial for ${comm.name} is set to end on ${dueStr}. Cancel before this date to prevent a recurring charge of ${formattedAmount}.`
          : `${comm.name} (${comm.merchant}) is expected to charge ${formattedAmount} on ${dueStr} via ${comm.paymentMethodLabel || 'your registered account'}.`;

        try {
          await this.prisma.notification.upsert({
            where: { dedupeKey },
            create: {
              userId: comm.userId,
              commitmentId: comm.id,
              title,
              message,
              scheduledAt: today,
              deliveredAt: today,
              status: NotificationStatus.DELIVERED,
              dedupeKey,
            },
            update: {}, // idempotent, do not overwrite if exists
          });
          generatedCount++;
        } catch (err: unknown) {
          this.logger.error(`Failed to create notification ${dedupeKey}`, err);
        }
      }
    }

    return { processedReminders: reminders.length, generatedNotifications: generatedCount };
  }
}

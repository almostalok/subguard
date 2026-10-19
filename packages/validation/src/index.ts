import { z } from 'zod';
import {
  Cadence,
  CommitmentCategory,
  CommitmentType,
  CommitmentStatus,
  MandateKind,
  MandateFrequency,
  MandateStatus,
  ReminderType,
  NotificationChannel,
} from '@subguard/types';

// ==========================================
// Authentication & User Schemas
// ==========================================

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Valid email is required' })
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
  name: z.string().trim().max(100).optional(),
  currency: z.string().trim().length(3).default('INR'),
  timezone: z.string().trim().default('Asia/Kolkata'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Valid email is required' }),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().max(100).optional(),
  currency: z.string().trim().length(3).optional(),
  timezone: z.string().trim().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ==========================================
// Commitment Schemas
// ==========================================

export const createCommitmentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  merchant: z.string().trim().min(1, 'Merchant is required').max(150),
  category: z.nativeEnum(CommitmentCategory),
  type: z.nativeEnum(CommitmentType),
  amountMinor: z.number().int().positive('Amount must be positive in minor units (paise)'),
  currency: z.string().trim().length(3).optional().default('INR'),
  cadence: z.nativeEnum(Cadence),
  customCadenceDays: z.number().int().positive().nullable().optional(),
  nextDueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'nextDueAt must be YYYY-MM-DD format'),
  status: z.nativeEnum(CommitmentStatus).optional().default(CommitmentStatus.ACTIVE),
  paymentMethodLabel: z.string().trim().max(100).nullable().optional(),
  cancellationUrl: z.string().trim().url().nullable().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type CreateCommitmentInput = z.infer<typeof createCommitmentSchema>;

export const updateCommitmentSchema = createCommitmentSchema.partial().extend({
  status: z.nativeEnum(CommitmentStatus).optional(),
});

export type UpdateCommitmentInput = z.infer<typeof updateCommitmentSchema>;

// ==========================================
// Mandate Schemas
// ==========================================

export const createMandateSchema = z.object({
  commitmentId: z.string().uuid().nullable().optional(),
  kind: z.nativeEnum(MandateKind),
  providerReference: z.string().trim().max(100).nullable().optional(),
  maximumAmountMinor: z.number().int().positive().nullable().optional(),
  currency: z.string().trim().length(3).optional().default('INR'),
  frequency: z.nativeEnum(MandateFrequency).optional().default(MandateFrequency.MONTHLY),
  status: z.nativeEnum(MandateStatus).optional().default(MandateStatus.ACTIVE),
  nextExpectedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  cancellationInstructions: z.string().trim().max(2000).nullable().optional(),
});

export type CreateMandateInput = z.infer<typeof createMandateSchema>;

export const updateMandateSchema = createMandateSchema.partial();

export type UpdateMandateInput = z.infer<typeof updateMandateSchema>;

// ==========================================
// Import Schemas
// ==========================================

export const commitImportSchema = z.object({
  filename: z.string().trim().min(1),
  fileHash: z.string().trim().min(10),
  columnMapping: z.object({
    dateColumn: z.string().min(1),
    descriptionColumn: z.string().min(1),
    amountColumn: z.string().optional(),
    debitColumn: z.string().optional(),
    creditColumn: z.string().optional(),
    typeColumn: z.string().optional(),
  }),
  accountId: z.string().uuid().nullable().optional(),
  rawCsvText: z.string().min(1, 'CSV content is required'),
});

export type CommitImportInput = z.infer<typeof commitImportSchema>;

// ==========================================
// Recurrence Detection Schemas
// ==========================================

export const confirmCandidateSchema = z.object({
  name: z.string().trim().min(1),
  merchant: z.string().trim().min(1),
  category: z.nativeEnum(CommitmentCategory),
  amountMinor: z.number().int().positive(),
  cadence: z.nativeEnum(Cadence),
  nextDueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethodLabel: z.string().trim().max(100).nullable().optional(),
  cancellationUrl: z.string().trim().url().nullable().optional().or(z.literal('')),
});

export type ConfirmCandidateInput = z.infer<typeof confirmCandidateSchema>;

// ==========================================
// Reminder Schemas
// ==========================================

export const createReminderSchema = z.object({
  commitmentId: z.string().uuid(),
  reminderType: z.nativeEnum(ReminderType).optional().default(ReminderType.DAYS_BEFORE_DUE),
  offsetDays: z.number().int().min(0).max(30).optional().default(3),
  enabled: z.boolean().optional().default(true),
  channel: z.nativeEnum(NotificationChannel).optional().default(NotificationChannel.IN_APP),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;

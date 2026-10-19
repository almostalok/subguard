// ==========================================
// Enums & Domain Constants
// ==========================================

export const Cadence = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  SEMI_ANNUALLY: 'SEMI_ANNUALLY',
  ANNUALLY: 'ANNUALLY',
  CUSTOM: 'CUSTOM',
} as const;
export type Cadence = (typeof Cadence)[keyof typeof Cadence];

export const CommitmentCategory = {
  ENTERTAINMENT: 'ENTERTAINMENT',
  PRODUCTIVITY: 'PRODUCTIVITY',
  UTILITIES: 'UTILITIES',
  HEALTH_FITNESS: 'HEALTH_FITNESS',
  FINANCE_EMI: 'FINANCE_EMI',
  CLOUD_HOSTING: 'CLOUD_HOSTING',
  MEMBERSHIP: 'MEMBERSHIP',
  INSURANCE: 'INSURANCE',
  OTHER: 'OTHER',
} as const;
export type CommitmentCategory =
  (typeof CommitmentCategory)[keyof typeof CommitmentCategory];

export const CommitmentType = {
  SUBSCRIPTION: 'SUBSCRIPTION',
  MANDATE: 'MANDATE',
  EMI: 'EMI',
  INSURANCE_PREMIUM: 'INSURANCE_PREMIUM',
  FREE_TRIAL: 'FREE_TRIAL',
  UTILITY_BILL: 'UTILITY_BILL',
  MEMBERSHIP: 'MEMBERSHIP',
  OTHER: 'OTHER',
} as const;
export type CommitmentType =
  (typeof CommitmentType)[keyof typeof CommitmentType];

export const CommitmentStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type CommitmentStatus =
  (typeof CommitmentStatus)[keyof typeof CommitmentStatus];

export const CommitmentSource = {
  MANUAL_ENTRY: 'MANUAL_ENTRY',
  DETECTED_IMPORT: 'DETECTED_IMPORT',
  MANDATE_REGISTER: 'MANDATE_REGISTER',
} as const;
export type CommitmentSource =
  (typeof CommitmentSource)[keyof typeof CommitmentSource];

export const VerificationState = {
  USER_VERIFIED: 'USER_VERIFIED',
  UNVERIFIED_ESTIMATE: 'UNVERIFIED_ESTIMATE',
} as const;
export type VerificationState =
  (typeof VerificationState)[keyof typeof VerificationState];

export const MandateKind = {
  UPI_AUTOPAY: 'UPI_AUTOPAY',
  CARD_E_MANDATE: 'CARD_E_MANDATE',
  BANK_STANDING_INSTRUCTION: 'BANK_STANDING_INSTRUCTION',
  NACH_DEBIT: 'NACH_DEBIT',
  OTHER: 'OTHER',
} as const;
export type MandateKind = (typeof MandateKind)[keyof typeof MandateKind];

export const MandateFrequency = {
  AS_PRESENTED: 'AS_PRESENTED',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUALLY: 'ANNUALLY',
  MAX_DAILY: 'MAX_DAILY',
} as const;
export type MandateFrequency =
  (typeof MandateFrequency)[keyof typeof MandateFrequency];

export const MandateStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;
export type MandateStatus = (typeof MandateStatus)[keyof typeof MandateStatus];

export const MandateVerificationState = {
  MANUAL_UNVERIFIED: 'MANUAL_UNVERIFIED',
  IMPORT_MATCHED: 'IMPORT_MATCHED',
} as const;
export type MandateVerificationState =
  (typeof MandateVerificationState)[keyof typeof MandateVerificationState];

export const ImportType = {
  CSV: 'CSV',
  OFX: 'OFX',
  PDF: 'PDF',
} as const;
export type ImportType = (typeof ImportType)[keyof typeof ImportType];

export const ImportStatus = {
  PENDING: 'PENDING',
  PREVIEWED: 'PREVIEWED',
  COMMITTED: 'COMMITTED',
  ROLLED_BACK: 'ROLLED_BACK',
  FAILED: 'FAILED',
} as const;
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];

export const TransactionDirection = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
} as const;
export type TransactionDirection =
  (typeof TransactionDirection)[keyof typeof TransactionDirection];

export const DetectionReviewStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  DISMISSED: 'DISMISSED',
  ALREADY_TRACKED: 'ALREADY_TRACKED',
} as const;
export type DetectionReviewStatus =
  (typeof DetectionReviewStatus)[keyof typeof DetectionReviewStatus];

export const EvidenceLevel = {
  CONFIRMED: 'CONFIRMED',
  EXPECTED: 'EXPECTED',
  ESTIMATED: 'ESTIMATED',
  POTENTIAL: 'POTENTIAL',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
} as const;
export type EvidenceLevel =
  (typeof EvidenceLevel)[keyof typeof EvidenceLevel];

export const ReminderType = {
  DAYS_BEFORE_DUE: 'DAYS_BEFORE_DUE',
  ON_DUE_DATE: 'ON_DUE_DATE',
  TRIAL_EXPIRATION: 'TRIAL_EXPIRATION',
  UNUSUAL_AMOUNT: 'UNUSUAL_AMOUNT',
} as const;
export type ReminderType = (typeof ReminderType)[keyof typeof ReminderType];

export const NotificationStatus = {
  PENDING: 'PENDING',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type NotificationStatus =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const NotificationChannel = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
} as const;
export type NotificationChannel =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];

// ==========================================
// Domain Interfaces
// ==========================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  currency: string;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommitmentDto {
  id: string;
  userId: string;
  name: string;
  merchant: string;
  category: CommitmentCategory;
  type: CommitmentType;
  amountMinor: number;
  currency: string;
  cadence: Cadence;
  customCadenceDays?: number | null;
  nextDueAt: string; // ISO date string YYYY-MM-DD
  status: CommitmentStatus;
  source: CommitmentSource;
  verificationState: VerificationState;
  confidence: number;
  cancellationUrl?: string | null;
  paymentMethodLabel?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MandateDto {
  id: string;
  userId: string;
  commitmentId?: string | null;
  kind: MandateKind;
  providerReference?: string | null;
  maximumAmountMinor?: number | null;
  currency: string;
  frequency: MandateFrequency;
  status: MandateStatus;
  verificationState: MandateVerificationState;
  nextExpectedAt?: string | null;
  cancellationInstructions?: string | null;
  commitment?: CommitmentDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionImportDto {
  id: string;
  userId: string;
  filename: string;
  fileHash: string;
  importType: ImportType;
  status: ImportStatus;
  rowCount: number;
  validRowCount: number;
  duplicateRowCount: number;
  errorSummary?: Record<string, unknown> | null;
  columnMapping?: Record<string, string> | null;
  importedAt: string;
}

export interface TransactionDto {
  id: string;
  userId: string;
  importId?: string | null;
  accountId?: string | null;
  transactionDate: string; // YYYY-MM-DD
  descriptionOriginal: string;
  merchantNormalized: string;
  merchantKey: string;
  amountMinor: number;
  currency: string;
  direction: TransactionDirection;
  externalReference?: string | null;
  fingerprint: string;
  isExcludedFromDetection: boolean;
  createdAt: string;
}

export interface DetectionCandidateDto {
  id: string;
  userId: string;
  merchantKey: string;
  merchantDisplayName: string;
  proposedCadence: Cadence;
  proposedAmountMinor: number;
  amountIsVariable: boolean;
  minAmountMinor?: number | null;
  maxAmountMinor?: number | null;
  confidence: number;
  evidence: {
    matchedTransactionCount: number;
    transactionDates: string[];
    averageIntervalDays: number;
    amountVariancePercent: number;
    reasons: string[];
  };
  reviewStatus: DetectionReviewStatus;
  linkedCommitmentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RadarItemDto {
  id: string;
  title: string;
  merchant: string;
  category: CommitmentCategory;
  dueDate: string; // YYYY-MM-DD
  amountMinor: number;
  currency: string;
  cadence: Cadence;
  evidenceLevel: EvidenceLevel;
  sourceType: CommitmentType | 'DETECTED_CANDIDATE';
  sourceId: string;
  verificationState: VerificationState;
  paymentMethodLabel?: string | null;
  cancellationUrl?: string | null;
  isExpiringTrial?: boolean;
  notes?: string | null;
}

export interface FinancialSummaryDto {
  currency: string;
  monthlyCommitmentMinor: number;
  annualCommitmentMinor: number;
  next7DaysMinor: number;
  next30DaysMinor: number;
  activeCommitmentsCount: number;
  itemsRequiringReviewCount: number;
  totalRecordedSpendPast30DaysMinor: number;
}

export interface CategoryBreakdownDto {
  category: CommitmentCategory;
  monthlyEquivalentMinor: number;
  annualizedMinor: number;
  commitmentCount: number;
  percentageOfTotal: number;
}

export interface NotificationDto {
  id: string;
  userId: string;
  commitmentId?: string | null;
  title: string;
  message: string;
  scheduledAt: string;
  deliveredAt?: string | null;
  status: NotificationStatus;
  isRead: boolean;
  dedupeKey: string;
  createdAt: string;
}

export interface ReminderDto {
  id: string;
  userId: string;
  commitmentId: string;
  reminderType: ReminderType;
  offsetDays: number;
  enabled: boolean;
  channel: NotificationChannel;
  createdAt: string;
}

export interface CsvPreviewResult {
  headers: string[];
  previewRows: Record<string, string>[];
  totalRows: number;
  detectedMapping: {
    dateColumn?: string;
    descriptionColumn?: string;
    amountColumn?: string;
    debitColumn?: string;
    creditColumn?: string;
    typeColumn?: string;
  };
  fileHash: string;
}

export interface ImportCommitResult {
  importId: string;
  totalRows: number;
  validRowCount: number;
  duplicateRowCount: number;
  invalidRowCount: number;
  errors: Array<{ row: number; reason: string }>;
}

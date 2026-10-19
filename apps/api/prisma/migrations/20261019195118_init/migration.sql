-- CreateEnum
CREATE TYPE "Cadence" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CommitmentCategory" AS ENUM ('ENTERTAINMENT', 'PRODUCTIVITY', 'UTILITIES', 'HEALTH_FITNESS', 'FINANCE_EMI', 'CLOUD_HOSTING', 'MEMBERSHIP', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommitmentType" AS ENUM ('SUBSCRIPTION', 'MANDATE', 'EMI', 'INSURANCE_PREMIUM', 'FREE_TRIAL', 'UTILITY_BILL', 'MEMBERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommitmentSource" AS ENUM ('MANUAL_ENTRY', 'DETECTED_IMPORT', 'MANDATE_REGISTER');

-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('USER_VERIFIED', 'UNVERIFIED_ESTIMATE');

-- CreateEnum
CREATE TYPE "MandateKind" AS ENUM ('UPI_AUTOPAY', 'CARD_E_MANDATE', 'BANK_STANDING_INSTRUCTION', 'NACH_DEBIT', 'OTHER');

-- CreateEnum
CREATE TYPE "MandateFrequency" AS ENUM ('AS_PRESENTED', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'MAX_DAILY');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('ACTIVE', 'PAUSED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MandateVerificationState" AS ENUM ('MANUAL_UNVERIFIED', 'IMPORT_MATCHED');

-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('CSV', 'OFX', 'PDF');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PREVIEWED', 'COMMITTED', 'ROLLED_BACK', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "DetectionReviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED', 'ALREADY_TRACKED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('DAYS_BEFORE_DUE', 'ON_DUE_DATE', 'TRIAL_EXPIRATION', 'UNUSUAL_AMOUNT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SAVINGS', 'CURRENT', 'CREDIT_CARD', 'WALLET', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" VARCHAR(128),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionTokenHash" VARCHAR(64) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "institution" VARCHAR(100),
    "accountType" "AccountType" NOT NULL DEFAULT 'SAVINGS',
    "mask" VARCHAR(8),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commitments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "merchant" VARCHAR(150) NOT NULL,
    "category" "CommitmentCategory" NOT NULL,
    "type" "CommitmentType" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "cadence" "Cadence" NOT NULL,
    "customCadenceDays" INTEGER,
    "nextDueAt" DATE NOT NULL,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "CommitmentSource" NOT NULL DEFAULT 'MANUAL_ENTRY',
    "verificationState" "VerificationState" NOT NULL DEFAULT 'USER_VERIFIED',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "cancellationUrl" TEXT,
    "paymentMethodLabel" VARCHAR(100),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandates" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "commitmentId" UUID,
    "kind" "MandateKind" NOT NULL,
    "providerReference" VARCHAR(100),
    "maximumAmountMinor" BIGINT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "frequency" "MandateFrequency" NOT NULL DEFAULT 'MONTHLY',
    "status" "MandateStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationState" "MandateVerificationState" NOT NULL DEFAULT 'MANUAL_UNVERIFIED',
    "nextExpectedAt" DATE,
    "cancellationInstructions" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_imports" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "fileHash" VARCHAR(64) NOT NULL,
    "importType" "ImportType" NOT NULL DEFAULT 'CSV',
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "validRowCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateRowCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" JSONB,
    "columnMapping" JSONB,
    "importedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "importId" UUID,
    "accountId" UUID,
    "transactionDate" DATE NOT NULL,
    "descriptionOriginal" TEXT NOT NULL,
    "merchantNormalized" VARCHAR(150) NOT NULL,
    "merchantKey" VARCHAR(100) NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "direction" "TransactionDirection" NOT NULL DEFAULT 'DEBIT',
    "externalReference" VARCHAR(100),
    "fingerprint" VARCHAR(64) NOT NULL,
    "isExcludedFromDetection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detection_candidates" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "merchantKey" VARCHAR(100) NOT NULL,
    "merchantDisplayName" VARCHAR(150) NOT NULL,
    "proposedCadence" "Cadence" NOT NULL,
    "proposedAmountMinor" BIGINT NOT NULL,
    "amountIsVariable" BOOLEAN NOT NULL DEFAULT false,
    "minAmountMinor" BIGINT,
    "maxAmountMinor" BIGINT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "evidence" JSONB NOT NULL,
    "reviewStatus" "DetectionReviewStatus" NOT NULL DEFAULT 'PENDING',
    "linkedCommitmentId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "detection_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_matches" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "commitmentId" UUID NOT NULL,
    "matchType" VARCHAR(50) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "reviewedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "commitmentId" UUID NOT NULL,
    "reminderType" "ReminderType" NOT NULL DEFAULT 'DAYS_BEFORE_DUE',
    "offsetDays" INTEGER NOT NULL DEFAULT 3,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "commitmentId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledAt" TIMESTAMPTZ(6) NOT NULL,
    "deliveredAt" TIMESTAMPTZ(6),
    "status" "NotificationStatus" NOT NULL DEFAULT 'DELIVERED',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "dedupeKey" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(64),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionTokenHash_key" ON "sessions"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_sessionTokenHash_idx" ON "sessions"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "payment_accounts_userId_idx" ON "payment_accounts"("userId");

-- CreateIndex
CREATE INDEX "commitments_userId_idx" ON "commitments"("userId");

-- CreateIndex
CREATE INDEX "commitments_status_idx" ON "commitments"("status");

-- CreateIndex
CREATE INDEX "commitments_nextDueAt_idx" ON "commitments"("nextDueAt");

-- CreateIndex
CREATE INDEX "commitments_merchant_idx" ON "commitments"("merchant");

-- CreateIndex
CREATE INDEX "mandates_userId_idx" ON "mandates"("userId");

-- CreateIndex
CREATE INDEX "mandates_commitmentId_idx" ON "mandates"("commitmentId");

-- CreateIndex
CREATE INDEX "mandates_status_idx" ON "mandates"("status");

-- CreateIndex
CREATE INDEX "transaction_imports_userId_idx" ON "transaction_imports"("userId");

-- CreateIndex
CREATE INDEX "transaction_imports_fileHash_idx" ON "transaction_imports"("fileHash");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_fingerprint_idx" ON "transactions"("fingerprint");

-- CreateIndex
CREATE INDEX "transactions_transactionDate_idx" ON "transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "transactions_merchantKey_idx" ON "transactions"("merchantKey");

-- CreateIndex
CREATE INDEX "transactions_direction_idx" ON "transactions"("direction");

-- CreateIndex
CREATE INDEX "detection_candidates_userId_idx" ON "detection_candidates"("userId");

-- CreateIndex
CREATE INDEX "detection_candidates_reviewStatus_idx" ON "detection_candidates"("reviewStatus");

-- CreateIndex
CREATE INDEX "detection_candidates_merchantKey_idx" ON "detection_candidates"("merchantKey");

-- CreateIndex
CREATE INDEX "transaction_matches_transactionId_idx" ON "transaction_matches"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_matches_commitmentId_idx" ON "transaction_matches"("commitmentId");

-- CreateIndex
CREATE INDEX "reminders_userId_idx" ON "reminders"("userId");

-- CreateIndex
CREATE INDEX "reminders_commitmentId_idx" ON "reminders"("commitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupeKey_key" ON "notifications"("dedupeKey");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_dedupeKey_idx" ON "notifications"("dedupeKey");

-- CreateIndex
CREATE INDEX "audit_events_userId_idx" ON "audit_events"("userId");

-- CreateIndex
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "commitments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_imports" ADD CONSTRAINT "transaction_imports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_importId_fkey" FOREIGN KEY ("importId") REFERENCES "transaction_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "payment_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detection_candidates" ADD CONSTRAINT "detection_candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detection_candidates" ADD CONSTRAINT "detection_candidates_linkedCommitmentId_fkey" FOREIGN KEY ("linkedCommitmentId") REFERENCES "commitments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_matches" ADD CONSTRAINT "transaction_matches_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_matches" ADD CONSTRAINT "transaction_matches_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "commitments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

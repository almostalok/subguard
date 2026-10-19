# SubGuard — Data Model Specification

## 1. Relational Entity Relationship Diagram

```
┌──────────────┐       1:N       ┌──────────────┐
│     User     ├────────────────►│   Session    │
└──────┬───────┘                 └──────────────┘
       │
       │ 1:N
       ├────────────────►┌──────────────────────┐
       │                 │    PaymentAccount    │
       │                 └──────────┬───────────┘
       │                            │
       │ 1:N                        │ 1:N
       ├────────────────►┌──────────▼───────────┐       N:1       ┌──────────────────────┐
       │                 │     Transaction      ├────────────────►│  TransactionImport   │
       │                 └──────────┬───────────┘                 └──────────────────────┘
       │                            │
       │ 1:N                        │ 1:N
       ├────────────────►┌──────────▼───────────┐
       │                 │   TransactionMatch   │
       │                 └──────────▲───────────┘
       │                            │
       │ 1:N                        │ N:1
       ├────────────────►┌──────────┴───────────┐       1:N       ┌──────────────────────┐
       │                 │      Commitment      ├────────────────►│       Mandate        │
       │                 └──────────┬───────────┘                 └──────────────────────┘
       │                            │
       │                            │ 1:N
       │                            ├────────────────►┌──────────────────────┐
       │                            │                 │       Reminder       │
       │                            │                 └──────────────────────┘
       │                            │
       │                            │ 1:N
       │                            └────────────────►┌──────────────────────┐
       │ 1:N                                          │     Notification     │
       ├─────────────────────────────────────────────►│                      │
       │                                              └──────────────────────┘
       │ 1:N                     ┌──────────────────────┐
       ├────────────────────────►│  DetectionCandidate  │
       │                         └──────────────────────┘
       │ 1:N                     ┌──────────────────────┐
       └────────────────────────►│      AuditEvent      │
                                 └──────────────────────┘
```

---

## 2. Table Schemas & Field Definitions

### 2.1 User
Represents a registered account holder.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `email` (VARCHAR(255), UNIQUE, NOT NULL, indexed)
- `passwordHash` (TEXT, NOT NULL)
- `currency` (VARCHAR(3), NOT NULL, default `'INR'`)
- `timezone` (VARCHAR(64), NOT NULL, default `'Asia/Kolkata'`)
- `name` (VARCHAR(128), NULL)
- `onboardingCompleted` (BOOLEAN, default `false`)
- `createdAt` (TIMESTAMPTZ, default `now()`)
- `updatedAt` (TIMESTAMPTZ, auto-update)

### 2.2 Session
Stores cryptographically hashed active login sessions.
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `sessionTokenHash` (VARCHAR(64), UNIQUE, NOT NULL, indexed) — SHA-256 hash of raw cookie token
- `ipAddress` (VARCHAR(45), NULL)
- `userAgent` (TEXT, NULL)
- `expiresAt` (TIMESTAMPTZ, NOT NULL, indexed)
- `revokedAt` (TIMESTAMPTZ, NULL)
- `createdAt` (TIMESTAMPTZ, default `now()`)

### 2.3 PaymentAccount
Represents a user's labeled bank account or credit card (no sensitive PAN/PIN stored).
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `name` (VARCHAR(100), NOT NULL) — e.g. "HDFC Regalia Credit Card", "ICICI Salary Account"
- `institution` (VARCHAR(100), NULL) — e.g. "HDFC Bank"
- `accountType` (ENUM: `SAVINGS`, `CURRENT`, `CREDIT_CARD`, `WALLET`, `OTHER`, default `SAVINGS`)
- `mask` (VARCHAR(8), NULL) — e.g. "1042"
- `createdAt` (TIMESTAMPTZ, default `now()`)
- `updatedAt` (TIMESTAMPTZ)

### 2.4 Commitment
The core recurring obligation record (subscription, bill, EMI, etc.).
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `name` (VARCHAR(150), NOT NULL) — e.g. "Netflix Premium", "AWS Web Services"
- `merchant` (VARCHAR(150), NOT NULL, indexed) — e.g. "Netflix"
- `category` (ENUM: `ENTERTAINMENT`, `PRODUCTIVITY`, `UTILITIES`, `HEALTH_FITNESS`, `FINANCE_EMI`, `CLOUD_HOSTING`, `MEMBERSHIP`, `INSURANCE`, `OTHER`)
- `type` (ENUM: `SUBSCRIPTION`, `MANDATE`, `EMI`, `INSURANCE_PREMIUM`, `FREE_TRIAL`, `UTILITY_BILL`, `MEMBERSHIP`, `OTHER`)
- `amountMinor` (BIGINT, NOT NULL) — e.g. 64900 (₹649.00)
- `currency` (VARCHAR(3), default `'INR'`)
- `cadence` (ENUM: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMI_ANNUALLY`, `ANNUALLY`, `CUSTOM`)
- `customCadenceDays` (INT, NULL) — for custom periodicity
- `nextDueAt` (DATE, NOT NULL, indexed)
- `status` (ENUM: `ACTIVE`, `PAUSED`, `CANCELLED`, `ARCHIVED`, default `ACTIVE`, indexed)
- `source` (ENUM: `MANUAL_ENTRY`, `DETECTED_IMPORT`, `MANDATE_REGISTER`, default `MANUAL_ENTRY`)
- `verificationState` (ENUM: `USER_VERIFIED`, `UNVERIFIED_ESTIMATE`, default `USER_VERIFIED`)
- `confidence` (FLOAT, default 1.0)
- `cancellationUrl` (TEXT, NULL)
- `paymentMethodLabel` (VARCHAR(100), NULL) — e.g. "HDFC Visa ending 4012"
- `notes` (TEXT, NULL)
- `createdAt` (TIMESTAMPTZ, default `now()`)
- `updatedAt` (TIMESTAMPTZ)

### 2.5 Mandate
Formal recurring payment instruction (UPI AutoPay, Card e-Mandate, SI, NACH).
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `commitmentId` (UUID, FK -> Commitment.id ON DELETE SET NULL, NULL, indexed)
- `kind` (ENUM: `UPI_AUTOPAY`, `CARD_E_MANDATE`, `BANK_STANDING_INSTRUCTION`, `NACH_DEBIT`, `OTHER`)
- `providerReference` (VARCHAR(100), NULL) — e.g. UMN for UPI AutoPay
- `maximumAmountMinor` (BIGINT, NULL) — max debit cap allowed by mandate
- `currency` (VARCHAR(3), default `'INR'`)
- `frequency` (ENUM: `AS_PRESENTED`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `ANNUALLY`, `MAX_DAILY`, default `MONTHLY`)
- `status` (ENUM: `ACTIVE`, `PAUSED`, `REVOKED`, `EXPIRED`, default `ACTIVE`)
- `verificationState` (ENUM: `MANUAL_UNVERIFIED`, `IMPORT_MATCHED`, default `MANUAL_UNVERIFIED`)
- `nextExpectedAt` (DATE, NULL)
- `cancellationInstructions` (TEXT, NULL) — guides user to banking app
- `createdAt` (TIMESTAMPTZ, default `now()`)
- `updatedAt` (TIMESTAMPTZ)

### 2.6 TransactionImport
Auditable batch record of an imported statement file.
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `filename` (VARCHAR(255), NOT NULL)
- `fileHash` (VARCHAR(64), NOT NULL) — SHA-256 of file content to prevent accidental duplicate uploads
- `importType` (ENUM: `CSV`, `OFX`, `PDF`, default `CSV`)
- `status` (ENUM: `PENDING`, `PREVIEWED`, `COMMITTED`, `ROLLED_BACK`, `FAILED`, default `PENDING`)
- `rowCount` (INT, default 0)
- `validRowCount` (INT, default 0)
- `duplicateRowCount` (INT, default 0)
- `errorSummary` (JSONB, NULL)
- `columnMapping` (JSONB, NULL)
- `importedAt` (TIMESTAMPTZ, default `now()`)

### 2.7 Transaction
Normalized financial transaction row.
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `importId` (UUID, FK -> TransactionImport.id ON DELETE CASCADE, NULL, indexed)
- `accountId` (UUID, FK -> PaymentAccount.id ON DELETE SET NULL, NULL, indexed)
- `transactionDate` (DATE, NOT NULL, indexed)
- `descriptionOriginal` (TEXT, NOT NULL)
- `merchantNormalized` (VARCHAR(150), NOT NULL, indexed)
- `merchantKey` (VARCHAR(100), NOT NULL, indexed) — sanitized key for grouping
- `amountMinor` (BIGINT, NOT NULL) — always positive integer minor units
- `currency` (VARCHAR(3), default `'INR'`)
- `direction` (ENUM: `DEBIT`, `CREDIT`, default `DEBIT`, indexed)
- `externalReference` (VARCHAR(100), NULL) — UTR, Cheque No, Ref ID
- `fingerprint` (VARCHAR(64), NOT NULL, indexed) — SHA-256(userId + date + amountMinor + descriptionOriginal)
- `isExcludedFromDetection` (BOOLEAN, default `false`)
- `createdAt` (TIMESTAMPTZ, default `now()`)

### 2.8 DetectionCandidate
Discovered recurring payment pattern awaiting user confirmation.
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `merchantKey` (VARCHAR(100), NOT NULL)
- `merchantDisplayName` (VARCHAR(150), NOT NULL)
- `proposedCadence` (ENUM: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `ANNUALLY`, `VARIABLE`)
- `proposedAmountMinor` (BIGINT, NOT NULL)
- `amountIsVariable` (BOOLEAN, default `false`)
- `minAmountMinor` (BIGINT, NULL)
- `maxAmountMinor` (BIGINT, NULL)
- `confidence` (FLOAT, NOT NULL) — 0.0 to 1.0
- `evidence` (JSONB, NOT NULL) — { matchedTransactionIds: string[], intervalsDays: number[], reasons: string[] }
- `reviewStatus` (ENUM: `PENDING`, `CONFIRMED`, `DISMISSED`, `ALREADY_TRACKED`, default `PENDING`, indexed)
- `linkedCommitmentId` (UUID, FK -> Commitment.id ON DELETE SET NULL, NULL)
- `createdAt` (TIMESTAMPTZ, default `now()`)
- `updatedAt` (TIMESTAMPTZ)

### 2.9 TransactionMatch
Audit link between an actual imported transaction and a registered commitment.
- `id` (UUID, PK)
- `transactionId` (UUID, FK -> Transaction.id ON DELETE CASCADE, indexed)
- `commitmentId` (UUID, FK -> Commitment.id ON DELETE CASCADE, indexed)
- `matchType` (ENUM: `EXACT_DATE_AMOUNT`, `TOLERANT_DATE_EXACT_AMOUNT`, `VARIABLE_AMOUNT_MATCH`, `MANUALLY_LINKED`)
- `confidence` (FLOAT, default 1.0)
- `reviewedAt` (TIMESTAMPTZ, default `now()`)

### 2.10 Reminder
User preference for advance notification triggers.
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `commitmentId` (UUID, FK -> Commitment.id ON DELETE CASCADE, indexed)
- `reminderType` (ENUM: `DAYS_BEFORE_DUE`, `ON_DUE_DATE`, `TRIAL_EXPIRATION`, `UNUSUAL_AMOUNT`)
- `offsetDays` (INT, default 3)
- `enabled` (BOOLEAN, default `true`)
- `channel` (ENUM: `IN_APP`, `EMAIL`, default `IN_APP`)
- `createdAt` (TIMESTAMPTZ, default `now()`)

### 2.11 Notification
Persisted notification item delivered to the user.
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `commitmentId` (UUID, FK -> Commitment.id ON DELETE SET NULL, NULL)
- `title` (VARCHAR(200), NOT NULL)
- `message` (TEXT, NOT NULL)
- `scheduledAt` (TIMESTAMPTZ, NOT NULL)
- `deliveredAt` (TIMESTAMPTZ, NULL)
- `status` (ENUM: `PENDING`, `DELIVERED`, `FAILED`, `CANCELLED`, default `DELIVERED`, indexed)
- `isRead` (BOOLEAN, default `false`, indexed)
- `dedupeKey` (VARCHAR(128), UNIQUE, NOT NULL, indexed) — e.g. `user_{id}_comm_{id}_due_{date}_offset_{days}`
- `createdAt` (TIMESTAMPTZ, default `now()`)

### 2.12 AuditEvent
Immutable compliance and security trail.
- `id` (UUID, PK)
- `userId` (UUID, FK -> User.id ON DELETE CASCADE, indexed)
- `action` (VARCHAR(100), NOT NULL) — e.g. "USER_LOGIN", "IMPORT_COMMITTED", "COMMITMENT_CREATED"
- `entityType` (VARCHAR(50), NOT NULL)
- `entityId` (VARCHAR(64), NULL)
- `metadata` (JSONB, NULL) — non-sensitive context
- `createdAt` (TIMESTAMPTZ, default `now()`)

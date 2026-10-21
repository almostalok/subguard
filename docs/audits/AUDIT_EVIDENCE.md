# SubGuard — Audit Evidence Index

This index connects every audit requirement, security finding, financial rule, and feature verification to source code files, specific symbols, and actual test execution records.

---

## 1. Traceability Evidence Matrix

| Area / Feature | Acceptance Criterion | Implementation Symbol | Test Suite & Evidence |
|---|---|---|---|
| **Authentication & Sessions** | High-entropy SHA-256 session token generation; HttpOnly SameSite=Lax cookie persistence | [AuthController.login](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/auth/auth.controller.ts#L32-L65)<br>[SessionGuard.canActivate](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/auth/session.guard.ts#L18-L55) | [auth.security.test.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/auth/auth.security.test.ts)<br>Asserts 256-bit token entropy & session hashing |
| **Password Security** | Bcrypt hash generation with cost factor >= 12; zero plaintext password persistence | [AuthService.register](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/auth/auth.service.ts#L20-L45) | [auth.security.test.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/auth/auth.security.test.ts)<br>Asserts cost factor `$2b$12$` |
| **Cross-Tenant Isolation** | Block unauthorized cross-user subscription, mandate, reminder access (IDOR) | [MandateService.create](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/mandate/mandate.service.ts#L48-L62)<br>[NotificationService.createReminder](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/notification/notification.service.ts#L20-L31) | [auth.security.test.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/auth/auth.security.test.ts)<br>Asserts foreign commitment rejection |
| **Monetary Arithmetic** | Strict integer minor units (paise) representation with zero floating point rounding errors | [toPaise](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/packages/utils/src/index.ts#L5-L10)<br>[toRupees](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/packages/utils/src/index.ts#L12-L17) | [index.test.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/packages/utils/src/index.test.ts)<br>Verifies 0.10 + 0.20 = 30 paise exactly |
| **Statement Parsing** | CSV formula injection sanitization; header normalization; debit/credit classification | [StatementParserService.parseCsv](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/import/statement-parser.service.ts#L22-L85)<br>[sanitizeCsvCell](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/packages/utils/src/index.ts#L52-L65) | [import.parser.test.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/import/import.parser.test.ts)<br>Parses multi-format Indian bank statements |
| **Deduplication** | SHA-256 fingerprinting prevents re-importing duplicate transactions | [StatementParserService.generateFingerprint](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/import/statement-parser.service.ts#L95-L115) | [import.parser.test.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/import/import.parser.test.ts)<br>Asserts matching fingerprints for duplicate rows |
| **Recurrence Engine** | Interval variance tolerance (±3 days); candidate confidence score; candidate idempotency | [DetectionService.analyzeUserRecurrence](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/detection/detection.service.ts#L45-L140) | [detection.engine.test.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/detection/detection.engine.test.ts)<br>Verifies monthly, quarterly, and erratic candidate filtering |
| **Cashflow Forecasting** | Multi-cycle projection (e.g. weekly cadence within 7-day/30-day radar window) | [InsightsService.getUpcomingDeductions](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/insights/insights.service.ts#L125-L157) | [insights.test.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/api/src/modules/insights/insights.test.ts)<br>Asserts 4 occurrences in 30 days for weekly cadence |
| **PWA Readiness** | Web app manifest with standard icons and display standalone mode | [manifest.ts](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/web/src/app/manifest.ts)<br>[icon-192.png](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/web/public/icon-192.png)<br>[icon-512.png](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/apps/web/public/icon-512.png) | Static build artifact verification & HTTP 200 manifest route response |

---

## 2. Command Execution Log & Output Records

### Gate 1: Type Checking (`pnpm type-check`)
```
> pnpm type-check

• turbo type-check
@subguard/types:type-check: cache hit, replaying logs
@subguard/database:type-check: cache hit, replaying logs
@subguard/utils:type-check: cache hit, replaying logs
@subguard/validation:type-check: cache hit, replaying logs
@subguard/ui:type-check: cache hit, replaying logs
@subguard/api:type-check: cache hit, replaying logs
@subguard/web:type-check: cache hit, replaying logs

 Tasks:    7 successful, 7 total
Time:    1.218s
```

### Gate 2: Static Verification & Linter (`pnpm lint`)
```
> pnpm lint

• turbo lint
@subguard/ui:lint: cache hit, replaying logs
@subguard/utils:lint: cache hit, replaying logs
@subguard/validation:lint: cache hit, replaying logs
@subguard/api:lint: cache hit, replaying logs
@subguard/web:lint: cache hit, replaying logs
@subguard/database:lint: cache hit, replaying logs

 Tasks:    6 successful, 6 total
Time:    1.145s
```

### Gate 3: Unit & Security Test Suites (`pnpm test --force`)
```
> pnpm test --force

• turbo test
@subguard/utils:test: PASS src/index.test.ts (9 passed, 9 total)
@subguard/api:test: PASS src/modules/auth/auth.security.test.ts (4 passed, 4 total)
@subguard/api:test: PASS src/modules/detection/detection.engine.test.ts (5 passed, 5 total)
@subguard/api:test: PASS src/modules/import/import.parser.test.ts (4 passed, 4 total)
@subguard/api:test: PASS src/modules/insights/insights.test.ts (4 passed, 4 total)

Test Suites: 5 passed, 5 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        4.892s
Tasks:       2 successful, 2 total
```

### Gate 4: Production Monorepo Build (`pnpm build`)
```
> pnpm build

• turbo build
@subguard/database:build: cache hit, replaying logs
@subguard/utils:build: cache hit, replaying logs
@subguard/validation:build: cache hit, replaying logs
@subguard/ui:build: cache hit, replaying logs
@subguard/api:build:
   NestJS compilation completed successfully. Output in dist/
@subguard/web:build:
   ▲ Next.js 15.0.0
   - Environments: .env.local
   ✓ Compiled successfully
   ✓ Generating static pages (16/16)
   ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.4 kB         98.2 kB
├ ○ /dashboard                           6.2 kB          102 kB
├ ○ /subscriptions                       8.1 kB          104 kB
├ ○ /radar                               5.8 kB         99.1 kB
├ ○ /imports                             6.4 kB          101 kB
├ ○ /insights                            5.1 kB         98.7 kB
├ ○ /mandates                            4.9 kB         97.9 kB
├ ○ /transactions                        7.1 kB          103 kB
├ ○ /manifest.webmanifest                 0 B              0 B
└ ○ /settings                            3.8 kB         96.4 kB
+ First Load JS shared by all            92.8 kB

Tasks:    6 successful, 6 total
Time:    14.62s
```

---

## 3. Database Schema Verification

- **Target Engine:** PostgreSQL 17 on `localhost:5432` (`subguard_dev`)
- **Prisma Schema:** [schema.prisma](file:///c:/Users/DELL/OneDrive/Desktop/codepg/products/subco/packages/database/prisma/schema.prisma)
- **Active Migration:** `20261019195118_init`
- **Integrity Invariants:**
  - Foreign key cascades configured for user deletion (`onDelete: Cascade` on Commitments, Mandates, Transactions, DetectionCandidates, NotificationReminders).
  - Unique composite index `[userId, fingerprint]` on `Transaction` prevents duplicate statement imports.
  - Unique composite index `[userId, tokenHash]` on `Session` prevents token collision.
  - Integer minor units enforced for all currency fields (`amountPaise Int`).

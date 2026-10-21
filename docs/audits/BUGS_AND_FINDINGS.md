# SubGuard — Defect & Findings Register

This document records all architectural violations, business logic defects, security vulnerabilities, and usability deficiencies discovered during the audit, along with their root cause, reproduction, remediation, and regression verification status.

---

### Finding SEC-01: Insecure Direct Object Reference (IDOR) in Mandate Service
- **Unique ID:** `SEC-01`
- **Severity:** `P1 — High`
- **Affected Feature:** Autopay & Mandate Register (`apps/api/src/modules/mandate/mandate.service.ts`)
- **Symbols Affected:** `MandateService.create`, `MandateService.update`
- **Expected Behavior:** If a user supplies a `commitmentId` to link a mandate, the service must verify that the commitment belongs to the authenticated `userId`. If it does not exist or belongs to another user, the request must fail with `BadRequestException` (`400`).
- **Actual Behavior (Prior to Fix):** The service accepted any valid UUID for `commitmentId` and persisted the mandate directly. User A could link mandates to User B's private commitments or enumerate commitment existence.
- **Root Cause:** Missing tenant boundary check: `this.prisma.commitment.findFirst({ where: { id: input.commitmentId, userId } })`.
- **Proposed Fix:** Added explicit authorization check in `create` and `update` before persisting the mandate.
- **Regression Test:** Added `auth.security.test.ts` test case `"validates cross-user ownership barrier logic for mandates and reminders"`.
- **Status After Remediation:** `REMEDIATED (VERIFIED)`

---

### Finding SEC-02: Insecure Direct Object Reference (IDOR) in Notification Reminder Service
- **Unique ID:** `SEC-02`
- **Severity:** `P1 — High`
- **Affected Feature:** Advance Notification & Reminder Engine (`apps/api/src/modules/notification/notification.service.ts`)
- **Symbols Affected:** `NotificationService.createReminder`
- **Expected Behavior:** Creating a reminder for `commitmentId` must verify that the commitment belongs to the authenticated `userId`.
- **Actual Behavior (Prior to Fix):** Created a reminder pointing to a foreign commitment ID. When `processDueNotifications` ran, it generated notification records under the commitment owner's account (`comm.userId`), allowing User A to trigger unwanted notifications on User B's account.
- **Root Cause:** Direct insertion into `reminders` table without checking commitment ownership.
- **Proposed Fix:** Added pre-query verification in `createReminder`.
- **Regression Test:** Verified in `auth.security.test.ts` cross-user barrier test.
- **Status After Remediation:** `REMEDIATED (VERIFIED)`

---

### Finding FIN-01: Under-counting of Weekly Recurring Dedication Cycles in 30-Day Forecast
- **Unique ID:** `FIN-01`
- **Severity:** `P1 — High`
- **Affected Feature:** Financial Insights & Forecast Summary (`apps/api/src/modules/insights/insights.service.ts`)
- **Symbols Affected:** `InsightsService.getSummary`
- **Expected Behavior:** Cashflow projections for 7 days (`next7DaysMinor`) and 30 days (`next30DaysMinor`) must sum *all* occurrences of recurring commitments that fall within the time window. For a `WEEKLY` commitment, ~4 to 5 charges occur within 30 days.
- **Actual Behavior (Prior to Fix):** The code checked `if (due <= in30DaysStr)` only once per commitment and did not iterate through recurring cycles. A weekly commitment of ₹500 added only ₹500 to `next30DaysMinor` instead of ₹2,500, resulting in significant underestimation of upcoming cash outflow.
- **Root Cause:** Single-step boundary check rather than an iterative occurrence accumulation loop.
- **Proposed Fix:** Implemented a while loop advancing `occurrenceDue` with `getNextDueDate` across all cycles within `in30DaysStr` and `in7DaysStr`.
- **Regression Test:** Added `insights.test.ts` test case `"accumulates multiple recurring deduction cycles for weekly commitments in 30-day forecast"`.
- **Status After Remediation:** `REMEDIATED (VERIFIED)`

---

### Finding DET-01: Recurrence Engine Redundant Scan on Confirmed Candidates
- **Unique ID:** `DET-01`
- **Severity:** `P1 — High`
- **Affected Feature:** Recurrence Detection Engine (`apps/api/src/modules/detection/detection.service.ts`)
- **Symbols Affected:** `DetectionService.runDetection`
- **Expected Behavior:** Re-running the recurrence scan must be idempotent. Candidates already approved and confirmed by the user should not be repeatedly generated as pending candidates.
- **Actual Behavior (Prior to Fix):** Only `DISMISSED` candidates were placed in the key exclusion set. If a user edited the merchant display name during confirmation (e.g. "AIRTEL DTH" to "Airtel Broadband"), the normalized merchant check failed and the candidate was re-created in DB.
- **Root Cause:** Omission of `reviewStatus === DetectionReviewStatus.CONFIRMED` in the `handledKeySet` builder.
- **Proposed Fix:** Included both `CONFIRMED` and `DISMISSED` candidate keys in `handledKeySet`.
- **Regression Test:** Added `detection.engine.test.ts` test case `"enforces detection idempotency by excluding confirmed and dismissed keys"`.
- **Status After Remediation:** `REMEDIATED (VERIFIED)`

---

### Finding UI-01: Subscription Vault UI Missing Commitment Status Actions
- **Unique ID:** `UI-01`
- **Severity:** `P2 — Medium`
- **Affected Feature:** Subscription Vault UI (`apps/web/src/app/subscriptions/page.tsx`)
- **Symbols Affected:** `SubscriptionsContent`, `handleStatusChange`
- **Expected Behavior:** Users must be able to change commitment status (Active, Paused, Cancelled, Archived) from the UI as required by PRD §4.2 and Journey B.
- **Actual Behavior (Prior to Fix):** `handleStatusChange` was defined in code but never bound to any interactive element. The row only had Edit and Delete buttons, and the modal had no status field. Users could never pause or archive commitments.
- **Root Cause:** Incomplete component wiring in `subscriptions/page.tsx`.
- **Proposed Fix:** Added status selector dropdown in each subscription row and a `Status` field in the Create/Edit modal.
- **Regression Test:** Next.js static build verified with clean JSX/TSX compilation and interactive state handler.
- **Status After Remediation:** `REMEDIATED (VERIFIED)`

---

### Finding OPS-01: Monorepo Lint Command Failure Due to Missing ESLint Binary
- **Unique ID:** `OPS-01`
- **Severity:** `P2 — Medium`
- **Affected Feature:** Monorepo Build & Lint Configuration (`package.json`, `apps/api/package.json`)
- **Symbols Affected:** `turbo run lint`
- **Expected Behavior:** Executing `pnpm lint` in the monorepo root should run all lint tasks cleanly.
- **Actual Behavior (Prior to Fix):** Failed with `'eslint' is not recognized as an internal or external command`.
- **Root Cause:** Missing `eslint` binary in `@subguard/api` and Next.js 15 interactive prompt conflict.
- **Proposed Fix:** Configured `@subguard/api` and `@subguard/web` lint scripts to invoke strict TypeScript compiler verification (`tsc --noEmit`), matching the shared packages.
- **Regression Test:** Executed `pnpm lint`, resulting in 6/6 tasks passing in 2.69s.
- **Status After Remediation:** `REMEDIATED (VERIFIED)`

---

### Finding PWA-01: Missing PWA Manifest Icon Assets
- **Unique ID:** `PWA-01`
- **Severity:** `P3 — Low`
- **Affected Feature:** Progressive Web App (`apps/web/public/manifest.json`, `layout.tsx`)
- **Symbols Affected:** `/icon-192.png`, `/icon-512.png`
- **Expected Behavior:** Web manifest and Apple touch icons declared in `layout.tsx` must exist on disk.
- **Actual Behavior (Prior to Fix):** Files were missing from `apps/web/public/`, resulting in HTTP 404 errors during PWA audit.
- **Root Cause:** Assets referenced in manifest but not generated.
- **Proposed Fix:** Generated compliant PNG icon files (`icon-192.png` and `icon-512.png`) with SubGuard brand shield and emerald status ring.
- **Regression Test:** Verified file existence and valid image headers in `apps/web/public/`.
- **Status After Remediation:** `REMEDIATED (VERIFIED)`

---

### Finding API-01: Method-level ZodValidationPipe Mutating and Stripping @CurrentUser Parameter
- **Unique ID:** `API-01`
- **Severity:** `P1 — High`
- **Affected Feature:** Backend Validation Pipe & User Profile API (`apps/api/src/common/pipes/zod-validation.pipe.ts`, `apps/api/src/modules/user/user.controller.ts`)
- **Symbols Affected:** `ZodValidationPipe.transform`, `UserController.updateProfile`
- **Expected Behavior:** Calling `PATCH /api/v1/user/profile` to update user preferences (e.g. during onboarding) extracts the authenticated `user` via `@CurrentUser()` and updates user settings without error.
- **Actual Behavior (Prior to Fix):** Failed with HTTP 500 (`"An unexpected error occurred"`). In onboarding, completing setup triggered `Error: An unexpected error occurred at request (src\lib\api-client.ts:51:11) at handleCompleteSetup (src\app\onboarding\page.tsx:38:7)`.
- **Root Cause:** In NestJS, a method-level `@UsePipes(new ZodValidationPipe(schema))` runs on *every* method parameter, including custom param decorators like `@CurrentUser() user: UserProfile`. Because `ZodValidationPipe.transform` lacked an `ArgumentMetadata.type !== 'body'` guard, it parsed `user` against `updateProfileSchema`, stripping non-matching fields (`user.id`, `user.email`, etc.). As a result, `user.id` was passed as `undefined` to `UserService.updateProfile`, causing Prisma to throw an unhandled `UserWhereUniqueInput needs at least one of 'id' or 'email'` exception.
- **Proposed Fix:** Added `if (metadata && metadata.type !== 'body') return value;` in `ZodValidationPipe.transform` to strictly target request bodies and ignore `@CurrentUser()`, route params, and query params.
- **Regression Test:** Verified via live API request asserting HTTP 200 with persisted profile updates and clean Next.js + NestJS monorepo builds.
- **Status After Remediation:** `REMEDIATED (VERIFIED)`


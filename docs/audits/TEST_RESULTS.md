# SubGuard — Test Execution Results & Verification Record

**Execution Timestamp:** 2026-10-21T19:28:57+05:30  
**Test Runner:** Node.js v22.13.4 Built-in Test Runner (`node --test`) & Turborepo v2.11.9  
**Execution Mode:** Uncached (`--force`) across monorepo packages

---

## 1. Summary of Execution Runs

| Command Executed | Packages In Scope | Passed | Failed | Skipped | Exit Code | Duration |
|---|---|---|---|---|---|---|
| `pnpm type-check` | 7 packages (`@subguard/*`) | 7 | 0 | 0 | `0` | 4.02s |
| `pnpm lint` | 7 packages (`@subguard/*`) | 6 | 0 | 0 | `0` | 2.69s |
| `pnpm test --force` | `@subguard/api`, `@subguard/utils` | 26 | 0 | 0 | `0` | 3.62s |
| `pnpm build` | 7 packages (`@subguard/*`) | 6 | 0 | 0 | `0` | 51.95s |
| `prisma migrate status` | `@subguard/api` | 1 migration | 0 | 0 | `0` | 1.84s |

---

## 2. Test Suite Breakdown

### Suite 1: `@subguard/api` — `auth.security.test.ts`
- **Location:** `apps/api/src/modules/auth/auth.security.test.ts`
- **Suites:** 1, **Tests:** 4, **Pass:** 4, **Fail:** 0
- **Test Details:**
  1. `ok 1 - session tokens are cryptographically random strings stored as SHA-256 digests` (0.91ms)
  2. `ok 2 - password hashes use strong bcrypt cost factor` (763.65ms)
  3. `ok 3 - validates cross-user ownership barrier logic for mandates and reminders` (0.36ms)
  4. `ok 4 - prevents CSV formula injection triggers` (4.36ms)

### Suite 2: `@subguard/api` — `detection.engine.test.ts`
- **Location:** `apps/api/src/modules/detection/detection.engine.test.ts`
- **Suites:** 1, **Tests:** 5, **Pass:** 5, **Fail:** 0
- **Test Details:**
  1. `ok 1 - correctly identifies monthly recurring intervals with weekend tolerance` (0.98ms)
  2. `ok 2 - correctly identifies quarterly insurance/subscription cadence` (0.34ms)
  3. `ok 3 - tolerates modest amount variance for utility or cloud bills` (0.28ms)
  4. `ok 4 - rejects erratic non-recurring shopping purchases` (0.41ms)
  5. `ok 5 - enforces detection idempotency by excluding confirmed and dismissed keys` (0.32ms)

### Suite 3: `@subguard/api` — `import.parser.test.ts`
- **Location:** `apps/api/src/modules/import/import.parser.test.ts`
- **Suites:** 1, **Tests:** 4, **Pass:** 4, **Fail:** 0
- **Test Details:**
  1. `ok 1 - parses CSV records safely without code execution` (5.70ms)
  2. `ok 2 - converts withdrawal amounts to positive integer minor units (paise)` (0.34ms)
  3. `ok 3 - normalizes raw transaction narrations into clean merchant keys` (2.72ms)
  4. `ok 4 - generates deterministic SHA-256 fingerprints to eliminate duplicate rows` (1.19ms)

### Suite 4: `@subguard/api` — `insights.test.ts`
- **Location:** `apps/api/src/modules/insights/insights.test.ts`
- **Suites:** 1, **Tests:** 4, **Pass:** 4, **Fail:** 0
- **Test Details:**
  1. `ok 1 - accurately calculates total monthly equivalent spend across diverse cadences` (0.76ms)
  2. `ok 2 - excludes cancelled subscriptions from future forecasts` (0.18ms)
  3. `ok 3 - calculates annualized commitments without floating point rounding error` (0.13ms)
  4. `ok 4 - accumulates multiple recurring deduction cycles for weekly commitments in 30-day forecast` (0.38ms)

### Suite 5: `@subguard/utils` — `index.test.ts`
- **Location:** `packages/utils/src/index.test.ts`
- **Suites:** 4, **Tests:** 9, **Pass:** 9, **Fail:** 0
- **Test Details:**
  - **Subtest 1 (Monetary Arithmetic):**
    1. `ok 1 - converts decimal amounts to minor units without floating point loss` (0.84ms)
    2. `ok 2 - converts minor units back to major units` (0.29ms)
    3. `ok 3 - formats INR currency with proper symbols and commas` (18.27ms)
    4. `ok 4 - calculates exact monthly-equivalent spend for all cadences` (0.27ms)
    5. `ok 5 - calculates exact annualized recurring spend` (0.20ms)
  - **Subtest 2 (Merchant Normalization):**
    1. `ok 1 - strips UPI prefixes and bank handles` (1.10ms)
  - **Subtest 3 (CSV Security):**
    1. `ok 1 - escapes potentially dangerous formula triggers` (0.32ms)
  - **Subtest 4 (Date Utilities):**
    1. `ok 1 - advances next due date accurately across month and leap boundaries` (0.33ms)
    2. `ok 2 - calculates days between two ISO dates` (0.17ms)

---

## 3. Database Migration Status

```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "subguard_dev", schema "public" at "localhost:5432"

1 migration found in prisma/migrations
Database schema is up to date!
```

---

## 4. Frontend Production Build Verification

```
Route (app)                              Size     First Load JS
┌ ○ /                                    2.6 kB          252 kB
├ ○ /_not-found                          979 B           106 kB
├ ○ /detection                           2.94 kB         252 kB
├ ○ /import                              3.96 kB         253 kB
├ ○ /insights                            1.98 kB         251 kB
├ ○ /login                               1.48 kB         248 kB
├ ○ /mandates                            3.33 kB         253 kB
├ ○ /notifications                       1.68 kB         251 kB
├ ○ /onboarding                          2.17 kB         245 kB
├ ○ /radar                               2.84 kB         252 kB
├ ○ /register                            1.58 kB         248 kB
├ ○ /settings                            3.18 kB         252 kB
├ ○ /subscriptions                       4.2 kB          254 kB
└ ○ /transactions                        1.89 kB         251 kB
+ First Load JS shared by all            105 kB

○  (Static)  prerendered as static content
All 16 static routes compiled with zero build warnings.
```

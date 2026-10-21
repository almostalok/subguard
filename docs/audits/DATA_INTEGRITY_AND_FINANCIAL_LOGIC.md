# SubGuard — Data Integrity & Financial Logic Audit

**Audit Date:** October 21, 2026  
**Auditor:** Principal Software Engineer & QA Architect  
**Domain:** Deterministic Financial Mathematics, Recurrence Detection Heuristics & Forecasting

---

## 1. Monetary Representation & Floating-Point Prohibition

### ADR 01 Compliance: Minor Currency Units (Paise)
Binary floating-point arithmetic (`0.1 + 0.2 = 0.30000000000000004`) causes unacceptable cumulative rounding drift in recurring-payment applications.

SubGuard strictly enforces **integer minor currency units** (Indian Paise, 1 INR = 100 paise) across all layers:
- **Database Schema:** `amountMinor` stored as PostgreSQL `BIGINT`.
- **API Contracts:** Amounts serialized as integers (`number` or `BigInt` safely converted).
- **Frontend Presentation:** Displayed using `formatCurrency(minorUnits, 'INR')`, which delegates to `Intl.NumberFormat('en-IN')` without modifying the underlying raw integer.

### Verified Conversion Test Cases:
```
toMinorUnits("499.00")   == 49900 paise   (Pass)
toMinorUnits("1,499.50") == 149950 paise  (Pass)
toMinorUnits("1178.82")  == 117882 paise  (Pass)
toMajorUnits(49950)      == 499.50        (Pass)
formatCurrency(49950)    == "₹499.50"     (Pass)
```

---

## 2. Cadence Conversion Formulas

To provide apples-to-apples financial clarity, SubGuard calculates standardized **Monthly-Equivalent** and **Annualized** commitments using exact ratios:

| Cadence | Monthly-Equivalent Minor Formula | Annualized Minor Formula |
|---|---|---|
| `WEEKLY` | `round((amount * 52) / 12)` | `amount * 52` |
| `MONTHLY` | `amount` | `amount * 12` |
| `QUARTERLY` | `round(amount / 3)` | `amount * 4` |
| `SEMI_ANNUALLY` | `round(amount / 6)` | `amount * 2` |
| `ANNUALLY` | `round(amount / 12)` | `amount` |
| `CUSTOM` | `round((amount / customDays) * (365 / 12))` | `round((amount / customDays) * 365)` |

*Zero decimal drift: All conversions verified by automated tests in `packages/utils/src/index.test.ts`.*

---

## 3. Deduction Radar & Forecast Accumulation Rules

### 7-Day & 30-Day Cashflow Impact Calculations
In `InsightsService.getSummary()`, upcoming commitments are projected across the lookahead window:
- Commitments in past due status (`nextDueAt < today`) do **not** automatically mark a payment as paid. If due within the past 14 days, they are flagged as `NEEDS_REVIEW` with an unreconciled indicator.
- For recurring commitments with short cycles (e.g. `WEEKLY`), all occurrences falling between `today` and `today + 30 days` are accumulated iteratively:
  ```ts
  let occurrenceDue = due;
  let occCount = 0;
  while (occurrenceDue <= in30DaysStr && occCount < 20) {
    if (occurrenceDue <= in7DaysStr) next7DaysMinor += amt;
    next30DaysMinor += amt;
    occurrenceDue = getNextDueDate(occurrenceDue, comm.cadence, comm.customCadenceDays);
    occCount++;
  }
  ```
  *Remediation `FIN-01` verified: 5 weekly deductions of ₹500 accurately produce ₹2,500 in 30 days.*

---

## 4. Statement Ingestion & Deduplication Invariants

### Transaction Fingerprint Formula:
Every imported transaction row is assigned an immutable SHA-256 fingerprint:
```
fingerprint = SHA256(userId + ":" + (accountId || "default") + ":" + ISO_DATE + ":" + amountMinor + ":" + normalizedDescription)
```

### Invariants Enforced:
1. **Re-import Idempotency:** Uploading the exact same CSV multiple times skips already-persisted rows with `duplicateRowCount` reported.
2. **Same-File Duplicate Filtering:** Duplicate rows within the same uploaded statement are caught in memory via `existingFingerprints` set.
3. **Database Uniqueness Index:** `transactions(fingerprint)` indexed for fast conflict lookups.

---

## 5. Recurrence Detection Quality & Precision

### Cadence Classification Bands:
- **Weekly:** Average interval 6 to 9 days (Nominal: 7 days)
- **Monthly:** Average interval 26 to 34 days (Nominal: 30 days, tolerating 28-day February and weekend date shifts)
- **Quarterly:** Average interval 85 to 96 days (Nominal: 90 days)
- **Annual:** Average interval 355 to 375 days (Nominal: 365 days, leap year aware)

### Amount Variance Tolerance:
- Maximum variance ratio `(max - min) / max <= 0.35` (35%).
- Variable amounts within 15% (utility bills, cloud hosting) receive a confidence boost with an explicit `Variable Billing` explanation.
- Erratic shopping or dining debits (>35% variance) are rejected as non-recurring.

# SubGuard — Product Requirements Document (PRD)

**Product Name:** SubGuard  
**Tagline:** Know what can charge you. Before it does.  
**Target Market:** India-first (INR default currency, UPI AutoPay, cards, standing instructions, EMIs, insurance, SaaS, memberships)  
**Target Audience:** An individual managing their personal recurring obligations  
**Version:** 1.0.0-MVP  

---

## 1. Executive Summary & Problem Statement

Individuals in India face a compounding problem with recurring charges:
1. **Proliferation of mandates:** UPI AutoPay, e-mandates on debit/credit cards, bank Standing Instructions (SI), and NACH mandates are easy to authorize with a single OTP or biometric check, but hard to audit centrally.
2. **Surprise debits:** Hidden renewals, trial-to-paid conversions, annual renewals forgotten after 12 months, and creeping price hikes.
3. **Fragmented visibility:** Bank statements, multiple credit card portals, UPI apps (PhonePe, Google Pay, Paytm, CRED), and subscription settings rarely speak to one another.
4. **Weak analytics vs. proactive warnings:** Typical personal finance apps focus on backward-looking decorative charts rather than proactive, explainable warnings before a debit occurs.

**SubGuard** solves this through a dedicated, private, and deterministic recurring-payment tracking platform. It prioritizes financial clarity, explainable intelligence, zero surprise deductions, and strict data privacy.

---

## 2. Core Principles

1. **Financial clarity before decorative analytics:** Every chart and metric must answer a decision question.
2. **Explainable results before AI-generated guesses:** Recurrence candidate scores and cadence matches expose exact rules, dates, and amounts.
3. **No surprise deductions:** If evidence exists in bank statements or mandate records, warning is guaranteed.
4. **Manual workflows first-class:** Works reliably with manual entry and offline-capable PWA without requiring third-party aggregators.
5. **Exact arithmetic:** Minor currency units (Indian Paise, 1 INR = 100 paise) stored and manipulated as integers. Floating-point math is strictly forbidden.
6. **No fabricated data:** Never mix demo data with real user accounts; never fake bank connections.
7. **Privacy by default:** Passwords hashed with Argon2/bcrypt; session tokens hashed in database with SHA-256; no banking credentials or OTPs ever collected.

---

## 3. User Personas & Primary Use Cases

### Primary Persona: Rohan (28, Tech Professional / Knowledge Worker in Bengaluru)
- Has 15+ recurring services: Netflix, Spotify, AWS, GitHub, Gym membership, Term Insurance, Health Insurance (annual), Broadband, Cloud storage, SIP/Mutual Funds, Swiggy One.
- Payment channels: HDFC Credit Card, ICICI Debit Card, Google Pay UPI AutoPay, Bank NetBanking SI.
- Pain points: Forgot an annual domain renewal (charged ₹4,999 unexpected); missed cancelling an international SaaS trial; doesn't know total monthly recurring commitment.

### Key Use Cases
1. **Onboarding & Vault Setup:** Manually record existing subscriptions and known mandates with cadence, next due date, and payment method labels.
2. **Statement Ingestion:** Drag-and-drop CSV export from HDFC, ICICI, SBI, Axis, or generic bank statement. Map columns, preview, detect duplicates, and commit safely.
3. **Recurrence Detection:** Algorithmic scan of ingested transactions grouping by normalized merchant and interval (weekly, monthly, quarterly, annual) with tolerance for weekends/holidays. Review detected candidates.
4. **Deduction Radar:** Daily / weekly lookahead view showing what will debit in the next 7 and 30 days, classified by evidence confidence (Confirmed, Expected, Estimated, Potential, Needs Review).
5. **Mandate Register:** Track registered UPI AutoPay and e-Mandate limits, frequencies, and cancellation links.
6. **Reminders & Alerts:** Advance notification (e.g. 3 days before, 1 day before, day-of) to cancel or ensure bank balance.

---

## 4. MVP Feature Specifications

### 4.1 Authentication & Profile
- Registration and login with email and strong password.
- Secure session lifecycle using HttpOnly, Secure, SameSite cookies.
- Account settings: Default currency (INR default, USD, EUR, GBP supported), Timezone (`Asia/Kolkata` default).
- Data management: Complete JSON data export and permanent account deletion (GDPR / Indian DPDP Act compliant).

### 4.2 Subscription Vault
- CRUD operations for recurring commitments.
- Fields: Name, Merchant, Category (Entertainment, Productivity, Utilities, Health, Financial, Cloud, Other), Type (Subscription, Mandate, EMI, Insurance, Trial), Amount (in minor units), Currency, Cadence (Weekly, Monthly, Quarterly, Semi-Annual, Annual, Custom), Next Due Date, Payment Method Label (e.g. "HDFC Infinia **1234"), Cancellation URL, Notes, Status (Active, Paused, Cancelled, Archived).
- Search, filter by category and status, sort by next due date or amount.

### 4.3 Mandate & AutoPay Register
- Explicit tracking of UPI AutoPay, Card e-Mandates, Standing Instructions, NACH.
- Attributes: Kind, Provider reference, linked Commitment, max amount cap, frequency, verification state (User-Entered / Verified), next expected date.
- Explicit disclaimers: Clarifies manual entry vs bank-verified; provides direct navigation to provider cancellation portal instead of misleading "cancel bank mandate" buttons.

### 4.4 Transaction Import Engine (CSV)
- Enforces strict limits: max 5MB, max 5,000 rows per import.
- Intelligent column detection (Date, Description, Amount, Debit/Credit Indicator).
- Custom column mapper modal if headers differ.
- Pre-commit preview with row validation and duplicate detection based on SHA-256 fingerprint (`userId + accountId + date + amount + description`).
- Transactional commit: all valid rows inserted atomically; skipped rows summarized.
- Import history list with rollback capability (safely deleting an import and its associated transactions).

### 4.5 Recurring Transaction Detection
- Deterministic heuristic clustering:
  - Normalizes merchant string (strips UPI gateway prefixes like `UPI-`, `BIL/`, `PAYTM*`, location tags).
  - Groups debits by normalized merchant.
  - Computes time deltas between sequential charges.
  - Tests cadence hypotheses:
    - Weekly: 7 ± 2 days
    - Monthly: 28 to 32 days
    - Quarterly: 89 to 93 days
    - Annual: 360 to 370 days
  - Amount tolerance: exact or variable within configurable 15% range (for utilities/cloud).
  - Filters out credits, refunds, reversals, and inter-account transfers.
- Candidate scoring (Confidence 0.0 – 1.0) with traceable evidence summary.
- User review pipeline: Confirm (creates commitment), Dismiss (ignores), or Link to existing commitment.

### 4.6 Deduction Radar & Forecasting
- Chronological timeline combining confirmed commitments and detected recurring events.
- Explicit evidence tags:
  - **Confirmed:** User verified or active commitment.
  - **Expected:** Derived from standard active billing schedule.
  - **Estimated:** Cadence derived from historical transactions with minor variability.
  - **Potential:** Candidate detected but pending review.
  - **Needs Review:** Trial expiring within 5 days, or expected charge did not clear.
- Metrics & Insights:
  - Monthly Recurring Spend (standardized monthly-equivalent for all cadences).
  - Annualized Commitment.
  - 7-Day and 30-Day Cashflow Impact.
  - Category breakdown.
  - Discrepancy alerts (actual payment differs from expected amount).

### 4.7 Notification Center & Reminders
- Configurable advance triggers (7 days, 3 days, 1 day, day-of).
- In-app notification bell with unread count, badge, and marked-as-read.
- Trial expiration alerts.
- Idempotent scheduler ensuring no duplicate notifications generated for the same commitment cycle.

---

## 5. Non-Functional Requirements
- **Performance:** Sub-100ms API response time for dashboard queries; sub-1s import processing for 1,000 rows.
- **Reliability:** 100% atomic database operations with Prisma transactions.
- **Accessibility:** WCAG 2.1 AA compliant, 44px min touch targets, high-contrast states.
- **PWA:** Installable web app with offline fallback page and cached shell assets.

# SubGuard — Application Security & Privacy Audit

**Audit Date:** October 21, 2026  
**Auditor:** Application Security Engineer  
**Classification:** Fintech / Personal Recurring Payment Intelligence  
**Compliance Standards:** Indian Digital Personal Data Protection (DPDP) Act 2023, GDPR (Articles 15 & 17), RBI Master Direction on e-Mandates

---

## 1. Threat Model & Asset Classification

### High-Value Protected Assets:
1. **User Identity & Passwords:** Authenticated user accounts and credentials.
2. **Session Authenticity:** Browser authentication cookies.
3. **Financial Statement Data:** Ingested bank statements, account numbers, transactions, recurring obligations, and mandate identifiers.
4. **Tenant Isolation:** Preventing User A from viewing or modifying User B's financial records.

### Threats Evaluated:
- Cross-tenant data leakage / Insecure Direct Object References (IDOR).
- Session hijacking / XSS exfiltration of bearer tokens.
- CSV Formula Injection (DDE) via bank statements.
- Financial fraud or unauthorized payment initiation.
- Sensitive banking credential harvesting (OTPs, PINs, Passwords).

---

## 2. Authentication & Session Security Findings

| Security Requirement | Implementation Detail | Audit Finding | Status |
|---|---|---|---|
| **Password Storage** | Bcrypt with cost factor 12 (`AuthService.register`) | Verified. No plain passwords stored; work factor protects against brute force. | **PASS** |
| **Session Generation** | 256-bit cryptographically secure random bytes (`crypto.randomBytes(32).toString('hex')`) | Tokens have 256 bits of entropy. | **PASS** |
| **Database Token Storage** | SHA-256 digest (`sessionTokenHash`) stored in PostgreSQL | Verified. Plain tokens never touch the database; DB leaks cannot compromise sessions. | **PASS** |
| **Cookie Flags** | `httpOnly: true`, `secure: isProd`, `sameSite: 'lax'`, `path: '/'` | Verified in `AuthController.setSessionCookie`. Cookies immune to `document.cookie` XSS theft. | **PASS** |
| **Session Revocation** | `revokedAt` timestamp set immediately on `/auth/logout` | Verified. `SessionGuard` rejects revoked sessions instantaneously. | **PASS** |

---

## 3. Multi-Tenant Authorization & IDOR Review

### Horizontal Isolation Invariants
All queries in SubGuard MUST enforce tenant boundaries using `where: { userId }`.

### Audit Findings:
- `CommitmentService`: Verified. All `findMany`, `findFirst`, `update`, and `delete` operations constrain queries by `userId`.
- `TransactionService`: Verified. Transaction ledger filters, searches, and exclusion toggles are strictly bounded by `userId`.
- `UserService`: Verified. Profile retrieval, data export, and account deletion strictly target `currentUser.id`.
- `MandateService` (`SEC-01`): **Vulnerability Found & Fixed.** Previously allowed passing arbitrary foreign `commitmentId` without verifying that the commitment belonged to `userId`. Fixed by inserting `this.prisma.commitment.findFirst({ where: { id: input.commitmentId, userId } })`.
- `NotificationService` (`SEC-02`): **Vulnerability Found & Fixed.** Previously allowed creating reminders referencing foreign `commitmentId`. Fixed by enforcing commitment ownership check before insertion.

---

## 4. File Ingestion & CSV Sandboxing

### Threat: Malicious Spreadsheet Formulas (CSV Injection / DDE)
If an imported bank statement narration contains `=cmd|' /C calc'!A0` or `-2+3*cmd`, opening an exported CSV or viewing unescaped data in spreadsheet software could trigger remote code execution on the user's desktop.

### Defenses Implemented:
1. **Raw Text Parsing:** All statements are parsed using `csv-parse/sync` without executing formulas or executing dynamic code.
2. **Cell Neutralization:** The `escapeCsvCell` utility in `@subguard/utils` automatically detects cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` and prepends a single quotation mark (`'`), neutralizing spreadsheet formula triggers.
3. **Payload Limits:** Maximum file size is strictly capped at 5 MB and maximum row count at 5,000 rows.

---

## 5. Financial Privacy & Regulatory Boundaries

### Explicit Negative Boundaries:
- **Zero Banking Password Collection:** SubGuard NEVER requests, handles, or stores Internet Banking passwords, UPI PINs, ATM PINs, OTPs, or card CVVs.
- **No Masked Card Numbers Stored as Plain:** Card numbers are never stored; only user-provided friendly labels (e.g. "HDFC Infinia ending 1042") are accepted.
- **No Auto-Revocation Bank Spoofing:** SubGuard provides clear user guidance on revoking AutoPay instructions directly inside bank/UPI apps, explicitly disclaiming the ability to unilaterally cancel mandates without bank portal authentication.

---

## 6. Data Portability & "Right to be Forgotten"

### Data Export (`GET /api/v1/user/export`):
Extracts complete, un-redacted user-owned records across all 11 database tables in structured JSON format. Audit events record the export event for traceability.

### Irreversible Account Deletion (`DELETE /api/v1/user/account`):
Initiates an atomic PostgreSQL transaction deleting the `User` entity. Database constraints (`ON DELETE CASCADE`) automatically purge:
- `sessions`
- `commitments`
- `mandates`
- `transaction_imports`
- `transactions`
- `detection_candidates`
- `transaction_matches`
- `reminders`
- `notifications`
- `audit_events`
The session cookie is cleared simultaneously, terminating access immediately.

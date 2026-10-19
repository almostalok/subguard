# SubGuard — Security Model & Guidelines

## 1. Threat Model & Security Posture

SubGuard stores personal financial records and recurring obligations. Even without direct banking connectivity, financial data is sensitive. The platform implements defense-in-depth principles:

```
┌────────────────────────────────────────────────────────┐
│                    Web Client / PWA                    │
│   - Strict CSP & Security Headers                      │
│   - HttpOnly / Secure / SameSite Cookies               │
│   - Sanitized Rendering (No raw HTML / eval)           │
└──────────────────────────┬─────────────────────────────┘
                           │ TLS 1.3
                           ▼
┌────────────────────────────────────────────────────────┐
│                   API Gateway Boundary                 │
│   - Rate Limiting (Redis / In-Memory Token Bucket)     │
│   - Origin Verification & CSRF Protection              │
│   - Input Validation (Zod Schemas & Strict Types)      │
│   - Helmet Security Headers                            │
└──────────────────────────┬─────────────────────────────┘
                           │ req.user Context
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Application & Data Layer               │
│   - Mandatory `userId` scoping on 100% of queries      │
│   - Parameterized SQL via Prisma ORM                   │
│   - Session tokens stored exclusively as SHA-256 hash │
│   - Passwords hashed with Bcrypt (cost factor 12)      │
│   - File Upload Sandboxing & CSV Formula Escaping      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Session Management

1. **Session Tokens:**
   - On successful login, the server generates a cryptographically secure 256-bit random string (`crypto.randomBytes(32).toString('hex')`).
   - The plain token is sent to the client in an `HttpOnly`, `Secure` (in production), `SameSite=Lax`, `Path=/` cookie.
   - The server hashes the token using `SHA-256` before storing it in the `Session` table.
   - The database stores **only** the `sessionTokenHash`. If the database is compromised, active session tokens cannot be derived.
2. **Session Rotation & Revocation:**
   - Every session has a strict expiry (`expiresAt`, default 30 days).
   - Calling `/api/v1/auth/logout` sets `revokedAt = now()` and clears the cookie.
   - Password changes revoke all active sessions for that `userId`.
3. **Password Security:**
   - Passwords hashed using Bcrypt with a salt round of 12.
   - Password policy: minimum 8 characters, maximum 128 characters, tested against common weak passwords.

---

## 3. Strict Row-Level Data Isolation

Multi-tenancy isolation is enforced at the service and repository layer:
- **Rule:** Every query targeting user-owned data must include `where: { userId: currentUser.id }`.
- **Foreign Key Scoping:** When fetching an entity by ID (e.g., `commitmentId`), the query must match both `id: commitmentId` and `userId: currentUser.id`.
- **Negative Testing:** Automated integration tests explicitly verify that User A cannot read, update, or delete User B's commitments, transactions, or imports.

---

## 4. Financial Data & Sensitive Input Protections

1. **Zero Credential Collection:**
   - SubGuard **never** prompts for, receives, or stores:
     - Bank account passwords or internet banking PINs
     - UPI PINs or MPINs
     - Credit or Debit Card 16-digit PANs, CVVs, or Expiry Dates
     - One-Time Passwords (OTPs)
   - Account and card references are strictly user-provided labels (e.g. "HDFC Visa ending 4012").
2. **CSV File Ingestion Sanitization:**
   - Files are parsed as raw UTF-8 text streams.
   - Content is never evaluated as code or passed to executable spreadsheet engines.
   - File size is capped at 5 MB; row count capped at 5,000 rows.
   - Temporary file uploads are deleted immediately after parsing.
3. **CSV Export Formula Injection (CSV Injection / DDE):**
   - When generating CSV exports, any cell string beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` is escaped by prefixing with a single quote (`'`).

---

## 5. Audit Logging & Telemetry

- The `AuditEvent` table captures significant security and lifecycle events:
  - `AUTH_REGISTER`, `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`
  - `COMMITMENT_CREATED`, `COMMITMENT_DELETED`
  - `IMPORT_COMMITTED`, `IMPORT_ROLLED_BACK`
  - `ACCOUNT_DELETED`, `DATA_EXPORTED`
- Sensitive data (passwords, tokens, raw file contents) is strictly excluded from `metadata`.

---

## 6. Incident Response & Security Checklist

- [x] Environment secrets kept in `.env` and excluded from `.gitignore`.
- [x] No hardcoded JWT secrets, DB passwords, or API keys in repository.
- [x] Rate limiting configured on auth endpoints (`/auth/login`, `/auth/register`).
- [x] CORS restricted to authorized origin domains.
- [x] Content Security Policy (CSP) and HSTS configured via Helmet.
- [x] Automated dependency vulnerability scanning (`pnpm audit`).

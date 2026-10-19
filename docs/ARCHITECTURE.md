# SubGuard — Architecture Document

## 1. System Overview

SubGuard is architected as a high-cohesion, low-coupling monorepo using **pnpm workspaces** and **Turborepo**. The codebase is partitioned into distinct applications (`apps/*`) and shared cross-cutting packages (`packages/*`), ensuring strict separation between HTTP transport, domain logic, persistence, and presentation.

```
                          ┌──────────────────────────┐
                          │   Browser / PWA Client   │
                          │      (Next.js App)       │
                          └────────────┬─────────────┘
                                       │ HTTP / Cookies (SameSite=Lax, HttpOnly)
                                       ▼
                          ┌──────────────────────────┐
                          │     NestJS REST API      │
                          │       (/api/v1/*)        │
                          └──────┬─────────────┬─────┘
                                 │             │
        ┌────────────────────────┼─────────────┼────────────────────────┐
        ▼                        ▼             ▼                        ▼
┌──────────────┐         ┌──────────────┐ ┌──────────────┐      ┌──────────────┐
│  Auth/Session│         │ Ingestion &  │ │  Recurrence  │      │ Notification │
│   Service    │         │ Import Engine│ │  & Forecast  │      │ & Scheduler  │
└──────┬───────┘         └──────┬───────┘ └──────┬───────┘      └──────┬───────┘
       │                        │                │                     │
       └────────────────────────┼────────────────┼─────────────────────┘
                                │                │
                                ▼                ▼
                         ┌─────────────────────────────┐
                         │    Prisma ORM Client        │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   PostgreSQL 17 Database    │
                         └─────────────────────────────┘
```

---

## 2. Monorepo Organization

```
subguard/
├── apps/
│   ├── web/                    # Next.js App Router (UI, Client State, PWA Service Worker)
│   └── api/                    # NestJS REST API (Controllers, Services, Prisma persistence)
├── packages/
│   ├── types/                  # Shared Domain Types, DTO interfaces, Cadence & Category enums
│   ├── validation/             # Zod validation schemas shared between frontend & backend
│   ├── utils/                  # Deterministic money arithmetic, date utils, normalization
│   ├── config/                 # Shared configs (ESLint, Prettier, TypeScript, Tailwind)
│   └── ui/                     # Reusable design tokens, accessible primitives, shared styling
├── infra/
│   ├── docker-compose.yml      # Local container orchestration (Postgres, Redis)
│   ├── Dockerfile.api          # Container build for API service
│   └── Dockerfile.web          # Container build for Next.js frontend
└── docs/                       # Specifications, security model, and API contracts
```

---

## 3. Layered Architecture Principles

### 3.1 Presentation Layer (`apps/web`)
- **Framework:** Next.js with React Server Components (RSC) where appropriate and client interactivity for responsive dashboards, modals, and file uploads.
- **Design System:** Custom Tailwind CSS tokens implementing warm neutral surfaces, near-black primary text (`#0F172A`), restrained green for verified states (`#10B981`), amber for pending reviews (`#F59E0B`), and muted borders (`#E2E8F0`).
- **Data Access:** Typed HTTP client interacting exclusively with `/api/v1/*`. No direct database queries or raw credentials in the frontend.
- **PWA:** Web manifest (`manifest.json`) and service worker providing offline fallback, asset caching, and mobile installation.

### 3.2 Transport & Security Boundary (`apps/api`)
- **Framework:** NestJS with TypeScript in strict mode.
- **Route Versioning:** All endpoints are grouped under `/api/v1/`.
- **Validation Pipe:** Request bodies and query parameters validated using shared schemas (Zod or class-validator).
- **Session Guard:** `SessionGuard` inspects the HttpOnly session cookie, hashes the bearer token with SHA-256, looks up active sessions in PostgreSQL, checks expiry/revocation, and attaches the authenticated `User` context to `req.user`.

### 3.3 Domain Services (`apps/api/src/modules/`)
1. **AuthModule:** Registration, password hashing (Argon2/bcrypt), session generation, rotation, logout, and CSRF token verification.
2. **CommitmentModule:** Vault CRUD, category aggregations, cadence normalizations, lifecycle transitions (active, paused, cancelled, archived).
3. **MandateModule:** AutoPay, e-mandate, and standing instruction tracking with provider references and explicit verification disclaimers.
4. **ImportModule:** CSV parser with stream-based validation, custom header mapper, row-level error reporting, SHA-256 transaction fingerprinting, and transactional batch persistence.
5. **DetectionModule:** Heuristic recurrence engine. Groups debits by normalized merchant key, performs interval variance analysis, validates amount stability (or variable tolerance), and computes candidate confidence scores.
6. **RadarModule:** Synthesizes confirmed commitments, active mandates, and detected candidates into a unified chronological upcoming cashflow forecast.
7. **NotificationModule:** Timezone-aware reminder engine with deduplication keys, in-app notification center, and retry mechanisms.

### 3.4 Persistence Layer (Prisma & PostgreSQL 17)
- **Engine:** Prisma ORM with strict type generation.
- **Transactions:** High-integrity workflows (e.g., CSV commit, account deletion, subscription confirmation) executed via `prisma.$transaction`.
- **Isolation:** Multi-tenant row-level tenant isolation enforced via `where: { userId: currentUser.id }` across all queries.

---

## 4. Key Architectural Decisions (ADRs)

### ADR 01: Integer Minor Units for Monetary Values
- **Context:** Currency values in floating-point (`0.1 + 0.2 = 0.30000000000000004`) cause rounding drift, unacceptable in financial software.
- **Decision:** All monetary amounts are stored as integers representing minor currency units (e.g. 49900 paise = ₹499.00). Standard conversion utilities in `@subguard/utils` handle parsing, formatting, and arithmetic.

### ADR 02: Deterministic Heuristic Recurrence vs. Black-box LLMs
- **Context:** User financial trust requires 100% explainable recurrence detection. AI models can hallucinate cadences or misclassify non-recurring charges without clear provenance.
- **Decision:** Core detection relies on mathematical time-interval analysis (weekly, monthly, quarterly, annual) with tolerance bands (±2 days) and amount variance thresholds. Every candidate exposes an explicit `evidence` payload listing matched transactions and interval statistics.

### ADR 03: Cookie-Based Secure Sessions over Plain JWTs in LocalStorage
- **Context:** JWTs stored in browser `localStorage` are vulnerable to XSS exfiltration and cannot be revoked server-side immediately without an active blocklist.
- **Decision:** HttpOnly, Secure, SameSite=Lax session cookies. Tokens are 256-bit cryptographic random strings; only their SHA-256 hash is stored in PostgreSQL. Revocation is instantaneous on logout or password reset.

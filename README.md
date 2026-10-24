# SubGuard — Recurring Payment Guardian

**Tagline:** *Know what can charge you. Before it does.*

SubGuard is a production-minded personal recurring-payment tracking platform tailored for individuals in India. It helps users discover, organize, forecast, and prevent surprise recurring money deductions across **UPI AutoPay mandates, card recurring payments (e-mandates), bank standing instructions (SI), EMIs, insurance premiums, free trials, and SaaS subscriptions.**

---

## 1. Core Principles

1. **Financial clarity before decorative analytics:** No vanity charts; every metric directly informs cashflow protection.
2. **Explainable intelligence:** Deterministic heuristic recurrence engine displaying exact mathematical interval evidence, confidence scores, and transaction dates.
3. **Exact integer minor units:** Money is stored and calculated in integer minor currency units (paise) to prevent IEEE 754 floating-point rounding errors.
4. **Zero sensitive credentials:** Never prompts for or stores bank passwords, UPI PINs, 16-digit card numbers, CVVs, or OTPs.
5. **Multi-tenant row-level isolation:** 100% of queries enforce authenticated `userId` scoping.

---

## 2. Monorepo Architecture

```
subguard/
├── apps/
│   ├── web/                    # Next.js 15 App Router (React 19, Tailwind CSS, PWA)
│   └── api/                    # NestJS REST API (/api/v1/*, Prisma ORM, Schedule)
├── packages/
│   ├── types/                  # Shared Domain Types, DTOs, Enums
│   ├── validation/             # Shared Zod validation schemas
│   ├── utils/                  # Exact currency math, date utils, normalization, CSV escaping
│   ├── config/                 # Shared configs (Tailwind preset, TS base)
│   └── ui/                     # Accessible component primitives & Linear/Apple design tokens
├── infra/
│   ├── docker-compose.yml      # Containerized local environment (Postgres 17, Redis, Services)
│   ├── Dockerfile.api          # Production Dockerfile for NestJS backend
│   └── Dockerfile.web          # Production Dockerfile for Next.js web frontend
└── docs/
    ├── PRD.md                  # Product Requirements Document
    ├── ARCHITECTURE.md         # Layered architectural breakdown & ADRs
    ├── DATA_MODEL.md           # Database tables, schemas, relations, and indexes
    ├── SECURITY.md             # Threat model, cookie sessions, sanitization, and audit logs
    └── API_SPEC.md             # Complete REST API specification
```

---

## 3. Technology Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **Design System:** Custom tokens inspired by Linear's information hierarchy and Apple's restraint (Geist/Inter fonts, warm neutral surfaces, tabular numbers, 44px min touch targets)
- **Backend:** NestJS, Express, Helmet, Cookie-Parser, Zod, Swagger OpenAPI
- **Database:** PostgreSQL 17 with Prisma ORM and committed SQL migrations
- **PWA:** Web App Manifest + Service Worker with security-conscious offline fallback (strictly avoids caching private financial API responses)

---

## 4. Getting Started Locally

### Prerequisites
- Node.js >= 20.x (tested on v22.14.0)
- pnpm >= 10.x
- PostgreSQL 17 running on `localhost:5432` (or Docker)

### Setup Steps

1. **Clone the repository and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Run database migrations:**
   ```bash
   pnpm --filter @subguard/api db:migrate
   ```

4. **(Optional) Seed demo account:**
   ```bash
   pnpm --filter @subguard/api db:seed
   ```
   *Seed credentials:* `demo@subguard.local` / `DemoPassword123!`

5. **Start development servers:**
   ```bash
   pnpm dev
   ```
   - Web application: [http://localhost:3000](http://localhost:3000)
   - REST API: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
   - Swagger Documentation: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 5. Automated Verification & Testing

Run all unit, integration, and build checks across the monorepo:

```bash
# Run unit and integration tests
pnpm test

# Run strict TypeScript type checks
pnpm type-check

# Run production build
pnpm build
```

---

## 6. Docker Deployment

To launch PostgreSQL, Redis, the API service, and the Web application via Docker Compose:

```bash
cd infra
docker compose up -d --build
```


@almostalok

# Project Inventory

**Last audited:** 17 August 2026

This inventory reflects the current repository structure and the implemented application areas. It replaces the older file list that omitted the administrator, payment, check-in, middleware and migration work added later in the project.

## Repository root

```text
event-ticketing/
├── .env.example
├── .github/workflows/ci.yml
├── .gitignore
├── LICENSE
├── PROJECT_INVENTORY.md
├── README.md
├── docker-compose.yml
├── package.json
├── backend/
├── frontend/
└── docs/
```

## Backend

```text
backend/
├── Dockerfile
├── middleware.ts
├── next.config.ts
├── next-env.d.ts
├── package.json
├── tsconfig.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       ├── admin/
│       │   ├── audit/
│       │   ├── orders/
│       │   ├── overview/
│       │   ├── payments/
│       │   ├── tickets/
│       │   └── users/
│       ├── auth/
│       │   ├── login/
│       │   ├── logout/
│       │   ├── me/
│       │   └── register/
│       ├── events/
│       │   ├── [id]/
│       │   └── [id]/publish/
│       ├── health/
│       ├── orders/
│       │   └── me/
│       ├── organizer/
│       │   ├── check-in/
│       │   ├── events/
│       │   ├── orders/
│       │   ├── payments/
│       │   └── tickets/
│       └── payments/
│           └── paystack/
│               ├── callback/
│               └── webhook/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── http.ts
│   ├── order-payment.ts
│   ├── paystack.ts
│   ├── slug.ts
│   └── validation.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
└── tests/
    ├── paystack-signature.test.ts
    ├── slug.test.ts
    └── validation.test.ts
```

## Frontend

```text
frontend/
├── Dockerfile
├── next.config.ts
├── next-env.d.ts
├── package.json
├── tsconfig.json
├── public/
│   └── .gitkeep
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── api/[...path]/route.ts
│   ├── dashboard/page.tsx
│   ├── events/page.tsx
│   ├── events/[id]/page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── organizer/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── tickets/page.tsx
│   │   ├── payments/page.tsx
│   │   └── check-in/page.tsx
│   └── admin/
│       ├── page.tsx
│       ├── users/
│       ├── orders/
│       ├── tickets/
│       ├── payments/
│       ├── check-in/
│       └── audit/
├── components/
│   ├── auth-form.tsx
│   ├── event-card.tsx
│   ├── event-detail.tsx
│   └── site-header.tsx
└── lib/api.ts
```

## Documentation

```text
docs/
├── API.md
├── ARCHITECTURE.md
├── AUDIT.md
├── CAPSTONE.md
├── DATABASE.md
├── DECISIONS.md
├── DEPLOYMENT.md
├── SECURITY.md
└── TESTING.md
```

## Infrastructure and delivery

- Dockerfiles exist for both deployable applications.
- `docker-compose.yml` provides PostgreSQL for local development.
- `.github/workflows/ci.yml` installs dependencies, generates Prisma Client, applies migrations, runs tests and builds both workspaces.
- Prisma migration history is stored under `backend/prisma/migrations/`.

## Audit note

The repository contains additional nested route/component files under the directories above. The inventory intentionally uses route groups for large areas instead of duplicating every implementation line. `docs/AUDIT.md` records the source-level audit findings and corrections.

# EventFlow — Event Ticketing Platform

[![CI](https://github.com/saukkake/event-ticketing/actions/workflows/ci.yml/badge.svg)](https://github.com/saukkake/event-ticketing/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=111111)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.17.1-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Paystack](https://img.shields.io/badge/Paystack-Test%20Mode-0BA4DB)](https://paystack.com/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?logo=render&logoColor=111111)](https://render.com/)

> **Production-Ready Capstone Project — 3MTT Next-Gen Cohort**

EventFlow is a full-stack event ticketing and management platform built by **Yasin Muhammed Tukur**. It covers event discovery, ticket inventory, authenticated ordering, Paystack Test Mode checkout, server-side payment verification, signed webhooks, digital QR tickets, organizer management and administrator controls.

## Project information

| Item | Details |
|---|---|
| Project | EventFlow — Event Ticketing Platform |
| Author | Yasin Muhammed Tukur |
| Program | 3MTT Next-Gen Capstone |
| Repository | https://github.com/saukkake/event-ticketing |
| Email | saukakke@gmail.com |
| License | MIT |

## Live deployment

- Frontend: `https://event-ticketing-x3og.onrender.com`
- Backend: `https://event-ticketing-backend-yzzr.onrender.com`
- Health: `https://event-ticketing-backend-yzzr.onrender.com/api/health`
- Paystack webhook: `https://event-ticketing-backend-yzzr.onrender.com/api/payments/paystack/webhook`

The deployment uses two independent Render services. Both containers listen on port `10000`. The frontend exposes a same-origin `/api/*` proxy to the backend, keeping the backend origin out of browser-side configuration.

## Core workflow

```text
Register / Login
      ↓
Discover published events
      ↓
Open /events/:id
      ↓
Select ticket types
      ↓
Create order + reserve inventory
      ↓
Paystack Test Mode checkout
      ↓
Server verification / signed webhook
      ↓
Order becomes PAID
      ↓
Digital QR tickets issued once
      ↓
Dashboard / organizer / admin verification
```

## Features

### Attendees

- Registration and secure login.
- Published event discovery and search.
- Event detail pages with real-time remaining inventory.
- Ticket quantity validation.
- Paystack Test Mode checkout.
- Server-side payment verification and customer callback handling.
- Digital QR ticket issuance after confirmed payment.
- Personal ticket dashboard.

### Organizers

- Organizer/admin role-based access.
- Event creation and publishing.
- Ticket type and inventory management.
- Event ownership isolation.
- Order and payment history.
- Ticket management and check-in workflows.

### Administrators

- Platform overview and revenue metrics.
- User management, role changes, suspension and soft deletion.
- Order and payment administration.
- Ticket activation/voiding.
- Check-in management.
- Audit logs.

### Payment and integrity controls

- Server-side Paystack initialization.
- Exact payment reference, amount and currency validation.
- HMAC-SHA512 webhook signature validation.
- Idempotent payment finalization.
- Idempotent failed/reversed payment handling.
- Transactional inventory reservation and restoration.
- Digital tickets generated only after confirmed payment.

## Technology stack

- **Frontend:** Next.js 16.3, React 19.2, TypeScript 5.8.
- **Backend:** Next.js 16.3, TypeScript.
- **Database:** PostgreSQL with Prisma 6.17.1.
- **Authentication:** JWT sessions in HTTP-only cookies, `jose`, bcryptjs.
- **Validation:** Zod.
- **Payments:** Paystack Test Mode.
- **QR:** `qrcode`.
- **Infrastructure:** Docker, Render and GitHub Actions.

## Repository structure

```text
event-ticketing/
├── frontend/                    # Browser-facing Next.js application
│   ├── app/
│   │   ├── events/
│   │   ├── dashboard/
│   │   ├── organizer/
│   │   ├── admin/
│   │   └── api/[...path]/       # Same-origin backend proxy
│   ├── components/
│   └── lib/
├── backend/                     # Next.js API + Prisma
│   ├── app/api/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── organizer/
│   │   └── admin/
│   ├── lib/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── tests/
│   └── middleware.ts
├── docs/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── .env.example
├── PROJECT_INVENTORY.md
├── LICENSE
└── package.json
```

## Local development

### Requirements

- Node.js 22.x
- npm 10+
- PostgreSQL 15+
- Docker (optional)

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and set real local values:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/event_ticketing"
JWT_SECRET="replace-with-a-long-random-secret"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:10000"
NODE_ENV="development"
PAYSTACK_SECRET_KEY="sk_test_your_real_test_secret"
```

`BACKEND_URL` is a server-only frontend variable. Do not rename it to a `NEXT_PUBLIC_*` variable.

### Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Run both services

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Seeded demo accounts

The seed script creates demo accounts using the same password for demonstration purposes:

| Role | Email | Password |
|---|---|---|
| Organizer | `organizer@eventflow.com` | `Password123!` |
| Organizer | `organizer@eventflow.local` | `Password123!` |
| Organizer | `organizer2@eventflow.com` | `Password123!` |
| Attendee | `attendee@eventflow.com` | `Password123!` |
| Attendee | `attendee@eventflow.local` | `Password123!` |
| Attendee | `attendee2@eventflow.com` | `Password123!` |
| Attendee | `attendee3@eventflow.com` | `Password123!` |
| Admin | `admin@eventflow.com` | `Password123!` |
| Admin | `admin@eventflow.local` | `Password123!` |

These credentials are for development/capstone demonstration only. Do not use them in a production environment.

## Paystack Test Mode

The secret key is server-side only. Configure the Paystack webhook as:

```text
https://<backend-domain>/api/payments/paystack/webhook
```

The webhook validates `x-paystack-signature`, verifies successful transactions against Paystack, validates the local reference/amount/currency, and finalizes the order idempotently.

The customer callback is:

```text
https://<frontend-domain>/dashboard?payment=return&reference=<reference>
```

A callback is not treated as the sole source of truth; the backend verifies the transaction before marking an order paid.

## Testing

Run the backend tests:

```bash
npm test
```

Build the complete workspace:

```bash
npm run build
```

The CI workflow runs dependency installation, Prisma client generation, migrations, tests and the production build.

See [`docs/TESTING.md`](docs/TESTING.md) for the full verification matrix.

## Security

Implemented controls include:

- Zod request validation.
- Lowercase email normalization.
- bcrypt password hashing.
- HTTP-only session cookies.
- JWT issuer, audience and expiry validation.
- Server-side role authorization.
- Suspended/soft-deleted account checks.
- Browser origin validation for state-changing API requests.
- Paystack HMAC-SHA512 webhook verification.
- Payment amount/currency/reference verification.
- Idempotent payment and inventory transitions.
- No Paystack secret in frontend code.

See [`docs/SECURITY.md`](docs/SECURITY.md) and [`docs/AUDIT.md`](docs/AUDIT.md).

## Documentation

| Document | Purpose |
|---|---|
| [`docs/AUDIT.md`](docs/AUDIT.md) | Repository audit, corrections and verification status |
| [`docs/API.md`](docs/API.md) | Current API endpoint reference |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Current application and payment architecture |
| [`docs/CAPSTONE.md`](docs/CAPSTONE.md) | 3MTT capstone specification and demonstration flow |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Prisma models, relationships and constraints |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architectural/product decisions |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Render, Docker, environment and database deployment |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Security controls |
| [`docs/TESTING.md`](docs/TESTING.md) | Automated and manual verification matrix |
| [`PROJECT_INVENTORY.md`](PROJECT_INVENTORY.md) | Repository structure and route inventory |

## Production readiness

Before enabling live payments:

1. Replace the Paystack Test Mode secret with an appropriate live secret after merchant activation.
2. Configure the live webhook over HTTPS.
3. Use a managed PostgreSQL database with backups.
4. Use a cryptographically random JWT secret.
5. Remove development demo credentials/data.
6. Restrict `FRONTEND_URL` to trusted production origins.
7. Configure monitoring, rate limiting and WAF controls.
8. Verify the full payment, inventory, ticket and check-in flows in staging.

The current capstone deployment is a **Paystack Test Mode** environment and must not be represented as a live-money payment system.

## Author

**Yasin Muhammed Tukur**

- GitHub: https://github.com/saukkake
- LinkedIn: https://www.linkedin.com/in/yasin-muhammed-tukur
- Email: saukakke@gmail.com
- Phone: 08130144920

## License

MIT License. See [`LICENSE`](LICENSE).

Third-party dependencies retain their respective licenses.

---

Built by **Yasin Muhammed Tukur** for the **3MTT Next-Gen Cohort** capstone project.

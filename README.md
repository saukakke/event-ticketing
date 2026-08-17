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
[![Zod](https://img.shields.io/badge/Zod-4.1.12-3E67B1)](https://zod.dev/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000)](https://jwt.io/)

> **Production-Ready Capstone Project — 3MTT NextGen**

EventFlow is a full-stack digital event ticketing and management platform built by **Yasin Muhammed Tukur**. It provides a complete workflow for event discovery, ticket inventory, order creation, Paystack Test Mode checkout, server-side payment verification, signed payment webhooks, digital ticket issuance, QR-code verification, and organizer sales management.

## Project information

| Item | Details |
|---|---|
| **Project** | EventFlow — Event Ticketing Platform |
| **Author** | Yasin Muhammed Tukur |
| **3MTT status** | Production-Ready Capstone Project — 3MTT NextGen |
| **GitHub** | [github.com/saukkake](https://github.com/saukkake) |
| **Repository** | [github.com/saukkake/event-ticketing](https://github.com/saukkake/event-ticketing) |
| **LinkedIn** | [linkedin.com/in/yasin-muhammed-tukur](https://www.linkedin.com/in/yasin-muhammed-tukur) |
| **Email** | [saukakke@gmail.com](mailto:saukakke@gmail.com) |
| **License** | MIT |

## Live deployment

- **Frontend:** https://event-ticketing-x3og.onrender.com
- **Backend API:** https://event-ticketing-backend-yzzr.onrender.com
- **Backend health endpoint:** https://event-ticketing-backend-yzzr.onrender.com/api/health
- **Paystack webhook:** https://event-ticketing-backend-yzzr.onrender.com/api/payments/paystack/webhook

The application is deployed as two independent Render services. Both production containers listen on **port `10000`**. The frontend uses a same-origin `/api/*` proxy to the backend, which avoids browser-side cross-origin authentication problems.

## Problem

Event organizers often rely on informal sales channels, manual payment confirmation, spreadsheets, printed tickets, and fragmented attendee communication. These processes make inventory tracking, payment reconciliation, attendee verification, and event administration difficult.

## Solution

EventFlow centralizes the event-ticketing lifecycle:

```text
Event discovery
      ↓
Event details
      ↓
Ticket selection
      ↓
Order creation + inventory reservation
      ↓
Paystack Test Mode checkout
      ↓
Server-side verification / signed webhook
      ↓
Order marked PAID
      ↓
Digital ticket + QR code generated once
      ↓
Attendee ticket access / verification
```

## Key features

### Attendees

- Account registration and secure login.
- Published event discovery and search.
- Event and ticket-type details.
- Quantity validation and inventory reservation.
- Paystack Test Mode checkout.
- Server-side payment verification.
- Payment-return callback handling.
- Digital ticket generation after confirmed payment.
- QR-code ticket access.

### Organizers

- Organizer role-based access.
- Event creation and editing.
- Ticket type and inventory management.
- Event publishing/unpublishing.
- Sales statistics.
- Recent order visibility for owned events.

### Payment and ticket integrity

- Paystack transaction initialization from the backend.
- Amount, currency, and payment-reference validation.
- `charge.success` webhook processing.
- HMAC-SHA512 Paystack webhook signature validation.
- Idempotent `PENDING → PAID` finalization.
- Idempotent failed/reversed payment handling.
- Reserved inventory restoration after failed/reversed payments.
- Digital tickets issued only after confirmed payment.

## Technology stack

### Application

![Next.js](https://img.shields.io/badge/Next.js-16.3.0-000000?logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=111111) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)

### Data and validation

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-6.17.1-2D3748?logo=prisma&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-4.1.12-3E67B1)

### Security and payments

![JWT](https://img.shields.io/badge/JWT-Authentication-000000) ![bcryptjs](https://img.shields.io/badge/bcryptjs-Password%20Hashing-8B0000) ![Paystack](https://img.shields.io/badge/Paystack-Test%20Mode-0BA4DB)

### Infrastructure and delivery

![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white) ![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?logo=render&logoColor=111111) ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?logo=github-actions&logoColor=white) ![npm](https://img.shields.io/badge/npm-Workspaces-CB3837?logo=npm&logoColor=white)

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                    EventFlow Frontend                    │
│                  Next.js + React + TS                    │
│                   Render · :10000                        │
└──────────────────────────┬───────────────────────────────┘
                           │ same-origin /api proxy
                           ▼
┌──────────────────────────────────────────────────────────┐
│                     EventFlow Backend                    │
│              Next.js API + TypeScript                    │
│                   Render · :10000                        │
│                                                          │
│ Auth · Authorization · Orders · Inventory · Paystack     │
└───────────────┬───────────────────────────┬──────────────┘
                │                           │
                ▼                           ▼
        ┌───────────────┐          ┌──────────────────┐
        │ PostgreSQL +  │          │ Paystack Test    │
        │ Prisma        │          │ Mode API/Webhook │
        └───────────────┘          └──────────────────┘
```

## Repository structure

```text
event-ticketing/
├── frontend/                    # Public Next.js web application
├── backend/                     # Next.js API + Prisma service
│   ├── app/api/
│   ├── lib/
│   ├── prisma/
│   └── tests/
├── docs/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── .env.example
├── LICENSE
├── PROJECT_INVENTORY.md
└── package.json
```

## Local development

### Requirements

- Node.js 22.x
- npm 10+
- PostgreSQL 15+
- Docker (optional)

### Install dependencies

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and configure the database, JWT secret, frontend/backend origins, and Paystack test secret.

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/event_ticketing"
JWT_SECRET="replace-with-a-long-random-secret"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:10000"
PAYSTACK_SECRET_KEY="sk_test_your_real_test_secret"
```

The Paystack secret must be obtained from your Paystack Dashboard. Never commit a real secret key.

### Database setup

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Start both services

```bash
npm run dev
```

Local services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:10000`

Production containers both use port `10000` because Render provides separate service network namespaces.

## Demo accounts

The development seed creates:

| Role | Email | Password |
|---|---|---|
| Organizer | `organizer@eventflow.local` | `Password123!` |
| Attendee | `attendee@eventflow.local` | `Password123!` |
| Admin | `admin@eventflow.local` | `Password123!` |

These are development credentials only. Do not retain seeded passwords in a production environment.

## Paystack integration

EventFlow uses **Paystack Test Mode** for the capstone demonstration. The secret key remains server-side.

### Webhook

Configure this URL in Paystack:

```text
https://event-ticketing-backend-yzzr.onrender.com/api/payments/paystack/webhook
```

The webhook:

1. Validates `x-paystack-signature` using HMAC-SHA512.
2. Accepts supported payment events.
3. Verifies successful transactions against Paystack.
4. Validates the local order reference, amount, and currency.
5. Performs an idempotent payment-state transition.
6. Issues digital tickets exactly once after successful payment.
7. Releases reserved inventory for failed/reversed payments.

### Customer callback

The customer browser returns to:

```text
https://event-ticketing-x3og.onrender.com/dashboard?payment=return&reference=<reference>
```

The dashboard invokes the backend payment callback for server-side verification. The callback is a customer-return mechanism; the webhook remains the asynchronous server-to-server payment notification path.

### Test mode

Test mode does not process real funds. Use a real `sk_test_...` key from your Paystack account when testing the deployed application. Do not place the secret key in frontend environment variables.

## Testing

The backend includes executable tests for:

- request validation;
- slug generation;
- valid Paystack HMAC-SHA512 signatures;
- invalid Paystack signatures;
- missing Paystack signatures.

Run the tests with:

```bash
npm test
```

The GitHub Actions workflow is configured to run the test suite before the production build.

For the complete integration and security test matrix, see [`docs/TESTING.md`](docs/TESTING.md).

## Security

Implemented controls include:

- Server-side Zod validation.
- Normalized email handling.
- bcrypt password hashing.
- HTTP-only session cookies.
- JWT issuer/audience/subject validation.
- Server-side role authorization.
- Origin validation for browser state-changing requests.
- Paystack HMAC-SHA512 webhook validation.
- Payment amount/currency/reference validation.
- Idempotent payment finalization.
- Idempotent inventory restoration.
- No Paystack secret exposure to the frontend.

See [`docs/SECURITY.md`](docs/SECURITY.md) and [`docs/AUDIT.md`](docs/AUDIT.md).

## Documentation

| Document | Purpose |
|---|---|
| [`docs/CAPSTONE.md`](docs/CAPSTONE.md) | 3MTT capstone project specification, scope and demonstration flow |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Application architecture and request/payment flows |
| [`docs/API.md`](docs/API.md) | API endpoints and request/response behavior |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Database entities, relationships and constraints |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Security model and controls |
| [`docs/TESTING.md`](docs/TESTING.md) | Unit, integration, security and deployment test matrix |
| [`docs/AUDIT.md`](docs/AUDIT.md) | Implementation and documentation audit |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Render, database and Paystack deployment configuration |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Key architectural and product decisions |
| [`PROJECT_INVENTORY.md`](PROJECT_INVENTORY.md) | Source-tree inventory |

## Production readiness

Before opening the application to real payments:

- Replace the Paystack test secret with a live secret after merchant activation.
- Configure the live Paystack webhook over HTTPS.
- Use a managed PostgreSQL database with backups.
- Run `prisma migrate deploy` during deployment.
- Use a cryptographically random `JWT_SECRET`.
- Remove development seed credentials.
- Restrict browser origins to the real frontend origin.
- Configure rate limiting/WAF and application monitoring.
- Add transactional email if ticket delivery by email is required.
- Add object storage if event image uploads are required.

The current capstone deployment is intentionally a **Paystack Test Mode** environment and should not be represented as a live-money payment system.

## Screenshots

The final application screenshots can be added to `docs/screenshots/` and referenced here after capture from the deployed frontend. No screenshot assets were bundled in this archive because the deployed Render frontend did not return a capturable page during the final verification attempt.

## Capstone positioning

EventFlow is designed as a complete 3MTT NextGen capstone demonstration rather than a collection of disconnected CRUD screens. The strongest demonstration is the end-to-end path:

```text
Register → Login → Discover Event → Select Ticket
→ Create Order → Paystack Test Checkout
→ Server Verification/Webhook → PAID Order
→ Digital Ticket → QR Code
```

This demonstrates frontend engineering, backend API design, relational data modelling, authentication, authorization, payment integration, webhook security, transactional inventory handling, idempotency, and deployment architecture in one coherent product.

## Author

**Yasin Muhammed Tukur**

- GitHub: https://github.com/saukkake
- LinkedIn: https://www.linkedin.com/in/yasin-muhammed-tukur
- Email: saukakke@gmail.com

## License

MIT License. See [`LICENSE`](LICENSE).

Third-party dependencies retain their respective licenses.

---

Built by **Yasin Muhammed Tukur** for the **3MTT NextGen** capstone.

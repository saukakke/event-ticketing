# Architecture

## Monorepo

EventFlow is split into two independently deployable Next.js applications:

- `frontend` — browser-facing product UI and same-origin `/api/*` proxy.
- `backend` — REST API, authentication, payment integration and Prisma data layer.

Both services use Node.js 22 and listen on port `10000` in production containers.

## Frontend

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── events/
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   ├── organizer/
│   ├── admin/
│   └── api/[...path]/route.ts
├── components/
├── lib/api.ts
└── next.config.ts
```

Browser requests use `/api/*`. The catch-all proxy forwards them server-to-server to `BACKEND_URL`, which keeps the backend origin and credentials out of browser JavaScript.

## Backend

```text
backend/
├── app/api/
│   ├── auth/
│   ├── events/
│   ├── orders/
│   ├── payments/
│   ├── organizer/
│   ├── admin/
│   └── health/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── http.ts
│   ├── validation.ts
│   ├── paystack.ts
│   ├── order-payment.ts
│   └── slug.ts
├── middleware.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
└── tests/
```

## Authentication and authorization

- Passwords are hashed with bcrypt.
- Sessions are signed JWTs stored in HTTP-only cookies.
- JWTs use issuer and audience validation and a seven-day expiry.
- User status is checked against the database on every authenticated request, so suspended and soft-deleted accounts cannot continue using an existing session.
- Role checks are performed server-side.
- Organizer operations enforce event ownership unless the caller is an administrator.

## Request protection

The backend middleware validates browser origins for state-changing requests and supplies credentialed CORS headers for configured frontend origins. The Paystack webhook is exempt from browser-origin checks because it is a server-to-server provider callback; it is protected by Paystack HMAC-SHA512 signature validation.

## Inventory consistency

Order creation uses a Prisma transaction:

1. Confirm the event is published.
2. Validate the selected ticket types belong to the event.
3. Confirm each requested quantity is available.
4. Create the pending order and items.
5. Conditionally decrement `quantityRemaining`.
6. Initialize the Paystack transaction.

If payment initialization fails and verification does not confirm success, the pending reservation is released. Successful webhook/callback processing changes the order to `PAID` and issues tickets exactly once.

## Payment integrity

The backend validates:

- Paystack secret configuration.
- Provider transaction reference.
- Currency.
- Exact payment amount.
- Webhook HMAC-SHA512 signature.
- Idempotent order state transitions.

The Paystack secret never reaches the frontend.

## Deployment topology

```text
Browser
   │
   ▼
Frontend Render service :10000
   │  same-origin /api/* proxy
   ▼
Backend Render service :10000
   ├── PostgreSQL + Prisma
   └── Paystack API / webhook
```

The two Render services have independent network namespaces, so both can listen on `10000`.

# Repository Audit

**Audit date:** 17 August 2026

## Scope

The audit covered the repository structure, frontend route architecture, backend API groups, Prisma schema/migrations, authentication, payment flow, checkout behavior, Docker configuration, CI configuration, tests and project documentation.

## Findings and corrections

### 1. Prisma schema drift — corrected

The application code and migration history use the following fields:

- `Event.slug`
- `TicketType.quantity`
- `TicketType.quantityRemaining`
- `Order.paymentReference`
- `Ticket.qrDataUrl`
- `Refund` with a unique `orderId`
- `AuditLog.actorId` as a required relationship

The checked-in `schema.prisma` instead contained incompatible names such as `capacity`, `soldCount`, `paystackReference` and `qrCodeDataUrl`, plus fields/indexes that were not represented by the migration history. This would cause generated Prisma Client types to disagree with runtime queries.

**Correction:** `backend/prisma/schema.prisma` was aligned with the application code and the final migration state.

### 2. Event detail inventory contract — corrected

The frontend event detail component and backend order flow use `quantity` and `quantityRemaining`. The frontend API types were corrected to match that contract.

The route `/events/:id` remains ID-based, which matches the backend `GET /events/:id` implementation.

### 3. Checkout redirect contract — corrected

The backend `POST /orders` returns `orderId`, `reference` and a Paystack `authorizationUrl`. The frontend previously treated the response as if it contained `id` and redirected to a dashboard URL without starting payment.

**Correction:** the event detail page now redirects to the Paystack authorization URL. If the backend confirms payment immediately, it uses the payment-return flow instead.

### 4. Event detail 404 handling — corrected

The frontend event detail page previously tried to identify a 404 by searching for `"(404)"` in the error message, while the API helper returned only the backend error message.

**Correction:** `frontend/lib/api.ts` now exposes a typed `ApiError` containing the HTTP status, and the event detail page calls `notFound()` for status `404` only.

### 5. Frontend password validation — corrected

The backend requires passwords to contain at least 12 characters, while the frontend form previously advertised only an 8-character minimum.

**Correction:** the frontend now uses the same 12-character minimum and appropriate password autocomplete attributes.

### 6. Backend Docker build — corrected

The backend Dockerfile attempted to copy `/app/public`, but the backend service has no tracked `public` directory. It also used a wildcard `package-lock.json*` even though the repository has no committed lockfile.

**Correction:** the backend Docker build now copies only `package.json` and does not copy a nonexistent `public` directory or lockfile.

### 7. Event list error handling — corrected

The events page previously swallowed backend errors and displayed the same empty state used for a valid search with no results.

**Correction:** backend failures now display a distinct error state, while a successful empty search still displays the empty-results state.

### 8. Administrator navigation and logout — corrected

The authenticated header exposed organizer navigation to administrators but did not expose the administrator dashboard. Logout also did not guarantee local cleanup when the API call failed.

**Correction:** administrators now have an `/admin` navigation entry and logout always clears local UI state and redirects.

### 9. Documentation drift — corrected

The previous documentation contained outdated information, including:

- an obsolete backend base URL/port in the API guide;
- a `NEXT_PUBLIC_API_URL` deployment variable that is not used by the current frontend;
- a `seed.ts` path although the repository contains `seed.js`;
- demo credentials that did not match the seed script;
- a database description that omitted refunds and audit logs;
- an API guide that described order creation as a demo-paid operation rather than the current Paystack initialization flow;
- a README reference to a missing `docs/AUDIT.md`.

**Corrections:** README, API, architecture, database, deployment, security, capstone, decisions and testing documentation were updated, and this audit document was added.

### 10. Migration history review

The repository contains the original schema migration plus later management, payment/ticket and user-account-control migrations. The final migration state includes account suspension and soft deletion, so the Prisma schema now retains those fields.

The repository also contains rollback-style account-control migrations followed by a restore migration. These are preserved as historical migrations rather than edited in place.

Existing migration files should not be rewritten after they have been applied to shared or production databases. Future schema changes should be introduced as new migrations.

## Current architecture verified

```text
Frontend Next.js
    │
    │ same-origin /api/* proxy
    ▼
Backend Next.js API
    ├── Auth / JWT session
    ├── Events / inventory
    ├── Orders
    ├── Paystack initialization + verification + webhook
    ├── Organizer management
    ├── Admin management
    └── Health
          │
          ├── Prisma
          ▼
      PostgreSQL

Backend ─────────────── Paystack API/Webhook
```

## Route coverage reviewed

### Frontend

- `/`
- `/events`
- `/events/[id]`
- `/login`
- `/register`
- `/dashboard`
- `/organizer`
- `/organizer/new`
- `/organizer/orders`
- `/organizer/orders/[id]`
- `/organizer/tickets`
- `/organizer/payments`
- `/organizer/check-in`
- `/admin`
- `/admin/users`
- `/admin/orders`
- `/admin/tickets`
- `/admin/payments`
- `/admin/check-in`
- `/admin/audit`
- `/api/[...path]`

### Backend API groups

- `/api/auth/*`
- `/api/events/*`
- `/api/orders/*`
- `/api/payments/*`
- `/api/organizer/*`
- `/api/admin/*`
- `/api/health`

## Security review

The implementation contains the following relevant controls:

- HTTP-only session cookies.
- Secure production cookies using the `__Host-` cookie prefix.
- JWT issuer, audience and expiration validation.
- Database-backed checks for suspended/deleted users.
- Server-side role authorization.
- Organizer ownership checks.
- Zod request validation.
- Browser-origin validation for state-changing requests.
- Paystack HMAC-SHA512 webhook verification.
- Payment reference, amount and currency verification.
- Idempotent payment finalization.
- Inventory restoration for failed/reversed pending payments.
- Server-only Paystack secret.

## Verification status

### Verified by source inspection

- Frontend/backend route contracts.
- Event detail and checkout response contracts.
- Prisma field names against runtime queries.
- Migration state represented in the checked-in schema.
- Payment reference and QR field naming.
- Seed credential values.
- Dockerfile filesystem assumptions.
- Documentation links and deployment variable names.
- Error handling contracts for event detail and event-list failures.

### Still requires runtime verification

The GitHub connector does not provide a local Node/PostgreSQL runtime for this audit. The following should be executed in CI or a local checkout before final production sign-off:

1. `npm install`
2. `npm run db:generate`
3. `npm run db:migrate`
4. `npm test`
5. `npm run build`
6. Build both Docker images.
7. Run the frontend and backend together.
8. Open `/events` and `/events/:id` in a browser.
9. Complete a Paystack Test Mode payment.
10. Verify the callback and webhook paths.
11. Verify ticket QR issuance and check-in.
12. Verify organizer ownership and admin authorization.
13. Verify suspended/soft-deleted account behavior.

## Release assessment

The significant source-level blockers found during the audit were the Prisma schema mismatch, frontend/backend ticket inventory contract mismatch, broken event checkout redirect, incorrect 404 detection, frontend password-rule mismatch, stale documentation and backend Docker filesystem/lockfile assumptions.

Those source-level issues have been corrected. The project should still pass the complete CI/build/browser/payment verification sequence above before being treated as fully production-verified.

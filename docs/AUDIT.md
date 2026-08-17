# Repository Audit

**Audit date:** 17 August 2026

## Scope

The audit covers the repository structure, frontend route architecture, backend API groups, Prisma schema/migrations, authentication, payment flow, checkout behavior, Docker configuration, CI configuration, tests, environment configuration and project documentation.

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

The checked-in `schema.prisma` was previously incompatible with runtime field names and migration history.

**Correction:** `backend/prisma/schema.prisma` was aligned with the application code and final migration state.

### 2. Event detail inventory contract — corrected

The frontend event detail component and backend order flow use `quantity` and `quantityRemaining`. The frontend API types now match that contract.

The route `/events/:id` remains ID-based, matching the backend `GET /events/:id` implementation.

### 3. Checkout redirect contract — corrected

The backend `POST /orders` returns `orderId`, `reference` and a Paystack `authorizationUrl`.

**Correction:** the event detail page redirects to the Paystack authorization URL and uses the payment-return flow only when the backend confirms payment immediately.

### 4. Event detail 404 handling — corrected

The frontend now uses the typed `ApiError.status` returned by the API helper and calls `notFound()` only for HTTP 404 responses.

### 5. Frontend password validation — corrected

The frontend and backend now enforce the same 12-character minimum password length.

### 6. Backend Docker build — corrected

The backend Dockerfile no longer assumes a backend `public` directory or a committed lockfile that does not exist.

### 7. Event list error handling — corrected

Backend failures on `/events` are now displayed separately from a valid empty search result.

### 8. Administrator navigation and logout — corrected

Administrator navigation includes the admin dashboard, and logout cleanup is handled even when the logout request fails.

### 9. Documentation drift — corrected

The README and supporting documentation were updated to reflect the current Paystack flow, route structure, seed credentials, schema, deployment variables and migration state.

### 10. Migration history review

Historical migrations are preserved and should not be rewritten after deployment. Future schema changes should be introduced as new migrations.

The migration history includes management indexes, platform-management changes and user-account-control changes followed by restore operations. The checked-in Prisma schema represents the final state rather than rewriting those historical migrations.

### 11. Event pagination input — corrected

The public events endpoint previously converted `page` and `limit` query parameters directly with `Number()`. Values such as `page=abc` produced `NaN`, which could reach Prisma `skip`/`take` arguments.

**Correction:** `backend/app/api/events/route.ts` now accepts only positive safe integers, applies sensible defaults and caps the values before querying Prisma.

### 12. Workspace environment configuration — corrected

The repository has separate Next.js `frontend` and `backend` applications. Relying on a single root `.env` is ambiguous because each application runs with its own project directory.

**Correction:** `backend/.env.example` was added and the service-specific environment model is documented. The frontend already has `frontend/.env.example`.

## Current architecture

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
- `/organizer/tickets/[id]`
- `/organizer/payments`
- `/organizer/check-in`
- `/admin`
- `/admin/users`
- `/admin/users/[id]`
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

The implementation contains these relevant controls:

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
- Inventory restoration for failed/reversed payments.
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
- Documentation route and deployment-variable consistency.
- Event-detail and event-list error handling.
- Event-list pagination input handling.
- Service-specific environment templates.

### Still requires runtime verification

The GitHub connector does not provide a local Node/PostgreSQL runtime for this audit. The following must be executed in CI or a local checkout before final production sign-off:

1. `npm install`
2. `npm run db:generate`
3. `npm run db:migrate`
4. `npm test`
5. `npm run build`
6. Build both Docker images.
7. Run frontend and backend together using service-specific `.env` files.
8. Open `/events` and `/events/:id` in a browser.
9. Complete a Paystack Test Mode payment.
10. Verify the callback and webhook paths.
11. Verify ticket QR issuance and check-in.
12. Verify organizer ownership and admin authorization.
13. Verify suspended/soft-deleted account behavior.
14. Verify malformed pagination parameters such as `?page=abc&limit=xyz` fall back safely.

## Release assessment

The major source-level blockers found during the audit have been corrected, including schema drift, frontend/backend inventory-contract mismatch, broken event checkout redirect, incorrect 404 detection, password-rule mismatch, stale documentation, Docker filesystem assumptions, workspace environment ambiguity and malformed pagination handling.

The repository is **source-audited but not runtime-certified** until the complete CI/build/browser/payment verification sequence succeeds.

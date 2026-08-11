# Architecture

## Monorepo

The application is intentionally split into two independently deployable Next.js applications:

- `frontend`: browser-facing product UI.
- `backend`: API service and Prisma data layer.

This structure keeps UI and business logic separated while preserving a single technology family for a 3MTT capstone.

## Frontend layers

```text
app/
  page.tsx
  events/
  login/
  register/
  dashboard/
  organizer/
components/
lib/
```

The frontend communicates with the backend through REST endpoints. The browser sends credentials using an HTTP-only cookie.

## Backend layers

```text
app/api/
  auth/
  events/
  orders/
  tickets/
lib/
  auth.ts
  db.ts
  http.ts
  validation.ts
prisma/
  schema.prisma
  seed.ts
```

## Security boundaries

- Public event reads are unauthenticated.
- Account creation and login are public.
- Event creation requires an authenticated organizer/admin.
- Order creation requires an authenticated user.
- Organizer sales data requires organizer/admin role.
- User identity is resolved server-side from a signed JWT.
- Passwords are never stored in plaintext.

## Inventory consistency

Order creation is executed inside a Prisma transaction. Ticket stock is checked before decrementing inventory. The ticket type update uses a conditional `updateMany` based on remaining capacity so concurrent requests cannot blindly reduce inventory below zero.

For a high-volume deployment, PostgreSQL row-level locking or an atomic inventory ledger can be introduced.

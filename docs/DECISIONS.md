# Architecture Decisions

## ADR-001: Next.js for both application layers

Next.js is used for the frontend and API service to keep the capstone stack coherent while separating browser presentation from backend business logic.

## ADR-002: PostgreSQL

Ticket inventory, orders, users, refunds and event relationships are transactional and relational. PostgreSQL is therefore preferred over a document database.

## ADR-003: Integer money

Prices and order totals are stored as Kobo integers to prevent floating-point rounding errors.

## ADR-004: JWT in HTTP-only cookie

A signed JWT stored in an HTTP-only cookie avoids exposing session tokens to browser JavaScript. Issuer, audience and expiration are validated, and account status is checked against the database.

## ADR-005: Same-origin frontend API proxy

The frontend exposes `/api/*` and forwards requests server-to-server to `BACKEND_URL`. This keeps the backend origin out of public browser configuration and simplifies cookie-based authentication.

## ADR-006: Paystack Test Mode

The capstone implements a real Paystack integration in Test Mode rather than a fake local payment state. The backend initializes transactions, verifies provider status, validates amount/currency/reference, processes signed webhooks and finalizes orders idempotently. Live-money processing remains disabled until merchant activation and production configuration are complete.

## ADR-007: Transactional inventory reservation

Order creation and inventory reservation occur inside a Prisma transaction. The remaining quantity is conditionally decremented to prevent concurrent requests from blindly overselling inventory. Failed or reversed pending payments restore the reservation through an idempotent state transition.

## ADR-008: QR tickets after payment confirmation

Tickets are issued only after confirmed payment. Each ticket receives a unique code and QR token. This prevents unpaid orders from producing valid entry credentials.

## ADR-009: Soft-delete and suspension controls

Administrator account controls use suspension and soft deletion rather than destructive deletion. Authenticated requests check these fields so an existing session cannot bypass the account state.

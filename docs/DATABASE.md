# Database Design

EventFlow uses PostgreSQL with Prisma ORM. The Prisma schema and migration history are source-controlled together.

## Entities

### User
Stores account identity, role, authentication data, and optional suspension/soft-delete state.

### Event
Stores event metadata, a unique URL-safe slug, publication state, organizer ownership and dates.

### TicketType
Defines a ticket category, price and total inventory. `quantityRemaining` is the currently available inventory reserved by the order workflow.

### Order
Represents an attendee purchase and its Paystack payment reference/status.

### OrderItem
Stores the ticket type, quantity and price captured at order time.

### Ticket
Represents an individual issued digital ticket, including a unique ticket code, QR token, QR image data and check-in state.

### Refund
Stores one refund record per order, including provider reference, amount and processing state.

### AuditLog
Stores administrator/organizer actions against managed entities.

## Relationships

```text
User 1 ─────── * Event
User 1 ─────── * Order
User 1 ─────── * AuditLog
User 1 ─────── * Refund (requested by)
Event 1 ────── * TicketType
Event 1 ────── * Order
Event 1 ────── * Ticket
Event 1 ────── * Refund
Order 1 ────── * OrderItem
Order 1 ────── * Ticket
Order 1 ────── 1 Refund
TicketType 1 ─ * OrderItem
TicketType 1 ─ * Ticket
```

## Important constraints

- User email is unique.
- Event slug is unique.
- Ticket code and QR token are unique.
- Payment reference is unique when present.
- Each order can have at most one refund record.
- Ticket inventory is stored as integer quantities; order creation conditionally decrements `quantityRemaining` to prevent overselling under concurrent requests.
- Foreign keys use restrictive or cascading deletion according to ownership and lifecycle requirements.
- Audit records require an actor and are retained independently of the managed entity's lifecycle.

## Money

Prices and totals are stored as integer minor units (`priceKobo`) rather than floating-point values. For example, ₦5,000 is stored as `500000` kobo.

## Payment lifecycle

```text
PENDING
   ├── successful Paystack verification ──> PAID ──> Tickets issued
   ├── failed payment ───────────────────> FAILED ─> Inventory released
   └── reversed payment ────────────────> FAILED ─> Inventory/tickets reconciled
```

Refund processing is tracked separately with `PENDING`, `PROCESSING`, `PROCESSED` and `FAILED` states.

## Migration strategy

Development:

```bash
npm run db:migrate
```

Production:

```bash
npx prisma migrate deploy
```

`migrate deploy` applies committed migrations; it does not detect arbitrary production schema drift. Verify the schema against migration history before production releases. Never run `prisma migrate reset` against a production database.

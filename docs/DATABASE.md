# Database Design

## Entities

### User

Stores account identity and role.

### Event

Stores event metadata and publishing state.

### TicketType

Defines a ticket category, price, currency, and quantity.

### Order

Represents an attendee purchase.

### OrderItem

Stores the ticket type and quantity purchased for an order.

### Ticket

Represents an issued individual digital ticket.

## Relationships

```text
User 1 ─────── * Event
User 1 ─────── * Order
Event 1 ────── * TicketType
Order 1 ────── * OrderItem
TicketType 1 ─ * OrderItem
Order 1 ────── * Ticket
TicketType 1 ─ * Ticket
```

## Important constraints

- User email is unique.
- Event slug is unique.
- Ticket type has a non-negative capacity.
- Ticket code is unique.
- QR token is unique.
- Foreign keys use cascade or restrictive behavior appropriate to ownership.

## Money

Prices are stored as integer minor units (`priceKobo`) rather than floating point values. For example, ₦5,000 is stored as `500000` kobo.

This avoids floating-point rounding errors.

## Migration strategy

Development:

```bash
npm run db:migrate
```

Production:

```bash
npx prisma migrate deploy
```

Never run `prisma migrate reset` against a production database.

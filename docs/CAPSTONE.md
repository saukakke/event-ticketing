# 3MTT Capstone Project Document

## Project title

**EventFlow: A Digital Event Ticketing and Management Platform**

## Problem statement

Event organizers frequently depend on informal sales channels, manual payment confirmation, spreadsheets, printed tickets and fragmented communication. These practices make it difficult to track ticket inventory, verify attendees, reconcile payments and provide a reliable customer experience.

## Proposed solution

EventFlow provides a centralized web platform where attendees discover published events, choose ticket categories, reserve inventory, complete Paystack Test Mode checkout and receive digital QR tickets after confirmed payment. Organizers can create and publish events, monitor orders and payments, manage tickets and check attendees in. Administrators can manage users, tickets, payments and audit records.

## Objectives

1. Digitize event discovery and ticket purchasing.
2. Provide role-based access for attendees, organizers and administrators.
3. Maintain accurate ticket inventory through transactional database operations.
4. Integrate secure server-side payment initialization and verification.
5. Generate unique digital tickets using QR codes after confirmed payment.
6. Provide organizer and administrator management dashboards.
7. Demonstrate production-oriented software engineering, security and deployment practices.

## Scope

### Included in the current MVP

- User registration and login.
- JWT-based HTTP-only sessions.
- Attendee, organizer and administrator roles.
- Event creation, editing and publishing.
- Ticket types and inventory management.
- Published event discovery and event detail pages.
- Transactional order creation and inventory reservation.
- Paystack Test Mode transaction initialization.
- Server-side payment verification.
- Signed Paystack webhook processing.
- Idempotent payment finalization and reversal handling.
- Digital ticket and QR-code generation.
- Attendee ticket dashboard.
- Organizer sales, orders, payments, tickets and check-in views.
- Administrator users, orders, payments, tickets, check-in and audit views.
- PostgreSQL persistence with Prisma migrations.
- Docker deployment support.
- GitHub Actions CI.
- Security and deployment documentation.

### Future scope

- Live-money Paystack production activation after merchant verification.
- Email/SMS ticket delivery.
- Dedicated mobile scanning application.
- Promo codes and discounts.
- Reserved seating maps.
- Event image/object storage.
- Advanced analytics and reporting.
- Multi-tenant organization accounts.
- Automated rate limiting and expanded observability.

## Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | Users shall register accounts. |
| FR-02 | Users shall authenticate using secure sessions. |
| FR-03 | Attendees shall browse published events. |
| FR-04 | Users shall view an event and available ticket inventory. |
| FR-05 | Organizers shall create and publish events. |
| FR-06 | The system shall prevent overselling through transactional inventory reservation. |
| FR-07 | Authenticated attendees shall create orders. |
| FR-08 | The system shall initialize Paystack Test Mode transactions server-side. |
| FR-09 | The system shall verify payment references, amounts and currency. |
| FR-10 | Signed payment webhooks shall be validated and processed idempotently. |
| FR-11 | Confirmed payments shall generate unique QR tickets exactly once. |
| FR-12 | Organizers shall view sales, orders and payment history for owned events. |
| FR-13 | Administrators shall manage users, orders, payments, tickets and audit records. |
| FR-14 | Authorized staff/admin workflows shall support ticket check-in. |

## Non-functional requirements

- Responsive across mobile, tablet and desktop.
- Accessible keyboard navigation and visible focus states.
- Server-side validation for mutation endpoints.
- Password hashing with bcrypt.
- HTTP-only authentication cookies.
- JWT issuer, audience and expiry validation.
- Browser-origin validation for state-changing API requests.
- Database transactions for inventory-sensitive operations.
- HMAC-SHA512 Paystack webhook verification.
- Structured JSON error responses.
- Environment-based configuration.
- Production Docker builds.
- Automated CI tests and production builds.
- Documentation suitable for project evaluation.

## Architecture

```text
                 ┌─────────────────────────┐
                 │      Web Browser        │
                 └────────────┬────────────┘
                              │ HTTPS
                              ▼
                 ┌─────────────────────────┐
                 │ Next.js Frontend        │
                 │ App Router + TypeScript │
                 │ Same-origin /api proxy  │
                 └────────────┬────────────┘
                              │ REST/JSON
                              ▼
                 ┌─────────────────────────┐
                 │ Next.js API Backend     │
                 │ Auth / Events / Orders  │
                 │ Payments / Admin       │
                 └───────┬─────────┬───────┘
                         │         │
                      Prisma    Paystack
                         │         │
                         ▼         ▼
                 ┌────────────┐  ┌────────────┐
                 │ PostgreSQL │  │ Paystack   │
                 └────────────┘  └────────────┘
```

## Development methodology

1. Requirements analysis.
2. UX and information architecture.
3. Data modelling.
4. Authentication and authorization.
5. Event management.
6. Inventory-safe order workflow.
7. Payment integration and webhook security.
8. Ticket issuance and check-in.
9. Automated testing and security review.
10. Deployment preparation.
11. Documentation and repository audit.

## Demonstration flow

### Attendee

1. Register or log in.
2. Browse published events.
3. Open `/events/:id`.
4. Select a ticket quantity.
5. Create an order.
6. Continue to Paystack Test Mode checkout.
7. Return through the payment callback.
8. Verify the order becomes `PAID`.
9. Open the dashboard and show the generated QR ticket.

### Organizer

1. Log in as an organizer.
2. Open the organizer dashboard.
3. Create an event.
4. Add ticket types and inventory.
5. Publish the event.
6. Review orders and payment history.
7. Review sales metrics.
8. Use the check-in workflow for an active ticket.

### Administrator

1. Log in as an administrator.
2. Open the platform overview.
3. Review users, orders and payments.
4. Suspend/restore or soft-delete a non-admin account.
5. Void/activate a ticket where permitted.
6. Review audit records.

## Capstone evidence

The strongest end-to-end demonstration is:

```text
Register → Login → Discover Event → Event Detail
→ Select Ticket → Create Order → Paystack Test Checkout
→ Server Verification/Webhook → PAID Order
→ QR Ticket → Dashboard → Check-in
```

This demonstrates frontend engineering, REST API design, relational data modelling, authentication, authorization, transactional inventory management, payment integration, webhook security, idempotency, QR ticketing and deployment architecture in one coherent application.

# 3MTT Capstone Project Document

## Project title

**EventFlow: A Digital Event Ticketing and Management Platform**

## Problem statement

Event organizers frequently depend on informal channels, manual payment confirmation, spreadsheets, printed tickets, and fragmented communication. These practices make it difficult to track ticket inventory, verify attendees, reconcile sales, and provide a reliable customer experience.

## Proposed solution

EventFlow provides a centralized web platform where attendees can discover published events, choose ticket categories, place orders, and receive digital tickets. Organizers can publish events, define ticket inventories, and monitor sales.

## Objectives

1. Digitize event discovery and ticket purchasing.
2. Provide role-based access for attendees, organizers, and administrators.
3. Maintain accurate ticket inventory through transactional database operations.
4. Generate verifiable digital tickets using QR codes.
5. Provide organizers with basic sales analytics.
6. Demonstrate production-oriented software engineering practices.

## Scope

### Included in MVP

- User registration and login.
- Role-based authorization.
- Event creation and publishing.
- Ticket type and inventory management.
- Event discovery and detail pages.
- Demo checkout.
- Order records.
- Digital ticket generation.
- QR code generation.
- Attendee ticket dashboard.
- Organizer sales dashboard.
- PostgreSQL persistence.
- Validation and API error handling.
- Deployment documentation.

### Future scope

- Paystack/Flutterwave payment verification.
- Webhook-driven ticket issuance.
- Email/SMS notifications.
- Ticket scanning application for event staff.
- Refund management.
- Promo codes.
- Seating maps.
- Event image storage.
- Advanced analytics.
- Multi-tenant organization accounts.

## Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | Users shall register accounts. |
| FR-02 | Users shall authenticate securely. |
| FR-03 | Attendees shall browse published events. |
| FR-04 | Organizers shall create events. |
| FR-05 | Organizers shall create ticket types. |
| FR-06 | The system shall prevent overselling. |
| FR-07 | Attendees shall create orders. |
| FR-08 | Paid demo orders shall generate tickets. |
| FR-09 | Tickets shall contain unique QR codes. |
| FR-10 | Organizers shall view event sales statistics. |

## Non-functional requirements

- Responsive across mobile, tablet, and desktop.
- Accessible keyboard navigation and visible focus.
- Server-side validation for all mutation endpoints.
- Password hashing.
- HTTP-only authentication cookie.
- Database transactions for inventory-sensitive operations.
- Structured error responses.
- Environment-based configuration.
- Production build scripts.
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
                 └────────────┬────────────┘
                              │ REST/JSON
                              ▼
                 ┌─────────────────────────┐
                 │ Next.js API Backend     │
                 │ Auth / Events / Orders  │
                 └────────────┬────────────┘
                              │ Prisma
                              ▼
                 ┌─────────────────────────┐
                 │ PostgreSQL              │
                 └─────────────────────────┘
```

## Development methodology

The project is organized around incremental MVP delivery:

1. Requirements analysis.
2. UX and information architecture.
3. Data modelling.
4. Authentication and authorization.
5. Event management.
6. Ticketing and checkout.
7. Testing and security review.
8. Deployment preparation.
9. Documentation.

## Evidence for capstone demonstration

A complete demonstration can follow this sequence:

1. Register/log in as an attendee.
2. Browse events.
3. Open an event.
4. Select a ticket.
5. Complete the demo checkout.
6. Open the generated ticket and show its QR code.
7. Log in as organizer.
8. Create another event.
9. Add ticket inventory.
10. Publish the event.
11. Return to attendee view and purchase a ticket.
12. Show updated organizer sales metrics.

# Testing Strategy

## Automated tests currently in the repository

The backend test suite runs with:

```bash
npm test
```

Current executable tests cover:

- request validation schemas;
- slug generation;
- valid Paystack HMAC-SHA512 signatures;
- invalid Paystack signatures;
- missing Paystack signatures.

The GitHub Actions workflow also runs Prisma client generation, migrations, the backend tests and the production build.

## Integration scenarios

The following flows should be verified against a PostgreSQL test database and Paystack Test Mode:

1. Register a user.
2. Login and receive an HTTP-only session cookie.
3. Fetch published events.
4. Open an event detail page by event ID.
5. Create an organizer event.
6. Publish the event.
7. Create an order for available ticket types.
8. Confirm inventory reservation.
9. Confirm Paystack transaction initialization.
10. Confirm callback verification.
11. Confirm signed `charge.success` webhook handling.
12. Confirm idempotent payment finalization.
13. Confirm digital ticket generation exactly once.
14. Confirm failed/reversed payment releases reserved inventory.
15. Attempt an oversell and expect `409`.
16. Attempt an organizer endpoint as an attendee and expect `403`.
17. Confirm suspended and soft-deleted accounts cannot authenticate.
18. Confirm organizer ownership isolation.
19. Confirm admin role, ticket and audit operations.
20. Confirm ticket check-in rejects invalid, void or already checked-in tickets.

## End-to-end browser flow

Recommended Playwright/agent-browser flow:

```text
Landing → Events → Event detail → Ticket selection → Checkout
→ Paystack Test Mode → Callback → Dashboard → Digital ticket
```

Organizer:

```text
Login → Organizer dashboard → Create event → Publish → Orders → Payments → Check-in
```

Admin:

```text
Login → Admin dashboard → Users → Orders → Payments → Tickets → Check-in → Audit log
```

## Manual acceptance checklist

- [ ] Home page loads without console errors.
- [ ] Events list loads published events.
- [ ] Event detail loads from `/events/:id`.
- [ ] Ticket availability is displayed from `quantityRemaining`.
- [ ] Quantity controls never exceed available stock or the per-item limit.
- [ ] Login and registration enforce the 12-character minimum password.
- [ ] HTTP-only session cookie is set and cleared correctly.
- [ ] Attendee dashboard displays paid tickets and QR codes.
- [ ] Organizer routes reject attendees.
- [ ] Organizer users cannot manage another organizer's events.
- [ ] Admin routes reject non-admin users.
- [ ] Admin suspension/soft-delete controls work.
- [ ] Inventory cannot become negative.
- [ ] Paystack signatures are validated.
- [ ] Payment amount, currency and reference are validated server-side.
- [ ] Duplicate payment callbacks/webhooks are idempotent.
- [ ] Failed/reversed payments restore inventory correctly.
- [ ] Ticket QR data is generated only after confirmed payment.
- [ ] Ticket check-in prevents duplicate use.
- [ ] Mobile layout is usable.
- [ ] Keyboard navigation works.
- [ ] Focus indicators are visible.
- [ ] Form errors are understandable.
- [ ] Loading and empty states are visible.
- [ ] Production build succeeds.
- [ ] Docker images build successfully.
- [ ] Prisma migrations apply successfully to a clean PostgreSQL database.

## Release gate

A release should not be considered production-ready until the automated suite passes and the browser, payment, inventory, authorization and deployment acceptance flows above have been verified.

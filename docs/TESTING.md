# Testing Strategy

## Unit tests

Recommended targets:

- validation schemas
- money formatting
- authorization helpers
- order total calculations

## Integration tests

API scenarios:

1. Register user.
2. Login.
3. Fetch public events.
4. Create organizer event.
5. Publish event.
6. Create order.
7. Confirm ticket generation.
8. Confirm stock decreases.
9. Attempt oversell and expect `409`.
10. Attempt organizer endpoint as attendee and expect `403`.

## End-to-end tests

Recommended Playwright flow:

```text
Landing → Events → Event detail → Checkout → Ticket
```

Organizer:

```text
Login → Organizer dashboard → Create event → Publish → Sales
```

## Manual acceptance checklist

- [ ] Mobile layout is usable.
- [ ] Keyboard navigation works.
- [ ] Focus indicators are visible.
- [ ] Form errors are understandable.
- [ ] Loading states are visible.
- [ ] Empty states are useful.
- [ ] Unauthorized API requests are rejected.
- [ ] Stock cannot become negative.
- [ ] Ticket QR is generated.
- [ ] Production build succeeds.

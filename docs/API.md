# API Reference

EventFlow exposes a JSON REST API from the backend Next.js service. In local development the backend listens on `http://localhost:10000`; the frontend proxies browser requests through its same-origin `/api/*` route.

## Response format

Successful responses use:

```json
{
  "data": {}
}
```

Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": {}
  }
}
```

## Authentication

Authentication uses an HTTP-only JWT session cookie.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create an attendee account |
| `POST` | `/auth/login` | Public | Authenticate a user |
| `POST` | `/auth/logout` | Authenticated | Clear the session cookie |
| `GET` | `/auth/me` | Authenticated | Return the current user |

Registration and login require passwords of 12–128 characters. Emails are normalized to lowercase.

## Health

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | Service health check |

## Events

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/events` | Public | Search and paginate published events |
| `GET` | `/events/:id` | Public | Return a published event and ticket inventory |
| `POST` | `/events` | Organizer/Admin | Create an event and ticket types |
| `PATCH` | `/events/:id` | Owner/Admin | Update event details |
| `POST` | `/events/:id/publish` | Owner/Admin | Publish an event |

`GET /events` supports `q`, `city`, `page`, and `limit`. Invalid or non-positive `page`/`limit` values fall back to safe defaults. Event detail is addressed by the event ID used by the frontend route `/events/:id`.

Example event creation:

```json
{
  "title": "Northern Tech Summit",
  "description": "Technology, software engineering and digital entrepreneurship conference.",
  "venue": "ABU Conference Centre",
  "city": "Zaria",
  "startAt": "2026-10-15T09:00:00.000Z",
  "endAt": "2026-10-15T17:00:00.000Z",
  "ticketTypes": [
    {
      "name": "Regular",
      "description": "General admission.",
      "priceKobo": 500000,
      "quantity": 100
    }
  ]
}
```

## Orders and payments

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/orders` | Authenticated | Reserve inventory, create an order and initialize Paystack checkout |
| `GET` | `/orders/me` | Authenticated | Return the user's orders and issued tickets |
| `GET` | `/payments/paystack/callback` | Authenticated | Verify a customer-return payment reference belonging to the signed-in user |
| `POST` | `/payments/paystack/webhook` | Paystack | Validate and process signed payment events |

Order creation is transactional. The backend validates event publication, ticket type ownership, quantity and remaining inventory before reserving stock.

Payment references are generated server-side. Paystack initialization, verification, amount/currency/reference checks, webhook signature validation and ticket issuance all happen on the backend.

Supported webhook events include:

- `charge.success`
- `charge.failed`
- `charge.reversed`

Successful payments are finalized idempotently. Tickets are generated only after confirmed payment. Failed or reversed pending payments release their reserved inventory.

## Organizer API

Organizer endpoints require `ORGANIZER` or `ADMIN` access. Non-admin organizers are restricted to events they own.

- `GET /organizer/events` — organizer event dashboard data.
- `GET /organizer/orders` — orders belonging to the organizer's events.
- `GET /organizer/orders/:id` — details for an order belonging to the organizer's events.
- `GET /organizer/tickets` — ticket management data.
- `GET /organizer/tickets/:id` — ticket details.
- `GET /organizer/payments` — payment history.
- `POST /organizer/refunds` — refund a paid order through Paystack and void its tickets.
- `GET /organizer/check-in` — check-in dashboard data.
- `POST /organizer/check-in` — validate/check in an active ticket by ticket code or QR token.

The same `/organizer/check-in` endpoint is intentionally used by the administrator check-in UI because the backend authorizes both organizer and admin roles. There is no separate `/admin/check-in` backend endpoint.

## Admin API

Admin endpoints require the `ADMIN` role.

- `GET /admin/overview` — platform metrics and recent orders.
- `GET /admin/users` — user management and filtering.
- `GET /admin/users/:id` — user details and account controls.
- `PATCH /admin/users/:id` — change role, suspend/restore, or soft-delete/undelete a user.
- `GET /admin/orders` — platform order management.
- `GET /admin/orders/:id` — order details.
- `POST /admin/orders/:id/verify-payment` — server-side payment verification.
- `GET /admin/payments` — payment history and filtering.
- `GET /admin/tickets` — ticket management.
- `PATCH /admin/tickets/:id` — activate or void a ticket.
- `GET /admin/audit` — audit-log records.

Administrator check-in operations use `/organizer/check-in` with `ADMIN` authorization rather than a duplicate admin-specific endpoint.

## Validation and status codes

- `200` — successful read/update.
- `201` — successful creation.
- `400` — malformed or invalid request.
- `401` — unauthenticated or invalid webhook signature.
- `403` — insufficient role or disallowed origin.
- `404` — resource not found.
- `409` — business conflict, such as insufficient stock.
- `422` — semantic validation error where an endpoint explicitly uses it.
- `500` — unexpected server error.
- `502` — upstream/payment-provider failure or unknown payment state.

## Browser proxy

The frontend exposes a catch-all `/api/*` route. It forwards the request to the server-only `BACKEND_URL`, preserves the HTTP method and request body, and forwards backend cookies to the frontend origin. `BACKEND_URL` must not be exposed as a `NEXT_PUBLIC_*` browser variable.

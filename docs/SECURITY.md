# Security

## Authentication

The backend creates a signed JWT and stores it in an HTTP-only cookie. JavaScript cannot read the session cookie, reducing exposure to client-side token theft.

In production the cookie uses the `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax` and `Path=/`.

JWTs are validated with:

- HS256 algorithm restriction;
- issuer validation;
- audience validation;
- expiration validation;
- database-backed user existence and account-status checks.

Suspended and soft-deleted users cannot continue authenticated requests even when an older session token exists.

## Passwords

Passwords are hashed with bcryptjs before storage. Raw passwords are not logged.

The server requires passwords between 12 and 128 characters.

## Validation

Zod schemas validate request bodies on the server. Client-side validation is convenience only and is never trusted for authorization or data integrity.

## Authorization

Role checks occur on the server. Frontend buttons and links are not security boundaries.

Organizer operations also verify event ownership unless the authenticated user is an administrator.

## SQL injection

Prisma parameterizes database operations. Application code does not use interpolated raw SQL.

## XSS

Event descriptions are rendered as text. The application does not use `dangerouslySetInnerHTML`.

## CSRF and browser origins

Because authentication uses cookies, state-changing browser requests must come from configured frontend origins. Backend middleware validates the `Origin` header for `POST`, `PUT`, `PATCH` and `DELETE` requests and rejects disallowed origins.

The frontend uses a same-origin `/api/*` proxy, which further reduces cross-origin browser authentication complexity.

The Paystack webhook is a server-to-server callback and is protected independently with HMAC-SHA512 signature validation.

## Payment security

EventFlow uses Paystack Test Mode for the current capstone deployment.

The backend:

1. Generates the payment reference.
2. Initializes the Paystack transaction.
3. Keeps the Paystack secret server-side.
4. Redirects the customer to Paystack checkout.
5. Verifies the transaction on the server.
6. Validates reference, amount and currency.
7. Validates the signed webhook.
8. Finalizes the order idempotently.
9. Issues tickets exactly once.
10. Releases reserved inventory for failed/reversed pending payments.

The customer callback is not trusted as proof of payment; it triggers server-side verification.

## Inventory integrity

Order creation runs inside a Prisma transaction. Remaining inventory is conditionally decremented only when enough stock remains. Failed or reversed pending orders release their reservation using an idempotent state transition.

## Ticket integrity

Tickets have unique codes and QR tokens. Tickets are issued only after confirmed payment. Voided tickets cannot be activated unless the order is paid and the event is not cancelled.

## Auditability

Administrative management actions write audit records containing the actor, action, entity, entity ID and optional metadata.

## Rate limiting

The current repository does not implement an application-level rate limiter. Production deployment should add rate limits/WAF controls for at least:

- registration;
- login;
- order creation;
- payment verification;
- organizer mutations;
- admin mutations;
- check-in endpoints.

## Production requirements

Before live-money operation:

- Use a live Paystack secret only after merchant activation.
- Keep all payment secrets server-side.
- Use HTTPS everywhere.
- Restrict trusted frontend origins.
- Enable rate limiting/WAF controls.
- Monitor webhook failures and payment-state anomalies.
- Use managed PostgreSQL backups and monitoring.
- Remove development/demo credentials and seeded demo data.

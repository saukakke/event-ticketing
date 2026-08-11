# Security

## Authentication

The backend creates a signed JWT and stores it in an HTTP-only cookie. JavaScript cannot read the cookie, reducing exposure to token theft through client-side scripts.

Use HTTPS in production so the cookie can be marked secure.

## Passwords

Passwords are hashed with bcryptjs before storage. The application never logs raw passwords.

## Validation

Zod schemas validate request bodies on the server. Client-side validation is convenience only and is never trusted.

## Authorization

Role checks occur on the server. Hiding a button in the frontend is not an authorization mechanism.

## SQL injection

Prisma parameterizes database operations. Raw SQL is avoided in the application.

## XSS

Event descriptions are rendered as plain text. The application does not use `dangerouslySetInnerHTML`.

## CSRF

Because authentication uses a cookie, production payment/mutation deployments should add CSRF protection when cross-site requests are possible. A strict `SameSite=Lax` cookie is used in the MVP. If the frontend and API are deployed on different sites, use a CSRF token strategy and explicit origin validation.

## Rate limiting

The MVP leaves rate limiting at the deployment layer. For production, add API rate limits for:

- registration
- login
- order creation
- organizer mutations

## Payment security

The demo checkout does not process real funds. For real payment:

1. Create a payment intent.
2. Redirect to provider checkout.
3. Receive provider webhook.
4. Verify signature.
5. Query provider transaction status.
6. Mark order paid only after server-side verification.
7. Issue tickets once.
8. Make webhook processing idempotent.

Never trust a frontend "payment successful" flag.

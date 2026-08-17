# Deployment

EventFlow is designed as two independently deployable Node.js/Next.js services.

## Render topology

- Frontend: Next.js standalone service on port `10000`.
- Backend: Next.js API service on port `10000`.
- PostgreSQL: managed PostgreSQL database.
- Paystack: Test Mode for the current capstone deployment.

Both services can listen on `10000` because Render assigns them separate service network namespaces.

## Backend environment

```env
DATABASE_URL=postgresql://...
JWT_SECRET=<minimum 32-character random secret>
FRONTEND_URL=https://your-frontend.example
NODE_ENV=production
PAYSTACK_SECRET_KEY=sk_test_...
```

`FRONTEND_URL` may contain comma-separated allowed browser origins when multiple trusted frontend origins are required.

## Frontend environment

```env
BACKEND_URL=https://your-backend.example
NODE_ENV=production
```

Do not use `NEXT_PUBLIC_BACKEND_URL` for the backend origin. The frontend API proxy reads `BACKEND_URL` server-side so the backend URL is not exposed as a public browser variable.

## Build and start

From the repository root:

```bash
npm install
npm run build
```

For local development:

```bash
npm run dev
```

For individual services:

```bash
npm run build --workspace @eventflow/backend
npm run start --workspace @eventflow/backend

npm run build --workspace @eventflow/frontend
npm run start --workspace @eventflow/frontend
```

## Docker

Both applications use multi-stage Docker builds with Next.js standalone output.

Backend startup applies committed Prisma migrations before starting the standalone server:

```bash
npx prisma migrate deploy && node server.js
```

The backend image does not copy a `public` directory because the backend service does not contain one. The frontend image copies its tracked `public` directory.

## Database deployment

Run migrations through the deployment pipeline:

```bash
npx prisma migrate deploy
```

Prisma's `migrate deploy` applies pending migrations but does not detect arbitrary database drift, so schema/migration consistency should be checked during development and release verification.

Never run `prisma migrate reset` against production.

## Paystack webhook

Configure the Paystack webhook to point to:

```text
https://<backend-domain>/api/payments/paystack/webhook
```

The webhook validates the `x-paystack-signature` header using HMAC-SHA512 and performs idempotent payment finalization or reversal handling.

## Health check

```text
GET https://<backend-domain>/api/health
```

Use this endpoint for service availability checks.

## Production checklist

- Use a cryptographically random `JWT_SECRET` of at least 32 characters.
- Use HTTPS for both services.
- Use a managed PostgreSQL database with backups and monitoring.
- Configure the real frontend origin in `FRONTEND_URL`.
- Keep `PAYSTACK_SECRET_KEY` server-side.
- Apply Prisma migrations before starting the new backend release.
- Configure Paystack webhook delivery and monitor failures.
- Enable application and database monitoring.
- Do not advertise Test Mode as a live-payment environment.

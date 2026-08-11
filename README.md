# EventFlow — Event Ticketing Platform

EventFlow is a production-oriented full-stack event ticketing MVP built as a 3MTT Capstone Project. It demonstrates a complete digital workflow for discovering events, selecting ticket types, creating orders, issuing digital tickets with QR codes, and managing events from an organizer dashboard.

## Project goals

- Replace manual event-ticket sales with a searchable digital platform.
- Give organizers tools to publish and manage events.
- Give attendees a simple path from discovery to ticket ownership.
- Demonstrate secure API design, authentication, validation, relational data modelling, responsive UX, and deployment readiness.
- Provide a clear capstone architecture that can be extended with real payment providers.

## Technology

- Frontend: Next.js App Router, TypeScript, React, CSS Modules/global CSS.
- Backend: Next.js App Router API service, TypeScript.
- Database: PostgreSQL with Prisma ORM.
- Authentication: signed JWT access tokens stored in an HTTP-only cookie.
- Validation: Zod.
- Password hashing: bcryptjs.
- QR generation: qrcode.
- Monorepo tooling: npm workspaces.
- Deployment: Node.js/Docker compatible.

The current Next.js deployment model supports a normal Node.js server and Docker deployments; this repository includes both approaches. See the official Next.js deployment documentation for platform-specific details.

## Repository structure

```text
event-ticketing/
├── frontend/                 # Public web application
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
├── backend/                  # API + Prisma service
│   ├── app/api/
│   ├── lib/
│   └── prisma/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── CAPSTONE.md
│   ├── DEPLOYMENT.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── TESTING.md
├── docker-compose.yml
├── .env.example
└── package.json
```

## Core user roles

### Attendee
- Register and log in.
- Browse published events.
- View event details.
- Select ticket quantity.
- Place an order using the included demo checkout flow.
- View owned tickets.
- Open a digital ticket containing a QR code.

### Organizer
- Create events.
- Add ticket types and prices.
- Publish/unpublish events.
- View sales statistics.
- View recent orders for their events.

### Admin
The data model supports administration and the API protects role-sensitive operations. The MVP dashboard focuses on attendee and organizer workflows while keeping the role model ready for an expanded administrative console.

## Important payment note

The included checkout is explicitly a **demo payment workflow** for a capstone environment. It marks an order as paid after the server validates inventory and creates the order. It does not claim to process real money.

For real deployment, replace the demo payment service with a provider such as Paystack or Flutterwave, verify payment asynchronously through provider webhooks, and only issue tickets after server-side payment verification.

## Quick start

### 1. Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 15+

### 2. Install

```bash
npm install
```

### 3. Configure

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/event_ticketing"
JWT_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 4. Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Run both applications

```bash
npm run dev
```

Frontend:
`http://localhost:3000`

Backend:
`http://localhost:4000`

### Demo accounts

Seed data creates:

- Organizer: `organizer@eventflow.local`
- Attendee: `attendee@eventflow.local`
- Admin: `admin@eventflow.local`

All seeded users use the development password:

`Password123!`

Change or remove seeded credentials before production deployment.

## Production checklist

- Set a cryptographically random `JWT_SECRET`.
- Use a managed PostgreSQL database with backups.
- Set `NODE_ENV=production`.
- Configure HTTPS.
- Configure real payment verification and webhooks.
- Restrict CORS to the deployed frontend origin.
- Add transactional email provider for receipts and ticket delivery.
- Add object storage for event images.
- Enable database monitoring and error tracking.
- Run migrations using `prisma migrate deploy`.
- Do not use development seed credentials in production.
- Review rate limits and WAF rules before opening public traffic.

## UI/UX implementation

The frontend follows the principles of the UI/UX Pro Max design intelligence approach: strong visual hierarchy, accessible contrast, responsive layouts, consistent spacing, explicit interaction states, keyboard-visible focus, appropriate touch targets, restrained animation, and product-specific information architecture.

The project keeps the design system in code rather than relying on decorative effects. The interface uses a warm ivory background, deep ink typography, coral/orange action color, compact event metadata, clear ticket pricing, and responsive card/list layouts.

## Capstone deliverables

The repository includes architecture, database, API, security, deployment, testing, and capstone documentation under `docs/`.

## License

MIT for the project source code. Third-party packages retain their respective licenses.

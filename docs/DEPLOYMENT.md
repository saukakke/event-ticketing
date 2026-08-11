# Deployment

## Option A: Separate Node deployments

Deploy `backend` as a Node.js service and `frontend` as a Node.js service.

### Backend environment

```env
DATABASE_URL=...
JWT_SECRET=...
FRONTEND_URL=https://your-frontend.example
NODE_ENV=production
```

### Frontend environment

```env
NEXT_PUBLIC_API_URL=https://your-backend.example
NODE_ENV=production
```

Build:

```bash
npm run build
```

Start each service:

```bash
npm run start --workspace backend
npm run start --workspace frontend
```

## Option B: Docker

The root includes a PostgreSQL compose file for local infrastructure. For production, use a managed PostgreSQL service or a separately managed database.

A production Docker deployment should use multi-stage builds and a non-root runtime user. The Next.js documentation supports Docker and standalone output.

## Database

Use a managed PostgreSQL database with:

- automated backups
- SSL
- connection limits
- monitoring
- point-in-time recovery where available

Run:

```bash
npx prisma migrate deploy
```

before serving the new release.

## Reverse proxy

Terminate TLS at your platform or reverse proxy. Forward HTTPS traffic to the frontend and API services. Configure the API's allowed frontend origin explicitly.

## Production observability

Recommended:

- application error tracking
- request logs with correlation IDs
- PostgreSQL metrics
- uptime monitoring
- payment webhook monitoring
- failed-order alerts

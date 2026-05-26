# Shiftlink Deployment Guide

## Server Requirements

- Ubuntu 22.04+ or Debian 12+
- Node.js 22+
- PostgreSQL 16+
- Redis 7+
- 2+ CPU cores, 4+ GB RAM (production)

## Initial Setup

```bash
# Clone repository
git clone https://github.com/taynextone/shiftlink.git
cd shiftlink

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build backend
npm run build

# Build frontend
npm run web:build
```

## Environment Variables

Create `.env` with:

```env
NODE_ENV=production
PORT=3000
APP_ORIGIN=https://your-domain.example
DATABASE_URL=postgresql://user:password@localhost:5432/shiftlink
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=7d
S3_ENDPOINT=https://s3.example.com
S3_REGION=eu-central-1
S3_BUCKET=shiftlink-uploads
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
NURSE_LOGIN_URL=https://your-domain.example/login
HOSPITAL_LOGIN_URL=https://your-domain.example/login
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Running

```bash
# Production
node dist/index.js

# With PM2
pm2 start dist/index.js --name shiftlink
pm2 save
pm2 startup
```

## Health Check

```
GET /api/v1/health
```

Returns `200` when healthy, `503` when degraded.

## Database Backups

```bash
pg_dump -U shiftlink shiftlink > backup-$(date +%Y%m%d).sql
```

## SSL/TLS

Use nginx or Caddy as reverse proxy with Let's Encrypt certificates.

## Monitoring

- Health endpoint: `/api/v1/health`
- Audit logs: Admin → Audit Log (superadmin only)
- Business KPIs: Admin → Business Metrics (superadmin only)

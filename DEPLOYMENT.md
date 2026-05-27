# Shiftlink Deployment Guide

## Quick Start (Docker) — Production

### Prerequisites
- Ubuntu 22.04+ or Debian 12+
- Docker 24+ and Docker Compose 2+
- 2+ CPU cores, 4+ GB RAM
- Domain pointing to server (for SSL)

### 1. Clone and Configure

```bash
git clone https://github.com/taynextone/shiftlink.git
cd shiftlink

# Create environment file
cp .env.example .env
nano .env
```

Edit `.env` with production values:
```env
DB_PASSWORD=<generate: openssl rand -hex 24>
JWT_SECRET=<generate: openssl rand -hex 32)>
NODE_ENV=production
PORT=3000
APP_ORIGIN=https://your-domain.com
REDIS_URL=redis://redis:6379
```

**Important**: Every variable in `.env` is required. There are no safe defaults for production.

### 2. Start Everything

```bash
docker compose up -d --build
```

This starts:
- **app** — Shiftlink backend (port 3000, resource-limited)
- **db** — PostgreSQL 16 (resource-limited, persistent volume)
- **redis** — Redis 7 (resource-limited, persistent volume, LRU eviction)
- **nginx** — Reverse proxy (ports 80, 443)

### 3. Run Migrations (first start or after updates)

```bash
docker compose exec app npx prisma migrate deploy
```

### 4. Verify

```bash
# Health check
curl http://localhost:3000/api/v1/health

# All containers healthy
docker compose ps
```

### 5. SSL / HTTPS (Production)

For production, add your SSL certificate:

```bash
# Copy certificates to nginx/ssl directory
mkdir -p nginx/ssl
cp your-fullchain.pem nginx/ssl/fullchain.pem
cp your-privkey.pem nginx/ssl/privkey.pem
```

Update nginx config to reference SSL certs — see `nginx/nginx.conf` for the SSL server block template.

For Let's Encrypt (recommended):
```bash
certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
```

### 6. Maintenance

```bash
# View logs
docker compose logs -f app

# Stop everything
docker compose down

# Restart
docker compose restart

# Rebuild after code changes
docker compose pull && docker compose up -d --build

# Database backup
docker compose exec db pg_dump -U shiftlink shiftlink > backup-$(date +%Y%m%d).sql

# Cleanup old images
docker image prune -f
```

---

## Manual Setup (without Docker)

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- Redis 7+

### Steps

```bash
git clone https://github.com/taynextone/shiftlink.git
cd shiftlink

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env

# Database setup
npx prisma generate
npx prisma migrate deploy

# Build
npm run build
npm run web:build

# Start (use PM2 for production PM2)
pm2 start dist/server.js --name shiftlink
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_PASSWORD` | ✅ | PostgreSQL password (use strong random) |
| `JWT_SECRET` | ✅ | Min 32 characters, random |
| `NODE_ENV` | ✅ | production/development |
| `PORT` | | Default: 3000 |
| `APP_ORIGIN` | ✅ | Your app URL (https://...) |
| `DATABASE_URL` | | Auto-composed if using Docker |
| `REDIS_URL` | | Auto-composed if using Docker |
| `S3_*` | | Object storage for file uploads |

## Production Checklist

- [ ] Strong DB_PASSWORD and JWT_SECRET generated
- [ ] APP_ORIGIN set to production URL
- [ ] SSL certificates configured
- [ ] Regular database backups scheduled (`pg_dump` cron)
- [ ] Log rotation configured (Docker json-file with max-size)
- [ ] Monitoring/alerting set up (health endpoint: `/api/v1/health`)
- [ ] Firewall: only ports 80, 443, 22 exposed

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App won't start | Check `docker compose logs app` |
| App restarting | Likely DB_PASSWORD missing in .env, or Prisma engine mismatch |
| DB connection failed | Verify DATABASE_URL in .env |
| Migration errors | Run `docker compose exec app npx prisma migrate deploy` |
| Health check fails | App takes ~30s to start (start_period) |
| "Query Engine not found" | Prisma binary mismatch — rebuild with `docker compose build --no-cache` |

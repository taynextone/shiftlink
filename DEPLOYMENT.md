# Shiftlink Deployment Guide

## Quick Start (Docker)

### Prerequisites
- Ubuntu 22.04+ or Debian 12+
- Docker 24+ and Docker Compose 2+
- 2+ CPU cores, 4+ GB RAM

### 1. Clone and Configure

```bash
git clone https://github.com/taynextone/shiftlink.git
cd shiftlink

# Create environment file
cp .env.example .env
nano .env
```

Edit `.env`:
```env
DB_PASSWORD=your-strong-password
JWT_SECRET=your-32-char-minimum-secret-key
NODE_ENV=production
PORT=3000
```

### 2. Start Everything

```bash
docker compose up -d --build
```

This starts:
- **app** — Shiftlink backend (port 3000)
- **db** — PostgreSQL 16
- **nginx** — Reverse proxy with SSL (ports 80, 443)

### 3. Run Migrations (first start)

```bash
docker compose exec app npx prisma migrate deploy
```

### 4. Verify

```bash
curl http://localhost:3000/api/v1/health
```

### 5. Manage

```bash
# View logs
docker compose logs -f app

# Stop everything
docker compose down

# Restart
docker compose restart

# Rebuild after code changes
docker compose up -d --build
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

# Start
node dist/server.js
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32 characters |
| `PORT` | ✅ | Default: 3000 |
| `NODE_ENV` | ✅ | production/development |
| `APP_ORIGIN` | For prod | Your app URL |
| `REDIS_URL` | For workers | Redis connection |
| `S3_*` | For file storage | Object storage config |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App won't start | Check `docker compose logs app` |
| DB connection failed | Verify DATABASE_URL in .env |
| Migration errors | Run `docker compose exec app npx prisma migrate deploy` |
| Health check fails | App takes ~10s to start |

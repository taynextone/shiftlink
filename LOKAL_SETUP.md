# Shiftlink — Lokales Entwicklungssetup

## Übersicht

Shiftlink läuft lokal auf dem Ubuntu-Rechner mit:

- **PostgreSQL** in Docker (Port 5432)
- **Redis** in Docker (Port 6379)
- **Backend** lokal via `npm run dev` (Port 3000)
- **Frontend** lokal via `npm run web:dev` (Port 5173)
- **Nginx** als Reverse Proxy (Port 80) — optional

## Standard-Credentials

| Service | Benutzer | Passwort | DB-Name |
|---------|----------|----------|---------|
| PostgreSQL | shiftlink | shiftlink | shiftlink |
| Redis | — | shiftlink | — |

## Ports

| Service | Port | Zweck |
|---------|------|-------|
| PostgreSQL | 5432 | Datenbank |
| Redis | 6379 | Cache/Sessions |
| Backend | 3000 | API |
| Frontend | 5173 | Vite Dev Server |
| Nginx | 80 | Reverse Proxy |

## Quick Start

```bash
# 1. Infrastruktur starten
docker compose -f docker-compose.dev.yml up -d

# 2. .env-Datei für Backend anlegen
cp .env.example .env.dev
# → DATABASE_URL und REDIS_URL eintragen

# 3. Prisma Migration
cd /home/jurica/.openclaw/workspace/projects/shiftlink
npx prisma migrate dev

# 4. Backend starten
npm run dev

# 5. Frontend starten (neues Terminal)
cd web && npm run dev

# 6. Öffnen
# Frontend: http://localhost:5173
# API: http://localhost:3000
```

## Dateien

- `docker-compose.dev.yml` — PostgreSQL + Redis
- `.env.dev` — Environment Variables für lokales Setup

## Nachträgliche Änderungen

Die Credentials sollten vor Produktion geändert werden.
Die Ports können in `docker-compose.dev.yml` angepasst werden.

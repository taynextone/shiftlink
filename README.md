# Shiftlink

Healthcare shift management platform connecting hospitals with nursing staff.

## Architecture

- **Backend**: Node.js + Express + Prisma ORM
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL
- **Queue**: BullMQ (Redis)
- **Auth**: JWT + HTTP-only cookies

## Quick Start

```bash
# Prerequisites: Node.js 22+, PostgreSQL 16+, Redis 7+

# 1. Clone and install
git clone https://github.com/taynextone/shiftlink.git
cd shiftlink
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database and Redis URLs

# 3. Initialize database
npx prisma generate
npx prisma migrate deploy

# 4. Run tests
npm test

# 5. Build
npm run build
npm run web:build

# 6. Start
node dist/index.js
```

## Project Structure

```
shiftlink/
├── src/                    # Backend source
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Auth, validation, error handling
│   ├── routes/             # API route definitions
│   ├── schemas/            # Zod validation schemas
│   ├── services/           # Business logic
│   ├── workers/            # Background job processors
│   └── config/             # Database, env, queues
├── web/src/                # Frontend source
│   ├── features/           # Feature-based modules
│   ├── components/         # Shared UI components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # API client, utilities
├── tests/                  # Jest test suites
├── prisma/                 # Database schema & migrations
└── DEPLOYMENT.md           # Server deployment guide
```

## Key Features

- **Nurse profiles**: Registration, verification, availability management
- **Hospital operations**: Shift import, offer management, contract lifecycle
- **Matching**: Automated nurse-job matching with availability checks
- **Billing**: Invoice generation, payment tracking
- **Notifications**: WhatsApp integration for offer communication
- **Superadmin controls**: Verification, audit logs, business metrics

## API

- `POST /api/v1/auth/register` — User registration
- `POST /api/v1/auth/login` — Authentication
- `GET /api/v1/health` — Health check
- `POST /api/v1/job-shifts/import` — Import shifts
- `POST /api/v1/matches/offer` — Create offer
- `POST /api/v1/matches/respond` — Accept/decline offer
- `GET /api/v1/admin/metrics` — Business metrics (superadmin)
- `GET /api/v1/admin/audit-logs` — Audit logs (superadmin)

## Testing

```bash
# Unit & integration tests
npm test

# With coverage
npm test -- --coverage
```

## License

Proprietary — all rights reserved.

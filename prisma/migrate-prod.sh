#!/usr/bin/env bash
# ============================================================
# Shiftlink — Production Migration Script
# Runs prisma migrate deploy + seed (non-interactive)
# ============================================================
set -euo pipefail

# ── Safety checks ─────────────────────────────────────────────
if [[ -z "${NODE_ENV:-}" ]]; then
  echo "❌ NODE_ENV is not set. Refusing to run."
  echo "   Set NODE_ENV=production before running this script."
  exit 1
fi

if [[ "${NODE_ENV}" == "development" ]]; then
  echo "❌ NODE_ENV is 'development'. This script is for production only."
  echo "   Use 'npx prisma migrate dev' for development."
  exit 1
fi

echo "🔒 NODE_ENV=${NODE_ENV} — proceeding with production migration."

# ── Ensure DATABASE_URL is set ────────────────────────────────
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Aborting."
  exit 1
fi

# ── Run migrations ────────────────────────────────────────────
echo "📦 Running prisma migrate deploy..."
npx prisma migrate deploy

# ── Run seed ──────────────────────────────────────────────────
echo "🌱 Running database seed..."
npx tsx prisma/seed.ts

echo "✅ Migration + seed complete."

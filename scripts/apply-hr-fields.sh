#!/bin/bash
# Generate SQL migration for HR fields manually (shadow-db workaround)
set -e
cd /home/jurica/.openclaw/workspace/projects/shiftlink

DB_URL=$(grep '^DATABASE_URL' .env | cut -d= -f2-)

mkdir -p prisma/migrations/20260824_hr_fields_for_contract_annex

cat > prisma/migrations/20260824_hr_fields_for_contract_annex/migration.sql <<'EOF'
-- AlterTable: optionale Personalabteilung-Felder für Vertragsanlage
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "birthPlace" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "homeAddress" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "socialSecurityNumber" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "taxId" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "healthInsuranceName" TEXT;
EOF

# Apply directly to the live DB (idempotent via IF NOT EXISTS)
docker exec shiftlink-db psql -U shiftlink -d shiftlink < prisma/migrations/20260824_hr_fields_for_contract_annex/migration.sql

# Mark migration as applied
npx prisma migrate resolve --applied 20260824_hr_fields_for_contract_annex 2>&1 | tail -1 || true

echo "--- columns now: ---"
docker exec shiftlink-db psql -U shiftlink -d shiftlink -c "\d \"NurseProfile\"" | grep -E "dateOfBirth|birthPlace|homeAddress|nationality|socialSecurity|taxId|healthInsurance"

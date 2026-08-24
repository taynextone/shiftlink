-- AlterTable: optionale Personalabteilung-Felder für Vertragsanlage
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "birthPlace" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "homeAddress" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "socialSecurityNumber" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "taxId" TEXT;
ALTER TABLE "NurseProfile" ADD COLUMN IF NOT EXISTS "healthInsuranceName" TEXT;

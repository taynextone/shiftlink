-- Shiftlink is a matching platform only; hospitals pay nurses directly.
-- Bank details are no longer required at registration.
ALTER TABLE "NurseProfile" ALTER COLUMN "iban" DROP NOT NULL;

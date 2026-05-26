CREATE TABLE "ContractActualWork" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "actualHours" DOUBLE PRECISION NOT NULL,
  "actualStartTime" TEXT,
  "actualEndTime" TEXT,
  "notes" TEXT,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractActualWork_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractActualWork_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MatchContract"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ContractActualWork_contractId_key" ON "ContractActualWork"("contractId");
CREATE INDEX "ContractActualWork_contractId_idx" ON "ContractActualWork"("contractId");

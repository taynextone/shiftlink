CREATE TABLE "WhatsAppEvent" (
  "id" TEXT NOT NULL,
  "matchContractId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "messageText" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsAppEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsAppEvent_matchContractId_createdAt_idx" ON "WhatsAppEvent"("matchContractId", "createdAt");
CREATE INDEX "WhatsAppEvent_eventType_idx" ON "WhatsAppEvent"("eventType");

ALTER TABLE "WhatsAppEvent"
ADD CONSTRAINT "WhatsAppEvent_matchContractId_fkey"
FOREIGN KEY ("matchContractId") REFERENCES "MatchContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

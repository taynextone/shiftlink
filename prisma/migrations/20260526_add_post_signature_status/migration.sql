ALTER TABLE "MatchContract" ADD COLUMN "activatedAt" TIMESTAMP(3);
ALTER TABLE "MatchContract" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "MatchContract" ADD COLUMN "canceledAt" TIMESTAMP(3);
ALTER TABLE "MatchContract" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "MatchContract" ADD COLUMN "noShowReportedAt" TIMESTAMP(3);
ALTER TABLE "MatchContract" ADD COLUMN "noShowDeadline" TIMESTAMP(3);
CREATE INDEX "MatchContract_status_idx" ON "MatchContract"("status");

-- Account-Verknüpfung mit MOS Core (siehe docs/MOS-INTEGRATION.md, Stufe 2)
ALTER TABLE "User" ADD COLUMN "mosUserId" INTEGER;
CREATE UNIQUE INDEX "User_mosUserId_key" ON "User"("mosUserId");

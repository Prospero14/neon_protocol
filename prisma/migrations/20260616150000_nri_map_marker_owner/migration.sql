-- AlterTable
ALTER TABLE "NriMapMarker" ADD COLUMN "ownerUserId" TEXT;

-- CreateIndex
CREATE INDEX "NriMapMarker_sessionId_ownerUserId_idx" ON "NriMapMarker"("sessionId", "ownerUserId");

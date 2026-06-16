-- Coop live match state (survives process restart)
CREATE TABLE "CoopLiveMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "memberIds" JSON NOT NULL,
    "roleByUserId" JSON NOT NULL,
    "shared" JSON NOT NULL,
    "events" JSON NOT NULL,
    "intentQueue" JSON NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "linkedObjectiveAwardedIds" JSON,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "CoopLiveMatch_partyId_key" ON "CoopLiveMatch"("partyId");
CREATE INDEX "CoopLiveMatch_status_idx" ON "CoopLiveMatch"("status");

-- CreateTable
CREATE TABLE "NriSessionVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "label" TEXT,
    "assignedUserId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriSessionVehicle_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriSessionVehicle_sessionId_idx" ON "NriSessionVehicle"("sessionId");

CREATE TABLE "NriIceScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "exfilPct" INTEGER NOT NULL DEFAULT 0,
    "tracePct" INTEGER NOT NULL DEFAULT 0,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriIceScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriIceScore_sessionId_score_idx" ON "NriIceScore"("sessionId", "score");

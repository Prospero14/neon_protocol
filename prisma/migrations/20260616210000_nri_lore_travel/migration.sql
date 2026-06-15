-- CreateTable
CREATE TABLE "NriLoreWorld" (
    "sessionId" TEXT NOT NULL PRIMARY KEY,
    "body" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriLoreWorld_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "NriFaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "color" TEXT,
    "memberPlayerIds" JSONB NOT NULL,
    "memberNpcIds" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriFaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriFaction_sessionId_idx" ON "NriFaction"("sessionId");

CREATE TABLE "NriLorePlace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "zoneKey" TEXT,
    "mapMarkerId" TEXT,
    "x" REAL,
    "y" REAL,
    "sourceScenarioNodeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriLorePlace_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriLorePlace_sessionId_idx" ON "NriLorePlace"("sessionId");

CREATE TABLE "NriScenarioProgress" (
    "sessionId" TEXT NOT NULL PRIMARY KEY,
    "currentScriptNodeId" TEXT,
    "completedNodeIds" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriScenarioProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "NriPlayerPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneKey" TEXT,
    "x" REAL,
    "y" REAL,
    "vehicleId" TEXT,
    "vehicleOverload" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriPlayerPosition_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NriPlayerPosition_sessionId_userId_key" ON "NriPlayerPosition"("sessionId", "userId");
CREATE INDEX "NriPlayerPosition_sessionId_zoneKey_idx" ON "NriPlayerPosition"("sessionId", "zoneKey");

CREATE TABLE "NriHostAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriHostAlert_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriHostAlert_sessionId_read_idx" ON "NriHostAlert"("sessionId", "read");

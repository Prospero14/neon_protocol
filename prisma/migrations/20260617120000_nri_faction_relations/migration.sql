-- CreateTable NriFactionRelationState
CREATE TABLE "NriFactionRelationState" (
    "sessionId" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "edges" JSON NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriFactionRelationState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "NriPlayer" ADD COLUMN "privateNotes" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "NriScenarioNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "links" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriScenarioNode_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NriScenarioNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NriScenarioNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriScenarioNode_sessionId_parentId_idx" ON "NriScenarioNode"("sessionId", "parentId");

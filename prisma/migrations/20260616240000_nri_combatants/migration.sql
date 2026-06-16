-- CreateTable
CREATE TABLE "NriCombatant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT,
    "archetypeId" TEXT,
    "threatTier" TEXT NOT NULL DEFAULT 'street',
    "imageUrl" TEXT,
    "inventory" JSON NOT NULL DEFAULT '[]',
    "sheet" JSON,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriCombatant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriCombatant_sessionId_idx" ON "NriCombatant"("sessionId");

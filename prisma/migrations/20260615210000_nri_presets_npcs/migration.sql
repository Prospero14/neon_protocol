-- AlterTable
ALTER TABLE "NriPlayer" ADD COLUMN "sheet" JSON;
ALTER TABLE "NriPlayer" ADD COLUMN "portraitUrl" TEXT;
ALTER TABLE "NriPlayer" ADD COLUMN "presetId" TEXT;

-- CreateTable
CREATE TABLE "NriPresetCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "inventory" JSON NOT NULL DEFAULT '[]',
    "sheet" JSON,
    "portraitUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "claimedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriPresetCharacter_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NriNpc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT,
    "imageUrl" TEXT,
    "inventory" JSON NOT NULL DEFAULT '[]',
    "sheet" JSON,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriNpc_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NriPresetCharacter_sessionId_claimedByUserId_idx" ON "NriPresetCharacter"("sessionId", "claimedByUserId");

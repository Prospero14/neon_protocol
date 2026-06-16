-- AlterTable
ALTER TABLE "NriVaultFile" ADD COLUMN "iceRewardCode" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NriFileUnlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "icePassedAt" DATETIME,
    "unlockedAt" DATETIME,
    CONSTRAINT "NriFileUnlock_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "NriVaultFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NriFileUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NriFileUnlock" ("id", "fileId", "userId", "unlockedAt") SELECT "id", "fileId", "userId", "unlockedAt" FROM "NriFileUnlock";
DROP TABLE "NriFileUnlock";
ALTER TABLE "new_NriFileUnlock" RENAME TO "NriFileUnlock";
CREATE UNIQUE INDEX "NriFileUnlock_fileId_userId_key" ON "NriFileUnlock"("fileId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

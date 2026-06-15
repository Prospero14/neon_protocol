-- AlterTable ChatMessage
ALTER TABLE "ChatMessage" ADD COLUMN "payload" TEXT;

-- CreateTable NriPlayer
CREATE TABLE "NriPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriPlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NriPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable NriVaultFile
CREATE TABLE "NriVaultFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "protected" BOOLEAN NOT NULL DEFAULT false,
    "gameId" TEXT,
    "difficulty" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriVaultFile_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NriVaultFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable NriFileUnlock
CREATE TABLE "NriFileUnlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriFileUnlock_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "NriVaultFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NriFileUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable ChatRoomMeta
CREATE TABLE "ChatRoomMeta" (
    "roomId" TEXT NOT NULL PRIMARY KEY,
    "spamBotEnabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ChatRoomMeta_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NriPlayer_sessionId_userId_key" ON "NriPlayer"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NriFileUnlock_fileId_userId_key" ON "NriFileUnlock"("fileId", "userId");

-- CreateTable NriLoreEntry (карточки раздела «Мир»)
CREATE TABLE "NriLoreEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriLoreEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriLoreEntry_sessionId_sortOrder_idx" ON "NriLoreEntry"("sessionId", "sortOrder");

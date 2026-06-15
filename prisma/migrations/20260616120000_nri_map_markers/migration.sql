-- CreateTable
CREATE TABLE "NriMapMarker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "blurb" TEXT,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'pin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NriMapMarker_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NriMapMarker_sessionId_idx" ON "NriMapMarker"("sessionId");

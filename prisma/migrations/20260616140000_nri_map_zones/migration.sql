-- CreateTable
CREATE TABLE "NriMapZone" (
    "zoneKey" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "zoneType" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "w" REAL NOT NULL,
    "h" REAL NOT NULL,
    "corpName" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "pois" TEXT,
    "updatedAt" DATETIME NOT NULL
);

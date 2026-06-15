-- NriCyberProduct: конструктор / лавка киберимплантов

CREATE TABLE "NriCyberProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "blueprint" JSONB NOT NULL,
    "build" JSONB NOT NULL,
    "priceWonlongs" INTEGER NOT NULL DEFAULT 0,
    "inShop" BOOLEAN NOT NULL DEFAULT false,
    "vendorNpcId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NriCyberProduct_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NriCyberProduct_sessionId_inShop_idx" ON "NriCyberProduct"("sessionId", "inShop");

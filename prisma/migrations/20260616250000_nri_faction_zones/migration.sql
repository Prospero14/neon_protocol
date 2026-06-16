-- AlterTable
ALTER TABLE "NriFaction" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'faction';
ALTER TABLE "NriFaction" ADD COLUMN "zoneKeys" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "NriLorePlace" ADD COLUMN "sourceFactionId" TEXT;

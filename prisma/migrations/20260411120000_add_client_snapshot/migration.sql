-- SQLite: JSON хранится как TEXT
ALTER TABLE "GameState" ADD COLUMN "clientSnapshot" TEXT;

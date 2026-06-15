-- Preset visibility: host drafts vs player pick list
ALTER TABLE "NriPresetCharacter" ADD COLUMN "publishedToPlayers" BOOLEAN NOT NULL DEFAULT false;

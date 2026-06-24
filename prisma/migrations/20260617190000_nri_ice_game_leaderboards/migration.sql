-- Рейтинг ICE: отдельная таблица на каждую мини-игру
ALTER TABLE "NriIceScore" ADD COLUMN "gameId" TEXT NOT NULL DEFAULT 'gibson_ice';
ALTER TABLE "NriIceScore" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'medium';
CREATE INDEX "NriIceScore_sessionId_gameId_score_idx" ON "NriIceScore"("sessionId", "gameId", "score");

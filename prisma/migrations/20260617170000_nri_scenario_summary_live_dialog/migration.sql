-- Краткая сводка квеста для [[ссылок]] + живой диалог НПС в чате
ALTER TABLE "NriScenarioNode" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';
ALTER TABLE "NriSession" ADD COLUMN "liveDialogEnabled" BOOLEAN NOT NULL DEFAULT false;

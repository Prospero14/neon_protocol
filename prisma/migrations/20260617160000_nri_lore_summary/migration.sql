-- Краткая сводка для поп-апов в чате; body/description — полный лор для мастера.
ALTER TABLE "NriLorePlace" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';
ALTER TABLE "NriFaction" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';
ALTER TABLE "NriLoreEntry" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';

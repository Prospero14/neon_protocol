-- Иконки районов + метки сущностей на карточках мест
ALTER TABLE "NriMapZone" ADD COLUMN "iconId" TEXT;
ALTER TABLE "NriLorePlace" ADD COLUMN "entityTag" TEXT;
ALTER TABLE "NriLorePlace" ADD COLUMN "iconId" TEXT;

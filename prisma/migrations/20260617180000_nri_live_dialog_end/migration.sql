-- Сигнал мастера «завершить живой диалог» для игроков
ALTER TABLE "NriSession" ADD COLUMN "liveDialogEndedAt" DATETIME;

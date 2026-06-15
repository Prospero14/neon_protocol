-- AlterTable NriSession: пауза SPAM после оплаты антиспама
ALTER TABLE "NriSession" ADD COLUMN "spamPausedUntil" DATETIME;

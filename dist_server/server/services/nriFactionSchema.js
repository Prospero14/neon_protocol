/** Runtime-гарантия колонок NriFaction / карты / лора (старые SQLite без migrate). */
import { ensureNriLoreEntryTable } from './nriLoreSchema.js';
function isMissingSqliteColumn(error) {
    const msg = String(error?.message ?? error ?? '');
    return /no such column|does not exist in the current database|Unknown column/i.test(msg);
}
async function addSqliteColumn(prisma, sql) {
    try {
        await prisma.$executeRawUnsafe(sql);
    }
    catch {
        /* column already exists */
    }
}
/** Идемпотентно добавляет все колонки, которые Prisma ожидает после последних миграций. */
async function ensureNriLoreDbColumnsRaw(prisma) {
    await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "megaDistrict" TEXT;`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "color" TEXT;`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "iconId" TEXT;`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriFaction" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'faction';`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriFaction" ADD COLUMN "zoneKeys" TEXT NOT NULL DEFAULT '[]';`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriFaction" ADD COLUMN "iconId" TEXT;`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriFaction" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriLorePlace" ADD COLUMN "entityTag" TEXT;`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriLorePlace" ADD COLUMN "iconId" TEXT;`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriLorePlace" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';`);
}
export async function ensureNriFactionSchema(prisma) {
    try {
        await prisma.nriFaction.findFirst({
            select: { id: true, kind: true, zoneKeys: true, iconId: true, summary: true },
        });
    }
    catch (error) {
        if (!isMissingSqliteColumn(error))
            throw error;
        await ensureNriLoreDbColumnsRaw(prisma);
    }
}
export async function ensureNriMapZoneIconColumn(prisma) {
    try {
        await prisma.nriMapZone.findFirst({ select: { zoneKey: true, iconId: true } });
    }
    catch (error) {
        if (!isMissingSqliteColumn(error))
            throw error;
        await ensureNriLoreDbColumnsRaw(prisma);
    }
}
export async function ensureNriLorePlaceExtras(prisma) {
    try {
        await prisma.nriLorePlace.findFirst({
            select: { id: true, entityTag: true, iconId: true, summary: true },
        });
    }
    catch (error) {
        if (!isMissingSqliteColumn(error))
            throw error;
        await ensureNriLoreDbColumnsRaw(prisma);
    }
}
/** Все runtime-колонки лора/карты — вызывать до Prisma-запросов на старых SQLite без migrate. */
export async function ensureAllNriLoreDbColumns(prisma) {
    await ensureNriLoreDbColumnsRaw(prisma);
    await ensureNriLoreEntryTable(prisma);
    await ensureNriMapZoneIconColumn(prisma);
    await ensureNriFactionSchema(prisma);
    await ensureNriLorePlaceExtras(prisma);
}
//# sourceMappingURL=nriFactionSchema.js.map
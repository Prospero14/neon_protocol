/** CREATE TABLE IF NOT EXISTS + колонки для старых SQLite на Amvera без migrate. */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ensureNriLoreEntryTable } from './nriLoreSchema.js';
async function addSqliteColumn(prisma, sql) {
    try {
        await prisma.$executeRawUnsafe(sql);
    }
    catch {
        /* already exists */
    }
}
export async function ensureNriMapZoneTable(prisma) {
    await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NriMapZone" (
      "zoneKey" TEXT NOT NULL PRIMARY KEY,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "name" TEXT NOT NULL,
      "zoneType" TEXT NOT NULL,
      "x" REAL NOT NULL,
      "y" REAL NOT NULL,
      "w" REAL NOT NULL,
      "h" REAL NOT NULL,
      "corpName" TEXT,
      "megaDistrict" TEXT,
      "color" TEXT,
      "iconId" TEXT,
      "locked" BOOLEAN NOT NULL DEFAULT 0,
      "pois" TEXT,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
export async function ensureNriFactionTable(prisma) {
    await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NriFaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      "kind" TEXT NOT NULL DEFAULT 'faction',
      "name" TEXT NOT NULL,
      "summary" TEXT NOT NULL DEFAULT '',
      "description" TEXT NOT NULL DEFAULT '',
      "color" TEXT,
      "iconId" TEXT,
      "zoneKeys" TEXT NOT NULL DEFAULT '[]',
      "memberPlayerIds" TEXT NOT NULL DEFAULT '[]',
      "memberNpcIds" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
    await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "NriFaction_sessionId_idx" ON "NriFaction"("sessionId");
  `);
}
export async function ensureNriLorePlaceTable(prisma) {
    await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NriLorePlace" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "summary" TEXT NOT NULL DEFAULT '',
      "body" TEXT NOT NULL DEFAULT '',
      "zoneKey" TEXT,
      "mapMarkerId" TEXT,
      "x" REAL,
      "y" REAL,
      "sourceScenarioNodeId" TEXT,
      "sourceFactionId" TEXT,
      "entityTag" TEXT,
      "iconId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
    await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "NriLorePlace_sessionId_idx" ON "NriLorePlace"("sessionId");
  `);
}
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
    await addSqliteColumn(prisma, `ALTER TABLE "NriLorePlace" ADD COLUMN "sourceFactionId" TEXT;`);
}
/** Минимум для GET /map/zones — не трогает лор-таблицы. */
export async function ensureNriMapSchema(prisma) {
    await ensureNriMapZoneTable(prisma);
    await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "megaDistrict" TEXT;`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "color" TEXT;`);
    await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "iconId" TEXT;`);
}
/** Полный bootstrap лора + карты (не бросает — логирует сбой шага). */
export async function ensureAllNriLoreDbColumns(prisma) {
    const steps = [
        { name: 'NriMapZone table', run: () => ensureNriMapZoneTable(prisma) },
        { name: 'NriFaction table', run: () => ensureNriFactionTable(prisma) },
        { name: 'NriLorePlace table', run: () => ensureNriLorePlaceTable(prisma) },
        { name: 'NriLoreEntry table', run: () => ensureNriLoreEntryTable(prisma) },
        { name: 'lore columns', run: () => ensureNriLoreDbColumnsRaw(prisma) },
    ];
    for (const step of steps) {
        try {
            await step.run();
        }
        catch (error) {
            console.warn(`[nriSchemaBootstrap] ${step.name}:`, error);
        }
    }
}
/** Читает seed районов — несколько путей для Amvera / dist_server / dev. */
export function loadZoneSeedFile() {
    const here = dirname(fileURLToPath(import.meta.url));
    const paths = [
        join(here, '../../shared/nri-night-city-zones.json'),
        join(here, '../../../shared/nri-night-city-zones.json'),
        join(process.cwd(), 'dist_server/shared/nri-night-city-zones.json'),
        join(process.cwd(), 'shared/nri-night-city-zones.json'),
    ];
    for (const p of paths) {
        if (!existsSync(p))
            continue;
        try {
            return JSON.parse(readFileSync(p, 'utf8'));
        }
        catch (e) {
            console.warn('[nriMapZones] bad zone seed file:', p, e);
        }
    }
    throw new Error(`Zone seed not found (tried: ${paths.join(' | ')})`);
}
export function apiErrorHint(error) {
    const msg = String(error?.message ?? error ?? '').trim();
    return msg.slice(0, 240);
}
//# sourceMappingURL=nriSchemaBootstrap.js.map
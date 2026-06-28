/** CREATE TABLE IF NOT EXISTS + колонки для старых SQLite на Amvera без migrate. */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { PrismaClient } from '@prisma/client';
import { ensureNriLoreEntryTable } from './nriLoreSchema.js';

async function addSqliteColumn(prisma: PrismaClient, sql: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch {
    /* already exists */
  }
}

export async function ensureNriMapZoneTable(prisma: PrismaClient): Promise<void> {
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

export async function ensureNriFactionTable(prisma: PrismaClient): Promise<void> {
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

export async function ensureNriLorePlaceTable(prisma: PrismaClient): Promise<void> {
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

async function ensureNriLoreDbColumnsRaw(prisma: PrismaClient): Promise<void> {
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
  await addSqliteColumn(prisma, `ALTER TABLE "NriScenarioNode" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriSession" ADD COLUMN "liveDialogEnabled" BOOLEAN NOT NULL DEFAULT 0;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriSession" ADD COLUMN "liveDialogEndedAt" DATETIME;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriIceScore" ADD COLUMN "gameId" TEXT NOT NULL DEFAULT 'gibson_ice';`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriIceScore" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'medium';`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriPlayer" ADD COLUMN "achievementState" JSON;`);
}

/** Починка NULL/пустых JSON-полей — иначе Prisma findMany падает на старых строках. */
export async function repairNriFactionJsonColumns(prisma: PrismaClient): Promise<void> {
  const fixes = [
    `UPDATE "NriFaction" SET "memberPlayerIds" = '[]' WHERE "memberPlayerIds" IS NULL OR TRIM("memberPlayerIds") = '';`,
    `UPDATE "NriFaction" SET "memberNpcIds" = '[]' WHERE "memberNpcIds" IS NULL OR TRIM("memberNpcIds") = '';`,
    `UPDATE "NriFaction" SET "zoneKeys" = '[]' WHERE "zoneKeys" IS NULL OR TRIM("zoneKeys") = '';`,
    `UPDATE "NriFaction" SET "kind" = 'faction' WHERE "kind" IS NULL OR TRIM("kind") = '';`,
    `UPDATE "NriFaction" SET "summary" = '' WHERE "summary" IS NULL;`,
    `UPDATE "NriFaction" SET "description" = '' WHERE "description" IS NULL;`,
  ];
  for (const sql of fixes) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      /* column may not exist yet */
    }
  }
}

/** Минимум для GET /map/zones — не трогает лор-таблицы. */
export async function ensureNriMapSchema(prisma: PrismaClient): Promise<void> {
  await ensureNriMapZoneTable(prisma);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "megaDistrict" TEXT;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "color" TEXT;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "iconId" TEXT;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "parentZoneKey" TEXT;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "placeType" TEXT;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "districtStyle" TEXT;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "gridRow" INTEGER;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "gridCol" INTEGER;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "populationBand" TEXT;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "densityLabel" TEXT;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "trafficLevel" INTEGER;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "nightlifeLevel" INTEGER;`);
  await addSqliteColumn(prisma, `ALTER TABLE "NriMapZone" ADD COLUMN "linksTo" TEXT;`);
}

/** Полный bootstrap лора + карты (не бросает — логирует сбой шага). */
export async function ensureAllNriLoreDbColumns(prisma: PrismaClient): Promise<void> {
  const steps: Array<{ name: string; run: () => Promise<void> }> = [
    { name: 'NriMapZone table', run: () => ensureNriMapZoneTable(prisma) },
    { name: 'NriFaction table', run: () => ensureNriFactionTable(prisma) },
    { name: 'NriLorePlace table', run: () => ensureNriLorePlaceTable(prisma) },
    { name: 'NriLoreEntry table', run: () => ensureNriLoreEntryTable(prisma) },
    { name: 'lore columns', run: () => ensureNriLoreDbColumnsRaw(prisma) },
    { name: 'faction json repair', run: () => repairNriFactionJsonColumns(prisma) },
  ];
  for (const step of steps) {
    try {
      await step.run();
    } catch (error) {
      console.warn(`[nriSchemaBootstrap] ${step.name}:`, error);
    }
  }
}

export type ZoneSeed = {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  megaDistrict?: string;
  corpName?: string;
  locked?: boolean;
  pois?: string[];
  parentZoneKey?: string;
  placeType?: string;
  districtStyle?: string;
  gridRow?: number;
  gridCol?: number;
  populationBand?: string;
  densityLabel?: string;
  trafficLevel?: number;
  nightlifeLevel?: number;
  linksTo?: unknown;
};

/** Читает seed районов — каталог по мегарайонам или monolith fallback. */
function readZoneSeedJson(filePath: string): ZoneSeed[] {
  return JSON.parse(readFileSync(filePath, 'utf8')) as ZoneSeed[];
}

function loadZoneSeedDir(dirPath: string): ZoneSeed[] | null {
  if (!existsSync(dirPath)) return null;
  try {
    if (!statSync(dirPath).isDirectory()) return null;
  } catch {
    return null;
  }
  const files = readdirSync(dirPath)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (files.length === 0) return null;
  const merged: ZoneSeed[] = [];
  for (const f of files) {
    merged.push(...readZoneSeedJson(join(dirPath, f)));
  }
  merged.sort((a, b) => a.sortOrder - b.sortOrder);
  return merged;
}

export function loadZoneSeedFile(): ZoneSeed[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const dirPaths = [
    join(here, '../../shared/nri-neon-city-zones'),
    join(here, '../../../shared/nri-neon-city-zones'),
    join(process.cwd(), 'dist_server/shared/nri-neon-city-zones'),
    join(process.cwd(), 'shared/nri-neon-city-zones'),
  ];
  for (const dir of dirPaths) {
    const fromDir = loadZoneSeedDir(dir);
    if (fromDir?.length) return fromDir;
  }
  const paths = [
    join(here, '../../shared/nri-neon-city-zones.json'),
    join(here, '../../../shared/nri-neon-city-zones.json'),
    join(process.cwd(), 'dist_server/shared/nri-neon-city-zones.json'),
    join(process.cwd(), 'shared/nri-neon-city-zones.json'),
    join(here, '../../shared/nri-night-city-zones.json'),
    join(here, '../../../shared/nri-night-city-zones.json'),
    join(process.cwd(), 'dist_server/shared/nri-night-city-zones.json'),
    join(process.cwd(), 'shared/nri-night-city-zones.json'),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      return readZoneSeedJson(p);
    } catch (e) {
      console.warn('[nriMapZones] bad zone seed file:', p, e);
    }
  }
  throw new Error(`Zone seed not found (tried dirs: ${dirPaths.join(' | ')})`);
}

export function apiErrorHint(error: unknown): string {
  const msg = String((error as { message?: string })?.message ?? error ?? '').trim();
  return msg.slice(0, 240);
}

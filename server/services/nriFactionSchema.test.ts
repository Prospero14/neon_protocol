import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ensureAllNriLoreDbColumns } from './nriFactionSchema.js';
import { listMapZones } from './nriMapZones.js';

describe('ensureAllNriLoreDbColumns', () => {
  let dir: string;
  let prisma: PrismaClient;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'neon-map-'));
    const dbPath = join(dir, 'test.db');
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "NriMapZone" (
        "zoneKey" TEXT NOT NULL PRIMARY KEY,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "name" TEXT NOT NULL,
        "zoneType" TEXT NOT NULL,
        "x" REAL NOT NULL,
        "y" REAL NOT NULL,
        "w" REAL NOT NULL,
        "h" REAL NOT NULL,
        "corpName" TEXT,
        "locked" BOOLEAN NOT NULL DEFAULT 0,
        "pois" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "NriFaction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "color" TEXT,
        "memberPlayerIds" TEXT NOT NULL,
        "memberNpcIds" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "kind" TEXT NOT NULL DEFAULT 'corp',
        "zoneKeys" TEXT NOT NULL DEFAULT '[]',
        "iconId" TEXT
      );
    `);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  });

  it('adds missing summary on NriFaction without throwing (Prisma-style column error)', async () => {
    await expect(
      prisma.nriFaction.findFirst({ select: { id: true, summary: true } })
    ).rejects.toThrow(/does not exist|no such column/i);

    await ensureAllNriLoreDbColumns(prisma);

    const row = await prisma.nriFaction.findFirst({ select: { id: true, summary: true } });
    expect(row).toBeNull();
  });

  it('allows listMapZones after adding iconId column', async () => {
    await ensureAllNriLoreDbColumns(prisma);
    const zones = await listMapZones(prisma);
    expect(zones.length).toBeGreaterThan(0);
  });
});

/** Runtime-гарантия колонок NriFaction (старые SQLite без migrate). */

import type { PrismaClient } from '@prisma/client';

function isMissingFactionColumn(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message ?? error ?? '');
  return /NriFaction|no such column|kind|zoneKeys/i.test(msg);
}

export async function ensureNriFactionSchema(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.nriFaction.findFirst({
      select: { id: true, kind: true, zoneKeys: true, iconId: true, summary: true },
    });
    return;
  } catch (error) {
    if (!isMissingFactionColumn(error)) throw error;
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "NriFaction" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'faction';`);
  } catch {
    /* already exists */
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "NriFaction" ADD COLUMN "zoneKeys" TEXT NOT NULL DEFAULT '[]';`);
  } catch {
    /* already exists */
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "NriFaction" ADD COLUMN "iconId" TEXT;`);
  } catch {
    /* already exists */
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "NriFaction" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';`);
  } catch {
    /* already exists */
  }
}

export async function ensureNriMapZoneIconColumn(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.nriMapZone.findFirst({ select: { zoneKey: true, iconId: true } });
  } catch (error) {
    const msg = String((error as { message?: string })?.message ?? error ?? '');
    if (!/iconId|no such column/i.test(msg)) throw error;
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "NriMapZone" ADD COLUMN "iconId" TEXT;`);
    } catch {
      /* already exists */
    }
  }
}

export async function ensureNriLorePlaceExtras(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.nriLorePlace.findFirst({
      select: { id: true, entityTag: true, iconId: true, summary: true },
    });
  } catch (error) {
    const msg = String((error as { message?: string })?.message ?? error ?? '');
    if (!/entityTag|iconId|summary|no such column/i.test(msg)) throw error;
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "NriLorePlace" ADD COLUMN "entityTag" TEXT;`);
    } catch {
      /* already exists */
    }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "NriLorePlace" ADD COLUMN "iconId" TEXT;`);
    } catch {
      /* already exists */
    }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "NriLorePlace" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';`);
    } catch {
      /* already exists */
    }
  }
}

/** Все runtime-колонки лора/карты — вызывать до Prisma-запросов на старых SQLite без migrate. */
export async function ensureAllNriLoreDbColumns(prisma: PrismaClient): Promise<void> {
  await ensureNriMapZoneIconColumn(prisma);
  await ensureNriFactionSchema(prisma);
  await ensureNriLorePlaceExtras(prisma);
  const { ensureNriLoreEntryTable } = await import('./nriLoreSchema.js');
  await ensureNriLoreEntryTable(prisma);
}

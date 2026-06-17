/** Runtime-гарантия таблицы NriLoreEntry (старые SQLite на Amvera без migrate). */

import type { PrismaClient } from '@prisma/client';

function isMissingLoreEntryTable(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message ?? error ?? '');
  return /NriLoreEntry|no such table/i.test(msg);
}

export async function ensureNriLoreEntryTable(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.nriLoreEntry.findFirst({ select: { id: true, summary: true }, take: 1 });
    return;
  } catch (error) {
    if (!isMissingLoreEntryTable(error)) {
      const msg = String((error as { message?: string })?.message ?? error ?? '');
      if (/summary|no such column/i.test(msg)) {
        try {
          await prisma.$executeRawUnsafe(
            `ALTER TABLE "NriLoreEntry" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';`
          );
        } catch {
          /* already exists */
        }
        return;
      }
      throw error;
    }
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NriLoreEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "summary" TEXT NOT NULL DEFAULT '',
      "body" TEXT NOT NULL DEFAULT '',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "NriLoreEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NriSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "NriLoreEntry_sessionId_sortOrder_idx"
    ON "NriLoreEntry"("sessionId", "sortOrder");
  `);
}

export async function listLoreEntries(
  prisma: PrismaClient,
  sessionId: string
): Promise<
  Array<{
    id: string;
    title: string;
    summary: string;
    body: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  await ensureNriLoreEntryTable(prisma);
  return prisma.nriLoreEntry.findMany({
    where: { sessionId },
    orderBy: { sortOrder: 'asc' },
  });
}

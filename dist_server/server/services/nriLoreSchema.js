/** Runtime-гарантия таблицы NriLoreEntry (старые SQLite на Amvera без migrate). */
function isMissingLoreEntryTable(error) {
    const msg = String(error?.message ?? error ?? '');
    return /NriLoreEntry|no such table/i.test(msg);
}
export async function ensureNriLoreEntryTable(prisma) {
    try {
        await prisma.nriLoreEntry.findFirst({ select: { id: true }, take: 1 });
        return;
    }
    catch (error) {
        if (!isMissingLoreEntryTable(error))
            throw error;
    }
    await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NriLoreEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
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
export async function listLoreEntries(prisma, sessionId) {
    await ensureNriLoreEntryTable(prisma);
    return prisma.nriLoreEntry.findMany({
        where: { sessionId },
        orderBy: { sortOrder: 'asc' },
    });
}
//# sourceMappingURL=nriLoreSchema.js.map
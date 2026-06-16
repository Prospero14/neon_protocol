/** Сериализация GameState для клиента и совместимость со старыми схемами SQLite. */
/** Склеивает строку GameState из БД с clientSnapshot (расширенный прогресс клиента). */
export function publicGameState(gs) {
    if (!gs)
        return null;
    const snap = gs.clientSnapshot;
    const fromSnap = typeof snap === 'object' && snap !== null && !Array.isArray(snap) ? { ...snap } : {};
    const { clientSnapshot: _drop, ...row } = gs;
    return {
        ...fromSnap,
        ...row,
        stress: gs.stress,
        maxStress: gs.maxStress,
        bits: gs.bits,
        ramPool: gs.ramPool,
        xp: gs.xp,
        level: gs.level,
        activeDeck: gs.activeDeck,
        inventory: gs.inventory,
        artifacts: gs.artifacts,
        completedQuests: gs.completedQuests,
        reputation: gs.reputation ?? fromSnap.reputation,
        intel: gs.intel ?? fromSnap.intel,
    };
}
/** SQLite: `no such column`. Prisma 7 + driver adapter: `P2022`, «does not exist», `ColumnNotFound`. */
export function hasMissingColumn(error, columnName) {
    const err = error;
    const msg = String(err.message ?? error ?? '');
    const metaCol = String(err.meta?.column_name ?? '');
    const haystack = `${msg}\n${metaCol}`;
    const sqlite = msg.includes('no such column');
    const prismaMissing = err.code === 'P2022' || msg.includes('does not exist') || msg.includes('ColumnNotFound');
    if (!sqlite && !prismaMissing)
        return false;
    if (!columnName)
        return true;
    return haystack.includes(columnName);
}
//# sourceMappingURL=gameStatePublic.js.map
/** Матрица отношений фракций стола (мастер настраивает). */
export const FACTION_STANCES = [
    { id: 'allied', label: 'Союз' },
    { id: 'neutral', label: 'Нейтрал' },
    { id: 'wary', label: 'Недоверие' },
    { id: 'hostile', label: 'Вражда' },
];
export function relationKey(a, b) {
    return [a, b].sort().join('::');
}
export function parseFactionRelationMatrix(raw) {
    if (!raw || typeof raw !== 'object') {
        return { enabled: false, edges: {} };
    }
    const o = raw;
    const edges = {};
    if (o.edges && typeof o.edges === 'object') {
        for (const [k, v] of Object.entries(o.edges)) {
            if (v === 'allied' || v === 'neutral' || v === 'wary' || v === 'hostile') {
                edges[k] = v;
            }
        }
    }
    return {
        enabled: o.enabled === true,
        edges,
        updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : undefined,
    };
}
export function isFactionRelationsActive(matrix) {
    if (!matrix?.enabled)
        return false;
    return Object.values(matrix.edges).some((s) => s !== 'neutral');
}
export function getFactionRelation(matrix, fromId, toId) {
    if (!fromId || !toId || fromId === toId)
        return 'neutral';
    if (!matrix)
        return 'neutral';
    return matrix.edges[relationKey(fromId, toId)] ?? 'neutral';
}
export function stanceLabel(stance) {
    return FACTION_STANCES.find((s) => s.id === stance)?.label ?? stance;
}
//# sourceMappingURL=factionRelations.js.map
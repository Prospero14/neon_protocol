export const NRI_FACTION_KINDS = [
    { id: 'faction', label: 'Фракция' },
    { id: 'corp', label: 'Корпорация' },
    { id: 'gang', label: 'Банда' },
    { id: 'clan', label: 'Клан' },
    { id: 'cult', label: 'Культ' },
    { id: 'nomads', label: 'Номады' },
    { id: 'gov', label: 'Власть' },
];
const KIND_IDS = new Set(NRI_FACTION_KINDS.map((k) => k.id));
export function normalizeFactionKind(kind) {
    if (typeof kind === 'string' && KIND_IDS.has(kind)) {
        return kind;
    }
    return 'faction';
}
export function factionKindLabel(kind) {
    return NRI_FACTION_KINDS.find((k) => k.id === kind)?.label ?? 'Фракция';
}
export function formatFactionTitle(kind, name) {
    const trimmed = name.trim() || 'Без названия';
    return `[${factionKindLabel(kind)}] ${trimmed}`;
}
export function parseZoneKeys(raw) {
    if (!Array.isArray(raw))
        return [];
    return [...new Set(raw.filter((x) => typeof x === 'string' && x.trim().length > 0))];
}
//# sourceMappingURL=nriFactionKinds.js.map
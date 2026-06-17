/** Универсальные метки сущностей: фракции, места, предметы, файлы. */
export const NRI_ENTITY_TAGS = [
    { id: 'corp', label: 'Корпорация' },
    { id: 'gang', label: 'Банда' },
    { id: 'free', label: 'Свободный' },
    { id: 'gov', label: 'Правительство' },
    { id: 'dealers', label: 'Торчки' },
    { id: 'fixers', label: 'Фиксеры' },
    { id: 'netrunners', label: 'Нетраннеры' },
    { id: 'pmc', label: 'ЧВК' },
    { id: 'peaceful', label: 'Мирные' },
    { id: 'unknown', label: 'Неизвестно' },
];
const TAG_IDS = new Set(NRI_ENTITY_TAGS.map((t) => t.id));
/** Старые kind фракций → новые метки. */
const LEGACY_KIND_MAP = {
    faction: 'unknown',
    clan: 'gang',
    cult: 'unknown',
    nomads: 'free',
};
export function normalizeEntityTag(tag) {
    if (typeof tag === 'string') {
        if (TAG_IDS.has(tag))
            return tag;
        if (tag in LEGACY_KIND_MAP)
            return LEGACY_KIND_MAP[tag];
    }
    return 'unknown';
}
export function entityTagLabel(tag) {
    return NRI_ENTITY_TAGS.find((t) => t.id === tag)?.label ?? 'Неизвестно';
}
export function formatEntityTaggedTitle(tag, name) {
    const trimmed = name.trim() || 'Без названия';
    return `[${entityTagLabel(tag)}] ${trimmed}`;
}
//# sourceMappingURL=entityTags.js.map
export { NRI_ENTITY_TAGS as NRI_FACTION_KINDS, normalizeEntityTag as normalizeFactionKind, entityTagLabel as factionKindLabel, formatEntityTaggedTitle as formatFactionTitle, } from '../../shared/nri-domain/entityTags.js';
export function parseZoneKeys(raw) {
    if (!Array.isArray(raw))
        return [];
    return [...new Set(raw.filter((x) => typeof x === 'string' && x.trim().length > 0))];
}
//# sourceMappingURL=nriFactionKinds.js.map
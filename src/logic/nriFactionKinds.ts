export {
  NRI_ENTITY_TAGS as NRI_FACTION_KINDS,
  type NriEntityTagId as NriFactionKind,
  entityTagLabel as factionKindLabel,
  formatEntityTaggedTitle as formatFactionTitle,
} from '../../shared/nri-domain/entityTags';

export function parseZoneKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0))];
}

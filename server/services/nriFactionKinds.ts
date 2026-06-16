export const NRI_FACTION_KINDS = [
  { id: 'faction', label: 'Фракция' },
  { id: 'corp', label: 'Корпорация' },
  { id: 'gang', label: 'Банда' },
  { id: 'clan', label: 'Клан' },
  { id: 'cult', label: 'Культ' },
  { id: 'nomads', label: 'Номады' },
  { id: 'gov', label: 'Власть' },
] as const;

const KIND_IDS = new Set(NRI_FACTION_KINDS.map((k) => k.id));

export function normalizeFactionKind(kind: unknown): string {
  if (typeof kind === 'string' && KIND_IDS.has(kind as (typeof NRI_FACTION_KINDS)[number]['id'])) {
    return kind;
  }
  return 'faction';
}

export function factionKindLabel(kind: string | undefined | null): string {
  return NRI_FACTION_KINDS.find((k) => k.id === kind)?.label ?? 'Фракция';
}

export function formatFactionTitle(kind: string | undefined | null, name: string): string {
  const trimmed = name.trim() || 'Без названия';
  return `[${factionKindLabel(kind)}] ${trimmed}`;
}

export function parseZoneKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0))];
}

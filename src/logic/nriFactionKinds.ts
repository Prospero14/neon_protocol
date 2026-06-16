export const NRI_FACTION_KINDS = [
  { id: 'faction', label: 'Фракция' },
  { id: 'corp', label: 'Корпорация' },
  { id: 'gang', label: 'Банда' },
  { id: 'clan', label: 'Клан' },
  { id: 'cult', label: 'Культ' },
  { id: 'nomads', label: 'Номады' },
  { id: 'gov', label: 'Власть' },
] as const;

export type NriFactionKind = (typeof NRI_FACTION_KINDS)[number]['id'];

export function factionKindLabel(kind: string | undefined | null): string {
  return NRI_FACTION_KINDS.find((k) => k.id === kind)?.label ?? 'Фракция';
}

export function formatFactionTitle(kind: string | undefined | null, name: string): string {
  const trimmed = name.trim() || 'Без названия';
  return `[${factionKindLabel(kind)}] ${trimmed}`;
}

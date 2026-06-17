/** Матрица отношений фракций стола (мастер настраивает). */

export type FactionStance = 'allied' | 'neutral' | 'wary' | 'hostile';

export type FactionRelationMatrix = {
  enabled: boolean;
  edges: Record<string, FactionStance>;
  updatedAt?: number;
};

export const FACTION_STANCES: { id: FactionStance; label: string }[] = [
  { id: 'allied', label: 'Союз' },
  { id: 'neutral', label: 'Нейтрал' },
  { id: 'wary', label: 'Недоверие' },
  { id: 'hostile', label: 'Вражда' },
];

export function relationKey(a: string, b: string): string {
  return [a, b].sort().join('::');
}

export function parseFactionRelationMatrix(raw: unknown): FactionRelationMatrix {
  if (!raw || typeof raw !== 'object') {
    return { enabled: false, edges: {} };
  }
  const o = raw as Record<string, unknown>;
  const edges: Record<string, FactionStance> = {};
  if (o.edges && typeof o.edges === 'object') {
    for (const [k, v] of Object.entries(o.edges as Record<string, unknown>)) {
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

export function isFactionRelationsActive(matrix: FactionRelationMatrix | null | undefined): boolean {
  if (!matrix?.enabled) return false;
  return Object.values(matrix.edges).some((s) => s !== 'neutral');
}

export function getFactionRelation(
  matrix: FactionRelationMatrix | null | undefined,
  fromId: string | null | undefined,
  toId: string | null | undefined
): FactionStance {
  if (!fromId || !toId || fromId === toId) return 'neutral';
  if (!matrix) return 'neutral';
  return matrix.edges[relationKey(fromId, toId)] ?? 'neutral';
}

export function stanceLabel(stance: FactionStance): string {
  return FACTION_STANCES.find((s) => s.id === stance)?.label ?? stance;
}

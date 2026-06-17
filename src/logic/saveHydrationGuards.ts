/** Безопасное чтение полей из gameState / localStorage (битые sync-снимки). */

import type { QuestState } from './questEngine';

const QUEST_STATUSES = new Set(['available', 'active', 'ready_to_turn_in', 'completed', 'failed']);

export function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

export function asFiniteNumber(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
}

export function asNumberRecord(raw: unknown, fallback: Record<string, number>): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...fallback };
  const out = { ...fallback };
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

export function asQuestStates(raw: unknown): QuestState[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
    .map((x) => {
      const o = x as { questId?: unknown; status?: unknown; tracked?: unknown };
      const questId = typeof o.questId === 'string' ? o.questId : '';
      const status =
        typeof o.status === 'string' && QUEST_STATUSES.has(o.status)
          ? (o.status as QuestState['status'])
          : 'available';
      return {
        questId,
        status,
        tracked: o.tracked === true,
      };
    })
    .filter((q) => q.questId.length > 0);
}

export function asImplantList(raw: unknown): Array<{ id: string; battlesLeft: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
    .map((x) => {
      const o = x as { id?: unknown; battlesLeft?: unknown };
      return {
        id: typeof o.id === 'string' ? o.id : '',
        battlesLeft: typeof o.battlesLeft === 'number' && o.battlesLeft >= 0 ? o.battlesLeft : 0,
      };
    })
    .filter((x) => x.id.length > 0);
}

export function parseSolvedChainsStorage(raw: unknown): Array<{ taskId: string; name: string; chain: string[] }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
    .map((x) => {
      const o = x as { taskId?: unknown; name?: unknown; chain?: unknown };
      return {
        taskId: typeof o.taskId === 'string' ? o.taskId : '',
        name: typeof o.name === 'string' ? o.name : '',
        chain: asStringArray(o.chain),
      };
    })
    .filter((x) => x.taskId.length > 0);
}

export function hydrateDeckEntries(raw: unknown): Array<{ id: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
    .map((x) => ({ id: typeof (x as { id?: unknown }).id === 'string' ? (x as { id: string }).id : '' }))
    .filter((x) => x.id.length > 0);
}

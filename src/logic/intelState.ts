/**
 * Intel State — управление коллекцией лор-фрагментов игрока.
 * Персистентность через localStorage.
 */

import type { IntelFragment } from './intelFragments';
import { INTEL_FRAGMENTS } from './intelFragments';
import { asStringArray } from './saveHydrationGuards';

const STORAGE_KEY = 'neon_protocol_intel_v1';

export interface IntelState {
  /** ID собранных фрагментов */
  collectedIds: string[];
  /** Уведомление о новом фрагменте для UI-тоста */
  pendingReveal?: string;
}

export const EMPTY_INTEL_STATE: IntelState = {
  collectedIds: []
};

export function loadIntelState(): IntelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_INTEL_STATE;
    const parsed = JSON.parse(raw);
    return {
      collectedIds: Array.isArray(parsed?.collectedIds)
        ? parsed.collectedIds.filter((x: unknown): x is string => typeof x === 'string')
        : [],
    };
  } catch {
    return EMPTY_INTEL_STATE;
  }
}

export function saveIntelState(state: IntelState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ collectedIds: state.collectedIds }));
  } catch {
    // silent fail — localStorage may be full
  }
}

export function hasFragment(state: IntelState, id: string): boolean {
  return asStringArray(state.collectedIds).includes(id);
}

/**
 * Добавляет фрагмент в коллекцию.
 * Автоматически записывает pendingReveal для следующего в цепочке.
 * Возвращает новый state.
 */
export function collectFragment(state: IntelState, id: string): IntelState {
  const collectedIds = asStringArray(state.collectedIds);
  if (collectedIds.includes(id)) return state;

  const newState: IntelState = {
    ...state,
    collectedIds: [...collectedIds, id],
    pendingReveal: id
  };

  saveIntelState(newState);
  return newState;
}

/**
 * Возвращает все доступные (незаблокированные и не собранные) фрагменты
 * для данной репутации и выполненных квестов.
 */
export function getAvailableFragments(
  state: IntelState,
  reputations: Record<string, number>,
  completedQuestIds: string[]
): IntelFragment[] {
  return INTEL_FRAGMENTS.filter(fragment => {
    if (state.collectedIds.includes(fragment.id)) return false;
    if (fragment.requiredReputation) {
      const rep = reputations[fragment.requiredReputation.factionId] ?? 0;
      if (rep < fragment.requiredReputation.minPoints) return false;
    }
    if (fragment.requiredQuestId) {
      if (!completedQuestIds.includes(fragment.requiredQuestId)) return false;
    }
    return true;
  });
}

/**
 * Прогресс нарративной нити: сколько фрагментов собрано.
 */
export function getThreadProgress(state: IntelState, threadId: string): { collected: number; total: number; complete: boolean } {
  const thread = NARRATIVE_THREADS_LOOKUP[threadId];
  if (!thread) return { collected: 0, total: 0, complete: false };
  const collected = thread.fragmentIds.filter(id => state.collectedIds.includes(id)).length;
  return { collected, total: thread.fragmentIds.length, complete: collected === thread.fragmentIds.length };
}

/**
 * Возвращает прогресс по фракции в процентах.
 */
export function getFactionProgress(state: IntelState, factionId: string): number {
  const total = INTEL_FRAGMENTS.filter(f => f.factionId === factionId).length;
  if (total === 0) return 0;
  const collected = INTEL_FRAGMENTS.filter(f => f.factionId === factionId && state.collectedIds.includes(f.id)).length;
  return Math.round((collected / total) * 100);
}

// Lookup map for threads (imported from intelFragments via same bundle)
import { NARRATIVE_THREADS } from './intelFragments';
const NARRATIVE_THREADS_LOOKUP = Object.fromEntries(NARRATIVE_THREADS.map(t => [t.id, t]));

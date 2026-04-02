export interface PreClassState {
  classUnlocked: boolean;
  completedQuestCount: number;
  bitsEarnedFromQuests: number;
}

export const PRECLASS_UNLOCK_QUESTS = 6;
export const PRECLASS_UNLOCK_BITS = 420;

export function canUnlockClass(state: PreClassState): boolean {
  return state.completedQuestCount >= PRECLASS_UNLOCK_QUESTS || state.bitsEarnedFromQuests >= PRECLASS_UNLOCK_BITS;
}

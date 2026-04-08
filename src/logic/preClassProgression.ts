export interface PreClassState {
  classUnlocked: boolean;
  completedQuestCount: number;
  bitsEarnedFromQuests: number;
  tutorialCompleted?: boolean;
  exploitsCount?: number;
}

export const PRECLASS_UNLOCK_QUESTS = 3; // Reduced to focus on the tutorial
export const PRECLASS_UNLOCK_BITS = 300;

export function canUnlockClass(state: PreClassState): boolean {
  const hasExploits = (state.exploitsCount ?? 0) >= 5;
  return hasExploits && !!state.tutorialCompleted;
}

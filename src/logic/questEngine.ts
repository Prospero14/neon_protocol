import type { QuestDefinition } from './questData';

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

export interface QuestState {
  questId: string;
  status: QuestStatus;
  tracked: boolean;
}

export function isQuestRelevantForNpc(
  quest: QuestDefinition,
  npcId: string,
  preClass: boolean,
  states: QuestState[]
): boolean {
  if (quest.giverNpcId !== npcId) return false;
  if (quest.preClassOnly && !preClass) return false;
  const existing = states.find((s) => s.questId === quest.id);
  // We show it if it's new OR if it's already active.
  return !existing || existing.status === 'available' || existing.status === 'active';
}

export function acceptQuest(states: QuestState[], questId: string): QuestState[] {
  const withoutTracked = states.map((s) => ({ ...s, tracked: false }));
  const existing = withoutTracked.find((s) => s.questId === questId);
  if (existing) {
    return withoutTracked.map((s) =>
      s.questId === questId ? { ...s, status: 'active', tracked: true } : s
    );
  }
  return [...withoutTracked, { questId, status: 'active', tracked: true }];
}

export function completeQuest(states: QuestState[], questId: string): QuestState[] {
  return states.map((s) => (s.questId === questId ? { ...s, status: 'completed', tracked: false } : s));
}

export function getTrackedQuest(states: QuestState[]): QuestState | undefined {
  return states.find((s) => s.tracked && s.status === 'active');
}

export function trackQuest(states: QuestState[], questId: string): QuestState[] {
  return states.map((s) => ({
    ...s,
    tracked: s.questId === questId && s.status === 'active'
  }));
}

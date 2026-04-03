import { DIALOGUE_TREES as MODULAR_DIALOGUE_TREES } from './world';

export interface DialogueOption {
  text: string;
  nextId: string;
  cost?: number;
  effect?: string;
  cardRewardId?: string;
  amount?: number;
  requireReputation?: {
    factionId: string;
    minPoints: number;
  };
  reputationReward?: {
    factionId: string;
    amount: number;
  };
  requireUnlock?: boolean; // For professional branches
  requireTrait?: string; // New: For trait-based dialogue options
  requireQuestId?: string; // New: For quest-specific dialogue options
  completeQuestId?: string; // New: For completing quest through dialogue
  requireItemId?: string; // New: For requirement items like TZ
  subtext?: string; // New: For descriptive UI hints
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  options: DialogueOption[];
}

export interface DialogueTree {
  id: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export const DIALOGUE_TREES: Record<string, DialogueTree> = MODULAR_DIALOGUE_TREES;

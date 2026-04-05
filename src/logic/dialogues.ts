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
  awardQuestId?: string; // New: For awarding quest through dialogue
  requireItemId?: string; // New: For requirement items like TZ
  requireMinLevel?: number; // New: Level-gating
  requireMaxLevel?: number; // New: For 'low rank' specific lines
  isProOnly?: boolean; // New: Requires class unlock
  isTraineeOnly?: boolean; // New: For 'tutorial' specific lines
  subtext?: string; // New: For descriptive UI hints
  requireReputationRange?: { factionId: string, min?: number, max?: number }; // New: Fine-grained gate
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
  introPools?: {
    neutral?: string[];  // Rep [ -19, 19 ], Stress < 50
    stressed?: string[]; // Stress >= 50
    friendly?: string[]; // Rep >= 20
    hostile?: string[];  // Rep <= -20 (Cold/Unwilling)
    repeat?: string[];    // If quest previously completed
  };
}

export const DIALOGUE_TREES: Record<string, DialogueTree> = MODULAR_DIALOGUE_TREES;

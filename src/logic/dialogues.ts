import { DIALOGUE_TREES as MODULAR_DIALOGUE_TREES } from './world';

export interface DialogueOption {
  text: string;
  nextId: string;
  cost?: number;
  effect?: string;
  cardRewardId?: string;
  cardRewardIds?: string[]; // Give multiple cards at once

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
  requireQuestId?: string; // Legacy/Active: For quest-specific dialogue options (includes active & ready)
  requireActiveQuestId?: string; // New: STRICTLY active (not ready to turn in)
  requireReadyQuestId?: string; // New: STRICTLY ready to turn in (combat/travel done)
  requireCompletedQuestId?: string; // New: STRICTLY completed (turned in/finished)
  completeQuestId?: string; // New: For completing quest through dialogue
  awardQuestId?: string; // New: For awarding quest through dialogue
  awardItemId?: string; // New: For giving a quest item
  removeItemId?: string; // New: For consuming a quest item
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

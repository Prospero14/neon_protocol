import { useCallback } from 'react';
import type { DialogueTree } from '../dialogues';

interface UseNpcDialogueProps {
  tree: DialogueTree;
  playerStress: number;
  maxStress: number;
  playerReputation: Record<string, number>;
  npcFactionId: string;
}

/**
 * Hook logic for v0.095 "Advanced Narrative Selection".
 * Handles Stress, Reputation, and Completion-aware intro selection.
 */
export const useNpcDialogue = ({
  tree,
  playerStress,
  maxStress,
  playerReputation,
  npcFactionId,
}: UseNpcDialogueProps) => {
  
  const getInitialNodeId = useCallback(() => {
    if (!tree.introPools) return tree.startNodeId;

    const rep = playerReputation[npcFactionId] || 0;
    const stressRatio = playerStress / maxStress;
    
    // 1. Hostile (Rep <= -20)
    if (rep <= -20 && tree.introPools.hostile?.length) {
      return tree.introPools.hostile[Math.floor(Math.random() * tree.introPools.hostile.length)];
    }

    // 2. Stressed (Stress >= 50%)
    if (stressRatio >= 0.5 && tree.introPools.stressed?.length) {
      return tree.introPools.stressed[Math.floor(Math.random() * tree.introPools.stressed.length)];
    }

    // 3. Friendly (Rep >= 20)
    if (rep >= 20 && tree.introPools.friendly?.length) {
      return tree.introPools.friendly[Math.floor(Math.random() * tree.introPools.friendly.length)];
    }

    // 4. Neutral/Default
    if (tree.introPools.neutral?.length) {
      return tree.introPools.neutral[Math.floor(Math.random() * tree.introPools.neutral.length)];
    }

    return tree.startNodeId;
  }, [tree, playerStress, maxStress, playerReputation, npcFactionId]);

  return {
    getInitialNodeId
  };
};

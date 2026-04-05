import type { DialogueTree, DialogueOption } from './dialogues';

/**
 * Standard utility for creating dialogue trees with randomized greetings (Bibirevo Standard).
 */
export class DialogueBuilder {
  private tree: DialogueTree;

  constructor(id: string, startNodeId: string = 'intro') {
    this.tree = {
      id,
      startNodeId,
      nodes: {},
      introPools: {
        neutral: [],
        friendly: [],
        hostile: [],
        stressed: [],
        repeat: []
      }
    };
  }

  /**
   * Add randomized greetings to the intro pools.
   */
  withGreetings(pools: { 
    neutral?: string[], 
    friendly?: string[], 
    hostile?: string[], 
    stressed?: string[], 
    repeat?: string[] 
  }): this {
    this.tree.introPools = { ...this.tree.introPools, ...pools };
    return this;
  }

  /**
   * Add a generic dialogue node.
   */
  addNode(id: string, speaker: string, text: string, options: DialogueOption[]): this {
    this.tree.nodes[id] = { id, speaker, text, options };
    return this;
  }

  /**
   * Add a simple lore/intel node that leads back to intro or leaves.
   */
  addLoreNode(id: string, speaker: string, text: string, backToId: string = 'intro', intelId?: string, extra?: { effect?: string; amount?: number; cardRewardId?: string }): this {
    return this.addNode(id, speaker, text + (intelId ? ` (+Intel: ${intelId})` : ''), [
      { 
        text: 'Понял.', 
        nextId: backToId,
        effect: extra?.effect,
        amount: extra?.amount,
        cardRewardId: extra?.cardRewardId
      }
    ]);
  }

  /**
   * Add a standard quest gating branch (accept/reject based on level).
   */
  addQuestGating(npcId: string, speaker: string, config: {
    questId: string,
    introText: string,
    successText: string,
    rejectText: string,
    minLevel: number,
    isProRequired?: boolean,
    rewardCardId?: string
  }): this {
    const prefix = `q_gate_${npcId}_${config.questId}`;
    
    // 1. Initial check point
    this.addNode(`${prefix}_check`, speaker, config.introText, [
      { text: '[ Ждать вердикта ]', nextId: `${prefix}_branch` }
    ]);

    // 2. Logic node (Empty text, just options with requirements)
    this.addNode(`${prefix}_branch`, speaker, 'Система анализирует твой допуск...', [
      { 
        text: 'Допуск разрешен.', 
        nextId: `${prefix}_accept`, 
        requireMinLevel: config.minLevel,
        isProOnly: config.isProRequired 
      },
      { 
        text: 'Допуск запрещен.', 
        nextId: `${prefix}_reject`, 
        requireMaxLevel: config.minLevel - 1,
        isTraineeOnly: !config.isProRequired 
      }
    ]);

    // 3. Rejection node
    this.addNode(`${prefix}_reject`, speaker, config.rejectText, [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ]);

    // 4. Acceptance node
    this.addNode(`${prefix}_accept`, speaker, config.successText, [
      { 
        text: '[ ПРИНЯТЬ КОНТРАКТ ]', 
        nextId: 'LEAVE', 
        effect: 'AWARD_QUEST', 
        cardRewardId: config.rewardCardId || config.questId 
      }
    ]);

    return this;
  }

  /**
   * Finalize and return the tree.
   */
  build(): DialogueTree {
    return this.tree;
  }
}

/**
 * Standard utility for simple NPCs (Traders, Barman, etc.)
 */
export const createServiceNpc = (id: string, name: string, welcomeText: string, options: DialogueOption[]): DialogueTree => {
  return new DialogueBuilder(id)
    .addNode('intro', name, welcomeText, [...options, { text: '[Уйти]', nextId: 'LEAVE' }])
    .build();
};

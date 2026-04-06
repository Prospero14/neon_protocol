import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_craft_dialogues = new DialogueBuilder('bar_craft')
  .addNode('intro', 'ТРАКТИР "У КОДА"', 'Искры от паяльника и пары крепкого софта. Здесь рождаются лучшие деки.', [
      { text: 'Эль "Оптимизация" (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 40 },
      { text: 'Обед мастера (45 Bits)', nextId: 'intro', cost: 45, effect: 'RESTORE_HP', amount: 100 },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_craft_dialogues = new DialogueBuilder('bar_craft').withDistrict('izmailovo')
  .addNode('intro', 'ТРАКТИР "У КОДА"', 'Искры от паяльника и пары крепкого софта. Здесь рождаются лучшие деки.', [
      { text: 'Снэк «Шов под напряжением» (8 Bits)', nextId: 'intro', cost: 8, effect: 'RESTORE_HP', amount: 18 },
      { text: 'Эль "Оптимизация" (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 40 },
      { text: 'Обед мастера (45 Bits)', nextId: 'intro', cost: 45, effect: 'RESTORE_HP', amount: 100 },
      { text: 'Синт-кофе «Дедлайн» (22 Bits)', nextId: 'intro', cost: 22, effect: 'GIVE_ITEM', cardRewardId: 'itm_synth_coffee' },
      { text: 'Транспортный жетон (18 Bits)', nextId: 'intro', cost: 18, effect: 'GIVE_ITEM', cardRewardId: 'itm_taxi_token' },
      { text: 'Порция «Горячий стек» (32 Bits)', nextId: 'intro', cost: 32, effect: 'RESTORE_HP', amount: 70 },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

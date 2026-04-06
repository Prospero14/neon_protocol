import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_legendary_dialogues = new DialogueBuilder('shop_legendary')
  .addNode('intro', 'ЛАВКА ЛЕГЕНД', 'Только верифицированные модули с подписью Архитектора. Здесь пахнет канифолью и дорогим пластиком.', [
      { text: 'Refactor Crystal (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_CARD', cardRewardId: 'fn_refactor' },
      { text: 'Artisan Core (200 Bits)', nextId: 'intro', cost: 200, effect: 'GIVE_TRAIT', cardRewardId: 'hardware_reclaimer' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

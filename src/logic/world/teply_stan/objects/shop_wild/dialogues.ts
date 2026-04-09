import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_wild_dialogues = new DialogueBuilder('shop_wild').withDistrict('teply_stan')
  .addNode('intro', 'ДИКИЙ_РЫНОК', 'Контрабанда из-за МКАДа. Софт без подписи, но работает там, где пасует официалка.', [
      { text: 'Garbage Collector V2 (60 Bits)', nextId: 'intro', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'fn_wash_logs' },
      { text: 'ПАКЕТНАЯ_СКРЫТНОСТЬ (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_TRAIT', cardRewardId: 'script_ghost' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

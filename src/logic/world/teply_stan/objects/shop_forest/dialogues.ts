import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_forest_dialogues = new DialogueBuilder('shop_forest').withDistrict('teply_stan')
  .addNode('intro', 'ЛЕСНИК', 'У меня только дикие модули. Никаких лицензий GigaBank, только чистая мощь SRE.', [
      { text: 'SRE Monitor (30 Bits)', nextId: 'intro', cost: 30, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

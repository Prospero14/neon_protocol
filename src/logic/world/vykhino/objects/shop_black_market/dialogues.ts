import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_black_market_dialogues = new DialogueBuilder('shop_black_market')
  .addNode('intro', 'ЧЕРНЫЙ_ИМПОРТ', 'Только Bits и результат. Что ищем?', [
      { text: 'Root Access Kit (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_TRAIT', cardRewardId: 'root_access' },
      { text: 'Encryption Layer (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'def_encryption' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

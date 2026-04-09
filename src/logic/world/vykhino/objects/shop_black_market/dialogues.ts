import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_black_market_dialogues = new DialogueBuilder('shop_black_market').withDistrict('vykhino')
  .addNode('intro', 'ЧЕРНЫЙ_ИМПОРТ', 'Только Bits и результат. Что ищем?', [
      { text: 'Root Access Kit (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_TRAIT', cardRewardId: 'root_access' },
      { text: 'Encryption Layer (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'def_encryption' },
      { text: 'Шунт ОЦ «Импорт» (195)', nextId: 'intro', cost: 195, awardItemId: 'itm_oc_shunt', subtext: 'Редкий расходник.' },
      { text: 'Кэш USB (швейцарский) (110)', nextId: 'intro', cost: 110, awardItemId: 'itm_bit_cache_usb', subtext: 'Переплата — меньше вопросов.' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

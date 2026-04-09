import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_state_secret_dialogues = new DialogueBuilder('shop_state_secret').withDistrict('taganka')
  .addNode('intro', 'ГОСТАЙНА', 'Магазин лицензированного оборудования Krylovo. Допуск только для сотрудников с уровнем доступа Crimson.', [
    { text: 'Crimson Access Key (150 Bits)', nextId: 'intro', cost: 150, effect: 'GIVE_CARD', cardRewardId: 'item_gate_key_taganka' },
    { text: 'Бронированная память (200 Bits)', nextId: 'intro', cost: 200, effect: 'GIVE_TRAIT', cardRewardId: 'trait_hardened_logic' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

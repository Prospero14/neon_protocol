import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_armor_weave_dialogues = new DialogueBuilder('shop_armor_weave').withDistrict('tekstilschiki')
  .addNode('intro', 'БРОНЯ_ТКАНЬ', 'Защитные плетения на любой вкус. От легких паттернов до тяжелых сетевых экранов. Что выберете?', [
    { text: 'Базовый файрвол (30 Bits)', nextId: 'intro', cost: 30, effect: 'GIVE_CARD', cardRewardId: 'def_basic_firewall' },
    { text: 'Сетевой экран v2 (70 Bits)', nextId: 'intro', cost: 70, effect: 'GIVE_CARD', cardRewardId: 'def_shield_v2' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

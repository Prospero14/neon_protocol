import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_gravity_dialogues = new DialogueBuilder('shop_gravity').withDistrict('fili')
  .addNode('intro', 'МАГАЗИН "ГРАВИТАЦИЯ"', 'Тяжелые стальные плиты, кабели и системы жизнеобеспечения. Здесь продают то, что поможет выжить при перегрузках.', [
    { text: 'Titanium Shell (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_TRAIT', cardRewardId: 'trait_titanium_shell' },
    { text: 'Gravity Boots (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'item_gravity_boots' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

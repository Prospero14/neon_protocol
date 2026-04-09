import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_gravity_dialogues = new DialogueBuilder('shop_gravity').withDistrict('fili')
  .addNode('intro', 'МАГАЗИН "ГРАВИТАЦИЯ"', 'Тяжелые стальные плиты, кабели и системы жизнеобеспечения. Здесь продают то, что поможет выжить при перегрузках.', [
    { text: 'Titanium Shell (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_TRAIT', cardRewardId: 'trait_titanium_shell' },
    { text: 'Gravity Boots (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'item_gravity_boots' },
    { text: 'Street Fusion Core (140 Bits)', nextId: 'intro', cost: 140, effect: 'GIVE_CARD', cardRewardId: 'infra_street_fusion' },
    { text: 'Orbital Uplink (210 Bits)', nextId: 'intro', cost: 210, effect: 'GIVE_CARD', cardRewardId: 'infra_orbital_uplink' },
    { text: 'Deadline Trance (110 Bits)', nextId: 'intro', cost: 110, effect: 'GIVE_CARD', cardRewardId: 'soft_deadline_trance' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

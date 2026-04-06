import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_nature_logic_dialogues = new DialogueBuilder('shop_nature_logic')
  .addNode('intro', 'ЛОГИКА ПРИРОДЫ', 'Полки ломятся от органических чипов и нейро-удобрений. Продавец кивает на стойку с надписью "Biosyndicate Approved".', [
    { text: 'Chlorophyll Scraper (35 Bits)', nextId: 'intro', cost: 35, effect: 'GIVE_CARD', cardRewardId: 'soft_nature_scraper' },
    { text: 'Bark Firewall (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_TRAIT', cardRewardId: 'trait_bark_firewall' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

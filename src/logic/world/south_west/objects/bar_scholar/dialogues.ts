import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_scholar_dialogues = new DialogueBuilder('bar_scholar').withDistrict('south_west')
  .addNode('intro', 'РЮМОЧНАЯ "СТУДЕНТ"', 'Здесь не гасят шум, здесь пишут дипломы. Кофе холодный, но Bits горячие.', [
    { text: 'Эспрессо "Дедлок" (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 40 },
    { text: 'Двойной Java-шот (35 Bits)', nextId: 'intro', cost: 35, effect: 'RESTORE_HP', amount: 100 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

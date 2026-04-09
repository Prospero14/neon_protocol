import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_satellite_crash_dialogues = new DialogueBuilder('combat_satellite_crash').withDistrict('fili')
  .addNode('intro', 'ПАДЕНИЕ ДАННЫХ', 'Обломки спутника всё ещё дымятся. Кодировщики со всего района уже здесь, каждый хочет урвать кусок черного ящика. Начинается цифровая потасовка.', [
    { text: '[ СЕСТЬ НА ДАМП ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_fili_satellite_crash' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

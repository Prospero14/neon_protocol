import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_board_tekstil_dialogues = new DialogueBuilder('job_board_tekstil').withDistrict('tekstilschiki')
  .addNode('intro', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'Экран мерцает. В списке активных контрактов Текстильщиков:', [
    { text: '[УРОВЕНЬ 1] Зачистка 7-й линии от ботов-багов.', nextId: 'quest_bugs', awardQuestId: 'q_tekstilschiki_combat_textile_raid_bug_sweep' },
    { text: '[УРОВЕНЬ 2] Доставка паттернов в Кузьминки.', nextId: 'quest_delivery', awardQuestId: 'q_tekstilschiki_delivery_pattern_kuzminki' },
    { text: '[Выйти]', nextId: 'LEAVE' }
  ])
  .addNode('quest_bugs', 'СИСТЕМА', 'Контракт принят. Цели отмечены на карте. Удачи в плетении смерти.', [
    { text: 'Ок.', nextId: 'LEAVE' }
  ])
  .addNode('quest_delivery', 'СИСТЕМА', 'Контракт на доставку принят. Не повредите носитель.', [
    { text: 'Принято.', nextId: 'LEAVE' }
  ])
  .build();

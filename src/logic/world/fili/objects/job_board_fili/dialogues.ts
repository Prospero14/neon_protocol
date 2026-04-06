import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_board_fili_dialogues = new DialogueBuilder('job_board_fili')
  .addNode('intro', 'ЦЕНТР УПРАВЛЕНИЯ НАЙМА', 'Список активных контрактов на орбитальный аудит и зачистку секторов Хруничева. Каждое выполнение — это шаг к аплинку.', [
    { text: 'Контракт: Охрана Пуска (Level 6+)', nextId: 'quest_accept_1', requireMinLevel: 6 },
    { text: 'Контракт: Сбор Обломков (Level 4+)', nextId: 'quest_accept_2', requireMinLevel: 4 },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept_1', 'ЦЕНТР НАЙМА', 'Объект: Стойка 4 (Хруничев). Задача: Зачистка автоматики. Награда: 300 Bits + 20 Rep (Redundants).', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_fili_combat_launch_guard_bug_sweep' }
  ])
  .addNode('quest_accept_2', 'ЦЕНТР НАЙМА', 'Объект: Сектор 15. Задача: Сбор черных ящиков спутника. Награда: 150 Bits.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_fili_combat_satellite_crash_bug_sweep' }
  ])
  .build();

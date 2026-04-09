import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_board_perovo_dialogues = new DialogueBuilder('job_board_perovo').withDistrict('perovo')
  .addNode('intro', 'ДОСКА ФРИЛАНСА ПЕРОВО', 'Мертвый экран. Чистка системных тупиков и борьба с крысами.', [
      { text: 'Чистка системных тупиков (Level 1+)', nextId: 'quest_accept', requireMinLevel: 1 },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ДОСКА ФРИЛАНСА', 'Объект: Сектор 14. Задача: Уничтожение системных грызунов. Награда: 40 Bits.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_perovo_combat_rat_invasion_bug_sweep' }
  ])
  .build();

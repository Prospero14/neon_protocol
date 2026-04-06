import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_basement_dialogues = new DialogueBuilder('bar_basement')
  .addNode('intro', 'БАР "ПОДВАЛ"', 'Свет от диодов серверов. Пьем "Канифоль" и обсуждаем взломы.', [
      { text: 'Стакан "Канифоли" (10 Bits)', nextId: 'intro', cost: 10, effect: 'RESTORE_HP', amount: 20 },
      { text: 'Суточный прогон (45 Bits)', nextId: 'intro', cost: 45, effect: 'RESTORE_HP', amount: 100 },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

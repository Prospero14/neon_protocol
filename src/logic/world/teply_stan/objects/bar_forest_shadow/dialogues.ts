import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_forest_shadow_dialogues = new DialogueBuilder('bar_forest_shadow')
  .addNode('intro', 'ТАВЕРНА_ТЕНЬ_ЛЕСА', 'Сруб, обшитый серверными панелями. Пьем березовый хладагент.', [
      { text: 'Кружка "Лесного Эха" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30 },
      { text: 'Ночлег в корнях (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100 },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

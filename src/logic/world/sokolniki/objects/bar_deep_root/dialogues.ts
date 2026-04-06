import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_deep_root_dialogues = new DialogueBuilder('bar_deep_root')
  .addNode('intro', 'БАР "ГЛУБИННЫЙ КОРЕНЬ"', 'Бар расположен внутри полого ствола огромного дерева, стены которого укреплены серверными стойками. Здесь пахнет мохом и перегретым пластиком.', [
      { text: 'Настойка "Биос" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30 },
      { text: 'Ночь в корневом каталоге (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100 },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

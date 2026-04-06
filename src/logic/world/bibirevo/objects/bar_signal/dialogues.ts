import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_signal_dialogue: DialogueTree = new DialogueBuilder('bar_signal')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'БАР "СИГНАЛ"', 'Здесь не гасят шум, здесь его создают. Лучший спирт для промывки плат. Идеальный охлад для перегретых кодеров.', [
    { text: 'Рюмка "Белого Шума" (12 Bits)', nextId: 'intro', cost: 12, effect: 'RESTORE_HP', amount: 20 },
    { text: 'Двойной охладитель (25 Bits)', nextId: 'intro', cost: 25, effect: 'RESTORE_HP', amount: 50 },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'БАР "СИГНАЛ"', 'Садись, юнит. Генератор сегодня не моргает, так что охлад холодный. Что льем в деку?', [
    { text: 'Заказать охладитель (25 Bits)', nextId: 'intro', cost: 25, effect: 'RESTORE_HP', amount: 50 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

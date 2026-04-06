import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_cold_buffer_dialogues = new DialogueBuilder('bar_cold_buffer')
  .addNode('intro', 'БАР "ХОЛОДНЫЙ БУФЕР"', 'Здесь пахнет озоном и жидким азотом. Аудиторы в дорогих костюмах молча потягивают хладагент, не сводя глаз с терминалов.', [
      { text: 'Азотный коктейль "Обнуление" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30 },
      { text: 'Полная промывка памяти (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100 },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

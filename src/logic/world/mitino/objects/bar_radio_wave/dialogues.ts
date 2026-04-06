import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_radio_wave_dialogues = new DialogueBuilder('bar_radio_wave')
  .addNode('intro', 'БАР "ВОЛНА"', 'Шум радиоволн здесь почти осязаем. Идеальное место, чтобы скрыть свои мысли от сканеров.', [
      { text: 'Энергетик "Импульс" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30 },
      { text: 'Глубокая дефрагментация (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100 },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

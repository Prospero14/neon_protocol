import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_packet_dialogue: DialogueTree = new DialogueBuilder('bar_packet').withDistrict('maryino')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'БАР_ПАКЕТ', 'Где пакеты теряются навсегда... Табак, озон и дешевый спирт. Идеальное место для тех, кто хочет забыть свой IP.', [
    { text: 'Кружка "Битого Пикселя" (12 Bits)', nextId: 'intro', cost: 12, effect: 'RESTORE_HP', amount: 25 },
    { text: 'Залить кэш (40 Bits)', nextId: 'intro', cost: 40, effect: 'RESTORE_HP', amount: 80 },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'БАР_ПАКЕТ', 'Шум, гам и старый рок. Здесь никто не спросит твой ID. Заказывай, еслиBits не жмут карман.', [
    { text: 'Залить кэш (40 Bits)', nextId: 'intro', cost: 40, effect: 'RESTORE_HP', amount: 80 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

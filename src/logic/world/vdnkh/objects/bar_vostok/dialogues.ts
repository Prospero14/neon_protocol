import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_vostok_dialogue: DialogueTree = new DialogueBuilder('bar_vostok').withDistrict('vdnkh')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'БАР_ВОСТОК-1', 'Напитки для космонавтов данных. Поехали! Чем охладить твой интерфейс? У нас есть "Тормозная Жидкость" и "Жидкий Гелий".', [
    { text: 'Эмульсия "Поехали!" (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 45 },
    { text: 'Залить кэш (60 Bits)', nextId: 'intro', cost: 60, effect: 'RESTORE_HP', amount: 100 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'БАР_ВОСТОК-1', 'Здесь пили те, кто запускал первые спутники в Deep Web. Садись. Не фони в эфире.', [
    { text: 'Залить кэш (60 Bits)', nextId: 'intro', cost: 60, effect: 'RESTORE_HP', amount: 100 },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

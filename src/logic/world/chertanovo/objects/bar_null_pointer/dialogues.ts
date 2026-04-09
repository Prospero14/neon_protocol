import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_null_pointer_dialogue: DialogueTree = new DialogueBuilder('bar_null_pointer').withDistrict('chertanovo')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'БАР_NULL_POINTER', 'Здесь не спрашивают твой IP и не логируют твои мысли. Тень Чертаново — твой дом. Чем залить кэш, чтобы не дрожал интерфейс?', [
    { text: 'Забыть всё (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 35 },
    { text: 'Полный дамп (55 Bits)', nextId: 'intro', cost: 55, effect: 'RESTORE_HP', amount: 100 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'БАР_NULL_POINTER', 'Лучшее место для тех, кто хочет стать просто Null. Садись. Сегодня акция: при разрыве соединения — вторая кружка бесплатно.', [
    { text: 'Залить кэш (55 Bits)', nextId: 'intro', cost: 55, effect: 'RESTORE_HP', amount: 100 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

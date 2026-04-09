import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_last_call_dialogue: DialogueTree = new DialogueBuilder('bar_last_call').withDistrict('chertanovo')
  .addNode('intro', 'РЮМОЧНАЯ_ПОСЛЕДНИЙ_ВЫЗОВ', 'Дно архитектуры Москвы. Терять здесь нечего. Только Bits и остатки кэша. Что будешь, юнит?', [
    { text: 'Стакан "404" (5 Bits)', nextId: 'intro', cost: 5, effect: 'RESTORE_HP', amount: 10 },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_propeller_dialogue: DialogueTree = new DialogueBuilder('bar_propeller')
  .addNode('intro', 'КАБАК_ПРОПЕЛЛЕР', 'Здесь пахнет керосином, озоном и старым кодом. Местные дебагят свои жизни в тишине. Что зальете в охлаждающий контур?', [
    { text: 'Чашка "Взлета" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 35, subtext: 'Очистка кэша.' },
    { text: 'Полная промывка форсунок (55 Bits)', nextId: 'intro', cost: 55, effect: 'RESTORE_HP', amount: 100, subtext: 'Глубокая очистка нейропортов.' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

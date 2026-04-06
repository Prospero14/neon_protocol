import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_local_lan_dialogue: DialogueTree = new DialogueBuilder('combat_local_lan')
  .addNode('intro', 'МЕСТНАЯ ЛОКАЛКА', 'Узел жилого массива. Система безопасности считает тебя несанкционированным процессом. Требуется принудительная дефрагментация.', [
    { text: '[ ЗАЧИСТИТЬ ПЕРИМЕТР ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_local_lan' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

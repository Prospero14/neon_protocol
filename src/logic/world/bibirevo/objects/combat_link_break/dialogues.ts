import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_link_break_dialogue: DialogueTree = new DialogueBuilder('combat_link_break')
  .addNode('intro', 'ОБРЫВ СВЯЗИ // CORE', 'Перед тобой мерцает разорванная магистраль. Паразит-вирус яростно перехватывает пакеты. Нужно вмешательство, иначе связь ляжет окончательно.', [
    { text: '[ ЗАЧИСТИТЬ ПОТОК ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_link_break' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

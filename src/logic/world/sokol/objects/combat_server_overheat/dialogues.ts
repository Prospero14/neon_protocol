import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_server_overheat_dialogue: DialogueTree = new DialogueBuilder('combat_server_overheat')
  .addNode('intro', 'ПЕРЕГРЕВ СЕРВЕРНОЙ', 'Критическая температура в узлах 08-S. Воздух густой от озона и запаха горячего пластика. Процессы-уборщики вскипают, превращаясь в "битые" кадры. Нужно срочное охлаждение через бой.', [
    { text: '[ ОСТУДИТЬ СЕРВЕРНУЮ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_server_overheat' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

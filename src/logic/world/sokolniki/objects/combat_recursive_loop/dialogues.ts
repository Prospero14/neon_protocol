import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_recursive_loop_dialogues = new DialogueBuilder('combat_recursive_loop').withDistrict('sokolniki')
  .addNode('intro', 'РЕКУРСИВНАЯ ПЕТЛЯ', 'Пространство здесь сворачивается само в себя. Вы видите собственную спину, вводящую команды на деке. Разорвать цикл?', [
    { text: '[ ПРЕРВАТЬ РЕКУРСИЮ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_sokolniki_loop' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

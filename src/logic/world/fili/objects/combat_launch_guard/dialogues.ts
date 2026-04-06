import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_launch_guard_dialogues = new DialogueBuilder('combat_launch_guard')
  .addNode('intro', 'ОХРАНА ПУСКА', 'Автоматические турели и боевые дроны. Они не знают, что пуск отменен двадцать лет назад. Любое движение воспринимается как угроза.', [
    { text: '[ ПРОРВАТЬ ОБОРОНУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_fili_launch_guard' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_ghost_process_dialogues = new DialogueBuilder('combat_ghost_process').withDistrict('taganka')
  .addNode('intro', 'ПРИЗРАЧНЫЙ ПРОЦЕСС', 'Между слоями памяти что-то шевелится. Этот код не принадлежит ни Krylovo, ни Инквизиции. Он просто... существует. И он голоден.', [
    { text: '[ ИЗОЛИРОВАТЬ ПРОЦЕСС ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_taganka_ghost' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

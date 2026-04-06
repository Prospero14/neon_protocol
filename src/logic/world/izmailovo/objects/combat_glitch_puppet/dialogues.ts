import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_glitch_puppet_dialogues = new DialogueBuilder('combat_glitch_puppet')
  .addNode('intro', 'ГЛЮЧНАЯ КУКЛА', 'Робот-манекен в витрине вдруг дергается и начинает транслировать красный шум. Его сенсоры светятся безумием.', [
    { text: '[ ИЗОЛИРОВАТЬ ПРОЦЕСС ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_izmailovo_puppet' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

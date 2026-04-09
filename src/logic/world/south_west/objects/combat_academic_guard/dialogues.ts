import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_academic_guard_dialogues = new DialogueBuilder('combat_academic_guard').withDistrict('south_west')
  .addNode('intro', 'АКАДЕМИЧЕСКАЯ ОХРАНА', 'Автоматические системы защиты данных активированы. Турели нацелены на ваши порты.', [
    { text: '[ ОТКЛЮЧИТЬ ЗАЩИТУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_south_west_guard' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

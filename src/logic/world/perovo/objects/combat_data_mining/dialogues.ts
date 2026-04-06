import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_data_mining_dialogues = new DialogueBuilder('combat_data_mining')
  .addNode('intro', 'ПРОЦЕСС-МАЙНЕР', 'В подвале завелся процесс-майнер. Он "ест" записи для добычи Bits. Если не остановить — потеряем данные о шлюзах.', [
    { text: '[ ПРЕРВАТЬ ПРОЦЕСС ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_perovo_mining' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

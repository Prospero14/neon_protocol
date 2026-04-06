import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_fox_virus_dialogues = new DialogueBuilder('combat_fox_virus')
  .addNode('intro', 'ВИРУС "РЫЖИЙ ХВОСТ"', 'Этот вирус не просто ворует данные, он играет с вашим стеком, подменяя адреса возврата. Хитрый и быстрый противник.', [
    { text: '[ ПОЙМАТЬ ВИРУС ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_sokolniki_fox' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

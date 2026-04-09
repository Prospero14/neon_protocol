import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_wild_node_dialogues = new DialogueBuilder('combat_wild_node').withDistrict('teply_stan')
  .addNode('intro', 'ДИКИЙ УЗЕЛ', 'Перед вами заросший данными сервер-паразит. Код здесь мутировал и сопротивляется любому вмешательству.', [
    { text: '[ ЗАЧИСТИТЬ УЗЕЛ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_teply_stan_wild_node' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

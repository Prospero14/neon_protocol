import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_rat_invasion_dialogues = new DialogueBuilder('combat_rat_invasion').withDistrict('perovo')
  .addNode('intro', 'КРЫСИНЫЙ НАБЕГ', 'Стая системных грызунов. У системных крыс зубы как бритвы. Дека выдержит укус?', [
    { text: '[ ЗАЧИСТИТЬ ПОДВАЛ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_perovo_rats' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

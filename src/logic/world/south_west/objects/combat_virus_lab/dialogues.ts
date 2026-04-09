import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_virus_lab_dialogues = new DialogueBuilder('combat_virus_lab').withDistrict('south_west')
  .addNode('intro', 'ВИРУСНАЯ ЛАБОРАТОРИЯ', 'Экспериментальные инфекции софта вырвались из-под контроля. Код вокруг вас мутирует в реальном времени.', [
    { text: '[ ИЗОЛИРОВАТЬ ВИРУС ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_south_west_virus' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

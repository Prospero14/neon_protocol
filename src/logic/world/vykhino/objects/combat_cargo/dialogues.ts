import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_cargo_dialogues = new DialogueBuilder('combat_cargo').withDistrict('vykhino')
  .addNode('intro', 'ПЕРЕХВАТ ГРУЗА', 'Логистические дроны Net Drivers кружат над брошенным контейнером. Системы защиты в режиме ожидания. Рискнете вскрыть?', [
    { text: '[ АКТИВИРОВАТЬ ПЕРЕХВАТ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_vykhino_cargo' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();

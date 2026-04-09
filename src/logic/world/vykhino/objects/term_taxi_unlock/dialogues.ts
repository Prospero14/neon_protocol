import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_unlock_dialogues = new DialogueBuilder('term_taxi_unlock').withDistrict('vykhino')
  .addNode('intro', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Карантин. Разблокировать шлюз?', [
    { text: 'Проломить шлюз (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .build();

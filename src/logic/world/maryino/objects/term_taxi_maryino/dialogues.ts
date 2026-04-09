import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_maryino_dialogue: DialogueTree = new DialogueBuilder('term_taxi_maryino').withDistrict('maryino')
  .addNode('intro', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Марьино. Перегрузка. Требуется приоритетный пропуск "VOSKHOD".', [
    { text: 'Купить пропуск (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .build();

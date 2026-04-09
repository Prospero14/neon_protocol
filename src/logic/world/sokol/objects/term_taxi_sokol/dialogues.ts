import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_sokol_dialogue: DialogueTree = new DialogueBuilder('term_taxi_sokol').withDistrict('sokol')
  .addNode('intro', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Сокол. Все бортовые системы в норме. Статус: ВЗЛЕТ_РАЗРЕШЕН. Желаете разблокировать маршруты Москвы?', [
    { text: 'Купить пропуск (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .build();

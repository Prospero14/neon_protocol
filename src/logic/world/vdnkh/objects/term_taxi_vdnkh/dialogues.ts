import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_vdnkh_dialogue: DialogueTree = new DialogueBuilder('term_taxi_vdnkh')
  .addNode('intro', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: ВДНХ. Все маршруты стабильны. Фракции ВДНХ (Voskhod/Дзен-ЦОД) гарантируют безопасность трансфера.', [
    { text: 'Купить пропуск (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .build();

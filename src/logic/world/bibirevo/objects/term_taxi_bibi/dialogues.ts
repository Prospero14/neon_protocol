import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_bibi_dialogue: DialogueTree = new DialogueBuilder('term_taxi_bibi')
  .addNode('intro', 'ТЕРМИНАЛ ТАКСИ', 'СИСТЕМА_ТАКСИ: Узел Бибирево. Глобальная навигация: 100 Bits. ДОСТУП: КОРНЕВОЙ.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .build();

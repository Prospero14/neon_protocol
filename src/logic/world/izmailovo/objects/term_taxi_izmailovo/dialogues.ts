import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_izmailovo_dialogues = new DialogueBuilder('term_taxi_izmailovo')
  .addNode('intro', 'ТАКСИ: ИЗМАЙЛОВО', 'СИСТЕМА_ТАКСИ: Узел Измайлово (Рынок). Глобальная навигация: 100 Bits. ДОСТУП: СВОБОДНЫЙ.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: '[ПЕРТОВО]', nextId: 'TRAVEL_PEROVO', cost: 15 },
    { text: '[СОКОЛЬНИКИ]', nextId: 'TRAVEL_SOKOL', cost: 20 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_PEROVO', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В ПЕРОВО. ТАМ ТИХО, НО ОПАСНО.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_SOKOL', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В СОКОЛЬНИКИ. ЛЕС ЖДЕТ ВАШЕГО КОДА.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .build();

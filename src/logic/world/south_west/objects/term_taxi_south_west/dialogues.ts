import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_south_west_dialogues = new DialogueBuilder('term_taxi_south_west')
  .addNode('intro', 'ТАКСИ: ЮГО-ЗАПАДНАЯ', 'СИСТЕМА_ТАКСИ: Узел Юго-Запад (Академия). Глобальная навигация: 100 Bits. ДОСТУП: СВОБОДНЫЙ.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: '[МИТИНО]', nextId: 'TRAVEL_MITINO', cost: 15 },
    { text: '[СОКОЛЬНИКИ]', nextId: 'TRAVEL_SOKOL', cost: 20 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_MITINO', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В МИТИНО. РЫНОК ЖДЕТ ВАШЕГО КОДА.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_SOKOL', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В СОКОЛЬНИКИ. ЛЕС ЖДЕТ ВАШЕГО КОДА.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .build();

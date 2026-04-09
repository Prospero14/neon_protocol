import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_perovo_dialogues = new DialogueBuilder('term_taxi_perovo').withDistrict('perovo')
  .addNode('intro', 'ТАКСИ: ПЕРОВО', 'СИСТЕМА_ТАКСИ: Узел Перово (Промзона). Глобальная навигация: 100 Bits. ДОСТУП: СЕРТИФИЦИРОВАН.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: '[ВЫХИНО]', nextId: 'TRAVEL_VYKHINO', cost: 15 },
    { text: '[КИТАЙ-ГОРОД]', nextId: 'TRAVEL_HUB', cost: 20 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_VYKHINO', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ НА ВЫХИНО. ТОРГОВЫЙ ХАОС ЖДЕТ ВАС.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_HUB', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В КИТАЙ-ГОРОД. ЦЕНТРАЛЬНЫЙ УЗЕЛ НА СВЯЗИ.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .build();

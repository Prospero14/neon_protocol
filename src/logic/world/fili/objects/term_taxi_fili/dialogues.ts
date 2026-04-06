import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_fili_dialogues = new DialogueBuilder('term_taxi_fili')
  .addNode('intro', 'ТАКСИ: ФИЛИ', 'СИСТЕМА_ТАКСИ: Узел Фили (Орбитальный линк). Глобальная навигация: 100 Bits. ДОСТУП: СЕРТИФИЦИРОВАН.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: '[КУТУЗОВСКАЯ]', nextId: 'TRAVEL_KUTUZ', cost: 10 },
    { text: '[ШЕЛЕПИХА]', nextId: 'TRAVEL_SHEL', cost: 15 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_KUTUZ', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ НА КУТУЗОВСКУЮ. НЕ ЗАБЫВАЙТЕ СОХРАНЯТЬ СТЕК.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_SHEL', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ НА ШЕЛЕПИХУ. БЕРЕГИТЕСЬ ТУПИКОВЫХ АЛГОРИТМОВ.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .build();

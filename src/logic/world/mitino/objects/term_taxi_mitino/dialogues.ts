import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_mitino_dialogues = new DialogueBuilder('term_taxi_mitino')
  .addNode('intro', 'ТАКСИ: МИТИНО', 'СИСТЕМА_ТАКСИ: Узел Митино. Глобальная навигация: 100 Bits. ДОСТУП: КОРНЕВОЙ.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: '[ТУШИНО]', nextId: 'TRAVEL_TUSHINO', cost: 15 },
    { text: '[СТРОГИНО]', nextId: 'TRAVEL_STROGINO', cost: 15 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_TUSHINO', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В ТУШИНО. ПОЖАЛУЙСТА, ПРИСТЕГНИТЕ ДЕКУ.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_STROGINO', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В СТРОГИНО. ПОМНИТЕ: РАДИО-ШТОРМ НЕ ЗНАЕТ ПОЩАДЫ.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .build();

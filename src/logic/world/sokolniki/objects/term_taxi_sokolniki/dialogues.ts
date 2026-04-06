import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_sokolniki_dialogues = new DialogueBuilder('term_taxi_sokolniki')
  .addNode('intro', 'ТАКСИ: СОКОЛЬНИКИ', 'СИСТЕМА_ТАКСИ: Узел Сокольники. Глобальная навигация: 100 Bits. ДОСТУП: СРЕДНИЙ.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: '[ПРЕОБРАЖЕНКА]', nextId: 'TRAVEL_PREOBR', cost: 15 },
    { text: '[ВДНХ]', nextId: 'TRAVEL_VDNH', cost: 20 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_PREOBR', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ НА ПРЕОБРАЖЕНКУ. БЕРЕГИТЕ ВАШ ПОТОК ДАННЫХ.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_VDNH', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ НА ВДНХ. ПОД КУПОЛОМ ВСЕГДА ТУЧНО.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .build();

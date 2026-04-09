import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_taganka_dialogues = new DialogueBuilder('term_taxi_taganka').withDistrict('taganka')
  .addNode('intro', 'ТАКСИ: ТАГАНКА', 'СИСТЕМА_ТАКСИ: Узел Таганка (Бункер). Глобальная навигация: 100 Bits. ДОСТУП: ПРИОРИТЕТНЫЙ.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: '[КУРСКАЯ]', nextId: 'TRAVEL_KURSKAYA', cost: 20 },
    { text: '[МАРКСИСТСКАЯ]', nextId: 'TRAVEL_MARKS', cost: 20 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_KURSKAYA', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ НА КУРСКУЮ. БЕРЕГИТЕ ВАШ ПОТОК.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_MARKS', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ НА МАРКСИСТСКУЮ. АЛГОРИТМЫ ЛУЧШЕ ЧУВСТВУЮТ СЕБЯ НА ГЛУБИНЕ.', [
    { text: '[ ЗАВЕРШИТЬ ПОЕЗДКУ ]', nextId: 'LEAVE' }
  ])
  .build();

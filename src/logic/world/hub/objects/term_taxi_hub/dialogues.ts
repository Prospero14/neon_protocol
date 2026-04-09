import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_hub_dialogues = new DialogueBuilder('term_taxi_hub').withDistrict('kitay_gorod')
  .addNode('intro', 'ТАКСИ: КИТАЙ-ГОРОД', 'СИСТЕМА_ТАКСИ: Центральный Узел (The Socket). ДОСТУП К ВСЕМ РАЙОНАМ. Глобальная навигация: 100 Bits.', [
    { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: '[ПЕРОВО]', nextId: 'TRAVEL_PEROVO', cost: 20 },
    { text: '[ИЗМАЙЛОВО]', nextId: 'TRAVEL_IZMAILOVO', cost: 25 },
    { text: '[ЮГО-ЗАПАДНАЯ]', nextId: 'TRAVEL_SW', cost: 25 },
    { text: 'Отмена', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_PEROVO', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В ПЕРОВО. ПРОМЗОНА ЖДЕТ.', [{ text: '[ ОК ]', nextId: 'LEAVE' }])
  .addNode('TRAVEL_IZMAILOVO', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ В ИЗМАЙЛОВО. РЫНОК ОТКРЫТ.', [{ text: '[ ОК ]', nextId: 'LEAVE' }])
  .addNode('TRAVEL_SW', 'ТАКСИ: ПЕРЕЕЗД', '[SUCCESS] ПЕРЕМЕЩЕНИЕ НА ЮГО-ЗАПАДНУЮ. АКАДЕМИЯ НА СВЯЗИ.', [{ text: '[ ОК ]', nextId: 'LEAVE' }])
  .build();

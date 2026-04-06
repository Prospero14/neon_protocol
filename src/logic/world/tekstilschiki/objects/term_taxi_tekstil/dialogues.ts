import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_taxi_tekstil_dialogues = new DialogueBuilder('term_taxi_tekstil')
  .addNode('intro', 'ТЕРМИНАЛ-ТАКСИ', 'Выберите пункт назначения. Текущий район: Текстильщики.', [
    { text: 'В Кузьминки (10 Bits).', nextId: 'confirm_kuzminki', cost: 10 },
    { text: 'В Люблино (15 Bits).', nextId: 'confirm_lublino', cost: 15 },
    { text: '[Выйти]', nextId: 'LEAVE' }
  ])
  .addNode('confirm_kuzminki', 'СИСТЕМА', 'Маршрут до Кузьминок проложен. Списание Bits подтверждено.', [
    { text: '[ ПУТЕШЕСТВОВАТЬ ]', nextId: 'TRAVEL_KUZMINKI' }
  ])
  .addNode('confirm_lublino', 'СИСТЕМА', 'Маршрут до Люблино проложен. Списание Bits подтверждено.', [
    { text: '[ ПУТЕШЕСТВОВАТЬ ]', nextId: 'TRAVEL_LUBLINO' }
  ])
  .addNode('TRAVEL_KUZMINKI', 'СИСТЕМА', 'Переподключение к узлу Кузьминки...', [
    { text: '...', nextId: 'LEAVE' }
  ])
  .addNode('TRAVEL_LUBLINO', 'СИСТЕМА', 'Переподключение к узлу Люблино...', [
    { text: '...', nextId: 'LEAVE' }
  ])
  .build();

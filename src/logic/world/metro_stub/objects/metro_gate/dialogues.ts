import { DialogueBuilder } from '../../../../dialogueUtils';

export const metro_gate_dialogues = new DialogueBuilder('metro_gate').withDistrict('kitay_gorod')
  .addNode('intro', 'ТУРНИКЕТ', 'Проверка права прохода: валюта, токен или контрактный приоритет.', [
    { text: 'Оплатить проход (100 Bits).', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
    { text: 'Пройти по транспортному жетону.', nextId: 'LEAVE', effect: 'TRAVEL', cardRewardId: 'kitay_gorod', cost: 100 },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .build();

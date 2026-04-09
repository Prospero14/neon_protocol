import { DialogueBuilder } from '../../../../dialogueUtils';

export const metro_dispatch_dialogues = new DialogueBuilder('metro_dispatch').withDistrict('kitay_gorod')
  .addNode('intro', 'ДИСПЕТЧЕР', 'Метро сейчас работает в режиме заглушки района: базовая логистика, токены, межрайонные окна. Нужен жетон или тестовый контракт?', [
    { text: 'Выдать транспортный жетон.', nextId: 'intro', effect: 'GIVE_ITEM', cardRewardId: 'itm_taxi_token' },
    { text: '[КОНТРАКТ] Тест линии пересадки.', nextId: 'intro', awardQuestId: 'q_metro_transfer_check' },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .build();

import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_exchange_dialogues = new DialogueBuilder('term_exchange').withDistrict('vykhino')
  .addNode('intro', 'ЛИКВИД_ТЕРМИНАЛ', 'Курс: 100 Bits = 20 Репутации Анархистов (VOID).', [
      { text: 'Купить Репутацию (100 Bits)', nextId: 'success', cost: 100, effect: 'GIVE_REPUTATION', amount: 20, cardRewardId: 'ANARCHO_VOID' },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('success', 'ЛИКВИД_ТЕРМИНАЛ', 'Транзакция завершена. Вы ближе к Пустоте.', [
      { text: 'Назад', nextId: 'intro' }
  ])
  .build();

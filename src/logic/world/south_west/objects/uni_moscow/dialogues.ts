import { DialogueBuilder } from '../../../../dialogueUtils';

export const uni_moscow_dialogues = new DialogueBuilder('uni_moscow')
  .addNode('intro', 'УНИВЕРСИТЕТ ЮГО-ЗАПАДА', 'Добро пожаловать в архив знаний. Доступ к учебным модулям открыт для всех, у кого достаточно Bits.', [
    { text: 'Купить Core: Ping (50 Bits)', nextId: 'intro', cost: 50, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

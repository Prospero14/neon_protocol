import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_metro_dialogues = new DialogueBuilder('shop_metro')
  .addNode('intro', 'РАДИО_ПАЛАТКА', 'Модули из метро. Дешево, сердито, работает.', [
      { text: 'Socket Wrapper (25 Bits)', nextId: 'intro', cost: 25, effect: 'GIVE_CARD', cardRewardId: 'fn_socket_wrap' },
      { text: 'Debug Buffer (35 Bits)', nextId: 'intro', cost: 35, effect: 'GIVE_CARD', cardRewardId: 'soft_buffer_v1' },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

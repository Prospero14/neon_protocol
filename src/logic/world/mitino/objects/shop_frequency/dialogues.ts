import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_frequency_dialogues = new DialogueBuilder('shop_frequency')
  .addNode('intro', 'ЧАСТОТА 440', 'Только высокочастотные модули. Оплата в Bits, гарантия — до выхода из лавки.', [
    { text: 'Frequency Booster (45 Bits)', nextId: 'intro', cost: 45, effect: 'GIVE_CARD', cardRewardId: 'soft_freq_boost' },
    { text: 'Sync Buffer (65 Bits)', nextId: 'intro', cost: 65, effect: 'GIVE_CARD', cardRewardId: 'soft_buffer_v2' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

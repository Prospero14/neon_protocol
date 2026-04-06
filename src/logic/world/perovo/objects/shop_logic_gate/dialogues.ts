import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_logic_gate_dialogues = new DialogueBuilder('shop_logic_gate')
  .addNode('intro', 'ЛАВКА "ЛОГИКА"', 'Терминал самообслуживания. Логика для всех: от 10 Bits.', [
      { text: 'Upgrade: Slot.RAM (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'infra_ram_slot' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();

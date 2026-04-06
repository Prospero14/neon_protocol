import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_cosmo_port_dialogues = new DialogueBuilder('bar_cosmo_port')
  .addNode('intro', 'БАР "БАЙКОНУР"', 'Стены бара обклеены старыми чертежами ракет и фотографиями Гагарина. Здесь всегда пахнет керосином и дешевым спиртом. Посетители — в основном инженеры и выгоревшие SRE.', [
      { text: 'Коктейль "Первая Ступень" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30 },
      { text: 'Полная заправка баков (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100 },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .build();

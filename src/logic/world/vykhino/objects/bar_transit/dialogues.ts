import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_transit_dialogues = new DialogueBuilder('bar_transit')
  .addNode('intro', 'БАР_ТРАНЗИТ', 'Грязно, шумно и пахнет "Синтез-спиртом". Зато лучшая изоляция в секторе.', [
      { text: 'Стимулятор "Выдох" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30, subtext: 'Восстанавливает 30 HP.' },
      { text: 'Промыть соты (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100, subtext: 'Максимальное восстановление.' },
      { text: 'БАТЯ ПРОСИЛ ПЕРЕДАТЬ ПРИВЕТ... [СОБРАТЬ ДОЛГ]', nextId: 'tax_collect', requireQuestId: 'q_vykhino_transit_tax' },
      { text: '[Выйти]', nextId: 'LEAVE' }
  ])
  .addNode('tax_collect', 'БАР_ТРАНЗИТ', '*нервно сглатывает озон* Ох... Батя... Забирай, только не надо больше "приветов".', [
      { text: 'Так-то лучше.', nextId: 'intro' }
  ])
  .build();

import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_chips_dialogue: DialogueTree = new DialogueBuilder('bar_chips')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'СИНИЙ ЧИП', 'Запах дешевого озона и перегретого пластика. Можешь охладить нейроны без риска подцепить вирус.', [
    { text: 'Заказать охладитель (25 Bits)', nextId: 'intro', cost: 25, effect: 'RESTORE_HP', amount: 30 },
    { text: 'Послушать сплетни (5 Bits)', nextId: 'lore_bar', cost: 5 },
    { text: '[УЙТИ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СИНИЙ ЧИП', 'Тихий вечер в Силосах. Редкость. Садись, пока генератор не моргнул. Чем остудить процессор?', [
    { text: 'Заказать охладитель (25 Bits)', nextId: 'intro', cost: 25, effect: 'RESTORE_HP', amount: 30 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore_bar', 'БАРМЕН', 'Говорят, в Силосе №12 вчера видели кого-то из "Элиты". Искали старые бэкапы... Странно это.', 'intro')
  .build();

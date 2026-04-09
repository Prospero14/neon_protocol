import { DialogueBuilder } from '../../../../dialogueUtils';

export const bar_oil_can_dialogues = new DialogueBuilder('bar_oil_can').withDistrict('tekstilschiki')
  .addNode('intro', 'МАСЛЕНКА', 'Запах синтетического масла и дешевого спирта. Бармен-дрон лениво протирает стойку. Что закажете?', [
    { text: 'Купить выпивку [Магазин]', nextId: 'intro', effect: 'RESTORE_HP', amount: 30 },
    { text: 'Послушать сплетни (Social).', nextId: 'rumors' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('rumors', 'БАРМЕН', 'Говорят, на 7-й линии опять завелись "жуки". Старейшина Влад ищет кого-то, кто не боится испачкать руки в коде. (+Intel: District_Rumors)', 'intro')
  .build();

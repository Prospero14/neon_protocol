import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_scavenger_dialogue: DialogueTree = new DialogueBuilder('npc_scavenger')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'СТЕРВЯТНИК', 'Слыхал? В Pavilion #5 нашли старые кластеры. У меня есть скрап и битые модули. Хочешь купить? Или продаешь свой хлам? В руинах ВДНХ много сокровищ.', [
    { text: 'Продать скрап данных (15 Bits)', nextId: 'trade', effect: 'GIVE_BITS', amount: 15 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СТЕРВЯТНИК', '*копается в ржавом блоке питания* Опять ты. Ищешь "Ретро-Тех"? У меня только то, что удалось вырвать у системных ботов. Берешь?', [
    { text: 'Сдать скрап (15 Bits)', nextId: 'trade', effect: 'GIVE_BITS', amount: 15 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'СТЕРВЯТНИК', 'О, мой лучший копатель логов! Для тебя есть пара запчастей "от своих". Дам хороший курс за твой скрап. Что нашел?', [
    { text: 'Сдать скрап (20 Bits)', nextId: 'trade_friendly', effect: 'GIVE_BITS', amount: 20 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'СТЕРВЯТНИК', 'Твой ID светится как патрульный дрон. Я не торгую с теми, кто на поводке у Voskhod. Сгинь!', [
    { text: 'Я сам по себе.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'СТЕРВЯТНИК', 'Ты... вибрируешь громче старого трансформатора. Уходи, пока не замкнуло мои платы. В "Восток-1" есть остывочное.', [
    { text: 'Остываю.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'СТЕРВЯТНИК', 'Снова в рейдах? Скрап — это жизнь. Показывай, что вытряс из павильонов.', [
    { text: 'Сдать детали (15 Bits)', nextId: 'trade', effect: 'GIVE_BITS', amount: 15 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === TRADE ===
  .addNode('trade', 'СТЕРВЯТНИК', 'Хлам, битые сектора... Дам 15 Bits. Согласен?', [
    { text: 'Забрал Bits.', nextId: 'intro' }
  ])
  .addNode('trade_friendly', 'СТЕРВЯТНИК', 'Держи 20 Bits. Твои логи — чистый мед.', [
    { text: 'Сделка.', nextId: 'intro' }
  ])

  .build();

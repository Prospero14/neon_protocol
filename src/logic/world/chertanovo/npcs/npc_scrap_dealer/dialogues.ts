import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_scrap_dealer_dialogue: DialogueTree = new DialogueBuilder('npc_scrap_dealer')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ТОРГОВЕЦ_ШЛАМОМ', 'Скупаю всё, что греется. Есть лишние модули или Bits? В Чертаново мусор — это тоже валюта.', [
    { text: 'Я хочу сдать скрап (20 Bits)', nextId: 'trade', effect: 'GIVE_BITS', amount: 20 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ТОРГОВЕЦ_ШЛАМОМ', '*копается в горе плат* Гляди-ка... Свежий лог с Октябрьской. Хочешь купить или сдать свое?', [
    { text: 'Сдать скрап (20 Bits)', nextId: 'trade', effect: 'GIVE_BITS', amount: 20 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ТОРГОВЕЦ_ШЛАМОМ', 'А, мой лучший поставщик! Твой скрап — чистый мед. Дам тебе бонус в следующий раз. Что принес?', [
    { text: 'Сдать детали (30 Bits)', nextId: 'trade_friendly', effect: 'GIVE_BITS', amount: 30 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ТОРГОВЕЦ_ШЛАМОМ', 'Я не торгую с "синими". Твое ID пахнет Регуляторами. Уходи, пока я не вызвал потрошителей.', [
    { text: 'Я изменюсь.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ТОРГОВЕЦ_ШЛАМОМ', 'Парень, ты вибрируешь. Твой FPS скоро упадет до нуля. Иди... выпей чего-нибудь, а то взорвешься прямо на моем товаре.', [
    { text: 'Я в порядке.', nextId: 'intro' },
    { text: 'Пойду остыну.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ТОРГОВЕЦ_ШЛАМОМ', 'Снова ты. Очистили еще пару складов? Чертаново это любит. Погнали сделку.', [
    { text: 'Сдать скрап (20 Bits)', nextId: 'trade', effect: 'GIVE_BITS', amount: 20 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === TRADE ===
  .addNode('trade', 'ТОРГОВЕЦ_ШЛАМОМ', 'Хлам, битые сектора... Дам 20 Bits. Честная цена для Гетто.', [
    { text: 'Забрал Bits.', nextId: 'intro' }
  ])
  .addNode('trade_friendly', 'ТОРГОВЕЦ_ШЛАМОМ', 'Для тебя — 30 Bits. Твои логи стоят больше, чем этот мусор.', [
    { text: 'Сделка.', nextId: 'intro' }
  ])

  .build();

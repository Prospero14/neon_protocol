import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_gennady_dialogues = new DialogueBuilder('npc_gennady')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed']
  })
  .addNode('intro', 'ГЕНА_СКУПЩИК', 'Чего застыл? Если не покупаешь и не продаешь — проходи мимо. Ядро в затылок дышит.', [
    { text: 'Нужны драйверы 1974 года для БЭСМ.', nextId: 'quest_vintage_check', requireQuestId: 'q_besm_vintage_code' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ГЕНА_СКУПЩИК', '*оглядывается* Регуляторы прозванивают рынок. Есть что стоящее или тень наводишь?', [
    { text: 'Нужны драйверы БЭСМ.', nextId: 'quest_vintage_check', requireQuestId: 'q_besm_vintage_code' }
  ])
  .addNode('intro_hostile', 'ГЕНА_СКУПЩИК', 'Логи говорят ты "СТУКАЧ". Уматывай, пока я не слил IP потрошителям.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'ГЕНА_СКУПЩИК', 'Твои пакеты дрожат, парень. Либо ты под кайфом, либо под прицелом. В любом случае — здесь тебе не рады в таком виде. Скройся.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('quest_vintage_check', 'ГЕНА_СКУПЩИК', 'БЭСМ? Музейный экспонат! Есть чип "Legacy Core", но он битый. За так не отдам.', [
    { text: 'Заплатить 50 Bits.', nextId: 'quest_vintage_deal', cost: 50 },
    { text: 'Обменять на редкую карту "Ping Flood".', nextId: 'quest_vintage_deal', requireItemId: 'fn_ping_flood', effect: 'REMOVE_ITEM' },
    { text: 'Это для Генерала БЭСМ на ВДНХ. (Lore)', nextId: 'quest_vintage_lore' },
    { text: 'Слишком дорого.', nextId: 'intro' }
  ])
  .addNode('quest_vintage_lore', 'ГЕНА_СКУПЩИК', 'БЭСМ всё еще коптит? Он вытащил моего брата из-под дефрагментации. Забирай за 10 Bits, но должок за тобой.', [
    { text: 'Спасибо, Гена. (10 Bits)', nextId: 'quest_vintage_deal', cost: 10, effect: 'GIVE_REPUTATION', amount: 10 }
  ])
  .addNode('quest_vintage_deal', 'ГЕНА_СКУПЩИК', 'Держи. Скажи Генералу, пусть не забывает, кто его кормит историей.', [
    { text: 'Забрать чип.', nextId: 'intro', completeQuestId: 'q_besm_vintage_code' }
  ])
  .build();

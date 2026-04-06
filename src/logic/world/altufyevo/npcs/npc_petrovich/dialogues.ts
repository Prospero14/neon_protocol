import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_petrovich_dialogue: DialogueTree = new DialogueBuilder('npc_petrovich')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ПЕТРОВИЧ', 'Здорово, племяш. Чинишься помаленьку? Тут один старый клиент из Митинского радиорынка жалуется — у него в Северных Силосах старое оборудование взбесилось. Скрипты-зомби забили всю шину, новые чипы не прошиваются. Поможешь ветерану?', [
    { text: 'Что за Скрипты-зомби?', nextId: 'lore_zombie' },
    { text: 'Я готов зачистить драйверы.', nextId: 'quest_accept' },
    { text: 'Бывай, дядюшка.', nextId: 'farewell' }
  ])
  .addNode('intro_v2', 'ПЕТРОВИЧ', '*паяет плату* ...Ещё один битый конденсатор. Молодёжь, всё через софт, а руками работать — религия. Ты, вижу, не из декоративных. Нужна помощь с Силосами?', [
    { text: 'Что случилось в Силосах?', nextId: 'lore_zombie' },
    { text: 'Я готов.', nextId: 'quest_accept' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'ПЕТРОВИЧ', 'Опа. Живой клиент. Не часто тут появляются деки без трещин на экране. У меня завал — Силосы фонят, железо бастует. Есть руки — есть работа.', [
    { text: 'Расскажи подробнее.', nextId: 'lore_zombie' },
    { text: 'Давай контракт.', nextId: 'quest_accept' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ПЕТРОВИЧ', 'О, свой человек! Помню-помню, ты мне тогда здорово помог. Без лишних разговоров — есть дельце посерьёзнее. Интересует?', [
    { text: 'Всегда готов, Петрович.', nextId: 'quest_accept' },
    { text: 'Расскажи, что нового в Силосах?', nextId: 'lore_zombie' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'ПЕТРОВИЧ', '*протягивает банку с охладом* Настоящий мастер! У тебя руки как у хирурга — чистые логи, ни одной утечки. Садись, поговорим за работу.', [
    { text: 'Что надо чинить?', nextId: 'quest_accept' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ПЕТРОВИЧ', '*отворачивается от верстака* Ты? После того, что ты накосячил? Мне Серый рассказал — ты данные клиентов налево сливал. Проваливай, пока я тебя в CRC-хеш не закатал.', [
    { text: 'Это недоразумение...', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ПЕТРОВИЧ', '*снимает очки* Эй-эй, полегче. Ты фонишь как старый блок питания. Перегрев? Сходи к Синему Чипу, остынь. Потом поговорим.', [
    { text: 'Мне нужна работа, не отдых.', nextId: 'quest_accept' },
    { text: 'Ладно, остыну.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ПЕТРОВИЧ', 'А, это ты. Помню — ты единственный, кто вернулся из Силоса #7 без перегрева. Молодца. Есть ещё работёнка, если не растерял хватку.', [
    { text: 'Давай, Петрович.', nextId: 'quest_accept' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat_v2', 'ПЕТРОВИЧ', 'Снова в мастерской? Слышал, в Силосе #12 опять крысы шуршат. Но это уже для опытных — не для стажёров. Потянешь?', [
    { text: 'Потяну.', nextId: 'quest_accept' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_zombie', 'ПЕТРОВИЧ', 'Да мусор это, остатки старых прошивок. Они как крысы — плодятся в пустых кластерах и жрут циклы CPU. Без ручного CRC-чека их не выкурить. Формат задачи: DIRECT_PURGE, сложность: JUNIOR.', 'intro')

  // === QUEST ===
  .addNode('quest_accept', 'ПЕТРОВИЧ', 'Вот и ладно. Узел забит под завязку, так что готовь дебаггер. Как закончишь — с меня 50 Bits на охлад.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_kiddo_start' }
  ])

  // === FAREWELL ===
  .addNode('farewell', 'ПЕТРОВИЧ', 'Иди уже. И не забудь сделать бэкап. В Октябре память — единственное, что нельзя украсть...', [
    { text: '[ УЙТИ ]', nextId: 'LEAVE' }
  ])

  .build();

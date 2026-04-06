import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_varvar_dialogue: DialogueTree = new DialogueBuilder('npc_varvar')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ВАРВАР', 'Стой! Проверка контрольной суммы... Ладно, проходи. Видишь это? Магнус, мой хвостатый помощник, заперся в Уборной №4 и случайно активировал протокол "Локаут". Теперь там охранный бот VOSKHOD считает, что туалет — это секретный объект.', [
    { text: 'Кот заперся в туалете?', nextId: 'lore_cat' },
    { text: 'Я разберусь с этим протоколом.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ВАРВАР', '*сканирует периметр* Три! Два! Один! ...Ладно, ты чистый. Знаешь, я тут единственный, кто ещё помнит, как работают ядерные прерывания. А ночью ещё и кота спасать надо...', [
    { text: 'Что за кот?', nextId: 'lore_cat' },
    { text: 'Чем помочь?', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'ВАРВАР', 'Слышал, ты Петровичу силос вычистил? Даже не облучился. Неплохо для новичка. У меня тут проблема потоньше — кот, бот и залипший замок. Классика.', [
    { text: 'Расскажи подробнее.', nextId: 'lore_cat' },
    { text: 'Погнали спасать.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ВАРВАР', '*ослабляет хватку на кабеле* О, проверенный юнит! Магнус тебя помнит — мурчал, когда ты уходил. Есть ещё одна... деликатная задача. Для своих.', [
    { text: 'Я слушаю.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'ВАРВАР', 'Ты вернулся! Магнус уже на свободе, но вентиляция фонит. Хочешь проверить, что там за шум? Без CRC — никуда.', [
    { text: 'Проверю.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ВАРВАР', '*направляет сканер* ТРЕВОГА! Твой хеш не совпадает с доверенным списком. Ты шпион Восхода? Или просто дурак? В любом случае — вон из моего периметра!', [
    { text: 'Я не шпион.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ВАРВАР', '*отступает* Стой-стой-стой! Я ЧУВСТВУЮ твой джиттер отсюда. Ты перегрет, как старый Pentium под нагрузкой. Сначала — в бар. Потом — разговоры.', [
    { text: 'Мне срочно нужна работа.', nextId: 'quest_start' },
    { text: 'Ладно, остыну.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ВАРВАР', 'Магнус! Наш герой вернулся! *кот мяукает* Видишь, он тебя узнал. Есть ещё дела в Силосах. Интересует?', [
    { text: 'Что на этот раз?', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat_v2', 'ВАРВАР', 'Опять в моем секторе. Ладно, пароль — "дефрагментация". CRC совпал. Есть пара координат с аномалиями.', [
    { text: 'Показывай.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_cat', 'ВАРВАР', 'Он не просто кот, он — ходячая уязвимость! Активировал IoT-блокировку по отпечатку лапы. Теперь система очистки считает любого входящего "критическим багом". Клиент — моя психика. Формат: BYPASS_SECURITY.', 'intro')

  // === QUEST ===
  .addNode('quest_start', 'ВАРВАР', 'Уборная №4 — там сейчас жарко. Взломай систему очистки, и я дам тебе одну из своих старых наработок.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_altufyevo_combat_magnus_toilet_bug_sweep' }
  ])

  .build();

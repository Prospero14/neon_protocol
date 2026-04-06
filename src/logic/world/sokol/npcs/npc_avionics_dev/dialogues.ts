import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_avionics_dev_dialogue: DialogueTree = new DialogueBuilder('npc_avionics_dev')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'АВИОНИК-РАЗРАБОТЧИК', 'Весь этот мир держится на прерываниях реального времени... Почему дроны не падают? Потому что у нас есть Чистый Синтаксис. Ты пришел учиться или принес "Стриж-4"?', [
    { text: 'Расскажи про системы.', nextId: 'lore_talk' },
    { text: 'В чем помочь?', nextId: 'quest_fetch_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'АВИОНИК-РАЗРАБОТЧИК', '*кодит на ассемблере* Опять утечка в 16-битном сегменте... У тебя в руках дека или просто калькулятор с подсветкой? Если хочешь Bits — покажи, на что способен твой стек.', [
    { text: 'Я готов к работе.', nextId: 'quest_fetch_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'АВИОНИК-РАЗРАБОТЧИК', 'А, мой любимый внештатный отладчик! Чип "Стриж" работает как швейцарские часы 1970-х. Есть еще пара "дырявых" логов в авионике. Поможешь?', [
    { text: 'Помогу.', nextId: 'quest_fetch_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'АВИОНИК-РАЗРАБОТЧИК', 'Твой код пахнет Windows 95. Это оскорбление для моего терминала. Проваливай, пока я не удалил твой загрузчик.', [
    { text: 'Я остыну.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'АВИОНИК-РАЗРАБОТЧИК', 'У тебя... переполнение стека в реальном времени. Ты сейчас зависнешь, юнит. Сделай "halt" в баре, промой охлаждайки.', [
    { text: 'Я в норме.', nextId: 'intro' },
    { text: 'Пойду.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'АВИОНИК-РАЗРАБОТЧИК', 'Ищешь истину в ассемблере? Ну заходи, прошивка "вскипает", а дедлайн был вчера. Готов к стресс-тесту?', [
    { text: 'Готов.', nextId: 'quest_fetch_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_sokol_fetch_chip_quest' })

  // === LORE ===
  .addLoreNode('lore_talk', 'АВИОНИК-РАЗРАБОТЧИК', 'Авионика — это религия EU Syntax. Мы верим в Чистый Взлет и безупречные прерывания. Без нас Москва бы ослепла и оглохла за один такт.', 'intro', 'Авионика')

  // === QUESTS ===
  .addNode('quest_fetch_start', 'АВИОНИК-РАЗРАБОТЧИК', 'Мне нужен старый чип "Стриж-4" для калибровки бортовых систем. У Семёныча должен быть ящик таких в каптёрке. Проштампуй ему сигнатуру "Sokol_Dev" и принеси железку. Справишься?', [
    { text: '[ ПРИНЯТЬ: ПОИСК ЧИПА ]', nextId: 'LEAVE', awardQuestId: 'q_sokol_fetch_chip_quest' },
    { text: 'Я занят.', nextId: 'intro' }
  ])

  .build();

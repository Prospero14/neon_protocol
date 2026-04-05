import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const tekstilschiki_dialogues: Record<string, DialogueTree> = {
  // --- VLAD (REDUNDANTS WEAVER) ---
  npc_vlad: new DialogueBuilder('npc_vlad')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'ВЛАД_ТКАЧ', 'Смотри под ноги, хакер. Тут везде оптоволоконные нити. Я Влад, слежу, чтобы Текстильщики не расплелись. Твой стек выглядит... неподготовленным.', [
      { text: 'Кто такие Redundants?', nextId: 'lore_faction' },
      { text: 'Я принес детали от Мастера Верстака.', nextId: 'quest_verstak_finish', requireQuestId: 'q_izmailovo_master_verstak_parts' },
      { text: 'Нужна работа по зачистке.', nextId: 'quest_explain_1' },
      { text: 'Расскажи про Старшего Ткача.', nextId: 'lore_vlad' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_verstak_finish', 'ВЛАД_ТКАЧ', 'Детали от Верстака? Наконец-то. Наш станок уже начал сбоить. Вот, забирай свою долю Bits за доставку.', [
      { text: 'Спасибо, Влад.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_izmailovo_master_verstak_parts' }
    ])
    .addNode('intro_v2', 'ВЛАД_ТКАЧ', '*поправляет кабель* Еще один юнит. В Текстильщиках мы ценим плотность плетения. Ты пришел за наукой или за Bits?', [
      { text: 'Заработать Bits.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'ВЛАД_ТКАЧ', 'А, ценитель! Твои логи сплетены грамотно, без лишних "гоуто". Есть дыра в 7-й линии. Поможешь?', [
      { text: 'Готов шить.', nextId: 'quest_explain_1' }
    ])
    .addNode('intro_hostile', 'ВЛАД_ТКАЧ', 'Везде корпоративный дешевый пластик. Проваливай из зоны, пока я не зациклил твой порт.', [
      { text: 'Я ухожу.', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'ВЛАД_ТКАЧ', 'Redundants — те, кто помнит. Мы не пишем код, мы его плетем. Храним традиции физического уровня. (+10 Репутации)', 'intro', 'Redundants', { effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'VOSKHOD_OFFICE' })
    .addLoreNode('lore_vlad', 'ВЛАД_ТКАЧ', 'Старший сидит в центре узла. Держит в голове паттерны, которые писали до твоего рождения. Без него тут всё развалится.', 'intro')
    .addNode('quest_explain_1', 'ВЛАД_ТКАЧ', 'На 7-й линии боты-ткачи словили "Null". Теперь они видят угрозу в любом движении. Как будешь работать?', [
      { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
      { text: 'Удаленный обход (Technical).', nextId: 'quest_tech_path', requireMinLevel: 3 },
      { text: 'Договориться (Social).', nextId: 'quest_social_path', requireReputation: { factionId: 'REDUNDANTS', minPoints: 15 } }
    ])
    .addNode('quest_explain_2', 'ВЛАД_ТКАЧ', 'Десятки запросов в секунду. Если дека не умеет в многопоточность — задавит объемом. Рискнешь?', [
      { text: 'Проверяй паттерн.', nextId: 'rank_check' },
      { text: 'Надо подумать.', nextId: 'intro' }
    ])
    .addNode('quest_tech_path', 'ВЛАД_ТКАЧ', 'Перехват через отладочный порт? Смело. Если прерывание чистое — перезагрузятся без боя. Берешься?', [
      { text: 'Да. Проверяй.', nextId: 'rank_check' }
    ])
    .addNode('quest_social_path', 'ВЛАД_ТКАЧ', 'Репутация дает сервисные ключи. Убеди контроллер, что ты техник. Готов?', [
      { text: 'Готов. Сканируй.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'ВЛАД_ТКАЧ', 'Дай гляну паттерн... (Проводит щупом по порту...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ВЛАД_ТКАЧ', 'Ха! На деке еще нет защитного плетения. Нос не дорос до промышленных ботов. Иди тренируйся.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ВЛАД_ТКАЧ', 'Сигнатура плотная. Контракт твой. 7-я линия ждет. Приступай к плетению реальности.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_tekstilschiki_combat_textile_raid_bug_sweep' }
    ])
    .build(),

  // --- SENIOR WEAVER (LEADER) ---
  npc_weaver_senior: new DialogueBuilder('npc_weaver_senior')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      hostile: ['intro'],
      stressed: ['intro'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'СТАРШИЙ_ТКАЧ', 'Нити судьбы спутались... или это плохой код? Каждому паттерну нужен свой поток. Ты пришел за наукой или за работой?', [
      { text: 'Что за паттерны?', nextId: 'lore' },
      { text: 'Мне нужен "Промышленный Паттерн".', nextId: 'quest_pattern_start' },
      { text: 'Я принес Паттерн из Академии.', nextId: 'quest_pattern_finish', requireQuestId: 'q_weaver_pattern' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'СТАРШИЙ_ТКАЧ', 'Паттерн — это образ мысли Ядра. Если знаешь его, предскажешь любой баг. Но истинные узоры в архивах Академии. (+Intel: Grid_Looming)', 'intro')
    .addNode('quest_pattern_start', 'СТАРШИЙ_ТКАЧ', 'Нам нужен утерянный "Grid_Optimizer_v2" из Мейнфрейма Академии. Как планируешь его достать?', [
        { text: 'К Профессору Архипову (Standard).', nextId: 'rank_check' },
        { text: 'Извлеку из локальной ткани (Technical).', nextId: 'quest_pattern_tech', requireMinLevel: 4 },
        { text: 'Связи с Voskhod (Social).', nextId: 'quest_pattern_social', requireReputation: { factionId: 'VOSKHOD', minPoints: 20 } }
    ])
    .addNode('quest_pattern_tech', 'СТАРШИЙ_ТКАЧ', 'Извлечь из ткани? Если уровень декодирования позволит — соберешь по частям. Но это нагрузка на CPU.', [
      { text: 'Мой CPU готов. Сканируй.', nextId: 'rank_check' }
    ])
    .addNode('quest_pattern_social', 'СТАРШИЙ_ТКАЧ', 'Дружба с Генералом БЭСМ полезна. У них есть дампы. Это ускорит процесс. Готов?', [
      { text: 'Я договорюсь. Сканируй.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'СТАРШИЙ_ТКАЧ', 'Смотри мне в объектив... (Анализирует нейронную структуру...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'СТАРШИЙ_ТКАЧ', 'Нет. Узор слишком прост. Ты — шум в системе. Прикоснешься к этому коду — он поглотит твою личность.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'СТАРШИЙ_ТКАЧ', 'У тебя есть потенциал стать мастером. Контракт твой. Найди Профессора Архипова или свой путь.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_weaver_pattern' }
    ])
    .addNode('quest_pattern_finish', 'СТАРШИЙ_ТКАЧ', '*рассматривает данные* Тончайшая работа, юнит. С этим Текстильщики станут неприступными. Спасибо.', [
      { text: 'Рад помочь.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_weaver_pattern' }
    ])
    .build(),

  // --- SHOPS & OTHERS ---
  shop_armor_weave: new DialogueBuilder('shop_armor_weave')
    .addNode('intro', 'ЛАВКА_БРОНЕПЛЕТЕНИЯ', 'Защита из чистого Java. Выдерживает даже агрессивный Garbage Collection.', [
        { text: 'Weave Shield (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'def_stability_patch' },
        { text: 'Steel Thread (70 Bits)', nextId: 'intro', cost: 70, effect: 'GIVE_TRAIT', cardRewardId: 'stack_archaeologist' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  bar_oil_can: new DialogueBuilder('bar_oil_can')
    .addNode('intro', 'КАБАК_МАСЛЕНКА', 'Здесь пахнет маслом и изоляцией. Идеально для инженеров.', [
        { text: 'Стакан "Ниппель" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 35 },
        { text: 'Полная замена масла (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100 },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  npc_safety_auditor: new DialogueBuilder('npc_safety_auditor')
    .addNode('intro', 'АУДИТОР_БЕЗОПАСНОСТЬ', 'Дека подозрительна. Неоптимизированные прыжки. Пройти аудит GigaBank?', [
        { text: 'Пройти аудит.', nextId: 'lore' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'АУДИТОР_БЕЗОПАСНОСТЬ', 'Слишком много импортов. Вы — ходячая дыра. Но это... приемлемо. (+5 Репутации)', 'LEAVE', 'GigaBank', { effect: 'GIVE_REPUTATION', amount: 5, cardRewardId: 'GIGA_BANK' })
    .build(),

  term_loom_control: new DialogueBuilder('term_loom_control')
    .addNode('intro', 'УЗЕЛ_УПРАВЛЕНИЯ', '[SYSTEM] ЦИКЛ_ПЛЕТЕНИЯ_АКТИВЕН. ВЫБЕРИТЕ_РЕЖИМ:', [
        { text: 'Посмотреть чертежи Октября', nextId: 'lore' },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'УЗЕЛ_УПРАВЛЕНИЯ', '[DATA] Схема "Октябрь": 99% отказоустойчивости. Фундамент Текстильщиков.', 'intro')
    .build(),

  term_taxi_tekstil: new DialogueBuilder('term_taxi_tekstil', 's')
    .addNode('s', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Текстильщики. Перегружено. Нужен спец-код Redundants.', [
      { text: 'Купить проезд (100 Bits)', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ])
    .build(),

  job_board_tekstil: new DialogueBuilder('job_board_tekstil', 'intro')
    .addNode('intro', 'УЗЕЛ_ТЕКСТИЛЬ', 'Переполнение логов на 7-й линии. Нужна зачистка sudo-процессов.', [
      { text: 'Взять контракт: Wash Logs (50 Bits)', nextId: 'accept' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('accept', 'УЗЕЛ_ТЕКСТИЛЬ', 'Система готова. Удачной зачистки, юнит.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_tekstilschiki_combat_factory_bot_bug_sweep' }
    ])
    .build(),
};

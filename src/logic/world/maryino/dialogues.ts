import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const maryino_dialogues: Record<string, DialogueTree> = {
  // --- TRACE (QA) ---
  npc_tanya: new DialogueBuilder('npc_tanya')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'TRACE (QA)', 'Внимание: целостность памяти скомпрометирована... Ты из тех, кто может пропинговать реальность?', [
      { text: 'Как именно пропинговать?', nextId: 'lore_stress' },
      { text: 'Кто такие Federal Oversight?', nextId: 'lore_faction' },
      { text: 'Нужна работа по профилю?', nextId: 'job_selection' },
      { text: 'Я закончил аудит.', nextId: 'quest_audit_finish', requireQuestId: 'q_maryino_qa_audit' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('job_selection', 'TRACE (QA)', 'В бэклоге пара задач: стресс-тест локалки или аудит безопасности терминалов. Что потянешь?', [
      { text: 'Стресс-тест локалки (Combat).', nextId: 'job_explain_1' },
      { text: 'Аудит терминалов (Logic).', nextId: 'quest_audit_accept' },
      { text: 'Назад.', nextId: 'intro' }
    ])
    .addNode('intro_v2', 'TRACE (QA)', '[SYSTEM_CHECK] Сканирование... В Марьино нестабильный трафик. Есть пара запросов в бэклоге. Интересует?', [
      { text: 'Что за запросы?', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'TRACE (QA)', 'Ноль-один-ноль... Опять лезешь в дебри QA? Нужна грубая сила кода.', [
      { text: 'Я помогу.', nextId: 'job_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'TRACE (QA)', '[STATUS_OK] Сигнатура: "Лояльный Аудитор". Твои правки были безупречны. Есть еще работа.', [
      { text: 'Показывай задачи.', nextId: 'intro' }
    ])
    .addNode('intro_hostile_v2', 'TRACE (QA)', '[ALERT] Твой ID в черном списке. Уходи, пока я не подала запрос на "Hard Reset" твоего сознания.', [
       { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed_v2', 'TRACE (QA)', '[CRITICAL_WARNING] Твой джиттер превышает нормы! "Восход" уже навел сканеры. Дисконнект!', [
       { text: 'Я остыну.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'TRACE (QA)', '[SYNCING] Опять регрессия? Хочешь пройтись по списку задач?', [
       { text: 'Давай.', nextId: 'intro' }
    ])
    .addLoreNode('lore_faction', 'TRACE (QA)', 'Мы — остатки структуры. Пока Nullpointers жгут кабели, мы их прокладываем заново. Нам нужна Стабильность.', 'intro', 'Federal Oversight')
    .addNode('job_explain_1', 'TRACE (QA)', 'Затык в коммутаторах. Нужно зайти и "протолкнуть" трафик грубой силой. Формат: STRESS_TEST.', [
       { text: 'Это безопасно?', nextId: 'job_explain_2' },
       { text: 'Я готов.', nextId: 'job' }
    ])
    .addNode('job_explain_2', 'TRACE (QA)', 'Безопасно? Это QA в Октябре, парень. Бэкапы могут тебя укусить. Берешь узел?', [
      { text: 'Беру.', nextId: 'job' },
      { text: 'Ухожу.', nextId: 'intro' }
    ])
    .addLoreNode('lore_stress', 'TRACE (QA)', 'Нужна грубая сила кода. Ожидаемая задержка: 0ms после твоего фикса.', 'intro')
    .addNode('job', 'TRACE (QA)', 'Узел выделен. Если прозвон пройдет успешно — Bits будут на счету. Приступай.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_maryino_npc_tanya_signal_sweep' }
    ])
    .addNode('quest_audit_accept', 'TRACE (QA)', 'Просканируй три терминала на предмет "Shadow-Header" инъекций. Плачу 50 Bits. Согласен?', [
      { text: 'Я сделаю аудит.', nextId: 'LEAVE', awardQuestId: 'q_maryino_qa_audit' },
      { text: 'Нет.', nextId: 'intro' }
    ])
    .addNode('quest_audit_finish', 'TRACE (QA)', 'Сигнатуры чисты. Аномалий нет. Оплата переведена.', [
       { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 50, completeQuestId: 'q_maryino_qa_audit' }
    ])
    .build(),

  // --- RAT (NULLPOINTERS) ---
  npc_rat: new DialogueBuilder('npc_rat')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'КРЫСА_КУРЬЕР', 'Пи-пи... Вижу тебя. Твоя дека фонит или мне кажется?', [
        { text: 'Что за шум в Марьино?', nextId: 'lore_district' },
        { text: 'Кто такие Nullpointers?', nextId: 'lore_faction' },
        { text: 'Мне нужен хладагент для Мастера Верстака.', nextId: 'quest_cooling_finish', requireQuestId: 'q_verstak_cooling' },
        { text: 'Петрович просил вернуть "Zero-Point" чип...', nextId: 'quest_rogue_module_rat', requireQuestId: 'q_petrovich_rogue_module' },
        { text: 'Нужны Bits. Есть работа?', nextId: 'job_selection' },
        { text: 'Я "приватизировал" детали для склада.', nextId: 'quest_scrap_raid_finish', requireQuestId: 'q_maryino_scrap_raid' },
        { text: 'Я готов помочь с проходом через шлюзы.', nextId: 'passage_lead', requireQuestId: 'q_maryino_passage' },
        { text: '[Прогнать]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_district', 'КРЫСА_КУРЬЕР', 'Пи! Марьино — цифровое кладбище. Тут дампы, тут призраки, тут... мы. Nullpointers.', 'intro')
    .addNode('job_selection', 'КРЫСА_КУРЬЕР', 'Есть пара вариантов: либо отбить ферму в Overflow, либо навести шороху на складе. Что выберешь?', [
      { text: 'Отбить ферму (Combat).', nextId: 'quest_explain_1' },
      { text: 'Взлом склада (Stealth/Combat).', nextId: 'quest_scrap_raid_accept' },
      { text: 'Назад.', nextId: 'intro' }
    ])
    .addNode('intro_v2', 'КРЫСА_КУРЬЕР', 'Пи! Пахнешь озоном. В Overflow сегодня жарко. Хочешь Bits или будешь ждать, пока всё сгорит?', [
      { text: 'Что за дело?', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'КРЫСА_КУРЬЕР', 'Стой! Пи-пи... Твоя дека — не просто кусок пластика. Есть узел con данными.', [
      { text: 'Показывай координаты.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'КРЫСА_КУРЬЕР', 'Пи! Брат по Пустоте! Вижу, ты не попался Federal Oversight. У нас "жирный" заказ.', [
       { text: 'Я в деле.', nextId: 'intro' }
    ])
    .addNode('intro_hostile_v2', 'КРЫСА_КУРЬЕР', 'У тебя клеймо "Доносчик"! Мои сородичи уже перегрызли твои маршруты. Убирайся!', [
       { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'КРЫСА_КУРЬЕР', 'Пи! Мы — серые зоны. Мы то, что они называют "ошибкой". Свободны от налогов и лицензий.', 'intro', 'Nullpointers')
    .addNode('quest_explain_1', 'КРЫСА_КУРЬЕР', 'В Overflow Zone лежит архив логов. Нужно зайти и выкачать ядро. Будут боты "Восход". Справишься?', [
        { text: 'А если боты меня заметят?', nextId: 'quest_explain_2' },
        { text: 'Показывай контракт.', nextId: 'rank_check' }
    ])
    .addNode('quest_explain_2', 'КРЫСА_КУРЬЕР', 'Пи! Тогда беги! Или бей первым. В Overflow нет правил. Рискнешь?', [
      { text: 'Погнали.', nextId: 'rank_check' },
      { text: 'Нет, опасно.', nextId: 'intro' }
    ])
    .addLoreNode('lore_dump', 'КРЫСА_КУРЬЕР', 'Теневой архив! Нас зажали патрули. Половина Bits — тебе.', 'intro')
    .addNode('quest_cooling_finish', 'КРЫСА_КУРЬЕР', 'Хладагент? "Buffer Liquid"? Отдам за 20 Bits. Скажи Верстаку, я помню долги.', [
        { text: 'Плачу 20 Bits.', nextId: 'intro', cost: 20, effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_verstak_cooling' },
        { text: 'Позже.', nextId: 'intro' }
    ])
    .addNode('passage_lead', 'КРЫСА_КУРЬЕР', 'Пи! Сержант из "Восхода" иногда закрывает глаза... Найди его на юге.', [
        { text: 'Найду.', nextId: 'intro', effect: 'GIVE_TRAIT', cardRewardId: 'trait_maryino_gang_lead' }
    ])
    .addNode('rank_check', 'КРЫСА_КУРЬЕР', 'Так-так... Дай просканирую твой нейро-порт... (Бипы-бупы...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'КРЫСА_КУРЬЕР', 'Пии! Что-то в твоих портах не то. Подрасти, хакер.', [
      { text: 'Я вернусь позже.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'КРЫСА_КУРЬЕР', 'О, сигнатура взрослая. Контракт твой. Overflow Zone ждет.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_rat_data_dump' }
    ])
    .addNode('quest_scrap_raid_accept', 'КРЫСА_КУРЬЕР', 'На складе Fed-Over лежат модули "Arctic-9". Обнули охрану. Плачу 100 Bits.', [
      { text: 'В деле.', nextId: 'LEAVE', awardQuestId: 'q_maryino_scrap_raid' },
      { text: 'Нет.', nextId: 'intro' }
    ])
    .addNode('quest_scrap_raid_finish', 'КРЫСА_КУРЬЕР', 'Пии! Модули наши. Держи соточку, заработал.', [
       { text: 'Честная сделка.', nextId: 'intro', effect: 'GIVE_BITS', amount: 100, completeQuestId: 'q_maryino_scrap_raid' }
    ])
    .addNode('quest_rogue_module_rat', 'КРЫСА_КУРЬЕР', 'Чип "Zero-Point" — моё сокровище. Держит тайминги фермы. С чего мне его отдавать?', [
        { text: 'Там нет защиты от обратного тока. Он выгорит.', nextId: 'quest_rogue_module_tech_1' },
        { text: 'Петрович единственный, кто его не угробит.', nextId: 'quest_rogue_module_social_1' },
        { text: 'Отдай чип или устрою "kernel panic".', nextId: 'quest_rogue_module_scare' },
        { text: 'Я заплачу (50 Bits).', nextId: 'quest_rogue_module_bribe', cost: 50 }
    ])
    .addNode('quest_rogue_module_tech_1', 'КРЫСА_КУРЬЕР', 'Пи! "Не проживёт"? Моя ферма на нем летает! Что с ним случится при нагрузке L3?', [
        { text: 'Выгорит без защиты от обратного тока.', nextId: 'quest_rogue_module_tech_2' },
        { text: 'Тайминги поплывут через 48 часов.', nextId: 'quest_rogue_module_tech_2' }
    ])
    .addNode('quest_rogue_module_tech_2', 'КРЫСА_КУРЬЕР', 'Пи-пи... Видел всплески в логах... Но чем ты его заменишь?', [
        { text: 'Залью патч-эмулятор. Не греется.', nextId: 'quest_rogue_module_negotiate' },
        { text: 'Просто верни его Петровичу.', nextId: 'quest_rogue_module_negotiate' }
    ])
    .addNode('quest_rogue_module_social_1', 'КРЫСА_КУРЬЕР', 'Петрович должен мне с 2098-го! Прислал битые кондеры!', [
        { text: 'Он соберёт тебе БП, если вернёшь модуль.', nextId: 'quest_rogue_module_social_2' }
    ])
    .addNode('quest_rogue_module_social_2', 'КРЫСА_КУРЬЕР', 'Соберет? Ладно, рискнем. Его репутация стоит того. Это в последний раз!', [
        { text: 'Забираю чип.', nextId: 'LEAVE', effect: 'GIVE_ITEM', cardRewardId: 'item_zero_point_chip' }
    ])
    .addNode('quest_rogue_module_scare', 'КРЫСА_КУРЬЕР', 'Пиии! Угрожаешь курьеру? Ладно-ладно, забирай железку.', [
        { text: 'Давно бы так.', nextId: 'LEAVE', effect: 'GIVE_ITEM', cardRewardId: 'item_zero_point_chip' }
    ])
    .addNode('quest_rogue_module_negotiate', 'КРЫСА_КУРЬЕР', 'Убедил. Не хочу пожара. Скажи Петровичу — жду блок питания!', [
        { text: 'Передам. Забираю чип.', nextId: 'LEAVE', effect: 'GIVE_ITEM', cardRewardId: 'item_zero_point_chip' }
    ])
    .addNode('quest_rogue_module_bribe', 'КРЫСА_КУРЬЕР', 'Bits! Это я люблю. Куплю новые процессоры. Держи раритет.', [
        { text: 'Сделка.', nextId: 'LEAVE', effect: 'GIVE_ITEM', cardRewardId: 'item_zero_point_chip' }
    ])
    .build(),

  // --- SARGE (VOSKHOD) ---
  npc_sarge: new DialogueBuilder('npc_sarge')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'СЕРЖАНТ', 'Стой. Дальше только для сотрудников "Восход" или с оплаченным транзитом. Батя из Выхино за тебя просил?', [
      { text: 'Что за "Восход"?', nextId: 'lore' },
      { text: 'Батя прислал меня на прозвон. (q_trace_stress_test)', nextId: 'quest_shluz_accept', requireQuestId: 'q_trace_stress_test' },
      { text: 'Мне сказали, ты поможешь с проходом...', nextId: 'negotiate', requireTrait: 'trait_maryino_gang_lead' },
      { text: 'Нужна работа. (Транзит)', nextId: 'job_selection' },
      { text: 'Сбросил триггеры шлюза.', nextId: 'quest_shluz_finish', requireQuestId: 'q_maryino_shluz_repair' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('job_selection', 'СЕРЖАНТ', 'Всегда нужны люди. Либо зачистка магистрали от дронов, либо ремонт залипшего шлюза. Что потянешь?', [
      { text: 'Зачистка магистрали (Combat).', nextId: 'quest_start', requireQuestId: 'q_maryino_passage' },
      { text: 'Ремонт шлюза (Technical).', nextId: 'quest_shluz_accept' },
      { text: 'Назад.', nextId: 'intro' }
    ])
    .addNode('intro_v2', 'СЕРЖАНТ', 'Опять в логах камер? Говори по делу или проваливай.', [
      { text: 'Нужна работа.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'СЕРЖАНТ', 'А, это ты. Вижу, умеешь решать проблемы без шума. Есть узел для "успокоения".', [
       { text: 'Я готов.', nextId: 'quest_start' }
    ])
    .addNode('intro_hostile', 'СЕРЖАНТ', '[DENIED] Ты во всех ориентировках. Шаг — и активирую турель.', [
       { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'СЕРЖАНТ', 'Я тот, кто держит порядок Марьино. Порядок стоит денег.', 'intro')
    .addNode('quest_start', 'СЕРЖАНТ', 'Дроны-отступники на 15-й магистрали. Разберись — выдам транзитный код. Бесплатно.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_maryino_combat_grid_patrol_bug_sweep' }
    ])
    .addNode('quest_shluz_accept', 'СЕРЖАНТ', 'Шлюз №8 залип. Перемкни контакты в шкафу. Плачу 30 Bits.', [
      { text: 'Сделаю.', nextId: 'LEAVE', awardQuestId: 'q_maryino_shluz_repair' },
      { text: 'Нет.', nextId: 'intro' }
    ])
    .addNode('quest_shluz_finish', 'СЕРЖАНТ', 'Индикатор позеленел. Молодец. Вот твои гроши.', [
       { text: 'Забрал.', nextId: 'intro', effect: 'GIVE_BITS', amount: 30, completeQuestId: 'q_maryino_shluz_repair' }
    ])
    .addNode('negotiate', 'СЕРЖАНТ', 'Хвостатые напели? Транзит на сутки — 50 Bits. Или помоги con узлом — выпишу пропуск бесплатно.', [
      { text: 'Плачу 50 Bits.', nextId: 'LEAVE', cost: 50, effect: 'GIVE_TRAIT', cardRewardId: 'trait_maryino_shluz_unlocked' },
      { text: 'Я помогу.', nextId: 'quest_start' },
      { text: 'Позже.', nextId: 'intro' }
    ])
    .build(),

  // --- TERMINALS & SHOPS ---
  term_taxi_maryino: new DialogueBuilder('term_taxi_maryino', 's')
    .addNode('s', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Марьино. Перегрузка. Требуется приоритетный пропуск.', [
      { text: 'Купить пропуск (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ])
    .build(),

  shop_pharmacy: new DialogueBuilder('shop_pharmacy')
    .addNode('intro', 'ДАТА_АПТЕКА', 'Ампулы con жидким кодом. Патчи для оболочек.', [
        { text: 'Патч "Стабильность" (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'def_stability_patch' },
        { text: 'Сборка "Анти-фриз" (60 Bits)', nextId: 'intro', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'reac_antifreeze' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  bar_packet: new DialogueBuilder('bar_packet')
    .addNode('intro', 'БАР_ПАКЕТ', 'Где пакеты теряются навсегда... Табак и озон.', [
        { text: 'Кружка "Битого Пикселя" (12 Bits)', nextId: 'intro', cost: 12, effect: 'RESTORE_HP', amount: 25 },
        { text: 'Залить кэш (40 Bits)', nextId: 'intro', cost: 40, effect: 'RESTORE_HP', amount: 80 },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  term_404: new DialogueBuilder('term_404')
    .addNode('intro', 'ТЕРМИНАЛ_#404', '[SYSTEM_ERROR] Файл не найден. Обнаружены скрытые дампы.', [
        { text: 'Вскрыть логи (25 Bits)', nextId: 'lore', cost: 25 },
        { text: 'Восстановить разделы.', nextId: 'quest_404_accept' },
        { text: 'Сектора восстановлены.', nextId: 'quest_404_finish', requireQuestId: 'q_maryino_terminal_404' },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addNode('quest_404_accept', 'ТЕРМИНАЛ_#404', '[WARNING] Требуется перезапись MFT. Риск повреждения деки.', [
      { text: '[ ПОРТ: CONNECT ]', nextId: 'LEAVE', awardQuestId: 'q_maryino_terminal_404' }
    ])
    .addNode('quest_404_finish', 'ТЕРМИНАЛ_#404', '[SUCCESS] Обнаружен Bits-архив.', [
      { text: '[ ВЫЙТИ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 120, completeQuestId: 'q_maryino_terminal_404' }
    ])
    .addLoreNode('lore', 'ТЕРМИНАЛ_#404', 'Марьино — цифровое кладбище. Призраки Web 2.0. (+10 Void)', 'intro', 'Void')
    .build(),
};

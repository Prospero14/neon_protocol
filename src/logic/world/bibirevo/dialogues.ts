import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const bibirevo_dialogues: Record<string, DialogueTree> = {
  // --- SIGNALMAN MONYA ---
  npc_signalman: new DialogueBuilder('npc_signalman')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'МОНЯ', 'Сынок, не стой под антенной... Пытаюсь Бибирево к общей сети прикрутить. Обрывы везде! Чего надо?', [
      { text: 'Кто такие Net Drivers?', nextId: 'lore_faction' },
      { text: 'Варвар просил передать бэкап. (Старый долг)', nextId: 'quest_backup_finish', requireQuestId: 'q_altufyevo_varvar_backup' },
      { text: 'Нужна работа по связи?', nextId: 'services' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'МОНЯ', 'Пакеты падают, как снег... Опять ты? Зачем пожаловал?', [
      { text: 'Что там с сетью?', nextId: 'services' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'МОНЯ', 'Стой-стой! Пингую... Понг! Ну, вроде свой. Говори быстро.', [
      { text: 'Нужна работа.', nextId: 'services' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'МОНЯ', 'О, пришел мой лучший тестер! Есть подстанция, совсем загнулась.', [
      { text: 'Показывай координаты.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'МОНЯ', 'О! Хай-рез заглянул! У меня как раз узел в дедлоке завис.', [
      { text: 'Я готов.', nextId: 'services' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile', 'МОНЯ', 'У тебя пакеты кривые. Ты — шум в нашей чистой линии. Уматывай.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile_v2', 'МОНЯ', 'У тебя на порту вместо данных — спам. Уходи, пока я не зациклил твое сознание.', [
       { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'МОНЯ', 'Парень, у тебя помехи в голосе. Сходи в "Сигнал", прими 50 грамм хладагента.', [
      { text: 'Я в порядке.', nextId: 'intro' }
    ])
    .addNode('intro_stressed_v2', 'МОНЯ', 'Твой джиттер зашкаливает. Стой на месте и не дыши!', [
       { text: 'Я остыну.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'МОНЯ', 'Снова 14-й луч обрубили? Снова за работу?', [
      { text: 'Да, Моня.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat_v2', 'МОНЯ', 'Снова за старое? Тебе что, Bits в карманах жмут? Ладно, глянем бэклог.', [
       { text: 'Берусь.', nextId: 'services' },
       { text: '[Уйти]', nextId: 'LEAVE' }
     ])
    .addNode('services', 'МОНЯ', 'Слушай, дел по горло. Про 14-й луч или "Древнее Эхо"? Что потянешь?', [
      { text: 'Расскажи про 14-й луч.', nextId: 'quest_explain_1' },
      { text: 'Что за помехи на линии?', nextId: 'quest_echo_pitch' },
      { text: 'Я еще подумаю.', nextId: 'intro' }
    ])
    .addNode('quest_backup_finish', 'МОНЯ', 'Варвар жив? Спасибо, парень. Тут старые логи... бесценная штука. Вот 60 Bits.', [
       { text: 'Рад помочь.', nextId: 'intro', effect: 'GIVE_BITS', amount: 60, completeQuestId: 'q_altufyevo_varvar_backup' }
    ])
    .addLoreNode('lore_faction', 'МОНЯ', 'Net Drivers — это кровеносная система Москвы. Без нас Ядро было бы просто железом.', 'intro', 'Net Drivers')
    .addNode('quest_explain_1', 'МОНЯ', 'На 14-м луче завелся перехватчик. Нужно зайти и сделать "Dump & Clear". Будь осторожен.', [
      { text: 'Безопасность узла?', nextId: 'quest_explain_2' },
      { text: 'Проверяй деку.', nextId: 'quest_rank_check' }
    ])
    .addNode('quest_explain_2', 'МОНЯ', 'Там старые скрипты Октября. Бьют больно. Но Bits хватит на новую деку.', [
      { text: 'Готов.', nextId: 'quest_rank_check' },
      { text: 'В другой раз.', nextId: 'intro' }
    ])
    .addNode('quest_echo_pitch', 'МОНЯ', 'Это "Древнее Эхо". Гид на ВДНХ знает, как это глушить. Но она не любит дилетантов. Уверен?', [
        { text: 'Я готов. Проверяй.', nextId: 'quest_echo_rank_check' },
        { text: 'Пожалуй, подожду.', nextId: 'intro' }
    ])
    .addNode('quest_echo_rank_check', 'МОНЯ', 'Дай гляну твой волновой лог... *настраивает осциллограф*', [
        { text: '[ Ждать настройки ]', nextId: 'quest_echo_accept', requireMinLevel: 0 },
        { text: '[ Ждать настройки ]', nextId: 'quest_echo_accept', isProOnly: true }
    ])
    .addNode('quest_echo_reject', 'МОНЯ', 'Пии! Что-то в твоих драйверах не то. Наберись опыта и возвращайся.', [
        { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_echo_accept', 'МОНЯ', 'Сигнал чистый. Хорошо, контракт твой. Найди Гида на ВДНХ. (Принять контракт)', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_monya_signal_echo' }
    ])
    .addNode('quest_echo_finish', 'МОНЯ', 'О! Тишина... Какая приятная тишина. Ты сделал это, хакер. Вот твои Bits.', [
        { text: 'Рад помочь.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_monya_signal_echo' }
    ])
    .addNode('quest_rank_check', 'МОНЯ', 'Дай гляну твою деку... (Сканирование...)', [
      { text: '[ Ждать результата ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
      { text: '[ Ждать результата ]', nextId: 'quest_accept', requireMinLevel: 2 },
      { text: '[ Ждать результата ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'МОНЯ', 'М-да. Нос не дорос. Твой файрвол дырявый, как мой носок. Свободен.', [
      { text: 'Ладно...', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'МОНЯ', 'Ну, вроде крепкий. Выбей Бага con подстанции — и Bits будут твои. Приступай.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: FIX LINK ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_bibirevo_combat_link_break_bug_sweep' }
    ])
    .build(),

  // --- NORTH LINK SHOP ---
  shop_north_link: new DialogueBuilder('shop_north_link')
    .addNode('intro', 'СЕВЕРНЫЙ_ПОТОК', 'Высокочастотные модули для тех, кто ценит скорость. Шина Бибирево — самая быстрая.', [
        { text: 'Ping Flood (45 Bits)', nextId: 'intro', cost: 45, effect: 'GIVE_CARD', cardRewardId: 'fn_ping_flood', subtext: 'Карта: Массовый опрос узлов.' },
        { text: 'Relay Booster (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_TRAIT', cardRewardId: 'stack_archaeologist', subtext: 'Черта: Усиление сигнала.' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  // --- SIGNAL BAR ---
  bar_signal: new DialogueBuilder('bar_signal')
    .addNode('intro', 'БАР_СИГНАЛ', 'Здесь не гасят шум, здесь им наслаждаются. 99% спирта и 1% данных — идеал.', [
        { text: 'Кружка "Белого Шума" (12 Bits)', nextId: 'intro', cost: 12, effect: 'RESTORE_HP', amount: 25, subtext: 'Восстановление 25 HP.' },
        { text: 'Полная перепрошивка (40 Bits)', nextId: 'intro', cost: 40, effect: 'RESTORE_HP', amount: 80, subtext: 'Восстановление 80 HP.' },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  // --- OLD ADMIN ---
  npc_old_admin: new DialogueBuilder('npc_old_admin')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'СТАРЫЙ_АДМИН', 'Помню я... телнет, модемы... Вы, молодежь, даже не знаете, что такое ждать подгрузки.', [
        { text: 'Рассказать о прошлом.', nextId: 'lore' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'СТАРЫЙ_АДМИН', 'Опять ты? Твои пакеты какие-то... сглаженные. Что тебе в моей базе данных?', [
        { text: 'Рассказать о прошлом.', nextId: 'lore' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'СТАРЫЙ_АДМИН', 'А, ценитель старой школы! Откопал архивный узел... хочешь послушать?', [
        { text: 'Конечно.', nextId: 'lore' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'СТАРЫЙ_АДМИН', 'Твой хеш плывет... Совсем как мой 14.4k модем под грозой. Иди остынь.', [
        { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'СТАРЫЙ_АДМИН', 'Снова в архивах? История — вечный цикл, парень. Слушай дальше.', [
        { text: 'Продолжай.', nextId: 'lore' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('lore', 'СТАРЫЙ_АДМИН', 'Свобода была до Ядра. Мы сами строили свои домены. (+5 Репутации Анархистов)', [
        { text: 'Глубоко.', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 5, cardRewardId: 'ANARCHO_VOID' }
    ])
    .build(),

  // --- CRAWLER ---
  npc_crawler: new DialogueBuilder('npc_crawler')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'КРОУЛЕР', 'Ищу заброшенные подсети. Поможешь проложить маршрут?', [
        { text: 'Я помогу.', nextId: 'rank_check' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'КРОУЛЕР', 'Слышишь? Этот шум — голос потерянных пакетов. Рискнем или побоишься?', [
        { text: 'Что за узел?', nextId: 'rank_check' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'КРОУЛЕР', 'О! Лучший прозвонщик вернулся! Намечается деликатный дамп. Ты в деле?', [
        { text: 'Всегда готов.', nextId: 'rank_check' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'КРОУЛЕР', 'Снова в зоне шума? Ну что, продолжим копаться в мусоре корпоратов?', [
        { text: 'Давай.', nextId: 'intro' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('rank_check', 'КРОУЛЕР', 'Ты?! Ну-ка, покажи свой волновод...', [
        { text: '[ Показать волновод ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
        { text: '[ Показать волновод ]', nextId: 'quest_accept', requireMinLevel: 2 },
        { text: '[ Показать волновод ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'КРОУЛЕР', 'Ха-ха! "Стажер"! В Северном Потоке тебя размажет. Нос не дорос. Гуляй.', [
        { text: 'Я еще вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'КРОУЛЕР', 'Ого, нормальный девайс. Хорошо, контракт твой. Встретимся в зоне шума.', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_bibirevo_combat_static_noise_bug_sweep' }
    ])
    .build(),

  // --- RELAY TERMINAL ---
  term_relay_stats: new DialogueBuilder('term_relay_stats')
    .addNode('intro', 'СТАТИСТИКА_РЕЛЕ', '[SYSTEM] ЛОГИ_СЕВЕРНОГО_УЗЛА. ПРОВЕРКА_ТРАФИКА:', [
        { text: 'Посмотреть загрузку (5 Bits)', nextId: 'lore', cost: 5 },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addNode('lore', 'СТАТИСТИКА_РЕЛЕ', '[LOG] Пакеты теряются в 30% случаев. Рекомендуется оптимизация.', [
        { text: 'Назад', nextId: 'intro' }
    ])
    .build(),

  // --- JOB BOARD ---
  job_board_bibi: new DialogueBuilder('job_board_bibi')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ИНФО-ПАНЕЛЬ', 'СИСТЕМА: Узел Бибирево. Список запросов обновлен.', [
      { text: 'Взять: Fix Link (50 Bits)', nextId: 'accept' },
      { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ИНФО-ПАНЕЛЬ', '[NOTIFICATION] Пульс сети: 44 Гц. Требуются добровольцы.', [
       { text: 'Посмотреть задачи.', nextId: 'intro' },
       { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ИНФО-ПАНЕЛЬ', '[RE-SYNCING] Таблица не изменилась. Доступны старые записи.', [
       { text: 'Глянуть еще раз.', nextId: 'intro' },
       { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
    ])
    .addNode('accept', 'ИНФО-ПАНЕЛЬ', 'Контракт активирован.', [
       { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_bibirevo_combat_static_noise_bug_sweep' }
    ])
    .build(),

  // --- TAXI ---
  term_taxi_bibi: new DialogueBuilder('term_taxi_bibi', 's')
    .addNode('s', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Узел Бибирево. Глобальная навигация: 100 Bits.', [
      { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ])
    .build(),

  // --- SONNY CODER ---
  npc_bibirevo_coder: new DialogueBuilder('npc_bibirevo_coder')
    .withGreetings({
        neutral: ['intro', 'intro_v2'],
        repeat: ['intro_repeat'],
        stressed: ['intro_stressed']
    })
    .addNode('intro', 'СОННЫЙ_КОДЕР', '...а? Баг в 312-й строке? Нет, это фича... *засыпает*', [
        { text: 'Эй, не спи! Тебе нужна энергия.', nextId: 'quest_energy_talk' },
        { text: 'Я принес Дзен-Лог от Олега.', nextId: 'quest_energy_finish', requireQuestId: 'q_bibirevo_energy' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'СОННЫЙ_КОДЕР', '...while (true) { sleep(); }... Твой приход прервал цикл. Чего хотел?', [
        { text: 'Ты выглядишь уставшим.', nextId: 'quest_energy_talk' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'СОННЫЙ_КОДЕР', 'Снова ты... Я почти увидел решение во сне. Принес то, о чем говорили?', [
        { text: 'Все еще работаю над этим.', nextId: 'intro' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'СОННЫЙ_КОДЕР', 'Мои нейроны шумят... Не подходи, я ухожу в аварийный шатдаун.', [
        { text: 'Ладно...', nextId: 'LEAVE' }
    ])
    .addNode('quest_energy_talk', 'СОННЫЙ_КОДЕР', 'Мне нужен кумулятив для циклов. Слыхал про "Дзен-Лог"? Его заваривает Олег на ВДНХ. Без него я просто `null`.', [
        { text: 'Я помогу, сгоняю на ВДНХ.', nextId: 'quest_energy_start' },
        { text: 'Сам разберись.', nextId: 'intro' }
    ])
    .addNode('quest_energy_start', 'СОННЫЙ_КОДЕР', 'Энергия... да. Обычный кофе не берет. Только "Дзен-Лог". Сходишь? Я заплачу.', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_bibirevo_energy' }
    ])
    .addNode('quest_energy_finish', 'СОННЫЙ_КОДЕР', '*делает глоток* ...Ух! Прямое попадание! Я вижу код! Спасибо, хакер.', [
        { text: 'Пожалуйста.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_bibirevo_energy' }
    ])
    .build(),

  // --- JITTER ---
  npc_jitter_signal: new DialogueBuilder('npc_jitter_signal')
    .withGreetings({
        neutral: ['intro', 'intro_v2'],
        friendly: ['intro_friendly'],
        repeat: ['intro_repeat']
    })
    .addNode('intro', 'ДЖИТТЕР (СВЯЗИСТ)', 'Эй, стайлер... Моня выжил из ума. Весь этот сегмент Бибирево — мой.', [
        { text: 'Кто ты такой?', nextId: 'lore_jitter' },
        { text: 'Моня просил принести данные ему.', nextId: 'quest_echo_intercept', requireQuestId: 'q_monya_signal_echo' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ДЖИТТЕР (СВЯЗИСТ)', 'Пакеты... Моня их гладит, я их забираю. Твой трафик выглядит доступным.', [
        { text: 'Поговорим о деле.', nextId: 'intro' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'ДЖИТТЕР (СВЯЗИСТ)', 'О! Лучший хакер вернулся! Хочешь долю с линка из Кремля?', [
        { text: 'Интересно.', nextId: 'intro' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ДЖИТТЕР (СВЯЗИСТ)', 'Снова ты. Давай быстрее, пока Моня не проснулся.', [
        { text: 'Ближе к делу.', nextId: 'intro' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_jitter', 'ДЖИТТЕР (СВЯЗИСТ)', 'Джиттер — это я. Тот, кто ловит пакеты на лету. Я — будущее Net Drivers.', 'intro')
    .addNode('quest_echo_intercept', 'ДЖИТТЕР (СВЯЗИСТ)', 'Забудь про Моню. Я дам 150 Bits прямо сейчас за дамп сигнала. Идет?', [
        { text: '150 Bits звучит заманчиво. (Предать Моню)', nextId: 'branch_betray', cost: 0 },
        { text: 'Я могу клонировать сигнал? (Техника)', nextId: 'branch_clone', requireMinLevel: 5 },
        { text: 'Нет, я работаю честно.', nextId: 'branch_refuse' }
    ])
    .addNode('branch_betray', 'ДЖИТТЕР (СВЯЗИСТ)', 'Красавчик. Деньги не пахнут. Вот твои Bits. А Моне скажи, что сигнал испарился.', [
        { text: 'Сделка есть сделка. (Завершить)', nextId: 'LEAVE', completeQuestId: 'q_monya_signal_echo', effect: 'GIVE_BITS', amount: 150 }
    ])
    .addNode('branch_clone', 'ДЖИТТЕР (СВЯЗИСТ)', '[SUCCESS] Ювелирная работа! Ладно, забирай Bits, я заберу копию. Моня не узнает.', [
        { text: 'Удачного дебага. (Продолжить у Мони)', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 100 }
    ])
    .addNode('branch_refuse', 'ДЖИТТЕР (СВЯЗИСТ)', 'Ха! Честный хакер в Бибирево? Иди к своему старику. Но я предлагал.', [
        { text: 'Прощай.', nextId: 'LEAVE' }
    ])
    .build(),
};

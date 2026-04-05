import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const vykhino_dialogues: Record<string, DialogueTree> = {
  // --- GREY ---
  npc_grey: new DialogueBuilder('npc_grey')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly', 'intro_friendly_v2', 'intro_friendly_v3'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2', 'intro_repeat_v3']
    })
    .addNode('intro', 'ГРЕЙ', 'Тс-с... Тебя не засекли? Выхино сейчас кишит аудиторами... Я Грей, из Redundants. Что ищем?', [
      { text: 'Кто такие Redundants?', nextId: 'lore_faction' },
      { text: 'Что сейчас слышно в Выхино?', nextId: 'lore_district' },
      { text: 'Ищу работу.', nextId: 'quest_pitch' },
      { text: 'Я почистил логи в терминале.', nextId: 'quest_audit_finish', requireQuestId: 'q_vykhino_audit_evasion' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ГРЕЙ', '*копается в щите* Еще один гость... Твой стек выглядит слишком опрятно. Ты из тех, кто пишет документацию?', [
      { text: 'Нарушение — мой профиль.', nextId: 'intro' },
      { text: 'Ищу работу.', nextId: 'quest_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'ГРЕЙ', 'Выхино — это перекресток всех битых байтов... Тебе некуда податься или ищешь стертое Октябрем?', [
      { text: 'Что-то вроде того.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'ГРЕЙ', 'А, наш человек. Вижу чистую сигнатуру. Есть "фонящий" пакет на перегоне. Поможешь?', [
      { text: 'Я в деле.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'ГРЕЙ', 'Твои логи — загляденье. Чистое плетение Redundants. Есть дельце и здесь, только для своих.', [
      { text: 'Выкладывай, Грей.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v3', 'ГРЕЙ', 'Твой последний перехват спас базу данных... Для тебя у меня всегда есть "тихий" канал.', [
       { text: 'Ценю это.', nextId: 'intro' },
       { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile', 'ГРЕЙ', 'Твой код светится в логах Federal Oversight... Исчезни, пока я не слил твои координаты.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile_v2', 'ГРЕЙ', '[SCAN_ALARM] Корпоративная прошивка. Проваливай, пока я не активировал ЭМИ-ловушку.', [
       { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'ГРЕЙ', 'Ты дрожишь, парень. Помехи на весь хаб. Остынь в "Транзите", выпей "Выдоха".', [
      { text: 'Бипы-бупы слышу...', nextId: 'intro' }
    ])
    .addNode('intro_stressed_v2', 'ГРЕЙ', 'У тебя джиттер в глазах! Как живой маяк слежения. Сядь, дефрагментируйся.', [
       { text: 'Понял.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ГРЕЙ', 'Снова перехват груза? Патрули плодятся быстро. Готов к новой вылазке?', [
      { text: 'Да, Грей. Давай данные.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat_v2', 'ГРЕЙ', '*проверяет пинг* Твои возвращения всегда сулят Bits. Продолжим зачистку?', [
      { text: 'Готов.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat_v3', 'ГРЕЙ', 'Время — это Bits. Не стой на линии. Если ищешь работу — она всё та же.', [
       { text: 'К делу.', nextId: 'intro' },
       { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'ГРЕЙ', 'Мы — заноза в их корпоративной заднице. Gigabank хочет контроля, а мы храним хаос.', 'intro', 'Redundants')
    .addLoreNode('lore_district', 'ГРЕЙ', 'Выхино — перекресток всех битых байтов. Здесь транзит, здесь рынок, здесь... смерть для неосторожных пакетов.', 'intro')
    .addNode('quest_pitch', 'ГРЕЙ', 'Работа всегда есть. На перегоне застрял контейнер, или нужно зачистить логи в терминале. Что выберешь?', [
      { text: 'Зачистить логи аудита (60 Bits).', nextId: 'quest_audit_accept' },
      { text: 'Перехватить контейнер (Combat).', nextId: 'quest_explain_1' },
      { text: 'Назад.', nextId: 'intro' }
    ])
    .addNode('quest_explain_1', 'ГРЕЙ', 'На перегоне застрял контейнер с данными. Охрана — дроны Ядра. Как будешь работать?', [
      { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
      { text: 'Допуск Net Drivers. (Social)', nextId: 'quest_social_gate', requireReputation: { factionId: 'NET_DRIVERS', minPoints: 20 } },
      { text: 'Взлом через метро-шлюз. (Technical)', nextId: 'quest_tech_gate', requireMinLevel: 3 }
    ])
    .addNode('quest_explain_2', 'ГРЕЙ', 'У них софт на старом "sudo-стеке". Пробить сложно. Рискнешь?', [
      { text: 'Проверяй маску.', nextId: 'rank_check' },
      { text: 'Позже.', nextId: 'intro' }
    ])
    .addNode('quest_social_gate', 'ГРЕЙ', 'Net Drivers умеют договариваться. Дроны просто "уснут". Берешься?', [
      { text: 'Давай ключ.', nextId: 'quest_accept' }
    ])
    .addNode('quest_tech_gate', 'ГРЕЙ', 'Нашел уязвимость в 404-м порту? Красиво. Если перехватишь управление — бой не нужен.', [
      { text: 'Дека вытянет. Принимаю.', nextId: 'quest_accept' }
    ])
    .addNode('rank_check', 'ГРЕЙ', 'Дай гляну твою сигнатуру... (Сканирование Грей-кодом...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ГРЕЙ', 'Ха! Пыль от учебников Академии еще не осела. Нос не дорос. Вернись позже.', [
      { text: 'Я еще покажу тебе...', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ГРЕЙ', 'Неплохо. У тебя чистые прерывания. Хорошо, контракт твой. Удачи.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_vykhino_combat_cargo_bug_sweep' }
    ])
    .addNode('quest_audit_accept', 'ГРЕЙ', 'Стери логи в Центральном Терминале за последние 24 часа. Плачу 60 Bits. Рискнешь?', [
      { text: 'Я сделаю это.', nextId: 'LEAVE', awardQuestId: 'q_vykhino_audit_evasion' },
      { text: 'Слишком опасно.', nextId: 'intro' }
    ])
    .addNode('quest_audit_finish', 'ГРЕЙ', 'Проверил... Чисто. Красивая работа. Вот твои 60 Bits. Плюс — уважение Redundants.', [
       { text: 'Был рад помочь.', nextId: 'intro', effect: 'GIVE_BITS', amount: 60, completeQuestId: 'q_vykhino_audit_evasion' }
    ])
    .build(),

  // --- LOADER ---
  npc_vykhino_loader: new DialogueBuilder('npc_vykhino_loader')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'ГРУЗЧИК', '*тяжело дышит* Уф... Пакеты данных плотные, а охлаждение не железное! Хотя... наполовину.', [
      { text: 'Тяжело работать в транзитной зоне?', nextId: 'lore' },
      { text: 'Нужна помощь с грузом?', nextId: 'quest_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ГРУЗЧИК', '*протирает манипуляторы* Весь день таскаю дампы. Заработать хочешь?', [
      { text: 'Что за работа?', nextId: 'quest_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'ГРУЗЧИК', '[BUFFER_FULL] Дай я этот массив в кэш сброшу... Слишком много транзита.', [
       { text: 'Есть груз?', nextId: 'quest_pitch' },
       { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v4', 'ГРУЗЧИК', 'Мои соленоиды воют. Кому-то в Алтуфьево приспичило бэкап. Ноги быстрые?', [
       { text: 'Быстрее некуда.', nextId: 'intro' }
    ])
    .addNode('intro_friendly', 'ГРУЗЧИК', 'О, надежные ноги! Твой блок дошел без битых пикселей. Есть еще "фонящий" архив.', [
      { text: 'Слушаю.', nextId: 'quest_pitch' }
    ])
    .addNode('intro_stressed', 'ГРУЗЧИК', 'У тебя CPU визжит. В таком состоянии даже флешку не удержишь. Сходи к Бате за охладом.', [
      { text: 'Ладно.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ГРУЗЧИК', 'Снова за блоками? Спина готова к нагрузкам?', [
      { text: 'Давай груз.', nextId: 'quest_pitch' }
    ])
    .addNode('quest_pitch', 'ГРУЗЧИК', 'Есть блок для Петровича в Алтуфьево. Он вскроет без детонации. Потянешь?', [
      { text: 'Я справлюсь. (Стандарт)', nextId: 'rank_check' },
      { text: 'Я могу фильтровать помехи. (Technical)', nextId: 'quest_pitch_tech', requireMinLevel: 2 },
      { text: 'Петрович меня рекомендовал. (Lore)', nextId: 'quest_pitch_lore', requireReputation: { factionId: 'RAST_VALLEY', minPoints: 10 } }
    ])
    .addNode('quest_pitch_tech', 'ГРУЗЧИК', 'Фильтровать умеешь? Блок шумит. Если погасишь всплески — Петрович накинет.', [
      { text: 'Беру.', nextId: 'rank_check' }
    ])
    .addNode('quest_pitch_lore', 'ГРУЗЧИК', 'Раз Петрович мазу тянет — значит рука прямая. Забирай без вопросов.', [
      { text: 'Не подкачаю.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'ГРУЗЧИК', 'Дай гляну страховку... просто покажи, что не "чайник".', [
      { text: '[ Показать логи ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Показать логи ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ГРУЗЧИК', 'Дружок, у тебя уровень — "библиотекарь". Рванет — битов не останется. Свободен.', [
      { text: 'Ладно...', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ГРУЗЧИК', 'Вроде крепкий. Петрович не любит ждать. Битсы получишь у него.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_vykhino_delivery' }
    ])
    .build(),

  // --- BATYA (JOB BOSS) ---
  npc_job_boss: new DialogueBuilder('npc_job_boss')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ФИКСЕР_БАТЯ', 'Ну и рожа... Если хочешь командовать — поднатаскаю по менеджменту. Или если ищешь Сержанта в Марьино — я дам наводку.', [
      { text: 'Разблокировать класс: PM (150 Bits)', nextId: 'pm_success', cost: 150, effect: 'SET_PROFESSION', cardRewardId: 'pm_jun' },
      { text: 'Кто ты такой?', nextId: 'lore' },
      { text: 'Мне нужен Сержант из Марьино.', nextId: 'job_start' },
      { text: 'Что сейчас в приоритете?', nextId: 'job_selection' },
      { text: 'Я собрал долю с бармена.', nextId: 'quest_tax_finish', requireQuestId: 'q_vykhino_transit_tax' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'ФИКСЕР_БАТЯ', 'Я — Батя. Фиксер. Решаю проблемы, которые не могут решить роботы Gigabank. Ты — либо инструмент, либо мусор. Выбирай.', 'intro')
    .addNode('job_selection', 'ФИКСЕР_БАТЯ', 'Всегда есть задачи. Либо выбить долг, либо... серьезное дело в Марьино. Твой выбор?', [
      { text: 'Собрать долги (Quick Bits).', nextId: 'quest_tax_accept' },
      { text: 'Серьезный проект в Марьино (Combat).', nextId: 'job_start' },
      { text: 'Назад.', nextId: 'intro' }
    ])
    .addNode('intro_v2', 'ФИКСЕР_БАТЯ', 'Выхино — одна большая горящая задача. Всё еще треплешься или готов взять проект?', [
      { text: 'Я готов.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'ФИКСЕР_БАТЯ', 'Вижу потенциал. У нас наклевывается дельце con корпоратами. Интересует рост?', [
      { text: 'Что за дело?', nextId: 'job_start' }
    ])
    .addNode('intro_friendly', 'ФИКСЕР_БАТЯ', 'О, лучший менеджер! Всё еще сжигаешь дедлайны или научился делегировать?', [
      { text: 'Давай задание.', nextId: 'job_start' }
    ])
    .addNode('intro_hostile', 'ФИКСЕР_БАТЯ', 'Твоя репутация воняет. Проваливай с глаз, пока я не закрыл твой тикет навсегда.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'ФИКСЕР_БАТЯ', 'Парень, у тебя джиттер зашкаливает. Марш в бар, охладись!', [
      { text: 'Слушаюсь.', nextId: 'LEAVE' }
    ])
    .addNode('pm_success', 'ФИКСЕР_БАТЯ', 'Держи методичку по Agile и иди разруливай хаос. Жду отчетов.', [
      { text: 'ОК, шеф.', nextId: 'LEAVE' }
    ])
    .addNode('job_start', 'ФИКСЕР_БАТЯ', 'Сходи в Марьино, там "Локалка" барахлит. Помоги Трассировке (Trace). Скажи, что от Бати.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_trace_stress_test' },
      { text: 'Позже.', nextId: 'LEAVE' }
    ])
    .addNode('quest_tax_accept', 'ФИКСЕР_БАТЯ', 'Бармен в "Транзите" задолжал. Напомни ему, что долги — это плохо для процессора.', [
      { text: 'Я напомню.', nextId: 'LEAVE', awardQuestId: 'q_vykhino_transit_tax' },
      { text: 'Я не коллектор.', nextId: 'intro' }
    ])
    .addNode('quest_tax_finish', 'ФИКСЕР_БАТЯ', 'Принес? Красавец. Держи свои 15 Bits. Заходи еще.', [
      { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 15, completeQuestId: 'q_vykhino_transit_tax' }
    ])
    .build(),

  // --- TRANSIT BAR ---
  bar_transit: new DialogueBuilder('bar_transit')
    .addNode('intro', 'БАР_ТРАНЗИТ', 'Грязно, шумно и пахнет "Синтез-спиртом". Зато лучшая изоляция в секторе.', [
        { text: 'Стимулятор "Выдох" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30, subtext: 'Восстанавливает 30 HP.' },
        { text: 'Промыть соты (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100, subtext: 'Максимальное восстановление.' },
        { text: 'БАТЯ ПРОСИЛ ПЕРЕДАТЬ ПРИВЕТ... [СОБРАТЬ ДОЛГ]', nextId: 'tax_collect', requireQuestId: 'q_vykhino_transit_tax' },
        { text: '[Выйти]', nextId: 'LEAVE' }
    ])
    .addNode('tax_collect', 'БАР_ТРАНЗИТ', '*нервно сглатывает озон* Ох... Батя... Забирай, только не надо больше "приветов".', [
        { text: 'Так-то лучше.', nextId: 'intro' }
    ])
    .build(),

  // --- LINK MANAGER ---
  npc_link_manager: new DialogueBuilder('npc_link_manager')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'МЕНЕДЖЕР_КАНАЛОВ', 'Трафик 75.3%. Нарушаете протокол присутствия. Кому подчиняетесь, юнит?', [
        { text: 'Я вольный агент.', nextId: 'intro' },
        { text: 'Что ты здесь охраняешь?', nextId: 'lore' },
        { text: 'Система сигнализации сбоит, помочь?', nextId: 'quest_subway_accept' },
        { text: 'Я обновил прошивку реле.', nextId: 'quest_subway_finish', requireQuestId: 'q_vykhino_subway_leak' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'МЕНЕДЖЕР_КАНАЛОВ', '[ANALYZING] Аномалии в тени. Предъявите лицензию NET_DRIVERS или покиньте зону шлюза.', [
      { text: 'Я мимо проходил.', nextId: 'intro' }
    ])
    .addNode('intro_friendly', 'МЕНЕДЖЕР_КАНАЛОВ', '[RECOGNITION_SUCCESS] Статус: Надежный поставщик. Канал 404 требует калибровки.', [
       { text: 'Я займусь.', nextId: 'quest_subway_accept' }
    ])
    .addNode('intro_hostile', 'МЕНЕДЖЕР_КАНАЛОВ', '[ACCESS_DENIED] Вы в черном списке. Немедленно отключитесь от подсети.', [
       { text: 'Отключаюсь.', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'МЕНЕДЖЕР_КАНАЛОВ', 'Эту ветку метро. Она — основа Локального Облака Москвы. Упадет — 40% Ядра в оффлайн.', 'intro')
    .addNode('quest_subway_accept', 'МЕНЕДЖЕР_КАНАЛОВ', 'Узел 404 рассинхронизирован. Нужно залить патч. ОПЛАТА: 45 Bits.', [
      { text: 'Принимаю.', nextId: 'LEAVE', awardQuestId: 'q_vykhino_subway_leak' },
      { text: 'Нет.', nextId: 'intro' }
    ])
    .addNode('quest_subway_finish', 'МЕНЕДЖЕР_КАНАЛОВ', 'Синхронизация: 99.9%. Оптимально. Награда переведена.', [
       { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 45, completeQuestId: 'q_vykhino_subway_leak' }
    ])
    .build(),

  // --- CORP SCOUT ---
  npc_corp_scout: new DialogueBuilder('npc_corp_scout')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'СКАУТ_GIGA_BANK', 'Выглядишь перспективно. Хочешь зарплату в 1000 Bits и страховку? Gigabank ценит талант.', [
        { text: 'Я не продаюсь.', nextId: 'intro' },
        { text: 'Что за работа?', nextId: 'lore' },
        { text: 'Я могу просканировать частоты Redundants.', nextId: 'quest_scout_accept' },
        { text: 'Данные сканирования готовы.', nextId: 'quest_scout_finish', requireQuestId: 'q_vykhino_corp_favor' },
        { text: '[Прощай]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'СКАУТ_GIGA_BANK', 'Программа "Ликвидные Активы"... таланты для идеального бэкенда. Интересует?', [
      { text: 'Расскажите подробнее.', nextId: 'lore' }
    ])
    .addNode('intro_friendly', 'СКАУТ_GIGA_BANK', 'Коллега! Ваши данные были впечатляющими. Есть еще пара "инсайдов"?', [
       { text: 'Я поищу.', nextId: 'quest_scout_accept' }
    ])
    .addNode('intro_hostile', 'СКАУТ_GIGA_BANK', 'ID отмечен как "нестабильный". Мы не инвестируем в мусор. Уходите.', [
       { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'СКАУТ_GIGA_BANK', 'Чистка транзакций в Сити. Платим в два раза больше, чем фиксеры трущоб.', 'intro')
    .addNode('quest_scout_accept', 'СКАУТ_GIGA_BANK', 'Нужны частоты Redundants в Выхино. Найдешь "тихий" узел — получишь 70 Bits.', [
      { text: 'Договорились.', nextId: 'LEAVE', awardQuestId: 'q_vykhino_corp_favor' },
      { text: 'Не работаю на GigaBank.', nextId: 'intro' }
    ])
    .addNode('quest_scout_finish', 'СКАУТ_GIGA_BANK', '*загружает данные* 2.4ГГц с фазовым сдвигом... Остроумно. Бонус на счету.', [
       { text: 'До встречи.', nextId: 'intro', effect: 'GIVE_BITS', amount: 70, completeQuestId: 'q_vykhino_corp_favor' }
    ])
    .build(),

  // --- TERMINALS & SHOPS ---
  term_taxi_unlock: new DialogueBuilder('term_taxi_unlock', 's')
    .addNode('s', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Карантин. Разблокировать шлюз?', [
      { text: 'Проломить шлюз (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ])
    .build(),

  shop_metro: new DialogueBuilder('shop_metro')
    .addNode('intro', 'РАДИО_ПАЛАТКА', 'Модули из метро. Дешево, сердито, работает.', [
        { text: 'Socket Wrapper (25 Bits)', nextId: 'intro', cost: 25, effect: 'GIVE_CARD', cardRewardId: 'fn_socket_wrap' },
        { text: 'Debug Buffer (35 Bits)', nextId: 'intro', cost: 35, effect: 'GIVE_CARD', cardRewardId: 'soft_buffer_v1' },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  shop_black_market: new DialogueBuilder('shop_black_market')
    .addNode('intro', 'ЧЕРНЫЙ_ИМПОРТ', 'Только Bits и результат. Что ищем?', [
        { text: 'Root Access Kit (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_TRAIT', cardRewardId: 'root_access' },
        { text: 'Encryption Layer (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'def_encryption' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  term_exchange: new DialogueBuilder('term_exchange')
    .addNode('intro', 'ЛИКВИД_ТЕРМИНАЛ', 'Курс: 100 Bits = 20 Репутации Анархистов (VOID).', [
        { text: 'Купить Репутацию (100 Bits)', nextId: 'success', cost: 100, effect: 'GIVE_REPUTATION', amount: 20, cardRewardId: 'ANARCHO_VOID' },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addNode('success', 'ЛИКВИД_ТЕРМИНАЛ', 'Транзакция завершена. Вы ближе к Пустоте.', [
        { text: 'Назад', nextId: 'intro' }
    ])
    .build(),
};

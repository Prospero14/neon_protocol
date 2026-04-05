import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const izmailovo_dialogues: Record<string, DialogueTree> = {
  // --- VERSTAK (REDUNDANTS MASTER) ---
  npc_master: new DialogueBuilder('npc_master')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'ВЕРСТАК', 'Собрать деку из хлама — это искусство. Раньше каждый знал, как паять шину, а теперь все только орут "Gigabank". Хочешь научиться или пришел за деталями?', [
      { text: 'Как дела у Резервистов?', nextId: 'lore_faction' },
      { text: 'Нужен хладагент для разгона...', nextId: 'quest_explain_cool_1' },
      { text: 'Хочу подработать сбором деталей.', nextId: 'quest_explain_scrap_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ВЕРСТАК', '*копается в транзисторах* О, заземленный. Твоя дека еще не превратилась в обогреватель? В Измайлово жарко от патрулей GigaBank.', [
      { text: 'Как дела у Резервистов?', nextId: 'lore_faction' },
      { text: 'Нужен хладагент...', nextId: 'quest_explain_cool_1' },
      { text: 'Подработка сбором.', nextId: 'quest_explain_scrap_1' }
    ])
    .addNode('intro_friendly', 'ВЕРСТАК', 'А, ценитель классики! Рад тому, кто понимает разницу между Pascal и Java. Есть дельце на свалке.', [
      { text: 'Рассказывай, мастер.', nextId: 'quest_explain_scrap_1' }
    ])
    .addNode('intro_hostile', 'ВЕРСТАК', 'Твой порт воняет корпоративным пачем. В Измайлово таким не подают. Проваливай.', [
      { text: 'Я ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'ВЕРСТАК', 'Твои кулеры надрываются! Стресс передается паяльнику! Остынь, кодер, иначе устроишь КЗ.', [
      { text: 'Я в норме. Что там с деталями?', nextId: 'quest_explain_scrap_1' }
    ])
    .addLoreNode('lore_faction', 'ВЕРСТАК', 'Мы — Redundants. Хранители того, что было до "Октября". Когда сети рухнут, старое железо останется работать. Гы! (+10 Репутации)', 'intro', 'Redundants', { effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'VOSKHOD_OFFICE' })
    .addNode('quest_explain_scrap_1', 'ВЕРСТАК', 'На свалке лежат "корзины" памяти. Боты Silicon Hedge считают их своими. Нужно вырезать защиту и забрать модули.', [
      { text: 'Что за боты?', nextId: 'quest_explain_scrap_2' },
      { text: 'Проверяй допуски.', nextId: 'rank_check' }
    ])
    .addNode('quest_explain_scrap_2', 'ВЕРСТАК', 'Летающие дебаггеры. Видят несанкционированный доступ — стирают личность. Бей по портам ввода-вывода.', [
      { text: 'Готов.', nextId: 'rank_check' },
      { text: 'Надо подумать.', nextId: 'intro' }
    ])
    .addNode('quest_explain_cool_1', 'ВЕРСТАК', 'Хладагент? Дефицит. "GigaBank" всё выкупил. Слышал, у Крысы в Марьино есть пара канистр "Buffer Liquid". Договорись.', [
      { text: 'Иду в Марьино.', nextId: 'quest_cooling_start' },
      { text: '[Назад]', nextId: 'intro' }
    ])
    .addNode('rank_check', 'ВЕРСТАК', 'Дай гляну конфигурацию... (Подключает тестер к порту...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ВЕРСТАК', 'Ну, твоя дека пока просто кусок кремния. Но для свалки сойдет. Иди к Крысе в Марьино, если хочешь настоящей работы.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ВЕРСТАК', 'Файрвол плотный, заземление в норме. Контракт твой. Собери свежего лома, я в долгу не останусь. Приступай.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: СБОР ДЕТАЛЕЙ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_izmailovo_combat_job_craft_scrap_bug_sweep' }
    ])
    .addNode('quest_cooling_start', 'ВЕРСТАК', 'Принесешь "Buffer Liquid" от Крысы — соберу тебе деку по высшему разряду. (Принять контракт)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_verstak_cooling' }
    ])
    .addNode('quest_cooling_finish', 'ВЕРСТАК', 'О, свежак! Слышишь, как шипит? Вот, держи "Refactor Tool" — моя лучшая работа.', [
      { text: 'Спасибо, мастер.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_verstak_cooling' }
    ])
    .build(),

  // --- GENNADY (SMUGGLER) ---
  npc_gennady: new DialogueBuilder('npc_gennady')
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
    .addNode('quest_vintage_check', 'ГЕНА_СКУПЩИК', 'БЭСМ? Музейный экспонат! Есть чип "Legacy Core", но он битый. За так не отдам.', [
      { text: 'Заплатить 50 Bits.', nextId: 'quest_vintage_deal', cost: 50 },
      { text: 'Обменять на редкую карту "Ping Flood".', nextId: 'quest_vintage_deal', requireItemId: 'fn_ping_flood', effect: 'REMOVE_ITEM', cardRewardId: 'fn_ping_flood' },
      { text: 'Это для Генерала БЭСМ на ВДНХ. (Lore)', nextId: 'quest_vintage_lore' },
      { text: 'Слишком дорого.', nextId: 'intro' }
    ])
    .addNode('quest_vintage_lore', 'ГЕНА_СКУПЩИК', 'БЭСМ всё еще коптит? Он вытащил моего брата из-под дефрагментации. Забирай за 10 Bits, но должок за тобой.', [
      { text: 'Спасибо, Гена. (10 Bits)', nextId: 'quest_vintage_deal', cost: 10, effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'NET_DRIVERS' }
    ])
    .addNode('quest_vintage_deal', 'ГЕНА_СКУПЩИК', 'Держи. Скажи Генералу, пусть не забывает, кто его кормит историей.', [
      { text: 'Забрать чип.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_besm_vintage_code' }
    ])
    .build(),

  // --- OLD RADIOMAN (VOSKHOD) ---
  npc_old_timer: new DialogueBuilder('npc_old_timer')
    .withGreetings({
      neutral: ['intro', 'intro_v2']
    })
    .addNode('intro', 'СТАРЫЙ_РАДИСТ', 'Слышишь треск? Это голос Москвы 1990-х. Радиоволны помнят всё. Чего ищешь, малец?', [
      { text: 'Кто такие Voskhod?', nextId: 'lore_voskhod' },
      { text: 'Вы разбираетесь в лампах?', nextId: 'quest_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'СТАРЫЙ_РАДИСТ', '*крутит приемник* GigaBank пытается заглушить "Свободу". Но аналоговый сигнал не убить.', [
      { text: 'Расскажите о Voskhod.', nextId: 'lore_voskhod' }
    ])
    .addLoreNode('lore_voskhod', 'СТАРЫЙ_РАДИСТ', 'Voskhod — это фундамент. Мы строили город на логике, а не на микротранзакциях. (+5 Репутации)', 'intro', 'Voskhod', { effect: 'GIVE_REPUTATION', amount: 5, cardRewardId: 'VOSKHOD_OFFICE' })
    .addNode('quest_start', 'СТАРЫЙ_РАДИСТ', 'Лампы? Парень, на деке только кристаллы. Но если хочешь помочь — найди "Vintage Capacitor" на свалке. Верстак подскажет.', [
      { text: 'Я поспрашиваю Верстака.', nextId: 'quest_accept' },
      { text: 'Нет времени.', nextId: 'intro' }
    ])
    .addNode('quest_accept', 'СТАРЫЙ_РАДИСТ', 'Иди, и не свети портом на каждом углу.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_izmailovo_old_timer_capacitor' }
    ])
    .build(),

  // --- SHOPS & OTHERS ---
  shop_legendary: new DialogueBuilder('shop_legendary')
    .addNode('intro', 'ЛАВКА_ЛЕГЕНД', 'Только верифицированные модули con подписью Архитектора.', [
        { text: 'Refactor Crystal (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_CARD', cardRewardId: 'fn_refactor' },
        { text: 'Artisan Core (200 Bits)', nextId: 'intro', cost: 200, effect: 'GIVE_TRAIT', cardRewardId: 'hardware_reclaimer' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  bar_craft: new DialogueBuilder('bar_craft')
    .addNode('intro', 'ТРАКТИР_У_КОДА', 'Искры от паяльника и пары крепкого софта. Здесь рождаются лучшие деки.', [
        { text: 'Эль "Оптимизация" (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 40 },
        { text: 'Обед мастера (45 Bits)', nextId: 'intro', cost: 45, effect: 'RESTORE_HP', amount: 100 },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  npc_artisan: new DialogueBuilder('npc_artisan')
    .addNode('intro', 'РЕМЕСЛЕННИК_ЛИ', 'Код должен быть не только быстрым, но и красивым. Раньше у хакеров был почерк.', [
        { text: 'Рассказать об искусстве.', nextId: 'lore' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'РЕМЕСЛЕННИК_ЛИ', 'Ядро хочет одинаковости. Но мы помним стиль. (+10 Репутации Neo Kyoto)', 'LEAVE', 'Neo Kyoto', { effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'NEO_KYOTO' })
    .build(),

  npc_collector: new DialogueBuilder('npc_collector')
    .addNode('intro', 'КОЛЛЕКЦИОНЕР', 'Ищу нетронутые дампы v0.04. Плачу за "чистый" код без подписи Ядра.', [
        { text: 'Продать старый лог (25 Bits)', nextId: 'intro', effect: 'GIVE_BITS', amount: 25 },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  term_craft_log: new DialogueBuilder('term_craft_log')
    .addNode('intro', 'ЖУРНАЛ_МАСТЕРА', '[SYSTEM] ДОСТУП_К_РЕЦЕПТАМ_ОТКРЫТ. ВЫБЕРИТЕ_КАТЕГОРИЮ:', [
        { text: 'Архитектура Деки', nextId: 'lore' },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'ЖУРНАЛ_МАСТЕРА', '[DATA] Баланс между CPU и RAM. Избыток одного без другого ведет к фризу.', 'intro')
    .build(),

  term_taxi_izmailovo: new DialogueBuilder('term_taxi_izmailovo', 's')
    .addNode('s', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Измайлово. Только для авторизованных курьеров.', [
      { text: 'Авторизоваться (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ])
    .build(),
};

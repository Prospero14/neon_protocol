import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_master_dialogues = new DialogueBuilder('npc_master')
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
  .addNode('intro_friendly_v2', 'ВЕРСТАК', 'Мой лучший ученик. С твоим чутьем на железо мы скоро соберем квантовый сервер из консервных банок. Готов к серьезному заказу?', [
    { text: 'Всегда готов, мастер.', nextId: 'quest_explain_scrap_1' }
  ])
  .addNode('intro_hostile', 'ВЕРСТАК', 'Твой порт воняет корпоративным пачем. В Измайлово таким не подают. Проваливай.', [
    { text: 'Я ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'ВЕРСТАК', 'Твои кулеры надрываются! Стресс передается паяльнику! Остынь, кодер, иначе устроишь КЗ.', [
    { text: 'Я в норме. Что там с деталями?', nextId: 'quest_explain_scrap_1' }
  ])
  .addNode('intro_repeat', 'ВЕРСТАК', 'Снова за ломом? Свалка никогда не пустует. Боты Silicon Hedge уже обновили свои таблицы маршрутизации. Будь осторожен.', [
    { text: 'Понял.', nextId: 'quest_explain_scrap_1' }
  ])
  .addNode('intro_repeat_v2', 'ВЕРСТАК', 'Ищешь редкий кремний? В секторе "Б" сегодня подозрительно тихо. Либо боты спят, либо это ловушка. Идешь?', [
    { text: 'Иду.', nextId: 'quest_explain_scrap_1' }
  ])
  .addLoreNode('lore_faction', 'ВЕРСТАК', 'Мы — Redundants. Хранители того, что было до "Октября". Когда сети рухнут, старое железо останется работать. Гы! (+10 Репутации)', 'intro', 'Redundants', { effect: 'GIVE_REPUTATION', amount: 10 })
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
    { text: '[ ПРИНЯТЬ КОНТРАКТ: СБОР ДЕТАЛЕЙ ]', nextId: 'LEAVE', awardQuestId: 'q_izmailovo_combat_job_craft_scrap_bug_sweep' }
  ])
  .addNode('quest_cooling_start', 'ВЕРСТАК', 'Принесешь "Buffer Liquid" от Крысы — соберу тебе деку по высшему разряду. (Принять контракт)', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_verstak_cooling' }
  ])
  .addNode('quest_cooling_finish', 'ВЕРСТАК', 'О, свежак! Слышишь, как шипит? Вот, держи "Refactor Tool" — моя лучшая работа.', [
    { text: 'Спасибо, мастер.', nextId: 'intro', completeQuestId: 'q_verstak_cooling' }
  ])
  .build();

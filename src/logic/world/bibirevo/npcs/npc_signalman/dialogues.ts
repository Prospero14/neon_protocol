import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_signalman_dialogue: DialogueTree = new DialogueBuilder('npc_signalman').withDistrict('bibirevo')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'СВЯЗИСТ МОНЯ', 'Пинг... 500мс... Это не жизнь, это слайд-шоу. Слышь, юнит, у меня в подсети "Северный Поток" какой-то паразит жрет пакеты. Нужен нормальный прозвон. Поможешь?', [
    { text: 'Что за паразит?', nextId: 'lore_parasite' },
    { text: 'Я прозвоню линию.', nextId: 'rank_check', requireMaxLevel: 1 },
    { text: 'Как успехи на линии?', nextId: 'active_status', requireActiveQuestId: 'q_bibirevo_combat_link_break_bug_sweep' },
    { text: 'Петрович отправил меня. Есть межрайонный заказ?', nextId: 'petrovich_handoff' },
    { text: 'Где искать путь к Junior?', nextId: 'prof_route' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СВЯЗИСТ МОНЯ', 'Опять задержка... Ты принес чистый трафик или просто пингуешь меня вхолостую? Линия "Север-12" искрит, некогда лясы точить.', [
    { text: 'Я готов работать.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'СВЯЗИСТ МОНЯ', '*втыкает штекер* Пакеты теряются... Джиттер растет. Эй, ты! Умеешь отличить TCP от UDP без документации? Есть работа.', [
    { text: 'Умею. Что надо сделать?', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'СВЯЗИСТ МОНЯ', 'А, мой любимый пакет! Твои логи — чистый шелк. Линии после тебя светятся как новые. Есть деликатный обрыв на магистрали. Глянешь?', [
    { text: 'Гляну, Моня.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'СВЯЗИСТ МОНЯ', '*протягивает волновод* Смотри — ни одной коллизии! Ты прямо подарок для этой подсети. Садись, есть один "теневой" контракт.', [
    { text: 'Я в деле.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'СВЯЗИСТ МОНЯ', '*отключает монитор* Тебе тут не рады. Слышал, ты с Джиттером спелся? Теневые реле, перехват... Нам такие "инженеры" не нужны. Проваливай в свою пустоту.', [
    { text: 'Это ошибка...', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'СВЯЗИСТ МОНЯ', '*морщится* Слышь, парень, ты фонишь. У тебя джиттер по всем портам. Иди остуди деку, а то спалишь мне всё оборудование.', [
    { text: 'Я в порядке, давай работу.', nextId: 'rank_check' },
    { text: 'Пойду в бар.', nextId: 'LEAVE' }
  ])

  .addNode('intro_repeat', 'СВЯЗИСТ МОНЯ', 'Цикл за циклом... Трафик не ждет. Готов к новой зачистке узла? Те узлы, что ты чистил, до сих пор держат аптайм 99.9%.', [
    { text: 'Давай координаты.', nextId: 'rank_check', requireCompletedQuestId: 'q_bibirevo_combat_link_break_bug_sweep' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat_v2', 'СВЯЗИСТ МОНЯ', 'Слышал, ты и Старому Админу помогал? Хорошее дело — историю надо знать. Но сейчас у нас настоящее под угрозой. Работаем?', [
    { text: 'Работаем.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_parasite', 'СВЯЗИСТ МОНЯ', 'Это "Джиттер-код". Он не ломает систему, он просто делает её невыносимой. Прямо как мой сосед по стойке. (+5 Репутации Net Drivers)', 'intro', 'Net Drivers')

  // === RANK CHECK ===
  .addNode('rank_check', 'СВЯЗИСТ МОНЯ', 'Ну-ка, покажи свой волновод...', [
    { text: '[ Показать волновод ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
    { text: '[ Показать волновод ]', nextId: 'quest_accept', requireMinLevel: 2 },
    { text: '[ Показать волновод ]', nextId: 'quest_accept', isProOnly: true }
  ])

  // === QUEST NODES ===
  .addNode('quest_reject', 'СВЯЗИСТ МОНЯ', 'Ха! С таким волноводом ты только в Академии "Hello World" прозванивать можешь. Нос не дорос! Вернись, когда прокачаешь стек.', [
    { text: 'Я еще вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'СВЯЗИСТ МОНЯ', 'Неплохо. Уровень сигнала стабильный. Контракт твой. Выбей этого Бага с подстанции.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_bibirevo_combat_link_break_bug_sweep' },
    { text: '[ НАЗАД ]', nextId: 'intro' }
  ])

  .addNode('active_status', 'СВЯЗИСТ МОНЯ', 'Линия до сих пор искрит! Чего стоишь? Пинг не будет ждать вечно. Иди работай.', [
    { text: 'Понял, Моня. Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('petrovich_handoff', 'СВЯЗИСТ МОНЯ', 'От Петровича? Тогда без очереди. Есть мост в Марьино: передай Крысе-курьеру метку канала и забери обратный лог. Держи жетон.', [
    { text: '[ПРИНЯТЬ МАРШРУТ]', nextId: 'intro', effect: 'GIVE_ITEM', cardRewardId: 'itm_taxi_token', awardQuestId: 'q_bib_to_maryino_signal_chain' }
  ])
  .addNode('prof_route', 'СВЯЗИСТ МОНЯ', 'Профессор Туранов ведет теорию на Юго-Западной. Но он любит цифры, а не обещания: сперва подними третий уровень в Exploit-DB. Потом уже идешь на экзамен.', [
    { text: 'Ясно, спасибо.', nextId: 'intro' }
  ])

  .build();

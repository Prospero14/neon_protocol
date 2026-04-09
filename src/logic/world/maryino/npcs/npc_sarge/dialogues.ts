import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_sarge_dialogue: DialogueTree = new DialogueBuilder('npc_sarge').withDistrict('maryino')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'СЕРЖАНТ', 'Стой. Дальше только для сотрудников "Восход" или с оплаченным транзитом. Батя из Выхино за тебя просил?', [
    { text: 'Что за "Восход"?', nextId: 'lore' },
    { text: 'Батя прислал меня на прозвон. (q_trace_stress_test)', nextId: 'quest_shluz_accept', requireQuestId: 'q_trace_stress_test' },
    { text: 'Мне сказали, ты поможешь с проходом...', nextId: 'negotiate', requireTrait: 'trait_maryino_gang_lead' },
    { text: 'Нужна работа. (Транзит)', nextId: 'job_selection' },
    { text: 'Сбросил триггеры шлюза.', nextId: 'quest_shluz_finish', requireQuestId: 'q_maryino_shluz_repair' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СЕРЖАНТ', 'Опять в логах камер? Говори по делу или проваливай. Южные шлюзы — не проходной двор.', [
    { text: 'Нужна работа.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'СЕРЖАНТ', 'А, это ты. Вижу, умеешь решать проблемы без шума. Твои отчеты по шлюзам чище, чем у моих капралов. Есть узел для "успокоения".', [
    { text: 'Я готов.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'СЕРЖАНТ', 'Стабильность — наше всё. Ты доказал лояльность "Восходу". Держи пропуск, заслужил.', [
    { text: 'Спасибо, Сержант.', nextId: 'intro', effect: 'GIVE_TRAIT', cardRewardId: 'trait_maryino_shluz_unlocked' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'СЕРЖАНТ', '[DENIED] Ты во всех ориентировках. Твой ID светится багами иNullpointer-кодом. Шаг — и активирую автоматические турели.', [
    { text: 'Я ухожу.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'СЕРЖАНТ', 'Эй, юнит. Твой интерфейс фризит. Это "Восход" на тебя так давит или ты просто перегрет? Отойди от шлюза, пока не сработала тревога.', [
    { text: 'Я в порядке.', nextId: 'intro' },
    { text: 'Пойду остыну.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'СЕРЖАНТ', 'Шлюз №8 работает исправно. Молодец, кодер. Если хочешь больше Bits — у меня всегда найдутся дроны-отступники в бэклоге.', [
    { text: 'Давай контракт.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_maryino_shluz_repair' })
  .addNode('intro_repeat_v2', 'СЕРЖАНТ', 'Транзит активен. Не создавай помех в системе — и мы поладим. Есть задачи по патрулированию.', [
    { text: 'Рассказывай.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore', 'СЕРЖАНТ', 'Я тот, кто держит порядок Марьино. Стабильность системы — это отсутствие лишних связей и неучтенного трафика.', 'intro')

  // === JOB SELECTION ===
  .addNode('job_selection', 'СЕРЖАНТ', 'Всегда нужны люди. Либо зачистка магистрали от дронов, либо ремонт залипшего шлюза. Что потянешь?', [
    { text: 'Зачистка магистрали (Combat).', nextId: 'quest_start', requireQuestId: 'q_maryino_passage' },
    { text: 'Ремонт шлюза (Technical).', nextId: 'quest_shluz_accept' },
    { text: 'Назад.', nextId: 'intro' }
  ])

  // === QUESTS ===
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

  // === NEGOTIATION ===
  .addNode('negotiate', 'СЕРЖАНТ', 'Хвостатые напели? Транзит на сутки — 50 Bits. Или помоги с узлом — выпишу пропуск бесплатно.', [
    { text: 'Плачу 50 Bits.', nextId: 'LEAVE', cost: 50, effect: 'GIVE_TRAIT', cardRewardId: 'trait_maryino_shluz_unlocked' },
    { text: 'Я помогу.', nextId: 'quest_start' },
    { text: 'Позже.', nextId: 'intro' }
  ])

  .build();

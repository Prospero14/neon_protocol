import { DialogueBuilder } from '../../../../dialogueUtils';

/**
 * KIN-T — Старший SRE, GigaBank Infrastructure Division
 * Специализация: нагрузочное тестирование, SLO/SLI/SLA, incident management.
 * Тон: жёсткий, корпоративно-технический, сухой юмор. Уважает данные.
 */
export const npc_kin_t_dialogues = new DialogueBuilder('npc_kin_t').withDistrict('teply_stan')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile', 'intro_hostile_2'],
    repeat: ['intro_repeat']
  })

  // ── ПРИВЕТСТВИЯ ─────────────────────────────────────────────────────────────
  .addNode('intro', 'KIN-T [SRE / GigaBank]',
    'У тебя 30 секунд до следующего scheduled load test. Говори быстро.', [
      { text: 'Что ты делаешь здесь?', nextId: 'lore_origin' },
      { text: 'Что такое нагрузочный тест?', nextId: 'lore_load_testing' },
      { text: 'Есть контракты?', nextId: 'quest_hub' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
  .addNode('intro_v2', 'KIN-T [SRE / GigaBank]',
    'Сигнатура идентифицирована. Не из GigaBank. Значит, либо контрактник, либо проблема. Уточни.', [
      { text: 'Контрактник. Нужна работа.', nextId: 'quest_hub' },
      { text: 'Просто любопытно.', nextId: 'lore_load_testing' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
  .addNode('intro_v3', 'KIN-T [SRE / GigaBank]',
    'p99 в норме. p999 — не твоя забота. Что тебе нужно?', [
      { text: 'Что такое p99?', nextId: 'lore_percentiles' },
      { text: 'Есть задания?', nextId: 'quest_hub' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
  .addNode('intro_v4', 'KIN-T [SRE / GigaBank]',
    'Kin-T. SRE. Если ты по поводу инцидента — номер тикета. Если нет — 60 секунд.', [
      { text: 'Нет инцидента. Хочу работу.', nextId: 'quest_hub' },
      { text: 'Расскажи про работу SRE.', nextId: 'lore_slo' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
  .addNode('intro_friendly', 'KIN-T [SRE / GigaBank]',
    'Данные по твоим операциям у меня. Неплохо. TP95 снизился после твоего вмешательства. Это засчитывается.', [
      { text: 'Ещё задания?', nextId: 'quest_hub' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
  .addNode('intro_hostile', 'KIN-T [SRE / GigaBank]',
    'GigaBank не ведёт переговоры с вандалами. RPS на наши ноды — это атака. Убирайся или escalate до Security.', [
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
  .addNode('intro_hostile_2', 'KIN-T [SRE / GigaBank]',
    'Твой трафик помечен как аномалия. Ещё один запрос — и я сама напишу post-mortem по твоему аккаунту.', [
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
  .addNode('intro_repeat', 'KIN-T [SRE / GigaBank]',
    'Снова ты. Метрики улучшились с твоего последнего визита на 0.3%. Совпадение или нет — не скажу. Что нужно?', [
      { text: 'Хочу ещё контракт.', nextId: 'quest_hub' },
      { text: 'Расскажи ещё про систему.', nextId: 'lore_load_testing' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])

  // ── ЛОР: НАГРУЗОЧНОЕ ТЕСТИРОВАНИЕ ──────────────────────────────────────────
  .addNode('lore_load_testing', 'KIN-T [SRE / GigaBank]',
    'Нагрузочный тест — это крэш-тест для системы. Ты искусственно поднимаешь RPS: 100, 500, 10000 запросов в секунду. Смотришь где ломается. Latency, error rate, throughput. Если не знаешь своего потолка — ты не знаешь ничего.', [
      { text: 'А что такое RPS?', nextId: 'lore_rps' },
      { text: 'Расскажи про p99', nextId: 'lore_percentiles' },
      { text: '[Назад]', nextId: 'intro' }
    ])

  .addLoreNode('lore_rps', 'KIN-T [SRE / GigaBank]',
    'RPS — Requests Per Second. У нас в пике — 840k RPS. Это не предел. Это точка где мы начинаем деградировать. Разница критична.',
    'intro')

  .addNode('lore_percentiles', 'KIN-T [SRE / GigaBank]',
    'p99 — это значит что 99% запросов обрабатываются за X миллисекунд. Но p999? Это самый медленный запрос из тысячи. Пользователи с плохим соединением всегда попадают в хвост. Если ты игнорируешь хвост — ты игнорируешь реальных людей.', [
      { text: 'Почему это важно для Москвы?', nextId: 'lore_moscow_infra' },
      { text: '[Назад]', nextId: 'intro' }
    ])

  .addLoreNode('lore_moscow_infra', 'KIN-T [SRE / GigaBank]',
    'GigaBank обслуживает 70% финансового трафика Московского Ядра. Один процент деградации p99 — это 40 000 незавершённых транзакций в час. Мы не просто держим систему. Мы держим экономику.',
    'intro')

  .addLoreNode('lore_slo', 'KIN-T [SRE / GigaBank]',
    'SLO — Service Level Objective. 99.97% uptime в месяц. Это 13 минут допустимого downtime. Ни секундой больше. Каждая минута сверх — штраф. Каждая штрафная минута — мой провал лично.',
    'intro')

  .addLoreNode('lore_origin', 'KIN-T [SRE / GigaBank]',
    'Пришла в GigaBank как джун-оператор в 2041-м. Через два года написала первый automated load test suite для Московского контура. Через четыре — отвечала за весь Infrastructure SLO. Тёплый Стан — сложная зона. Лесной трафик нестабилен.',
    'intro')

  // ── QUEST HUB ───────────────────────────────────────────────────────────────
  .addNode('quest_hub', 'KIN-T [SRE / GigaBank]',
    'Есть несколько контрактов. Предупреждаю: я проверяю результаты по метрикам, не по словам. Если данные не совпадают — оплаты не будет.', [
      { text: '[КВЕСТ] Нагрузочный тест на Диком Узле', nextId: 'quest_load_test', awardQuestId: 'q_kin_t_load_test' },
      { text: '[КВЕСТ] Найти источник spike latency', nextId: 'quest_latency', awardQuestId: 'q_kin_t_latency_spike' },
      { text: '[КВЕСТ] Написать post-mortem', nextId: 'quest_postmortem', awardQuestId: 'q_kin_t_postmortem', requireQuestId: 'q_kin_t_load_test' },
      { text: '[КВЕСТ] Red Team: Стык Роутеров', nextId: 'quest_red_team', awardQuestId: 'q_kin_t_red_team', requireQuestId: 'q_kin_t_postmortem' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])

  .addNode('quest_load_test', 'KIN-T [SRE / GigaBank]',
    'Узел "Дикий Узел" показывает аномальное поведение под нагрузкой. Мне нужны данные. Пойди туда, активируй его, выдержи 3 хода в боевом режиме без REACTION-карт. Только SCRIPT. Смотри что сломается первым.', [
      { text: 'Принято. Пошёл собирать данные.', nextId: 'LEAVE' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])

  .addNode('quest_latency', 'KIN-T [SRE / GigaBank]',
    'В 03:17 каждой ночи p99 прыгает с 12ms до 340ms. Ровно на 4 минуты. Кто-то или что-то делает это намеренно. Проверь Монитор Экосистемы и зону Охоты на Баг-Тварей. Мне нужны логи.', [
      { text: 'Разберусь.', nextId: 'LEAVE' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])

  .addNode('quest_postmortem', 'KIN-T [SRE / GigaBank]',
    '[UNLOCKED] Ты собрал достаточно данных. Задокументируй инцидент по стандарту. RCA — root cause, timeline, contributing factors, action items. Принеси структурированный отчёт. Я читаю только по шаблону.', [
      { text: 'Буду.', nextId: 'LEAVE' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])

  .addNode('quest_red_team', 'KIN-T [SRE / GigaBank]',
    '[CLASSIFIED] Официально — я не могу это санкционировать. Неофициально — если ты проведёшь контролируемую атаку на Стык Роутеров и вернёшься с отчётом о broken points... заплачу из собственного бюджета. Вне протокола.', [
      { text: 'Это работа для меня.', nextId: 'LEAVE' },
      { text: 'Слишком рискованно.', nextId: 'LEAVE' }
    ])

  .build();

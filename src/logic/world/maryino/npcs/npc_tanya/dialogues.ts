import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_tanya_dialogue: DialogueTree = new DialogueBuilder('npc_tanya')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile', 'intro_hostile_v2'],
    stressed: ['intro_stressed', 'intro_stressed_v2'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'TRACE (QA)', 'Внимание: целостность памяти скомпрометирована... Ты из тех, кто может пропинговать реальность? В Марьино слишком много грязного кода.', [
    { text: 'Как именно пропинговать?', nextId: 'lore_stress' },
    { text: 'Кто такие "Regulators"?', nextId: 'lore_faction' },
    { text: 'Нужна работа по профилю?', nextId: 'job_selection' },
    { text: 'Я закончил аудит.', nextId: 'quest_audit_finish', requireQuestId: 'q_maryino_qa_audit' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'TRACE (QA)', '[SYSTEM_CHECK] Сканирование... В Марьино нестабильный трафик. Есть пара запросов в бэклоге. Тебе интересно?', [
    { text: 'Что за запросы?', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'TRACE (QA)', 'Ноль-один-ноль... Опять лезешь в дебри QA? Нужна грубая сила кода. Иначе "Восход" нас всех "отсортирует".', [
    { text: 'Я помогу.', nextId: 'job_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'TRACE (QA)', '[STATUS_OK] Сигнатура: "Лояльный Аудитор". Твои правки были безупречны. Подсеть стала чище. Есть еще работа для профи.', [
    { text: 'Показывай задачи.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'TRACE (QA)', 'Твой хеш... он идеален. Редко встретишь такую дисциплину в Марьино. Если ищешь серьезный код — я дам тебе рекомендации в Академию.', [
    { text: 'Расскажи про Академию.', nextId: 'lore_libraries' },
    { text: 'Давай работу.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'TRACE (QA)', '[ALERT] Твой ID помечен как "Деструктивный". Твое присутствие — баг. Я активирую протокол зачистки, если не исчезнешь через 3 секунды.', [
    { text: 'Я могу загладить вину?', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_hostile_v2', 'TRACE (QA)', 'Крысиные повадки, Nullpointer-код... Ты ходячий "Hard Reset" для этой системы. Сгинь!', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'TRACE (QA)', '[CRITICAL_WARNING] Твой джиттер превышает нормы! "Восход" уже навел сканеры на твой IP. Дисконнект, немедленно!', [
    { text: 'Я исправлю это.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed_v2', 'TRACE (QA)', '[SYSTEM_FATAL] Ты греешься как старый блок питания. Марьино не место для глюков. Сначала — аптека, потом — разговоры.', [
    { text: 'Хорошо.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'TRACE (QA)', '[SYNCING] Опять регрессия? Тот аудит был завершен успешно, но бэклог никогда не пустует. Готов?', [
    { text: 'Давай.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_maryino_qa_audit' })
  .addNode('intro_repeat_v2', 'TRACE (QA)', 'Слышала, ты и в Академии уже отметился. Профессор Архипов ценит такие "образцы". Но в Марьино всё еще грязно. Погнали?', [
    { text: 'Погнали.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_stress', 'TRACE (QA)', 'Пропиновать реальность — значит проверить отклик каждого нейро-порта. Если задержка выше 10мс, ты уже не в Марьино, ты в кэше Ядра.', 'intro')
  .addLoreNode('lore_faction', 'TRACE (QA)', 'Мы — остатки структуры. Пока Nullpointers жгут кабели, мы их прокладываем заново. Нам нужна Стабильность.', 'intro', 'Federal Oversight')
  .addLoreNode('lore_libraries', 'TRACE (QA)', 'Если ищешь продвинутые библиотеки (Collections/Streams), тебе прямая дорога в Академию (Юго-Запад). Там Архипов держит эталонные репозитории.', 'intro')

  // === JOB SELECTION ===
  .addNode('job_selection', 'TRACE (QA)', 'В бэклоге пара задач: стресс-тест локалки или аудит безопасности терминалов. Что потянешь?', [
    { text: 'Стресс-тест локалки (Combat).', nextId: 'job_explain_1' },
    { text: 'Аудит терминалов (Logic).', nextId: 'quest_audit_accept' },
    { text: 'Назад.', nextId: 'intro' }
  ])

  // === JOB 1 (STRESS TEST) ===
  .addNode('job_explain_1', 'TRACE (QA)', 'Затык в коммутаторах. Нужно зайти и "протолкнуть" трафик грубой силой. Формат: STRESS_TEST.', [
    { text: 'Это безопасно?', nextId: 'job_explain_2' },
    { text: 'Я готов.', nextId: 'rank_check' }
  ])
  .addNode('job_explain_2', 'TRACE (QA)', 'Безопасно? Это QA в Октябре, парень. Бэкапы могут тебя укусить. Берешь узел?', [
    { text: 'Беру.', nextId: 'rank_check' },
    { text: 'Ухожу.', nextId: 'intro' }
  ])

  // === RANK CHECK ===
  .addNode('rank_check', 'TRACE (QA)', 'Дай гляну твой волновой лог... QA не терпит дилетантов.', [
    { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 4, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'job', requireMinLevel: 5 },
    { text: '[ Ждать ]', nextId: 'job', isProOnly: true }
  ])
  .addNode('quest_reject', 'TRACE (QA)', '[ERROR] Твой уровень доступа — "Trainee". Вернись, когда прокачаешь стек до Level 5. Нам нужны профессионалы.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('job', 'TRACE (QA)', 'Узел выделен. Если прозвон пройдет успешно — Bits будут на счету. Приступай.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_maryino_npc_tanya_signal_sweep' }
  ])

  // === JOB 2 (AUDIT) ===
  .addNode('quest_audit_accept', 'TRACE (QA)', 'Просканируй три терминала на предмет "Shadow-Header" инъекций. Плачу 50 Bits. Согласен?', [
    { text: 'Я сделаю аудит.', nextId: 'LEAVE', awardQuestId: 'q_maryino_qa_audit' },
    { text: 'Нет.', nextId: 'intro' }
  ])
  .addNode('quest_audit_finish', 'TRACE (QA)', 'Сигнатуры чисты. Аномалий нет. Оплата переведена.', [
    { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 50, completeQuestId: 'q_maryino_qa_audit' }
  ])

  .build();

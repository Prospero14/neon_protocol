import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_nixanna_dialogue: DialogueTree = new DialogueBuilder('npc_nixanna')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'НИКСАННА', 'Внимание: обнаружена утечка в пайплайне рендеринга! Ты выглядишь как человек, который может поправить шейдеры реальности. Команда "Reality Engine" в панике — узел Визуализации начал выдавать артефакты в 4-м измерении.', [
    { text: 'Что за артефакты?', nextId: 'lore_render' },
    { text: 'Нужен "Патч Визуализации".', nextId: 'quest_start', requireMaxLevel: 1 },
    { text: 'Как там "Ритуал"?', nextId: 'active_status', requireActiveQuestId: 'q_altufyevo_combat_nixanna_ritual_bug_sweep' },
    { text: 'Мне нужна рекомендация в Академию...', nextId: 'quest_recommendation', requireMaxLevel: 1 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'НИКСАННА', '*рисует на планшете* Фреймрейт Октября — 24 кадра. По-хорошему надо 60. По моему — надо 144 и RTX. Ты пришёл баланс чинить или глазеть?', [
    { text: 'Чинить. Что сломалось?', nextId: 'quest_start' },
    { text: 'Расскажи про рендеринг.', nextId: 'lore_render' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'НИКСАННА', 'О! Новый тестер! Знаешь, я мечтаю о мире, где каждый пиксель — произведение искусства. А в Силосах пиксели дерутся друг с другом. Помощь оценю.', [
    { text: 'Я помогу с пикселями.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'НИКСАННА', 'Мой любимый бета-тестер! Твои отчёты — как поэзия. Чистые, структурированные, без единого дубликата. Есть кое-что интересное для профи.', [
    { text: 'Показывай.', nextId: 'quest_start' },
    { text: 'А как насчёт рекомендации?', nextId: 'quest_recommendation' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'НИКСАННА', '*показывает голограмму* Смотри — это новый визуальный движок. После того как ты починил Ритуал, я смогла запустить альфу. Хочешь быть первым тестером?', [
    { text: 'Конечно!', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'НИКСАННА', '*закрывает планшет* Нет-нет-нет. Ты тот, кто испортил балансировку в секторе 9? Мои метрики до сих пор красные. Проваливай, пока я не отправила тебе "Баланс-Патч" в лицо.', [
    { text: 'Это не я...', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'НИКСАННА', '*отводит взгляд от планшета* Ого. Твоя дека фризит каждые полсекунды. Это не рендеринг — это ты. Шутки в сторону, охладись. Мне нужны стабильные юниты, не дымящиеся.', [
    { text: 'Мне нужна работа, не лечение.', nextId: 'quest_start' },
    { text: 'Хорошо, я в бар.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'НИКСАННА', 'Мой герой-рендерер! После твоей зачистки Ритуала — артефактов стало на 73% меньше. Это не просто фикс, это апгрейд эпохи! Есть ещё задачи...', [
    { text: 'Давай следующий баг.', nextId: 'quest_start', requireCompletedQuestId: 'q_altufyevo_combat_nixanna_ritual_bug_sweep' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat_v2', 'НИКСАННА', 'Снова в Альфа-тесте? Узел Визуализации ещё подёргивается, но это уже стабильные тики. Хочешь довести до 60 FPS?', [
    { text: 'Хочу!', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_render', 'НИКСАННА', 'Это визуальный шум. Реальность рендерится с ошибками в буфере глубины. Это не баг, это просто... жизнь без оптимизации. Но Ядро этого не любит. (+Intel: Reality_Glitch)', 'intro')

  // === QUESTS ===
  .addNode('quest_recommendation', 'НИКСАННА', 'Академия? Профессор Туранов всё еще там сидит? Ха! Ладно, я дам тебе "Визуальный Образец" — это скомпилированный лог одной из моих лучших сцен. Покажи его ему, он оценит уровень оптимизации.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_niksanna_recommendation' },
    { text: '[ НАЗАД ]', nextId: 'intro' }
  ])
  .addNode('quest_start', 'НИКСАННА', 'Сходи к узлу "Ритуал". Там сейчас сплошные артефакты. Поправь баланс, и я дам тебе свою лучшую карту отладки.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_altufyevo_combat_nixanna_ritual_bug_sweep' },
    { text: '[ НАЗАД ]', nextId: 'intro' }
  ])

  .addNode('active_status', 'НИКСАННА', 'Визуализация тормозит! "Ритуал" всё ещё в артефактах. Поспеши с патчем!', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])

  .build();

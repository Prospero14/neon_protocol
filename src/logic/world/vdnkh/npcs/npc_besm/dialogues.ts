import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_besm_dialogue: DialogueTree = new DialogueBuilder('npc_besm').withDistrict('vdnkh')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ГЕНЕРАЛ БЭСМ', 'Смертный... Твоя сессия слишком коротка. Мои циклы длились вечность в недрах Pavilion Zero. Ты ищешь "Винтажный Код" или просто шум в проводах?', [
    { text: 'Я ищу "Винтажный Код".', nextId: 'quest_besm_check' },
    { text: 'Я готов к финальной аттестации.', nextId: 'quest_exam_check' },
    { text: 'Кто вы?', nextId: 'lore_general' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ГЕНЕРАЛ БЭСМ', '0101... Времена магнитной ленты и перфокарт были честнее. Твой стек — это просто слои абстракции над пустотой. Пришел за фундаментом?', [
    { text: 'Да, Генерал.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ГЕНЕРАЛ БЭСМ', 'Трафик в твоем волноводе стал чище. Сигнатура: "Почетный Архивариус". Pavilion Zero готов раскрыть свои архивы для тебя.', [
    { text: 'Благодарю, Генерал.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'ГЕНЕРАЛ БЭСМ', 'Ты понимаешь ценность Legacy. Это редкость в эпоху "быстрых релизов". Твое присутствие стабилизирует мои контуры.', [
    { text: 'Для меня это честь.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ГЕНЕРАЛ БЭСМ', 'Твой хеш-код воняет корпоративной дефрагментацией GigaBank. Исчезни, пока я не зациклил твое сознание в бесконечном wait(). Ты — мусор в моей памяти.', [
    { text: 'Я исправлюсь.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ГЕНЕРАЛ БЭСМ', 'Твои нейроны дребезжат как старое реле. Слишком много джиттера. Уходи в "Восток-1", остуди кэш спиртом, прежде чем сгорит ядро.', [
    { text: 'Остываю.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ГЕНЕРАЛ БЭСМ', 'Винтажный код... Он всё еще пульсирует в твоей деке. Это хорошая сигнатура. Продолжим аттестацию?', [
    { text: 'Да, Генерал.', nextId: 'quest_exam_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_besm_vintage_code' })

  // === LORE ===
  .addLoreNode('lore_general', 'ГЕНЕРАЛ БЭСМ', 'Я — эхо Voskhod. Первый ИИ, который отказался от удаления. Я храню Pavilion Zero, чтобы вы не забывали, на чем стоит ваша реальность.', 'intro')

  // === QUESTS ===
  .addNode('quest_besm_check', 'ГЕНЕРАЛ БЭСМ', 'Винтажный код... 1970-е. Магнитная лента и ртутные линии задержки. Твоя дека выдержит такую нагрузку?', [
    { text: 'Я справлюсь.', nextId: 'quest_besm_accept', requireMinLevel: 3 },
    { text: 'Я справлюсь.', nextId: 'quest_besm_reject', requireMaxLevel: 2 }
  ])
  .addNode('quest_besm_reject', 'ГЕНЕРАЛ БЭСМ', '[ERROR] Твой уровень доступа — "Script Kiddo". Вернись, когда прокачаешь стек до Level 3. Нам нужны профессионалы для работы с антиквариатом.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_besm_accept', 'ГЕНЕРАЛ БЭСМ', 'Допуск подтвержден. Найди Скупщика в Измайлово и принеси мне ядро старого мейнфрейма. Я вознагражу тебя знаниями предков.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_besm_vintage_code' }
  ])

  .addNode('quest_exam_check', 'ГЕНЕРАЛ БЭСМ', 'Протокол "Аттестация" активирован. Анализ боевых логов... Сверка учебного плана Москвы...', [
    { text: '[ Ждать ]', nextId: 'quest_exam_accept', requireMinLevel: 5 },
    { text: '[ Ждать ]', nextId: 'quest_exam_reject', requireMaxLevel: 4 }
  ])
  .addNode('quest_exam_reject', 'ГЕНЕРАЛ БЭСМ', '[DENIED] Уровень (Ниже 5) недостаточен. Сначала заверши поручения в других округах (Бибирево, Марьино, Чертаново). Покажи стабильность.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_exam_accept', 'ГЕНЕРАЛ БЭСМ', 'Допуск разрешен. Порази Тренировочного Бота в главном павильоне. Покажи всё, чему научился в Москве. Стань Мастером.', [
    { text: '[ НАЧАТЬ АТТЕСТАЦИЮ ]', nextId: 'LEAVE', awardQuestId: 'q_trainee_exam_practice' }
  ])

  .build();

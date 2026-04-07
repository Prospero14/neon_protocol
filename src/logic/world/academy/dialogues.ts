import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const academy_dialogues: Record<string, DialogueTree> = {
  // --- PROFESSOR ARKHIPOV ---
  npc_professor_arkhipov: new DialogueBuilder('npc_professor_arkhipov')
    .withGreetings({
      neutral: ['intro', 'welcome_v2'],
      friendly: ['welcome_friendly'],
      stressed: ['stressed_welcome'],
      repeat: ['welcome_repeat']
    })
    .addNode('intro', 'ПРОФЕССОР Туранов', 'IDENTITY_VERIFIED: Поздравляю с получением лицензии Silicon Hedge. Твоя дека — это скальпель в руках хирурга. Начнем с основ архитектуры.', [
      { text: 'Я принес методички от Ильи.', nextId: 'delivery_complete', requireQuestId: 'q_sokol_talk_lab_delivery' },
      { text: 'Где мне искать продвинутые библиотеки (Collections/Streams)?', nextId: 'lore_libraries', requireReputation: { factionId: 'SILICON_HEDGE', minPoints: 25 } },
      { text: 'Я готов слушать. [ CORE_CPU ]', nextId: 'cpu_lecture' },
      { text: 'Кто такие Silicon Hedge?', nextId: 'lore_faction' },
      { text: 'Пропустить теорию (Не рекомендуется)', nextId: 'LEAVE' }
    ])
    .addNode('lore_libraries', 'ПРОФЕССОР Туранов', 'Вы по адресу. Наши архивы содержат полные спецификации Collections и Streams API. Ищите у дирижеров EU Syntax. Но если вам нужен Spring — это к фанатичным изгнанникам в Измайлово.', [
      { text: 'Благодарю.', nextId: 'intro' }
    ])
    .addNode('welcome_v2', 'ПРОФЕССОР Туранов', 'Циклы Академии никогда не останавливаются. Опять ты? Твои показатели в норме, но теория никогда не бывает лишней. Продолжим?', [
      { text: 'Пожалуй.', nextId: 'cpu_lecture' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('welcome_friendly', 'ПРОФЕССОР Туранов', 'А, мой лучший адепт Чистого Кода! Вижу, твоя сигнатура стала еще стабильнее. Чем могу помочь сегодня?', [
      { text: 'Хочу освежить теорию.', nextId: 'cpu_lecture' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('welcome_repeat', 'ПРОФЕССОР Туранов', 'Рекурсия — мать учения. Возвращаешься к истокам? Ну что же, мой терминал всегда открыт для жаждущих знаний.', [
       { text: 'Начнем сначала.', nextId: 'cpu_lecture' },
       { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('stressed_welcome', 'ПРОФЕССОР Туранов', '[ERR_STRESS_OVERFLOW] Твой нейроинтерфейс дрожит, юнит. С таким шумом ты не усвоишь даже простейший цикл. Попробуем стабилизировать тебя.', [
      { text: 'Слушаю лекцию.', nextId: 'cpu_lecture' }
    ])
    .addLoreNode('lore_faction', 'ПРОФЕССОР Туранов', 'Silicon Hedge — это фундамент. Мы не просто пишем код, мы строим законы, по которым живет эта цифровая реальность. Порядок — высшая ценность.', 'intro', 'Silicon Hedge')
    .addNode('cpu_lecture', 'ПРОФЕССОР Туранов', 'CORE_CPU — это твои когнитивные ядра. Каждое действие в бою "ест" один такт. Если ядра на нуле — твой ход окончен. Не думай быстрее железа.', [
      { text: 'Понял. Что насчет NEURAL_RAM?', nextId: 'ram_lecture' }
    ])
    .addNode('ram_lecture', 'ПРОФЕССОР Туранов', 'NEURAL_RAM — твоя память. Карта не срабатывает мгновенно, она загружается в RAM. Если память забита — ты не сможешь планировать новые действия.', [
      { text: 'А SYSTEM_STRESS?', nextId: 'stress_lecture' }
    ])
    .addNode('stress_lecture', 'ПРОФЕССОР Туранов', 'SYSTEM_STRESS — это перегрев. Если достигнет 100% — нейросеть уйдет в перезагрузку. Всегда следи за красной шкалой.', [
      { text: 'Как проходит OPERATIONS?', nextId: 'combat_lecture' }
    ])
    .addNode('combat_lecture', 'ПРОФЕССОР Туранов', ' OPERATIONS делятся на ARCHITECTURE (планирование) и ENGINEERING (исполнение). Никогда не начинай Engineering, если твоя архитектура — мусор.', [
      { text: 'Я готов к практике. [ ЗАВЕРШИТЬ ОБУЧЕНИЕ ]', nextId: 'installed_end', completeQuestId: 'q_neon_academy_bootcamp' }
    ])
    .addNode('delivery_complete', 'ПРОФЕССОР Туранов', 'О, материалы от Ильи. Оперативно. Твоя дисциплина впечатляет. Держи небольшой бонус к репутации.', [
      { text: 'Спасибо, Профессор.', nextId: 'intro', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'SILICON_HEDGE' }
    ])
    .addNode('lore_nixanna', 'ПРОФЕССОР Туранов', 'Никсанна... Давно её не было в сети Академии. Говорят, она ушла в глубокий аутсорс в Алтуфьево. Хороший специалист, хоть и со странностями.', [
      { text: 'Она помогла мне.', nextId: 'intro' }
    ])
    .addNode('installed_end', 'ПРОФЕССОР Туранов', 'Теперь ты — сертифицированный оператор. Твоя дека разблокирована. Иди и не позорь мои алгоритмы.', [
      { text: 'Спасибо, Профессор.', nextId: 'LEAVE' }
    ])
    .build(),

  // --- ACADEMY STUDENT ---
  npc_academy_student: new DialogueBuilder('npc_academy_student')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'СТУДЕНТ', 'IDENTITY_CHECK... О, ты не из наших. Помоги Студенту, а? Нужно собрать три "битых сектора" в районе Академии для моей курсовой.', [
      { text: 'Что за курсовая?', nextId: 'quest_explain' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'СТУДЕНТ', '*нервно печатает* Дедлайн через час... У тебя есть свободные прерывания? Помоги с данными.', [
      { text: 'Я помогу.', nextId: 'quest_explain' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'СТУДЕНТ', 'Опять ты! Ну как там с моими секторами? Профессор уже греет компилятор...', [
      { text: 'В процессе.', nextId: 'LEAVE' }
    ])
    .addNode('quest_explain', 'СТУДЕНТ', 'Мне нужны дампы с внешних узлов. Три штуки. Это несложно, если твоя дека не фонит. Сделаешь?', [
      { text: '[ ПРИНЯТЬ: СБОР ДАННЫХ ]', nextId: 'LEAVE', awardQuestId: 'q_academy_student_research' },
      { text: 'Я занят.', nextId: 'intro' }
    ])
    .build(),

  // --- TUTOR BOT ---
  npc_academy_tutor: new DialogueBuilder('npc_academy_tutor')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ТЬЮТОР-БОТ', 'БИП-БУП: Обнаружен стажёр. Готовность к симуляции боя: 100%. Желаете провести тренировочный дебаг на Манекене?', [
        { text: 'Я готов к практике.', nextId: 'quest_explain' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ТЬЮТОР-БОТ', 'ВНИМАНИЕ: Обнаружена низкая активность боевых модулей. Рекомендуется калибровка через практическое столкновение. Начать?', [
        { text: 'Начать калибровку.', nextId: 'quest_explain' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ТЬЮТОР-БОТ', 'Обнаружен ранее сертифицированный юнит. Желаете повторить цикл тренировки для закрепления навыков?', [
        { text: 'Повторить цикл.', nextId: 'quest_explain' }
    ])
    .addNode('quest_explain', 'ТЬЮТОР-БОТ', 'Симуляция "Academy_Defense_v0.1". Тебе предстоит столкнуться с учебным процессом-манекеном. Порядок действий: сначала просканируй структуру (ls), затем выведи приветствие (cat). Порядок — это дисциплина. Начинаем?', [
        { text: '[ ПРИНЯТЬ: БОЕВАЯ ПРАКТИКА ]', nextId: 'LEAVE', awardQuestId: 'q_academy_combat_training' },
        { text: 'Позже.', nextId: 'intro' }
    ])
    .build(),
};

import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_professor_dialogues = new DialogueBuilder('npc_professor').withDistrict('south_west')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'ПРОФЕССОР Туранов', 'Приветствую. Перед практикой вам нужен базовый допуск Junior: архитектурная дисциплина, модель памяти и аккуратная работа с ошибками. Готовы к вступительному экзамену?', [
    { text: '[ПРИНЯТЬ] Вступительный курс Junior Java', nextId: 'intro', awardQuestId: 'q_trainee_exam_theory', requireMinLevel: 3 },
    { text: 'Хочу на курс, но, кажется, рано.', nextId: 'intro_locked', requireMaxLevel: 2 },
    { text: 'Я готов к экзамену. Начинайте.', nextId: 'quiz_1', requireQuestId: 'q_trainee_exam_theory' },
    { text: 'Я уже получил допуск Junior.', nextId: 'intro_junior', requireCompletedQuestId: 'q_trainee_exam_practice' },
    { text: 'Просто смотрю.', nextId: 'LEAVE' }
  ])
  .addNode('intro_locked', 'ПРОФЕССОР Туранов', 'Пока у вас мало подтвержденной практики. Наберите третий уровень Script-Kiddo по базе Exploits, затем вернитесь: курс откроется автоматически.', [
    { text: 'Принято.', nextId: 'LEAVE' }
  ])
  .addNode('intro_junior', 'ПРОФЕССОР Туранов', 'Теперь вы Junior. Держите фокус на инженерной культуре: тесты, читаемость, стабильный релиз. Дальше — только глубже.', [
    { text: 'Спасибо, профессор.', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'ПРОФЕССОР Туранов', 'А, мой лучший студент! Ваши познания в структурах данных делают честь нашему факультету. Хотите пройти продвинутый тест или просто обсудим архитектуру?', [
    { text: 'Давайте тест, профессор.', nextId: 'quiz_1' }
  ])
  .addNode('intro_repeat', 'ПРОФЕССОР Туранов', 'Снова в стенах академии? Знания требуют постоянной рефакторизации. Готовы освежить память?', [
    { text: 'Да, профессор.', nextId: 'quiz_1' }
  ])
  .addNode('quiz_1', 'ПРОФЕССОР Туранов', 'Вопрос первый: где в JVM живут локальные переменные и параметры метода?', [
    { text: 'Stack (Стек).', nextId: 'quiz_2' },
    { text: 'Heap (Куча).', nextId: 'quiz_fail' }
  ])
  .addNode('quiz_2', 'ПРОФЕССОР Туранов', 'Вопрос второй: где JVM хранит метаданные классов и сигнатуры?', [
    { text: 'Metaspace (бывший PermGen).', nextId: 'quiz_3' },
    { text: 'Heap (Куча).', nextId: 'quiz_fail' }
  ])
  .addNode('quiz_3', 'ПРОФЕССОР Туранов', 'Финальный вопрос: в проде словили StackOverflowError. Ваш первый шаг как junior-инженера?', [
    { text: 'Снять стек вызовов, локализовать рекурсивный цикл и зафиксировать инцидент.', nextId: 'quiz_win' },
    { text: 'Срочно перезапустить все сервисы района.', nextId: 'quiz_fail' }
  ])
  .addNode('quiz_win', 'ПРОФЕССОР Туранов', 'Зачтено. Теоретический допуск Junior подтвержден. Теперь у вас есть право выйти на практическую аттестацию у Генерала БЭСМ на ВДНХ.', [
    { text: 'Принято.', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 100, completeQuestId: 'q_trainee_exam_theory' }
  ])
  .addNode('quiz_fail', 'ПРОФЕССОР Туранов', 'Пока рано. Повторите основы, особенно модель памяти JVM и дисциплину отладки, затем возвращайтесь на пересдачу.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .build();

import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_compiler_dialogues = new DialogueBuilder('npc_compiler').withDistrict('south_west')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'КОМПИЛЯТОР', 'Компилятор слушает. Мы не любим лишних слов. Только байт-код. Что тебе нужно?', [
    { text: 'Расскажи о чистоте кода.', nextId: 'lore' },
    { text: 'Нужна работа по оптимизации.', nextId: 'quest_profiler_accept' },
    { text: 'Я зачистил баги на Мейнфрейме.', nextId: 'quest_profiler_finish', requireQuestId: 'q_south_west_profiler' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'КОМПИЛЯТОР', '*пробегает глазами лог* Вижу неоптимальные ветвления в твоем поведении. Зачем тратишь циклы процессора на разговоры?', [
    { text: 'Хочу стать эффективнее.', nextId: 'quest_profiler_accept' }
  ])
  .addNode('intro_friendly', 'КОМПИЛЯТОР', 'Твой код... он почти идеален. Минимум прыжков, максимум прямого исполнения. Есть ли у тебя еще ресурсы для EU_SYNTAX?', [
    { text: 'Всегда найдутся.', nextId: 'quest_profiler_accept' }
  ])
  .addNode('intro_repeat', 'КОМПИЛЯТОР', 'Снова здесь? Память очищена, но узел Academic опять забивается мусором. Пора делать очередной прогон деструктора.', [
    { text: 'Я готов.', nextId: 'quest_profiler_accept' }
  ])
  .addLoreNode('lore', 'КОМПИЛЯТОР', 'Чистый код — это миф. Реальность — это оптимизация. Каждая лишняя команда — это потерянная энергия района. (+10 Репутации EU_SYNTAX)', 'intro', 'EU_SYNTAX', { effect: 'GIVE_REPUTATION', amount: 10 })
  .addNode('quest_profiler_accept', 'КОМПИЛЯТОР', 'У нас проблема с профилировщиком на Мейнфрейме. Узел "Academic" забит мусорными объектами. Нужно зайти и запустить деструктор. Рискнешь?', [
    { text: 'Я сделаю это.', nextId: 'LEAVE', awardQuestId: 'q_south_west_profiler' },
    { text: 'Слишком опасно.', nextId: 'intro' }
  ])
  .addNode('quest_profiler_finish', 'КОМПИЛЯТОР', 'Анализ завершен. Вижу, мусор удален. Хорошая работа, оптимизатор. Вот твоя доля.', [
    { text: 'Принято.', nextId: 'intro', effect: 'GIVE_BITS', amount: 80, completeQuestId: 'q_south_west_profiler' }
  ])
  .build();

import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_vykhino_loader_dialogues = new DialogueBuilder('npc_vykhino_loader')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
    friendly: ['intro_friendly'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'ГРУЗЧИК', '*тяжело дышит* Уф... Пакеты данных плотные, а охлаждение не железное! Хотя... наполовину.', [
    { text: 'Тяжело работать в транзитной зоне?', nextId: 'lore' },
    { text: 'Нужна помощь с грузом?', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ГРУЗЧИК', '*протирает манипуляторы* Весь день таскаю дампы. Заработать хочешь?', [
    { text: 'Что за работа?', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'ГРУЗЧИК', '[BUFFER_FULL] Дай я этот массив в кэш сброшу... Слишком много транзита.', [
     { text: 'Есть груз?', nextId: 'quest_pitch' },
     { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v4', 'ГРУЗЧИК', 'Мои соленоиды воют. Кому-то в Алтуфьево приспичило бэкап. Ноги быстрые?', [
     { text: 'Быстрее некуда.', nextId: 'intro' }
  ])
  .addNode('intro_friendly', 'ГРУЗЧИК', 'О, надежные ноги! Твой блок дошел без битых пикселей. Есть еще "фонящий" архив.', [
    { text: 'Слушаю.', nextId: 'quest_pitch' }
  ])
  .addNode('intro_stressed', 'ГРУЗЧИК', 'У тебя CPU визжит. В таком состоянии даже флешку не удержишь. Сходи к Бате за охладом.', [
    { text: 'Ладно.', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'ГРУЗЧИК', 'Снова за блоками? Спина готова к нагрузкам?', [
    { text: 'Давай груз.', nextId: 'quest_pitch' }
  ])
  .addLoreNode('lore', 'ГРУЗЧИК', 'Транзит — сердце Москвы-Зеро. Весь трафик между северными и южными хабами идет через нас. (+5 Репутации Net Drivers)', 'intro', 'Net Drivers')
  .addNode('quest_pitch', 'ГРУЗЧИК', 'Есть блок для Петровича в Алтуфьево. Он вскроет без детонации. Потянешь?', [
    { text: 'Я справлюсь. (Стандарт)', nextId: 'rank_check' },
    { text: 'Я могу фильтровать помехи. (Technical)', nextId: 'quest_pitch_tech', requireMinLevel: 2 },
    { text: 'Петрович меня рекомендовал. (Lore)', nextId: 'quest_pitch_lore', requireReputation: { factionId: 'RAST_VALLEY', minPoints: 10 } }
  ])
  .addNode('quest_pitch_tech', 'ГРУЗЧИК', 'Фильтровать умеешь? Блок шумит. Если погасишь всплески — Петрович накинет.', [
    { text: 'Беру.', nextId: 'rank_check' }
  ])
  .addNode('quest_pitch_lore', 'ГРУЗЧИК', 'Раз Петрович мазу тянет — значит рука прямая. Забирай без вопросов.', [
    { text: 'Не подкачаю.', nextId: 'rank_check' }
  ])
  .addNode('rank_check', 'ГРУЗЧИК', 'Дай гляну страховку... просто покажи, что не "чайник".', [
    { text: '[ Показать логи ]', nextId: 'quest_accept', requireMinLevel: 0 },
    { text: '[ Показать логи ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'ГРУЗЧИК', 'Дружок, у тебя уровень — "библиотекарь". Рванет — битов не останется. Свободен.', [
    { text: 'Ладно...', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ГРУЗЧИК', 'Вроде крепкий. Петрович не любит ждать. Битсы получишь у него.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_vykhino_delivery' }
  ])
  .build();

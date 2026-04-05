import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const south_west_dialogues: Record<string, DialogueTree> = {
  // --- PROFESSOR ARKHIPOV ---
  npc_professor: new DialogueBuilder('npc_professor')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'ПРОФЕССОР АРХИПОВ', 'А, коллега. Вовремя. В Мейнфрейме Университета творится неладное — "битые ссылки" и зомби-объекты. Silicon Hedge ценит порядок. Что привело?', [
      { text: 'Кто такие Silicon Hedge?', nextId: 'lore_faction' },
      { text: 'Как помочь con памятью?', nextId: 'quest_explain_1' },
      { text: 'Я принес рекомендацию от Никсанны.', nextId: 'quest_nixanna_finish', requireQuestId: 'q_niksanna_recommendation' },
      { text: 'Я принес методички от Ильи из Сокола.', nextId: 'quest_lab_finish', requireQuestId: 'q_sokol_talk_lab_delivery' },
      { text: 'Нужен Оптимизатор для Ткача.', nextId: 'quest_weaver_check', requireQuestId: 'q_weaver_pattern' },
      { text: 'Я за лицензией (500 Bits)', nextId: 'check_exam', cost: 500 },
      { text: '[ Уйти ]', nextId: 'LEAVE' }
    ])
    .addNode('quest_lab_finish', 'ПРОФЕССОР АРХИПОВ', 'Методички? Наконец-то. Илья вечно задерживает поставки. Вот, возьмите за труды. Это поможет вашему стеку.', [
      { text: 'Спасибо, Профессор.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_sokol_talk_lab_delivery' }
    ])
    .addNode('intro_v2', 'ПРОФЕССОР АРХИПОВ', '*поправляет очки* Вижу, стек прошел дефрагментацию. Вы здесь ради теории или есть практический запрос к мейнфрейму?', [
      { text: 'Что такое "Экзамен Стажёра"?', nextId: 'lore_exam' },
      { text: 'Я пришел помочь con зачисткой.', nextId: 'quest_explain_1' },
      { text: 'Мне нужен паттерн для Ткача.', nextId: 'quest_weaver_check', requireQuestId: 'q_weaver_pattern' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'ПРОФЕССОР АРХИПОВ', 'Рад видеть прилежного ученика. Ваши успехи делают честь кафедре. Нужна практика?', [
      { text: 'Да, Профессор.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile', 'ПРОФЕССОР АРХИПОВ', '[ACCESS_DENIED] Твои логи полны деструкции. Ты — академический баг. Покиньте аудиторию.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ПРОФЕССОР АРХИПОВ', 'Снова утечки в Мейнфрейме? Зомби-объекты плодятся быстро. Продолжим?', [
      { text: 'Да, за работу.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'ПРОФЕССОР АРХИПОВ', 'Silicon Hedge — это стражи алгоритмов. Мы верим, что код — это новая ДНК Москвы. (+Intel: Silicon Hedge)', 'intro', 'Silicon Hedge')
    .addNode('quest_explain_1', 'ПРОФЕССОР АРХИПОВ', 'Мейнфрейм захвачен "мусорными" процессами. Нужно зайти в ядро и провести дефрагментацию. Охрана в режиме паники.', [
      { text: 'Охрана будет атаковать?', nextId: 'quest_explain_2' },
      { text: 'Проверяйте сигнатуру.', nextId: 'rank_check' }
    ])
    .addNode('quest_explain_2', 'ПРОФЕССОР АРХИПОВ', 'Увы, автоматика не различает врачей и болезни. Будьте готовы к сопротивлению. Но Bits того стоят.', [
      { text: 'Я иду.', nextId: 'rank_check' },
      { text: 'Позже.', nextId: 'intro' }
    ])
    .addNode('rank_check', 'ПРОФЕССОР АРХИПОВ', 'Давайте взглянем на ваши достижения... (Исследует профиль...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ПРОФЕССОР АРХИПОВ', 'Вынужден отказать. С таким уровнем вы только создадите новые утечки. Попрактикуйтесь на простых скриптах.', [
      { text: 'Я вернусь, Профессор.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ПРОФЕССОР АРХИПОВ', 'Впечатляющая чистота. Допуск выписан. Очистите Мейнфрейм, и я вознагражу вас. (Принять контракт)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_professor_garbage' }
    ])
    .addNode('quest_nixanna_finish', 'ПРОФЕССОР АРХИПОВ', '*рассматривает образец* Никсанна... Она умела превращать хаос в искусство. Это шедевр. Поставлю вам зачет авансом.', [
      { text: 'Благодарю, Профессор.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_niksanna_recommendation' }
    ])
    .addNode('quest_weaver_check', 'ПРОФЕССОР АРХИПОВ', 'Паттерн Ткача? Закрытая архитектура. Требует допуска или... глубокого проникновения. Как будете действовать?', [
        { text: 'Взломать архив. (Combat)', nextId: 'quest_weaver_combat' },
        { text: 'Убедить в важности дела. (Technical)', nextId: 'quest_weaver_tech', requireMinLevel: 5 },
        { text: 'Найти в забытых логах. (Lore)', nextId: 'quest_weaver_lore', requireReputation: { factionId: 'SILICON_HEDGE', minPoints: 20 } },
        { text: 'Я позже вернусь.', nextId: 'intro' }
    ])
    .addNode('quest_weaver_combat', 'ПРОФЕССОР АРХИПОВ', 'Взлом Академии?! Смело... Если системы вас обнаружат — я умою руки. (Боевой перехват)', [
      { text: '[ ВЗЛОМАТЬ АРХИВ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_south_west_combat_academic_guard_bug_sweep' }
    ])
    .addNode('quest_weaver_tech', 'ПРОФЕССОР АРХИПОВ', 'Ваши аргументы логичны. Вы доказали техническую зрелость. Держите оригинал.', [
      { text: 'Спасибо, Профессор.', nextId: 'quest_weaver_finish' }
    ])
    .addNode('quest_weaver_lore', 'ПРОФЕССОР АРХИПОВ', 'Вы читали труды "Старой Школы"? Приятно. В подвальных логах есть копия. Высылаю.', [
      { text: 'Ценю помощь.', nextId: 'quest_weaver_finish' }
    ])
    .addNode('quest_weaver_finish', 'ПРОФЕССОР АРХИПОВ', 'Передай Савве, что чистота кода важнее сложности узора.', [
      { text: 'Передам.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_weaver_pattern' }
    ])
    .addNode('check_exam', 'ПРОФЕССОР АРХИПОВ', 'Посмотрим логи... Если победили тренировочного бота на ВДНХ — подпишу диплом. Чего желаете?', [
        { text: 'Только Лицензия (500 Bits)', nextId: 'installed', requireUnlock: true, effect: 'SET_PROFESSION', cardRewardId: 'java_jun', cost: 500 },
        { text: 'Лицензия + Обучение (750 Bits)', nextId: 'installed', requireUnlock: true, effect: 'SET_PROFESSION_WITH_ACADEMY', cardRewardId: 'java_jun', cost: 750 },
        { text: 'Теоретический Экзамен (Скидка 50%)', nextId: 'quiz_1' },
        { text: 'Я еще в процессе.', nextId: 'intro' }
    ])
    .addNode('quiz_1', 'ПРОФЕССОР АРХИПОВ', 'Первый вопрос. Что является основным механизмом предотвращения Deadlock в шинах данных Moscow Zero?', [
      { text: 'Иерархия ресурсов и строгая типизация.', nextId: 'quiz_2' },
      { text: 'Случайное удаление процессов.', nextId: 'quiz_fail' }
    ])
    .addNode('quiz_2', 'ПРОФЕССОР АРХИПОВ', 'Второй вопрос: какая область JVM Москва отвечает за хранение метаданных классов?', [
      { text: 'Metaspace (бывший PermGen).', nextId: 'quiz_3' },
      { text: 'Heap (Куча).', nextId: 'quiz_fail' }
    ])
    .addNode('quiz_3', 'ПРОФЕССОР АРХИПОВ', 'И последнее: при ошибке `Standard_Overflow` в `grep`, каково ваше первое действие?', [
      { text: 'Сбросить кэш и проверить глубину рекурсии.', nextId: 'quiz_win' },
      { text: 'Перезагрузить районный мейнфрейм.', nextId: 'quiz_fail' }
    ])
    .addNode('quiz_win', 'ПРОФЕССОР АРХИПОВ', 'Блестяще! За отличные знания — лицензия всего за 100 Bits. Заслужили.', [
      { text: 'Благодарю, Профессор. (100 Bits)', nextId: 'installed', effect: 'SET_PROFESSION', cardRewardId: 'java_jun', cost: 100 }
    ])
    .addNode('quiz_fail', 'ПРОФЕССОР АРХИПОВ', 'Увы, некорректно. Теория — фундамент. Возвращайтесь в библиотеку. Экзамен провален.', [
      { text: 'Я подготовлюсь.', nextId: 'intro' }
    ])
    .addLoreNode('lore_exam', 'ПРОФЕССОР АРХИПОВ', 'Это подтверждение вашей валидности. Пройдите "Экзамен Стажёра" на ВДНХ (Павильоны).', 'intro')
    .addNode('installed', 'ПРОФЕССОР АРХИПОВ', 'Диплом верифицирован. Теперь вы официально Java Junior. Не позорьте кафедру.', [
      { text: 'Спасибо, Профессор.', nextId: 'LEAVE' }
    ])
    .build(),

  // --- COMPILER (EU_SYNTAX) ---
  npc_compiler: new DialogueBuilder('npc_compiler')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'КОМПИЛЯТОР', 'Твой код медленный. Слишком много переходов. Хочешь оптимизации?', [
      { text: 'Научи меня.', nextId: 'lore' },
      { text: 'Мне нужен Профилировщик Памяти.', nextId: 'quest_profiler_accept' },
      { text: 'Я провел профилирование узла.', nextId: 'quest_profiler_finish', requireQuestId: 'q_south_west_profiler' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'КОМПИЛЯТОР', 'Читай логи. Слушай ритм шины. Не понимаешь байт-код — не контролируешь деку. (+10 EU_SYNTAX)', 'intro', 'EU_SYNTAX')
    .addNode('quest_profiler_accept', 'КОМПИЛЯТОР', 'Нужен глубокий анализ потоков в секторе. Возьми контракт.', [
      { text: 'Принимаю.', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_south_west_profiler' }
    ])
    .addNode('quest_profiler_finish', 'КОМПИЛЯТОР', 'Оптимально. Смысл найден в битах. Награда на счету.', [
      { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 80, completeQuestId: 'q_south_west_profiler' }
    ])
    .build(),

  // --- FUGITIVE ALUMINI ---
  npc_alumini: new DialogueBuilder('npc_alumini')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'БЕГЛЫЙ_ВЫПУСКНИК', 'Слышь, хакер... Ядро считает нас "устаревшими". Хочешь пару запрещенных библиотек?', [
      { text: 'Покажи, что есть.', nextId: 'trade' },
      { text: 'Кто тебя ищет?', nextId: 'lore_fugitive' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_fugitive', 'БЕГЛЫЙ_ВЫПУСКНИК', 'Silicon Hedge хочет логи, ГИГАБАНК — долги, Октябрь — чтобы меня не было. Но я жив.', 'intro')
    .addNode('trade', 'БЕГЛЫЙ_ВЫПУСКНИК', 'Только Bits. Без транзакций GIGA_BANK.', [
      { text: 'Shadow Copy (150 Bits)', nextId: 'intro', cost: 150, effect: 'GIVE_CARD', cardRewardId: 'fn_shadow_copy' },
      { text: 'Назад.', nextId: 'intro' }
    ])
    .build(),

  // --- TERMINALS & SHOPS ---
  uni_moscow: new DialogueBuilder('uni_moscow')
    .addNode('intro', 'УНИВЕРСИТЕТ', 'Официальные архивы знаний. Подтяни теорию за Bits.', [
      { text: 'Допуск к Core (50 Bits)', nextId: 'intro', cost: 50, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  shop_edu_addons: new DialogueBuilder('shop_edu_addons')
    .addNode('intro', 'МОДУЛИ_ЗНАНИЙ+', 'Курсы по декартовой логике и алгоритмам.', [
      { text: 'Algorithm V2 (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_CARD', cardRewardId: 'fn_grep_recursive' },
      { text: 'Stack Insight (150 Bits)', nextId: 'intro', cost: 150, effect: 'GIVE_TRAIT', cardRewardId: 'neural_sync_junkie' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  bar_scholar: new DialogueBuilder('bar_scholar')
    .addNode('intro', 'РЮМОЧНАЯ_СТУДЕНТ', 'Запах кофе и бессонных ночей. Обсуждаем курсовые и взломы.', [
      { text: 'Заряженный эспрессо (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 40 },
      { text: 'Студенческий обед (35 Bits)', nextId: 'intro', cost: 35, effect: 'RESTORE_HP', amount: 100 },
      { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  term_library: new DialogueBuilder('term_library')
    .addNode('intro', 'БИБЛИОТЕКА_КОДА', 'БАЗА_ЗНАНИЙ. Введите запрос:', [
      { text: 'История Ядра Октября', nextId: 'lore_1' },
      { text: 'Архивы Java Core', nextId: 'lore_2' },
      { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_1', 'БИБЛИОТЕКА_КОДА', 'Ядро создано в 2042 году после Коллапса. Гарант порядка.', 'intro')
    .addLoreNode('lore_2', 'БИБЛИОТЕКА_КОДА', 'Java — язык древних богов. Типизация реальности.', 'intro')
    .build(),

  term_main_frame: new DialogueBuilder('term_main_frame', 'intro')
    .addNode('intro', 'УЗЕЛ_МЕЙНФРЕЙМ', '[AUTO_DEFENSE] ТРЕБУЕТСЯ КАРТА ДОСТУПА "ACADEMIC".', [
      { text: 'Обойти защиту.', nextId: 'rank_check' },
      { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addNode('rank_check', 'УЗЕЛ_МЕЙНФРЕЙМ', '[SCANNING...] АНАЛИЗ ПРАВ...', [
      { text: '[ Ждать ]', nextId: 'access_denied', requireMaxLevel: 2, isTraineeOnly: true },
      { text: '[ Ждать ]', nextId: 'access_granted', requireMinLevel: 3 },
      { text: '[ Ждать ]', nextId: 'access_granted', isProOnly: true }
    ])
    .addNode('access_denied', 'УЗЕЛ_МЕЙНФРЕЙМ', '[ERROR] НЕДОСТАТОЧНЫЙ УРОВЕНЬ АУТЕНТИФИКАЦИИ.', [
      { text: 'Черт...', nextId: 'LEAVE' }
    ])
    .addNode('access_granted', 'УЗЕЛ_МЕЙНФРЕЙМ', '[SUCCESS] ДОСТУП РАЗРЕШЕН. ПРОВЕРКА ЗАДАНИЙ АКТИВНА.', [
      { text: '[ СТАРТ: ВЗЛОМ МЕЙНФРЕЙМА ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_south_west_combat_academic_guard_bug_sweep' }
    ])
    .build(),
};

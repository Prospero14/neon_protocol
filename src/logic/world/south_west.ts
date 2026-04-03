import type { WorldDistrict } from './types';

export const south_west: WorldDistrict = {
  id: 'south_west',
  node: {
    id: 'south_west', 
    name: 'ЮГО-ЗАПАДНАЯ: ACADEMIC_UPLINK', 
    description: 'Район институтов и наукоградов. Здесь витает дух старой академии и нелегальных серверов.', 
    x: 15, y: 65, stability: 95, type: 'hub', tier: 1,
    subNodes: [
        { id: 'npc_professor', name: 'Профессор Архипов', type: 'npc', description: 'Преподает фундаментальную Java. Верит в чистый код.', x: 30, y: 20 },
        { id: 'npc_compiler', name: 'Компилятор (Фанатик)', type: 'npc', description: 'Одержим оптимизацией байт-кода. Резок и точен.', x: 10, y: 60 },
        { id: 'npc_alumini', name: 'Беглый Выпускник', type: 'npc', description: 'Выжил после релиза в GIGA_BANK. Ищет убежище.', x: 60, y: 15 },
        { id: 'uni_moscow', name: 'Университет Юго-Запада', type: 'shop', description: 'Легальное обучение и библиотеки.', x: 50, y: 40 },
        { id: 'shop_edu_addons', name: 'Модули Знаний+', type: 'shop', description: 'Продвинутые курсы и карты-скрипты.', x: 80, y: 30 },
        { id: 'term_library', name: 'Библиотека Кода', type: 'terminal', description: 'Доступ к архивам Java и истории языков.', x: 70, y: 70 },
        { id: 'term_main_frame', name: 'Узел: МЕЙНФРЕЙМ', type: 'terminal', description: 'Центральный вычислитель района. Слишком защищен.', x: 90, y: 50 },
        { id: 'bar_scholar', name: 'Рюмочная "Студент"', type: 'bar', description: 'Здесь пьют горький кофе и пишут диплом.', x: 15, y: 40 },
        { id: 'combat_academic_guard', name: 'Академическая Охрана', type: 'combat', description: 'Автоматические системы защиты данных.', x: 40, y: 80 },
        { id: 'combat_virus_lab', name: 'Вирусная Лаборатория', type: 'combat', description: 'Экспериментальные инфекции софта.', x: 25, y: 90 }
    ]
  },
  npcs: [
    { id: 'npc_professor', name: 'Профессор Архипов', districtId: 'south_west', role: 'Наставник', greeting: 'Класс начинается с main.', shortLore: 'Ведет к профессии Java Junior.' },
  ],
  dialogues: {
    npc_professor: {
      id: 'npc_professor', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ПРОФЕССОР АРХИПОВ', text: 'Слушайте внимательно, аноним. Академический уплинк — это не место для "скрипт-кидди". Мы обучаем архитектуре, которую признаёт даже Ядро Октября. Хотите получить верифицированный класс от EU_SYNTAX?',
          options: [
            { text: 'Я готов к лицензированию (500 Bits)', nextId: 'check_exam', cost: 500 },
            { text: 'Как сдать "Экзамен Стажёра"?', nextId: 'lore_exam' },
            { text: '[ Уйти ]', nextId: 'LEAVE' }
          ]
        },
        check_exam: {
            id: 'check_exam', speaker: 'ПРОФЕССОР АРХИПОВ', text: 'Посмотрим ваши логи... Если вы уже победили тренировочного бота на ВДНХ, я подпишу ваш диплом. Вам нужна только лицензия или полный вводный курс?',
            options: [
                { text: 'Только Лицензия (500 Bits)', nextId: 'installed', requireUnlock: true, effect: 'SET_PROFESSION', cardRewardId: 'java_jun', cost: 500, subtext: 'Разблокирует Java Junior.' },
                { text: 'Лицензия + Обучение (750 Bits)', nextId: 'installed', requireUnlock: true, effect: 'SET_PROFESSION_WITH_ACADEMY', cardRewardId: 'java_jun', cost: 750, subtext: 'Включает обучающий квест.' },
                { text: 'Я еще в процессе.', nextId: 'intro' }
            ]
        },
        lore_exam: {
          id: 'lore_exam', speaker: 'ПРОФЕССОР АРХИПОВ', text: 'Это подтверждение вашей боевой и технической валидности. Пройдите "Экзамен Стажёра" в узлах ВДНХ (Павильоны). Только после этого мы допустим вас к лицензированию.',
          options: [{ text: 'Я найду этот экзамен.', nextId: 'intro' }]
        },
        installed: {
            id: 'installed', speaker: 'ПРОФЕССОР АРХИПОВ', text: 'Диплом верифицирован. Теперь вы официально Java Junior. Не позорьте кафедру.',
            options: [{ text: 'Спасибо, Профессор.', nextId: 'LEAVE' }]
        }
      }
    },
    uni_moscow: {
      id: 'uni_moscow', startNodeId: 'intro',
      nodes: {
        intro: { id: 'intro', speaker: 'УНИВЕРСИТЕТ', text: 'Официальные архивы знаний. Здесь можно подтянуть теорию за Bits.', options: [{ text: 'Допуск к Core (50 Bits)', nextId: 'LEAVE', cost: 50, effect: 'GIVE_CARD', cardRewardId: 'fn_ping', subtext: 'Базовая карта SYNTAX.' }, { text: '[Уйти]', nextId: 'LEAVE' }] }
      }
    },
    shop_edu_addons: {
        id: 'shop_edu_addons', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'МОДУЛИ_ЗНАНИЙ+', text: 'Продвинутые курсы по декартовой логике и боевым алгоритмам.',
                options: [
                    { text: 'Algorithm V2 (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_CARD', cardRewardId: 'fn_grep_recursive', subtext: 'Мощный поисковый скрипт.' },
                    { text: 'Stack Insight (150 Bits)', nextId: 'intro', cost: 150, effect: 'GIVE_TRAIT', cardRewardId: 'neural_sync_junkie', subtext: 'Черта: Видеть Bug-стек врага.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    bar_scholar: {
        id: 'bar_scholar', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'РЮМОЧНАЯ_СТУДЕНТ', text: 'Запах дешевого кофе и бессонных ночей. Здесь обсуждают курсовые и взломы серверов.',
                options: [
                    { text: 'Заряженный эспрессо (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 40, subtext: 'Восстановление 40 HP.' },
                    { text: 'Студенческий обед (35 Bits)', nextId: 'intro', cost: 35, effect: 'RESTORE_HP', amount: 100, subtext: 'Полное восстановление.' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_compiler: {
        id: 'npc_compiler', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'КОМПИЛЯТОР', text: 'Твой код... медленный. Слишком много переходов. Ты тратишь CPU впустую. Хочешь оптимизации?',
                options: [
                    { text: 'Научи меня.', nextId: 'lore' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'КОМПИЛЯТОР', text: 'Читай логи. Слушай ритм шины. Если ты не понимаешь байт-код — ты не контролируешь свою деку. (+10 Репутации EU_SYNTAX)',
                options: [{ text: 'Запомню.', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'EU_SYNTAX' }]
            }
        }
    },
    term_library: {
        id: 'term_library', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'БИБЛИОТЕКА_КОДА', text: 'БАЗА_ДАННЫХ_ЗНАНИЙ. Введите запрос:',
                options: [
                    { text: 'История Ядра Октября', nextId: 'lore_1' },
                    { text: 'Архивы Java Core', nextId: 'lore_2' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            },
            lore_1: {
                id: 'lore_1', speaker: 'БИБЛИОТЕКА_КОДА', text: '[LOG_001] Ядро было создано в 2042 году после Великого Коллапса Сети. Оно — гарант порядка в Moscow Zero.',
                options: [{ text: 'Назад', nextId: 'intro' }]
            },
            lore_2: {
                id: 'lore_2', speaker: 'БИБЛИОТЕКА_КОДА', text: '[DOC_404] Java — язык древних богов-архитекторов. Его мощь в строгой типизации реальности.',
                options: [{ text: 'Назад', nextId: 'intro' }]
            }
        }
    },
    term_main_frame: {
        id: 'term_main_frame', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'УЗЕЛ_МЕЙНФРЕЙМ', text: '[AUTO_DEFENSE_ACTIVE] ТРЕБУЕТСЯ КАРТА ДОСТУПА "ACADEMIC".',
                options: [
                    { text: 'Попробовать обойти защиту', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_academic_guard' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    }
  }
};

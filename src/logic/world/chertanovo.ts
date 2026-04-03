import type { WorldDistrict } from './types';

export const chertanovo: WorldDistrict = {
  id: 'chertanovo',
  node: {
    id: 'chertanovo', 
    name: 'ЧЕРТАНОВО: GLITCH_GHETTO', 
    description: 'Мрачная жилая зона. Дом для многих радикальных фрилансеров (Null Pointers).', 
    x: 52, y: 80, stability: 40, type: 'bar', tier: 2,
    subNodes: [
      { id: 'npc_zero', name: 'Z3R0 (Анархист)', type: 'npc', description: 'Лидер Нулевых Указателей. Мечтает о чистой Пустоте.', x: 50, y: 50 },
      { id: 'npc_chertanovo_paranoid', name: 'Параноик из высотки', type: 'npc', description: 'Боится, что Ядро читает его мысли через Wi-Fi.', x: 25, y: 15 },
      { id: 'npc_glitch', name: 'Глюк (Сломанный ИИ)', type: 'npc', description: 'Фрагмент старого помощника. Говорит загадками и ошибками.', x: 10, y: 15 },
      { id: 'npc_scrap_dealer', name: 'Торговец Шламом', type: 'npc', description: 'Скупщик горелых чипов и данных.', x: 85, y: 80 },
      { id: 'bar_null_pointer', name: 'Бар "Null Pointer"', type: 'bar', description: 'Где рождаются баги и умирает надежда.', x: 30, y: 70 },
      { id: 'bar_last_call', name: 'Рюмочная "Последний вызов"', type: 'bar', description: 'Самый дешевый и опасный бар в секторе.', x: 60, y: 90 },
      { id: 'npc_ripper_jax', name: 'Риппердок Джакс', type: 'npc', description: 'Устанавливает импланты знаний задорого. Больно, но нужно.', x: 70, y: 20 },
      { id: 'shop_shady', name: 'Лавка Шрама', type: 'shop', description: 'Нелегальные модификаторы стека.', x: 20, y: 40 },
      { id: 'term_void_link', name: 'Линк в Пустоту', type: 'terminal', description: 'Черный терминал. Ведет в самые темные углы сети.', x: 50, y: 5 },
      { id: 'combat_anarcho_cell', name: 'Ячейка Анархистов', type: 'combat', description: 'Тренировочный бой с радикалами.', x: 80, y: 45 },
      { id: 'combat_night_scan', name: 'Ночной Скан', type: 'combat', description: 'Обнаружен враждебный процесс-перехватчик.', x: 40, y: 30 }
    ]
  },
  npcs: [
    { id: 'npc_zero', name: 'Z3R0', districtId: 'chertanovo', role: 'Анархист', greeting: 'Null есть истина.', shortLore: 'Квесты с риском и большим RNG.' },
    { id: 'npc_chertanovo_paranoid', name: 'Параноик', districtId: 'chertanovo', role: 'Резидент', greeting: 'Ты из Ядра? Уходи!', shortLore: 'Одержим приватностью.' },
    { id: 'npc_ripper_jax', name: 'Риппер Джакс', districtId: 'chertanovo', role: 'Риппердок', greeting: 'Импланты больно, но эффективно.', shortLore: 'Обменивает лут на бусты.' },
  ],
  dialogues: {
    npc_zero: {
      id: 'npc_zero', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'Z3R0', text: 'Твое существование — это NullPointerException в планах Ядра. Я Z3R0. Мы здесь, в Чертаново, празднуем каждый сбой системы. Пришел присоединиться к хаосу?',
          options: [
            { text: 'Кто такие "Нулевые"?', nextId: 'lore_anarchy' },
            { text: 'Мне нужен "Анарахический Манифест".', nextId: 'quest_talk' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        lore_anarchy: {
          id: 'lore_anarchy', speaker: 'Z3R0', text: 'Мы — те, кого нельзя индексировать. Мы живем в неразмеченной области памяти. Ядро боится нас, потому что мы не идем по сценарию.',
          options: [{ text: 'Впечатляет.', nextId: 'intro' }]
        },
        quest_talk: {
          id: 'quest_talk', speaker: 'Z3R0', text: 'Манифест? Ха! Он написан на обратной стороне старого сервера. Ладно, ты мне нравишься. Держи копию — это изменит твое восприятие кода.',
          options: [
            { text: 'Принять Манифест (Награда)', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'fn_ping' }
          ]
        }
      }
    },
    npc_chertanovo_paranoid: {
        id: 'npc_chertanovo_paranoid', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ПАРАНОИК', text: 'Тихо! Они слушают даже через выключенные терминалы. Тебе нужна защита? Мне нужна защита! Настоящая приватность стоит дорого.',
                options: [
                    { text: 'Я могу помочь с защитой.', nextId: 'quest_start' },
                    { text: 'Я принес Privacy Patch от Никсанны.', nextId: 'quest_finish', requireQuestId: 'q_chertanovo_privacy' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            quest_start: {
                id: 'quest_start', speaker: 'ПАРАНОИК', text: 'Говорят, в Алтуфьево живет дизайнер Никсанна. Она делает патчи, которые Ядро не может взломать. Сходи к ней, принеси мне "Privacy Patch v.0.1". Только не пользуйся такси, они отслеживают маршруты! (Принять контракт)',
                options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_chertanovo_privacy' }]
            },
            quest_finish: {
                id: 'quest_finish', speaker: 'ПАРАНОИК', text: '*быстро устанавливает патч* Да... Да! Видишь? Эти красные полоски в логах исчезли! Теперь я невидимка. Спасибо, хакер. Держи этот "Shadow_Layer" — он спасет твою деку от лишних взглядов.',
                options: [{ text: 'Удачи с маскировкой.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_chertanovo_privacy' }]
            }
        }
    },
    npc_ripper_jax: {
      id: 'npc_ripper_jax', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'РИППЕР_ДЖАКС', text: 'Хочешь быстрый апгрейд? Вшиваю архитектуру и девопс за один сеанс. Грязновато, но эффективно.',
          options: [
            { text: 'Класс: DevOps Engineer (500 Bits)', nextId: 'installed', cost: 500, effect: 'SET_PROFESSION', cardRewardId: 'devops_jun' },
            { text: 'Класс: System Architect (900 Bits)', nextId: 'installed', cost: 900, effect: 'SET_PROFESSION', cardRewardId: 'architect_mid' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        installed: {
          id: 'installed', speaker: 'РИППЕР_ДЖАКС', text: 'Чип вошел как родной. Теперь твои мозги официально стоят состояние. Не потеряй их.',
          options: [{ text: 'Я... чувствую... (Уйти)', nextId: 'LEAVE' }]
        }
      }
    },
    bar_null_pointer: {
        id: 'bar_null_pointer', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'БАР_NULL_POINTER', text: 'Здесь не спрашивают имя. Только ID и Bits. Тень Чертаново — твой новый дом.',
                options: [
                    { text: 'Забыть всё (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 35, subtext: 'Восстановление 35 HP.' },
                    { text: 'Полный дамп памяти (55 Bits)', nextId: 'intro', cost: 55, effect: 'RESTORE_HP', amount: 100, subtext: 'Полное исцеление.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    bar_last_call: {
        id: 'bar_last_call', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'РЮМОЧНАЯ_ПОСЛЕДНИЙ_ВЫЗОВ', text: 'Самое дно архитектуры. Здесь пьют только те, кому терять нечего.',
                options: [
                    { text: 'Стакан "404" (5 Bits)', nextId: 'intro', cost: 5, effect: 'RESTORE_HP', amount: 10, subtext: 'Восстановление 10 HP.' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    shop_shady: {
        id: 'shop_shady', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ЛАВКА_ШРАМА', text: 'Хочешь взломать реальность? У меня есть скрипты, которые Ядро пытается стереть уже десятилетие.',
                options: [
                    { text: 'Grep Recursion (45 Bits)', nextId: 'intro', cost: 45, effect: 'GIVE_CARD', cardRewardId: 'fn_grep_recursive', subtext: 'Поиск и уничтожение багов.' },
                    { text: 'Sudo Overload (70 Bits)', nextId: 'intro', cost: 70, effect: 'GIVE_CARD', cardRewardId: 'fn_sudo_fix', subtext: 'Принудительная фиксация системы.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_glitch: {
        id: 'npc_glitch', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ГЛЮК', text: 'Stack... Overflow... Null... Ты видишь их? Танцующие биты... Они хотят... есть...',
                options: [
                    { text: 'О чем ты говоришь?', nextId: 'lore' },
                    { text: '[Дать 1 Bit]', nextId: 'reward', cost: 1 },
                    { text: '[Игнорировать]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'ГЛЮК', text: 'Я был... Senior... До того как... Рекурсия... Не входи в... Deep Web... Без... Брони...',
                options: [{ text: 'Жутко.', nextId: 'intro' }]
            },
            reward: {
                id: 'reward', speaker: 'ГЛЮК', text: 'Бит... Вкусный... Держи... Подарок... Тщетность...',
                options: [{ text: 'Получить карту (Sre Stack)', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'reac_stack_archaeologist' }]
            }
        }
    },
    npc_scrap_dealer: {
        id: 'npc_scrap_dealer', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ТОРГОВЕЦ_ШЛАМОМ', text: 'Скупаю всё, что блестит и греется. Есть лишние модули или Bits?',
                options: [
                    { text: 'Продать скрап (Получить 20 Bits)', nextId: 'intro', effect: 'GIVE_BITS', amount: 20 },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    term_void_link: {
        id: 'term_void_link', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ЛИНК_В_ПУСТОТУ', text: '[ACCESS_DENIED] ТРЕБУЕТСЯ_АНАРХИЧЕСКАЯ_РЕПУТАЦИЯ. (Мин: 50)',
                options: [
                    { text: 'Попробовать взломать (50% Шанс)', nextId: 'hack', requireTrait: 'social_engineer' },
                    { text: 'Зайти официально', nextId: 'access', requireReputation: { factionId: 'ANARCHO_VOID', minPoints: 50 } },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            },
            hack: {
                id: 'hack', speaker: 'ЛИНК_В_ПУСТОТУ', text: '[OK] СИСТЕМА_ОБМАНУТА. ДОБРО_ПОЖАЛОВАТЬ_В_DARKNET.',
                options: [{ text: 'Войти', nextId: 'LEAVE', effect: 'GIVE_XP', amount: 100 }]
            },
            access: {
                id: 'access', speaker: 'ЛИНК_В_ПУСТОТУ', text: 'ПРИВЕТСТВУЕМ, NULL_POINTER. ВЫБЕРИТЕ УСЛУГУ: [FREE_REPOS] [SIGNAL_WASH]',
                options: [{ text: 'Забрать софт', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'fn_wash_logs' }]
            }
        }
    }
  }
};

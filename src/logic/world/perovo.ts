import type { WorldDistrict } from './types';

export const perovo: WorldDistrict = {
  id: 'perovo',
  node: {
    id: 'perovo',
    name: 'ПЕРОВО: DATA_SLUMS',
    description: 'Тихий район, оккупированный нелегальными дата-центрами в подвалах панелек.',
    x: 85, y: 45, stability: 92, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_marina', name: 'Марина (Архивариус)', type: 'npc', description: 'Хранительница забытых логов и паролей.', x: 25, y: 40 },
      { id: 'npc_basement_coder', name: 'Подвальный Кодер', type: 'npc', description: 'Пишет скрипты за еду и Bits. Вечно сонный.', x: 15, y: 20 },
      { id: 'npc_resident_perovo', name: 'Местный Житель', type: 'npc', description: 'Обыватель, уставший от шума серверов.', x: 55, y: 10 },
      { id: 'shop_logic_gate', name: 'Магазин "Вентиль"', type: 'shop', description: 'Логические затворы и переключатели.', x: 80, y: 30 },
      { id: 'bar_basement', name: 'Бар "Подвал"', type: 'bar', description: 'Здесь всегда темно и пахнет канифолью.', x: 10, y: 65 },
      { id: 'combat_data_mining', name: 'Дата-майнинг подвала', type: 'combat', description: 'Добыча зашифрованных данных под огнем ИИ.', x: 65, y: 60 },
      { id: 'combat_rat_invasion', name: 'Нашествие Крыс', type: 'combat', description: 'Физическая угроза серверам.', x: 45, y: 80 },
      { id: 'job_board_perovo', name: 'Столб объявлений: Перово', type: 'npc', description: 'Поиск пропавших серверов и данных.', x: 50, y: 20 },
      { id: 'term_sub_net', name: 'Суб-нет Перово', type: 'terminal', description: 'Локальная сеть района. Полная мусора.', x: 30, y: 90 },
      { id: 'term_taxi_perovo', name: 'Такси: Перово', type: 'terminal', description: 'Связь с центром.', x: 85, y: 85 }
    ]
  },
  npcs: [
    { id: 'npc_marina', name: 'Марина', districtId: 'perovo', role: 'Архивариус', greeting: 'Логи помнят все.', shortLore: 'Квесты расследований и доставки.' },
    { id: 'job_board_perovo', name: 'Столб объявлений', districtId: 'perovo', role: 'Контракты', greeting: 'Нужны быстрые руки и чистый код.', shortLore: 'Череда pre-class задач.' },
  ],
  dialogues: {
    npc_marina: {
      id: 'npc_marina', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'МАРИНА', text: 'Тише... Логи не любят громких звуков. Я Марина, храню то, что другие выбросили в /dev/null. Зачем тревожишь архивы?', options: [
            { text: 'Нужна работа по поиску.', nextId: 'quest' },
            { text: 'Ищу старые записи.', nextId: 'lore_marina' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        quest: {
            id: 'quest', speaker: 'МАРИНА', text: 'В подвале соседнего дома завелся процесс-майнер. Он перегревает старые записи. Сходи и прерви его, пока данные не расплавились.',
            options: [
                { text: 'Прервать процесс (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_data_mining' }
            ]
        },
        lore_marina: {
          id: 'lore_marina', speaker: 'МАРИНА', text: 'Перово — это свалка данных. Но на свалке можно найти сокровища. Я собираю историю Москвы по крупицам.', options: [{ text: 'Интересно.', nextId: 'intro' }]
        }
      }
    },
    shop_logic_gate: {
        id: 'shop_logic_gate', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'МАГАЗИН_ВЕНТИЛЬ', text: 'Логические затворы, триггеры, переключатели. Мы торгуем тем, что заставляет код работать.',
                options: [
                    { text: 'Logic Filter (35 Bits)', nextId: 'intro', cost: 35, effect: 'GIVE_CARD', cardRewardId: 'fn_grep', subtext: 'Карта: Поиск багов.' },
                    { text: 'Gate Overload (65 Bits)', nextId: 'intro', cost: 65, effect: 'GIVE_TRAIT', cardRewardId: 'stack_archaeologist', subtext: 'Черта: Манипуляция логикой.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    bar_basement: {
        id: 'bar_basement', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'БАР_ПОДВАЛ', text: 'Темное помещение, освещенное только диодами серверов. Здесь пьют "Канифоль" и обсуждают взломы.',
                options: [
                    { text: 'Стакан "Канифоли" (10 Bits)', nextId: 'intro', cost: 10, effect: 'RESTORE_HP', amount: 20, subtext: 'Восстановление 20 HP.' },
                    { text: 'Суточный прогон (45 Bits)', nextId: 'intro', cost: 45, effect: 'RESTORE_HP', amount: 100, subtext: 'Полное восстановление.' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_basement_coder: {
        id: 'npc_basement_coder', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ПОДВАЛЬНЫЙ_КОДЕР', text: '...что? Уже утро? Мой скрипт еще не доработал... А, ты за Bits? У меня есть пара лазеек в системе.',
                options: [
                    { text: 'Покажи лазейки.', nextId: 'lore' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'ПОДВАЛЬНЫЙ_КОДЕР', text: 'Если войти через подсеть 14, можно обойти файрвол Перово. Но там водятся крысы... настоящие, системные. (+10 Репутации Анархистов)',
                options: [{ text: 'Полезно.', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'ANARCHO_VOID' }]
            }
        }
    },
    npc_resident_perovo: {
        id: 'npc_resident_perovo', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'МЕСТНЫЙ_ЖИТЕЛЬ', text: 'Опять эти сервера гудят всю ночь... Спать невозможно. Скорее бы SRE-патруль пришел и всё тут выключил.',
                options: [
                    { text: 'Могу помочь с шумом (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_rat_invasion' },
                    { text: '[Игнорировать]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    term_sub_net: {
        id: 'term_sub_net', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'СУБ-НЕТ_ПЕРОВО', text: '[DATA] ЛОКАЛЬНАЯ_СЕТЬ_ЗАГРЯЗНЕНА. ВЫБЕРИТЕ_ДИРЕКТИВУ:',
                options: [
                    { text: 'Очистить кэш (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_perovo' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    term_taxi_perovo: {
        id: 'term_taxi_perovo', startNodeId: 's',
        nodes: {
            s: {
                id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Узел Перово. Связь с центром стабильна. Стоимость проезда — 100 Bits.', options: [
                    { text: 'Купить проезд (100 Bits)', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
                    { text: 'Отмена', nextId: 'LEAVE' }
                ]
            }
        }
    },
    job_board_perovo: {
      id: 'job_board_perovo', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'СТОЛБ_ПЕРОВО', text: 'В подвалах Перово замечены аномалии данных. Требуется grep-сканирование.', options: [
            { text: 'Взять: Data Hunt (50 Bits)', nextId: 'accept' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        accept: {
          id: 'accept', speaker: 'СТОЛБ_ПЕРОВО', text: 'Аномалия локализована.', options: [{ text: 'Искать (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_perovo' }]
        }
      }
    }
  }
};

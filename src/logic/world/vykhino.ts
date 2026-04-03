import type { WorldDistrict } from './types';

export const vykhino: WorldDistrict = {
  id: 'vykhino',
  node: {
    id: 'vykhino', 
    name: 'ВЫХИНО: TRADE_BRANCH', 
    description: 'Торговый хаб с бешеным трафиком. Центр незаконного обмена данными.', 
    x: 75, y: 70, stability: 85, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_grey', name: 'Грей (Гоп-хакер)', type: 'npc', description: 'Знает все лазейки метро.', x: 40, y: 50 },
      { id: 'npc_link_manager', name: 'Менеджер Каналов', type: 'npc', description: 'Бюрократичный бот следит за трафиком.', x: 15, y: 20 },
      { id: 'npc_corp_scout', name: 'Скаут GIGA_BANK', type: 'npc', description: 'Ищет таланты для корпоративного рабства.', x: 60, y: 60 },
      { id: 'shop_metro', name: 'Радио-палатка', type: 'shop', description: 'Боевой софт.', x: 40, y: 30 },
      { id: 'shop_black_market', name: 'Черный Импорт', type: 'shop', description: 'Редкие карты по завышенным ценам.', x: 80, y: 20 },
      { id: 'npc_job_boss', name: 'Фиксер "Батя"', type: 'npc', description: 'Дает грязную работу за битсы.', x: 60, y: 20 },
      { id: 'term_exchange', name: 'Ликвид-Терминал', type: 'terminal', description: 'Обмен Bits на репутацию и обратно.', x: 20, y: 80 },
      { id: 'bar_transit', name: 'Рюмочная "Транзит"', type: 'bar', description: 'Место встречи проезжих хакеров.', x: 10, y: 40 },
      { id: 'combat_cargo', name: 'Перехват Груза', type: 'combat', description: 'Контейнер с данными остался без охраны.', x: 70, y: 45 },
      { id: 'term_taxi_unlock', name: 'Инфо-киоск Такси', type: 'terminal', description: 'Разблокировка города.', x: 80, y: 80 }
    ]
  },
  npcs: [
    { id: 'npc_grey', name: 'Грей', districtId: 'vykhino', role: 'Гоп-хакер', greeting: 'Метро - это мой VPN.', shortLore: 'Добывает маршруты и токены прохода.' },
    { id: 'npc_job_boss', name: 'Фиксер Батя', districtId: 'vykhino', role: 'Фиксер', greeting: 'Работа грязная, оплата чистая.', shortLore: 'Раздает высокодоходные контракты.' },
  ],
  dialogues: {
    npc_grey: {
      id: 'npc_grey', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ГРЕЙ', text: 'Тс-с... Тебя не засекли? Выхино сейчас кишит аудиторами. Я Грей, местный проводник по метро-шлюзам. Нужно что-то конкретное или просто ищешь приключений на свой фаервол?',
          options: [
            { text: 'Как проехать в Центр без шума?', nextId: 'lore_metro' },
            { text: 'Есть работа для бегуна?', nextId: 'quest_start' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        lore_metro: {
          id: 'lore_metro', speaker: 'ГРЕЙ', text: 'Метро — это артерии Москвы. Ядро гоняет по ним терабайты логов. Если знать тайминги, можно проскочить незамеченным. Но за инфу придется платить.',
          options: [{ text: 'Я запомню.', nextId: 'intro' }]
        },
        quest_start: {
          id: 'quest_start', speaker: 'ГРЕЙ', text: 'На перегоне Текстильщики-Выхино застрял пакет с "черным" кодом. Ядро выставило там патруль. Выбьешь их — я в долгу не останусь. Дам тебе проходку CLI.',
          options: [
            { text: 'Я в деле (Бой за CLI)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_tekstil' },
            { text: 'Слишком опасно.', nextId: 'intro' }
          ]
        }
      }
    },
    npc_job_boss: {
      id: 'npc_job_boss', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ФИКСЕР_БАТЯ', text: 'Ну и рожа у тебя. Слушай, стажер, если хочешь командовать — могу поднатаскать тебя по менеджменту. Будешь моим менеджером проектов.',
          options: [
            { text: 'Класс: Project Manager (150 Bits)', nextId: 'pm_success', cost: 150, effect: 'SET_PROFESSION', cardRewardId: 'pm_jun' },
            { text: 'Давай лучше задание.', nextId: 'job_start' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        pm_success: {
          id: 'pm_success', speaker: 'ФИКСЕР_БАТЯ', text: 'Теперь ты в костюме. Метафорически. Иди разруливай хаос.',
          options: [{ text: 'ОК, шеф.', nextId: 'LEAVE' }]
        },
        job_start: {
          id: 'job_start', speaker: 'ФИКСЕР_БАТЯ', text: 'Сбегай в Марьино, там "Местная локалка" барахлит. Помоги Тете Тане с тестами — она заплатит. Скажи, что от меня.',
          options: [
            { text: 'Я в деле.', nextId: 'LEAVE' },
            { text: 'Слишком мелко.', nextId: 'LEAVE' }
          ]
        }
      }
    },
    term_taxi_unlock: {
      id: 'term_taxi_unlock', startNodeId: 's',
      nodes: {
        s: {
          id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Глобальный терминал Выхино. Желаете покинуть сектор?', options: [
            { text: 'Проломить шлюз (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
            { text: 'Отмена', nextId: 'LEAVE' }
          ]
        }
      }
    },
    bar_transit: {
      id: 'bar_transit', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'БАР_ТРАНЗИТ', text: 'Грязно, шумно и пахнет дешевым "Синтез-спиртом". Но здесь лучшая инфляция в секторе.',
          options: [
            { text: 'Стимулятор "Выдох" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30, subtext: 'Восстанавливает 30 HP.' },
            { text: 'Промыть соты (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100, subtext: 'Максимальное восстановление.' },
            { text: '[Выйти]', nextId: 'LEAVE' }
          ]
        }
      }
    },
    shop_metro: {
      id: 'shop_metro', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'РАДИО_ПАЛАТКА', text: 'Перепрошитые модули из старых вагонов метро. Дешево и сердито.',
          options: [
            { text: 'Socket Wrapper (25 Bits)', nextId: 'intro', cost: 25, effect: 'GIVE_CARD', cardRewardId: 'fn_socket_wrap', subtext: 'Быстрая сетевая карта.' },
            { text: 'Debug Buffer (35 Bits)', nextId: 'intro', cost: 35, effect: 'GIVE_CARD', cardRewardId: 'soft_buffer_v1', subtext: 'Увеличение памяти.' },
            { text: '[Выход]', nextId: 'LEAVE' }
          ]
        }
      }
    },
    shop_black_market: {
        id: 'shop_black_market', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ЧЕРНЫЙ_ИМПОРТ', text: 'Здесь не любят лишних вопросов. Только Bits и результат.',
                options: [
                    { text: 'Root Access Kit (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_TRAIT', cardRewardId: 'root_access', subtext: 'Черта: Видеть следующий ход врага.' },
                    { text: 'Encryption Layer (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'def_encryption', subtext: 'Мощная защита.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_link_manager: {
        id: 'npc_link_manager', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'МЕНЕДЖЕР_КАНАЛОВ', text: 'Трафик в секторе 75.3%. Вы нарушаете протокол присутствия. Есть ли у вас разрешение?',
                options: [
                    { text: 'Я просто прохожу мимо.', nextId: 'intro' },
                    { text: 'Что ты здесь охраняешь?', nextId: 'lore' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'МЕНЕДЖЕР_КАНАЛОВ', text: 'Эту ветку метро. Она — основа Локального Облака Москвы. Если она упадет — 40% Ядра уйдет в оффлайн.',
                options: [{ text: 'Интересно.', nextId: 'intro' }]
            }
        }
    },
    npc_corp_scout: {
        id: 'npc_corp_scout', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'СКАУТ_GIGA_BANK', text: 'Выглядишь перспективно. Хочешь стабильную зарплату в 1000 Bits и страховку от дефрагментации? Нам нужны такие как ты.',
                options: [
                    { text: 'Я не продаюсь корпорациям.', nextId: 'intro' },
                    { text: 'Что за работа?', nextId: 'lore' },
                    { text: '[Прощай]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'СКАУТ_GIGA_BANK', text: 'Чистка транзакций в High-Tier. Опасно, но платим в два раза больше, чем эти фиксеры из трущоб.',
                options: [{ text: 'Подумаю.', nextId: 'intro' }]
            }
        }
    },
    term_exchange: {
        id: 'term_exchange', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ЛИКВИД_ТЕРМИНАЛ', text: 'Добро пожаловать в обменник. Текущий курс: 100 Bits = 20 Репутации у Анархистов.',
                options: [
                    { text: 'Купить Репутацию Анархистов (100 Bits)', nextId: 'success', cost: 100, effect: 'GIVE_REPUTATION', amount: 20, cardRewardId: 'ANARCHO_VOID' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            },
            success: {
                id: 'success', speaker: 'ЛИКВИД_ТЕРМИНАЛ', text: 'Транзакция успешно проведена. Вы теперь свой в Пустоте.',
                options: [{ text: 'Назад', nextId: 'intro' }]
            }
        }
    }
  }
};

import type { WorldDistrict } from './types';

export const bibirevo: WorldDistrict = {
  id: 'bibirevo',
  node: {
    id: 'bibirevo',
    name: 'БИБИРЕВО: NORTH_LINK',
    description: 'Северный жилой массив. Сплетение старых линий связи и новых оптоволоконных жил.',
    x: 45, y: 5, stability: 90, type: 'hub', tier: 1,
    subNodes: [
      { id: 'npc_signalman', name: 'Связист Моня', type: 'npc', description: 'Ремонтирует обрывы нейросети. Постоянно жалуется на пинг.', x: 20, y: 30 },
      { id: 'npc_old_admin', name: 'Старый Админ', type: 'npc', description: 'Помнит времена, когда интернет был по карточкам.', x: 65, y: 15 },
      { id: 'npc_crawler', name: 'Кроулер', type: 'npc', description: 'Исследователь заброшенных подсетей.', x: 10, y: 55 },
      { id: 'npc_bibirevo_coder', name: 'Сонный Кодер', type: 'npc', description: 'Засыпает прямо во время компиляции.', x: 70, y: 10 },
      { id: 'shop_north_link', name: 'Узел: Северный Поток', type: 'shop', description: 'Компоненты связи и высокоскоростные карты.', x: 50, y: 50 },
      { id: 'bar_signal', name: 'Бар "Сигнал"', type: 'bar', description: 'Чистый спирт и никакой задержки.', x: 35, y: 80 },
      { id: 'term_relay_stats', name: 'Статистика Реле', type: 'terminal', description: 'Данные о пакетах, потерянных в секторе.', x: 15, y: 10 },
      { id: 'job_board_bibi', name: 'Инфо-панель: Бибирево', type: 'npc', description: 'Мелкие подработки по восстановлению линков.', x: 40, y: 70 },
      { id: 'combat_link_break', name: 'Обрыв Связи', type: 'combat', description: 'Процесс-паразит пожирает пакеты данных.', x: 85, y: 40 },
      { id: 'combat_static_noise', name: 'Статический Шум', type: 'combat', description: 'Бой в условиях сильных помех.', x: 55, y: 30 },
      { id: 'term_taxi_bibi', name: 'Такси: Бибирево', type: 'terminal', description: 'Вылет в центр.', x: 80, y: 85 }
    ]
  },
  npcs: [
    { id: 'npc_signalman', name: 'Связист Моня', districtId: 'bibirevo', role: 'Связист', greeting: 'Линия живая? Тогда живем.', shortLore: 'Сетевые сервисные задания.' },
    { id: 'npc_bibirevo_coder', name: 'Сонный Кодер', districtId: 'bibirevo', role: 'Программист', greeting: '...еще пять минут...', shortLore: 'Нуждается в стимуляторах.' },
    { id: 'job_board_bibi', name: 'Инфо-панель', districtId: 'bibirevo', role: 'Контракты', greeting: 'Север не спит.', shortLore: 'Быстрые районные квесты.' },
  ],
  dialogues: {
    npc_signalman: {
      id: 'npc_signalman', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'МОНЯ', text: 'Сынок, не стой под антенной, мозги выжгло? Я тут пытаюсь Бибирево к общей сети прикрутить. Обрывы везде!', options: [
            { text: 'Нужна работа по зачистке.', nextId: 'quest' },
            { text: 'Тут какие-то странные помехи на линии...', nextId: 'quest_echo_start' },
            { text: 'Я принес Frequency Jammer.', nextId: 'quest_echo_finish', requireQuestId: 'q_monya_signal_echo' },
            { text: 'Уйти', nextId: 'LEAVE' }
          ]
        },
        quest_echo_start: {
            id: 'quest_echo_start', speaker: 'МОНЯ', text: 'Помехи? Это "Древнее Эхо". Говорят, на ВДНХ есть Гид, который знает, как глушить такие сигналы. Сходи к ней, если не хочешь, чтобы у тебя в голове вместо мыслей играли марши сорок восьмого года. (Принять контракт)',
            options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_monya_signal_echo' }]
        },
        quest_echo_finish: {
            id: 'quest_echo_finish', speaker: 'МОНЯ', text: 'О! Тишина. Ты слышишь? Этот блаженный белый шум... Спасибо, малец. Теперь я наконец-то смогу пропинговать Алтуфьево без потерь. Держи Bits.',
            options: [{ text: 'Не за что.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_monya_signal_echo' }]
        },
        quest: {
          id: 'quest', speaker: 'МОНЯ', text: 'Проверь подстанцию на 14-м луче. Если там сидит Баг — выбей его, и я подкину тебе пару свежих Bits.', options: [
            { text: 'Сделаю (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_link_break' }
          ]
        }
      }
    },
    shop_north_link: {
        id: 'shop_north_link', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'СЕВЕРНЫЙ_ПОТОК', text: 'Высокочастотные модули для тех, кто ценит скорость. Шина Бибирево — самая быстрая на севере.',
                options: [
                    { text: 'Ping Flood (45 Bits)', nextId: 'intro', cost: 45, effect: 'GIVE_CARD', cardRewardId: 'fn_ping_flood', subtext: 'Карта: Массовый опрос узлов.' },
                    { text: 'Relay Booster (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_TRAIT', cardRewardId: 'stack_archaeologist', subtext: 'Черта: Усиление сигнала.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    bar_signal: {
        id: 'bar_signal', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'БАР_СИГНАЛ', text: 'Здесь не гасят шум, здесь им наслаждаются. Стакан 99% спирта и 1% данных — идеальный коктейль.',
                options: [
                    { text: 'Кружка "Белого Шума" (12 Bits)', nextId: 'intro', cost: 12, effect: 'RESTORE_HP', amount: 25, subtext: 'Восстановление 25 HP.' },
                    { text: 'Полная перепрошивка (40 Bits)', nextId: 'intro', cost: 40, effect: 'RESTORE_HP', amount: 80, subtext: 'Восстановление 80 HP.' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_old_admin: {
        id: 'npc_old_admin', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'СТАРЫЙ_АДМИН', text: 'Помню я... телнет, модемы, звук дозвона... Вы, молодежь, даже не знаете, что такое ждать подгрузки страницы.',
                options: [
                    { text: 'Рассказать о прошлом.', nextId: 'lore' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'СТАРЫЙ_АДМИН', text: 'Свобода была... до Ядра. Мы сами строили свои домены. Те времена ушли, но в подсетях еще можно найти эхо v0.01. (+5 Репутации Анархистов)',
                options: [{ text: 'Глубоко.', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 5, cardRewardId: 'ANARCHO_VOID' }]
            }
        }
    },
    npc_crawler: {
        id: 'npc_crawler', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'КРОУЛЕР', text: 'Ищу заброшенные подсети в Северном Потоке. Говорят, там лежат забытые бит-кредиты.',
                options: [
                    { text: 'Помочь с поиском (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_static_noise' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    term_relay_stats: {
        id: 'term_relay_stats', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'СТАТИСТИКА_РЕЛЕ', text: '[SYSTEM] ЛОГИ_СЕВЕРНОГО_УЗЛА. ПРОВЕРКА_ТРАФИКА:',
                options: [
                    { text: 'Посмотреть загрузку (5 Bits)', nextId: 'lore', cost: 5 },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'СТАТИСТИКА_РЕЛЕ', text: '[LOG] Пакеты из Алтуфьево теряются в 30% случаев. Рекомендуется оптимизация маршрутизации.',
                options: [{ text: 'Назад', nextId: 'intro' }]
            }
        }
    },
    job_board_bibi: {
      id: 'job_board_bibi', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ИНФО-ПАНЕЛЬ', text: 'Система Бибирево. Обнаружены обрывы линков. Требуется ручной PING.', options: [
            { text: 'Взять: Fix Link (50 Bits)', nextId: 'accept' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        accept: {
          id: 'accept', speaker: 'ИНФО-ПАНЕЛЬ', text: 'Контракт активирован.', options: [{ text: 'Вход в поток (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_static_noise' }]
        }
      }
    },
    term_taxi_bibi: {
      id: 'term_taxi_bibi', startNodeId: 's',
      nodes: {
        s: { id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Узел Бибирево. Глобальная навигация требует подписки (100 Bits).', options: [
          { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
          { text: 'Отмена', nextId: 'LEAVE' }
        ] }
      }
    },
    npc_bibirevo_coder: {
        id: 'npc_bibirevo_coder', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'СОННЫЙ_КОДЕР', text: '...а? Что? Баг в триста двенадцатой строке? Нет, это просто фича... подожди, я сейчас допишу... *зевает*',
                options: [
                    { text: 'Эй, не спи! Тебе нужна энергия.', nextId: 'quest_energy_start' },
                    { text: 'Я принес Дзен-Лог от Олега.', nextId: 'quest_energy_finish', requireQuestId: 'q_bibirevo_energy' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            quest_energy_start: {
                id: 'quest_energy_start', speaker: 'СОННЫЙ_КОДЕР', text: 'Энергия... да. Обычный кофе уже не берет. Только "Дзен-Лог" от Мастера Чая с ВДНХ может поднять меня на ноги. Сходишь? Я заплачу... если не усну до твоего прихода. (Принять контракт)',
                options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_bibirevo_energy' }]
            },
            quest_energy_finish: {
                id: 'quest_energy_finish', speaker: 'СОННЫЙ_КОДЕР', text: '*делает глоток* ...Ух! Прямое попадание в нейросеть! Я вижу код... я вижу всё! Спасибо, хакер. Теперь я допишу этот патч за один цикл. Вот твоя награда.',
                options: [{ text: 'Пожалуйста.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_bibirevo_energy' }]
            }
        }
    }
  }
};

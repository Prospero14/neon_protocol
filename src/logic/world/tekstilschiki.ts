import type { WorldDistrict } from './types';

export const tekstilschiki: WorldDistrict = {
  id: 'tekstilschiki',
  node: {
    id: 'tekstilschiki',
    name: 'ТЕКСТИЛЬЩИКИ: TEXTILE_GRID',
    description: 'Старая промзона. Здесь "ткали" первые нейросети для госструктур.',
    x: 75, y: 60, stability: 85, type: 'combat', tier: 1,
    subNodes: [
      { id: 'npc_vlad', name: 'Влад-Ткач', type: 'npc', description: 'Мастер защитных плетений. Создает лучшие файрволы.', x: 20, y: 20 },
      { id: 'npc_weaver_senior', name: 'Старший Ткач', type: 'npc', description: 'Хранитель древних паттернов плетения.', x: 45, y: 10 },
      { id: 'npc_safety_auditor', name: 'Аудитор Безопасности', type: 'npc', description: 'Инспектирует код на наличие уязвимостей.', x: 80, y: 15 },
      { id: 'shop_armor_weave', name: 'Лавка Бронеплетения', type: 'shop', description: 'Защитные скрипты и карты-щиты.', x: 60, y: 40 },
      { id: 'bar_oil_can', name: 'Кабак "Масленка"', type: 'bar', description: 'Где инженеры смазывают шестеренки.', x: 10, y: 45 },
      { id: 'combat_textile_raid', name: 'Рейд на Промзону', type: 'combat', description: 'Зачистка от взбесившихся ткацких ботов.', x: 70, y: 55 },
      { id: 'combat_factory_bot', name: 'Заводской Бот: ТК-44', type: 'combat', description: 'Тяжелый дрон-охранник на пути.', x: 85, y: 80 },
      { id: 'job_board_tekstil', name: 'Узел: Текстильщики', type: 'npc', description: 'Контракты на зачистку и охрану.', x: 50, y: 70 },
      { id: 'term_loom_control', name: 'Узел Управления Станком', type: 'terminal', description: 'Доступ к производственным логам.', x: 30, y: 90 },
      { id: 'term_taxi_tekstil', name: 'Такси: Текстильщики', type: 'terminal', description: 'Выход на МКАД.', x: 80, y: 30 }
    ]
  },
  npcs: [
    { id: 'npc_vlad', name: 'Влад-Ткач', districtId: 'tekstilschiki', role: 'Инженер защит', greeting: 'Плетем защиту, а не сказки.', shortLore: 'Квесты на реактивные карты защиты.' },
    { id: 'npc_weaver_senior', name: 'Старший Ткач', districtId: 'tekstilschiki', role: 'Мастер паттернов', greeting: 'Узор должен быть безупречным.', shortLore: 'Дает высокоуровневые производственные квесты.' },
    { id: 'job_board_tekstil', name: 'Узел Текстильщики', districtId: 'tekstilschiki', role: 'Контракты', greeting: 'Заказы на чистку ждут.', shortLore: 'Линейка боевых поручений.' },
  ],
  dialogues: {
    npc_vlad: {
      id: 'npc_vlad', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ВЛАД_ТКАЧ', text: 'Смотри под ноги, хакер. Тут везде оптоволоконные нити. Я Влад, я слежу, чтобы Текстильщики не расплелись на байты. Что-то порвалось?', options: [
            { text: 'Нужна работа по зачистке.', nextId: 'quest' },
            { text: 'Расскажи про Старшего Ткача.', nextId: 'lore_vlad' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        quest: {
            id: 'quest', speaker: 'ВЛАД_ТКАЧ', text: 'На 7-й линии боты-ткачи забили фильтры. Сходи и прочисти их, пока они не начали "ткать" системную ошибку.',
            options: [
                { text: 'Сделаю (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_textile_raid' }
            ]
        },
        lore_vlad: {
          id: 'lore_vlad', speaker: 'ВЛАД_ТКАЧ', text: 'Старший? Он сидит в центре узла. Держит в голове паттерны, которые писали еще до твоего рождения. Без него тут всё развалится.', options: [{ text: 'Пойду пообщаюсь.', nextId: 'intro' }]
        }
      }
    },
    shop_armor_weave: {
        id: 'shop_armor_weave', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ЛАВКА_БРОНЕПЛЕТЕНИЯ', text: 'Плетем защиту из чистого Java. Наши надстройки выдерживают даже самый агрессивный Garbage Collection.',
                options: [
                    { text: 'Weave Shield (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'def_stability_patch', subtext: 'Карта: Защита +20.' },
                    { text: 'Steel Thread (70 Bits)', nextId: 'intro', cost: 70, effect: 'GIVE_TRAIT', cardRewardId: 'stack_archaeologist', subtext: 'Черта: Усиление брони.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    bar_oil_can: {
        id: 'bar_oil_can', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'КАБАК_МАСЛЕНКА', text: 'Здесь пахнет машинным маслом и жженой изоляцией. Идеальное место для инженеров-механиков.',
                options: [
                    { text: 'Стакан "Ниппель" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 35, subtext: 'Восстановление 35 HP.' },
                    { text: 'Полная замена масла (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100, subtext: 'Максимальное исцеление.' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_weaver_senior: {
        id: 'npc_weaver_senior', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'СТАРШИЙ_ТКАЧ', text: 'Нити судьбы спутались... или это просто плохой код? Каждому паттерну нужен свой поток. Ты пришел за наукой или за работой?',
                options: [
                    { text: 'Что за паттерны?', nextId: 'lore' },
                    { text: 'Мне нужен "Промышленный Паттерн".', nextId: 'quest_pattern_start' },
                    { text: 'Я принес Паттерн из Академии.', nextId: 'quest_pattern_finish', requireQuestId: 'q_weaver_pattern' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'СТАРШИЙ_ТКАЧ', text: 'Паттерн — это образ мысли Ядра. Если ты знаешь паттерн, ты можешь предсказать любой баг. Но истинные узоры хранятся глубоко в архивах Академии Юго-Запада.',
                options: [{ text: 'Интересно.', nextId: 'intro' }]
            },
            quest_pattern_start: {
                id: 'quest_pattern_start', speaker: 'СТАРШИЙ_ТКАЧ', text: 'Нам нужен утерянный "Grid_Optimizer_v2". Он должен быть в Главном Мейнфрейме Академии. Профессор Архипов вряд ли отдаст его просто так, но ты найдешь способ. (Принять контракт)',
                options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_weaver_pattern' }]
            },
            quest_pattern_finish: {
                id: 'quest_pattern_finish', speaker: 'СТАРШИЙ_ТКАЧ', text: '*рассматривает данные* ...Да. Это оно. Тончайшая работа. С этим паттерном Текстильщики станут неприступными. Спасибо, мастер. Вот твоя награда — "Weavers Loop".',
                options: [{ text: 'Рад помочь.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_weaver_pattern' }]
            }
        }
    },
    npc_safety_auditor: {
        id: 'npc_safety_auditor', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'АУДИТОР_БЕЗОПАСНОСТЬ', text: 'Ваша дека выглядит... подозрительно. Много неоптимизированных прыжков. Хотите аудит?',
                options: [
                    { text: 'Пройти аудит.', nextId: 'lore' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'АУДИТОР_БЕЗОПАСНОСТЬ', text: 'Слишком много импортов. Слишком мало защиты. Вы — ходячая дыра в безопасности. (+5 Репутации GIGA_BANK)',
                options: [{ text: 'Спасибо...', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 5, cardRewardId: 'GIGA_BANK' }]
            }
        }
    },
    term_loom_control: {
        id: 'term_loom_control', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'УЗЕЛ_УПРАВЛЕНИЯ_СТАНКОМ', text: '[SYSTEM] ЦИКЛ_ПЛЕТЕНИЯ_АКТИВЕН. ВЫБЕРИТЕ_РЕЖИМ:',
                options: [
                    { text: 'Посмотреть чертежи', nextId: 'lore' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'УЗЕЛ_УПРАВЛЕНИЯ_СТАНКОМ', text: '[DATA] Схема плетения "Октябрь" обеспечивает 99% отказоустойчивости при пиковых нагрузках на CPU.',
                options: [{ text: 'Назад', nextId: 'intro' }]
            }
        }
    },
    term_taxi_tekstil: {
        id: 'term_taxi_tekstil', startNodeId: 's',
        nodes: {
            s: {
                id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Узел Текстильщики. Трафик МКАД перегружен. Требуется авторизация (100 Bits).', options: [
                    { text: 'Купить проезд (100 Bits)', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
                    { text: 'Отмена', nextId: 'LEAVE' }
                ]
            }
        }
    },
    job_board_tekstil: {
      id: 'job_board_tekstil', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'УЗЕЛ_ТЕКСТИЛЬ', text: 'Ткацкая сеть: переполнение логов. Нужна очистка sudo.', options: [
            { text: 'Взять: Wash Logs (50 Bits)', nextId: 'accept' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        accept: {
          id: 'accept', speaker: 'УЗЕЛ_ТЕКСТИЛЬ', text: 'Система готова к очистке.', options: [{ text: 'Запустить (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_factory_bot' }]
        }
      }
    }
  }
};

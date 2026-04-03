import type { WorldDistrict } from './types';

export const izmailovo: WorldDistrict = {
  id: 'izmailovo',
  node: {
    id: 'izmailovo', 
    name: 'IZMAILOVO: CRAFT_MARKET', 
    description: 'Культурный и торговый центр. Здесь делают лучшие кастомные импланты и деки.', 
    x: 90, y: 30, stability: 92, type: 'trade', tier: 1,
    subNodes: [
        { id: 'npc_master', name: 'Мастер Верстак', type: 'npc', description: 'Соберет что угодно из мусора. Мастер кастомных дек.', x: 40, y: 40 },
        { id: 'npc_artisan', name: 'Ремесленник Ли', type: 'npc', description: 'Специалист по гравировке кода на кристаллах.', x: 15, y: 25 },
        { id: 'npc_collector', name: 'Коллекционер', type: 'npc', description: 'Ищет редкие версии библиотек v0.04.', x: 65, y: 10 },
        { id: 'shop_legendary', name: 'Лавка Легенд', type: 'shop', description: 'Самые редкие и дорогие компоненты в секторе.', x: 85, y: 50 },
        { id: 'bar_craft', name: 'Трактир "У Кода"', type: 'bar', description: 'Место встречи умельцев и создателей софта.', x: 70, y: 60 },
        { id: 'term_craft_log', name: 'Журнал Мастера', type: 'terminal', description: 'Чертежи и рецепты древних имплантов.', x: 30, y: 80 },
        { id: 'job_craft_scrap', name: 'Сбор деталей', type: 'combat', description: 'Сбор ценного лома под охраной ботов.', x: 80, y: 30 },
        { id: 'combat_market_thieves', name: 'Рыночные Воры', type: 'combat', description: 'Группа хакеров пытается взломать твой инвентарь.', x: 45, y: 70 },
        { id: 'combat_glitch_puppet', name: 'Глючная Кукла', type: 'combat', description: 'Робот-манекен захвачен вредоносным процессом.', x: 25, y: 45 },
        { id: 'term_taxi_izmailovo', name: 'Такси: Измайлово', type: 'terminal', description: 'Выход в город.', x: 50, y: 90 }
    ]
  },
  npcs: [
    { id: 'npc_master', name: 'Мастер Верстак', districtId: 'izmailovo', role: 'Крафтер', greeting: 'Из лома делаем легенды.', shortLore: 'Крафтовые контракты и добыча.' },
    { id: 'npc_artisan', name: 'Ремесленник Ли', districtId: 'izmailovo', role: 'Художник кода', greeting: 'Красота в логике.', shortLore: 'Эстетическая аутентификация.' },
    { id: 'npc_collector', name: 'Коллекционер', districtId: 'izmailovo', role: 'Архивариус', greeting: 'Дампы не горят.', shortLore: 'Покупает старые данные.' },
    { id: 'npc_gennady', name: 'Гена (Скупщик)', districtId: 'izmailovo', role: 'Черный рынок', greeting: 'Шепотом говори, у стен есть уши.', shortLore: 'Связующее звено для редких квестов.' },
  ],
  dialogues: {
    npc_master: {
      id: 'npc_master', startNodeId: 'intro',
      nodes: {
        intro: { id: 'intro', speaker: 'ВЕРСТАК', text: 'Собрать деку из хлама — это искусство. Хочешь научиться или просто пришел за деталями?', options: [
            { text: 'Мне нужен хладагент для разгона...', nextId: 'quest_cooling_start' },
            { text: '[ ПРИНЯТЬ КОНТРАКТ: СБОР ДЕТАЛЕЙ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_izmailovo_combat_job_craft_scrap_bug_sweep' }, 
            { text: '[Уйти]', nextId: 'LEAVE' }
        ] },
        quest_cooling_start: {
            id: 'quest_cooling_start', speaker: 'ВЕРСТАК', text: 'Хладагент? Дефицит. Мои запасы выпили "чистильщики" из МКАДа. Сходи к Крысе в Марьино, у него всегда есть пара канистр "Buffer Liquid". Принесешь — соберу тебе деку по высшему разряду. (Принять контракт)',
            options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_verstak_cooling' }]
        },
        quest_cooling_finish: {
            id: 'quest_cooling_finish', speaker: 'ВЕРСТАК', text: 'О, свежак! Слышишь, как шипит? Теперь моя станция не расплавится при первой же компиляции. Вот, держи "Refactor Tool" — моя лучшая работа.',
            options: [{ text: 'Спасибо, мастер.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_verstak_cooling' }]
        }
      }
    },
    shop_legendary: {
        id: 'shop_legendary', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ЛАВКА_ЛЕГЕНД', text: 'Здесь нет мусора. Только верифицированные модули с подписью Архитектора.',
                options: [
                    { text: 'Refactor Crystal (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_CARD', cardRewardId: 'fn_refactor', subtext: 'Карта: Переработка Bug-стека.' },
                    { text: 'Artisan Core (200 Bits)', nextId: 'intro', cost: 200, effect: 'GIVE_TRAIT', cardRewardId: 'hardware_reclaimer', subtext: 'Черта: Сборка риг из мусора.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    bar_craft: {
        id: 'bar_craft', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ТРАКТИР_У_КОДА', text: 'Место, где искры от паяльника мешаются с парами крепкого софта. Здесь рождаются лучшие кастомные деки.',
                options: [
                    { text: 'Эль "Оптимизация" (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 40, subtext: 'Восстановление 40 HP.' },
                    { text: 'Обед мастера (45 Bits)', nextId: 'intro', cost: 45, effect: 'RESTORE_HP', amount: 100, subtext: 'Полное восстановление.' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_artisan: {
        id: 'npc_artisan', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'РЕМЕСЛЕННИК_ЛИ', text: 'Витрина полна кристаллов с выгравированными на них циклами. Код должен быть не только быстрым, но и красивым.',
                options: [
                    { text: 'Рассказать об искусстве.', nextId: 'lore' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'РЕМЕСЛЕННИК_ЛИ', text: 'В старые времена каждый хакер имел свой почерк. Сегодня Ядро хочет, чтобы все писали одинаково. Но мы помним стиль. (+10 Репутации NEO_KYOTO)',
                options: [{ text: 'Вдохновляет.', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'NEO_KYOTO' }]
            }
        }
    },
    npc_collector: {
        id: 'npc_collector', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'КОЛЛЕКЦИОНЕР', text: 'Ищу нетронутые дампы v0.04. Плачу Bits за любую информацию о "чистом" коде без подписи Ядра.',
                options: [
                    { text: 'Продать старый лог (25 Bits)', nextId: 'intro', cost: 0, effect: 'GIVE_BITS', amount: 25 },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    term_craft_log: {
        id: 'term_craft_log', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ЖУРНАЛ_МАСТЕРА', text: '[SYSTEM] ДОСТУП_К_РЕЦЕПТАМ_ОТКРЫТ. ВЫБЕРИТЕ_КАТЕГОРИЮ:',
                options: [
                    { text: 'Архитектура Деки', nextId: 'lore' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'ЖУРНАЛ_МАСТЕРА', text: '[DATA] Эффективная дека должна иметь баланс между CPU и RAM. Избыток одного без другого ведет к фризу.',
                options: [{ text: 'Назад', nextId: 'intro' }]
            }
        }
    },
    term_taxi_izmailovo: {
        id: 'term_taxi_izmailovo', startNodeId: 's',
        nodes: {
            s: { id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Измайловский рынок. Такси доступны для авторизованных курьеров.', options: [{ text: 'Авторизоваться (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 }, { text: 'Отмена', nextId: 'LEAVE' }] }
        }
    },
    npc_gennady: {
        id: 'npc_gennady', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ГЕНА_СКУПЩИК', text: 'Чего застыл? Если не покупаешь и не продаешь — проходи мимо. Ядро и так дышит в затылок.',
                options: [
                    { text: 'Мне нужны драйверы 1974 года для БЭСМ.', nextId: 'quest_vintage_check', requireQuestId: 'q_besm_vintage_code' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            quest_vintage_check: {
                id: 'quest_vintage_check', speaker: 'ГЕНА_СКУПЩИК', text: 'БЭСМ? Это же музейный экспонат! Ладно, у меня завалялся один чип "Legacy Core", но он битый. Тебе придется его "прогреть". Отдам за 30 Bits, или проваливай.',
                options: [
                    { text: 'Плачу 30 Bits.', nextId: 'quest_vintage_deal', cost: 30 },
                    { text: 'Дорого.', nextId: 'intro' }
                ]
            },
            quest_vintage_deal: {
                id: 'quest_vintage_deal', speaker: 'ГЕНА_СКУПЩИК', text: 'Держи. И скажи Генералу, пусть не забывает, кто его кормит историей.',
                options: [{ text: 'Забрать чип.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_besm_vintage_code' }]
            }
        }
    }
  }
};

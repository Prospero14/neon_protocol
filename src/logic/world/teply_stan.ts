import type { WorldDistrict } from './types';

export const teply_stan: WorldDistrict = {
  id: 'teply_stan',
  node: {
    id: 'teply_stan', 
    name: 'ТЕПЛЫЙ СТАН: FOREST_EDGE', 
    description: 'Окраина Москвы, где город встречается с одичавшим лесом. Идеальное место для скрытых баз.', 
    x: 20, y: 90, stability: 88, type: 'combat', tier: 1,
    subNodes: [
        { id: 'npc_ranger', name: 'Егерь (SRE-патруль)', type: 'npc', description: 'Следит за стабильностью региона. Недолюбливает дикий код.', x: 50, y: 20 },
        { id: 'npc_hermit_forest', name: 'Лесной Отшельник', type: 'npc', description: 'Живет вне сети. Знает тайные тропы.', x: 15, y: 45 },
        { id: 'npc_sre_recruit', name: 'Рекрут Патруля', type: 'npc', description: 'Мечтает о настоящем задании.', x: 75, y: 15 },
        { id: 'shop_forest', name: 'Лесная лавка', type: 'shop', description: 'Уникальные лечебные модули.', x: 20, y: 60 },
        { id: 'shop_wild', name: 'Дикий рынок', type: 'shop', description: 'Контрабандный и немаркированный софт.', x: 45, y: 75 },
        { id: 'bar_forest_shadow', name: 'Таверна "Тень Леса"', type: 'bar', description: 'Уютное место под защитой старых роутеров.', x: 10, y: 30 },
        { id: 'term_nature_log', name: 'Монитор Экосистемы', type: 'terminal', description: 'Данные о росте дикого кода.', x: 85, y: 60 },
        { id: 'combat_forest_hunt', name: 'Охота на Баг-Тварей', type: 'combat', description: 'Очистка леса от системных ошибок.', x: 80, y: 40 },
        { id: 'combat_wild_node', name: 'Дикий Узел', type: 'combat', description: 'Заросший данными сервер-паразит.', x: 60, y: 80 },
        { id: 'combat_router_clash', name: 'Стык Роутеров', type: 'combat', description: 'Территориальный конфликт за сигнал.', x: 35, y: 90 }
    ]
  },
  npcs: [
    { id: 'npc_ranger', name: 'Егерь', districtId: 'teply_stan', role: 'SRE-патруль', greeting: 'Стабильность - это дисциплина.', shortLore: 'Боевые зачистки и ремонт.' },
  ],
  dialogues: {
    npc_ranger: {
      id: 'npc_ranger', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ЕГЕРЬ', text: 'Стоять. Лес — территория SRE. Здесь мы ловим баги, а не туристов. Чего хотел?', options: [
            { text: 'Нужна работа по зачистке.', nextId: 'quest' },
            { text: 'Просто прохожу мимо.', nextId: 'LEAVE' }
          ]
        },
        quest: {
          id: 'quest', speaker: 'ЕГЕРЬ', text: 'В чаще завелся бесконечный цикл. Сходи и прерви его, пока он не сожрал всю память района.', options: [
            { text: 'Сделаю.', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_forest_hunt' }
          ]
        }
      }
    },
    shop_forest: {
      id: 'shop_forest', startNodeId: 'intro',
      nodes: {
        intro: { id: 'intro', speaker: 'ЛЕСНИК', text: 'У меня только дикие модули. Никаких лицензий, только чистая мощь. Берешь?', options: [
            { text: 'SRE Monitor (30 Bits)', nextId: 'intro', cost: 30, effect: 'GIVE_CARD', cardRewardId: 'fn_ping', subtext: 'Для тех, кто следит за сетью.' }, 
            { text: '[Уйти]', nextId: 'LEAVE' }
        ] }
      }
    },
    shop_wild: {
        id: 'shop_wild', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ДИКИЙ_РЫНОК', text: 'Контрабанда из-за МКАДа. Здесь софт не имеет подписи, но работает безотказно.',
                options: [
                    { text: 'Garbage Collector V2 (60 Bits)', nextId: 'intro', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'fn_wash_logs', subtext: 'Чистит стек быстрее.' },
                    { text: 'Deep Forest Path (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_TRAIT', cardRewardId: 'script_ghost', subtext: 'Черта: Снижение стресса в бою.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    bar_forest_shadow: {
        id: 'bar_forest_shadow', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ТАВЕРНА_ТЕНЬ_ЛЕСА', text: 'Уютный сруб, обшитый старыми серверными панелями. Здесь пьют березовый хладагент.',
                options: [
                    { text: 'Кружка "Лесного Эха" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30, subtext: 'Восстановление 30 HP.' },
                    { text: 'Ночлег в корнях (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100, subtext: 'Полное восстановление.' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_hermit_forest: {
        id: 'npc_hermit_forest', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ЛЕСНОЙ_ОТШЕЛЬНИК', text: 'Город... шум... суета... Здесь, под корой, слышны только байты. Чего ты ищешь в моем уединении?',
                options: [
                    { text: 'Я ищу тайные тропы.', nextId: 'lore' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'ЛЕСНОЙ_ОТШЕЛЬНИК', text: 'МКАД — это не стена. Это огромный файрвол. Если найдешь "Пролом", сможешь увидеть то, что за ним. (+10 Репутации Анархистов)',
                options: [{ text: 'Запомню.', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'ANARCHO_VOID' }]
            }
        }
    },
    npc_sre_recruit: {
        id: 'npc_sre_recruit', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'РЕКРУТ_ПАТРУЛЯ', text: 'Егерь сказал, что я еще не готов к выходам за периметр. А я хочу в настоящий бой!',
                options: [
                    { text: 'Могу тебя потренировать.', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_wild_node' },
                    { text: 'Слушай Егеря.', nextId: 'LEAVE' }
                ]
            }
        }
    },
    term_nature_log: {
        id: 'term_nature_log', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'МОНИТОР_ЭКОСИСТЕМЫ', text: '[DATA_STREAM] Степень заражения леса диким кодом: 45%. Рекомендуется зачистка.',
                options: [
                    { text: 'Запустить диагностику (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_router_clash' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    }
  }
};

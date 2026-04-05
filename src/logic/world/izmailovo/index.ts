import type { WorldDistrict } from '../types';
import { izmailovo_npcs } from './npcs';
import { izmailovo_dialogues } from './dialogues';

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
  npcs: izmailovo_npcs,
  dialogues: izmailovo_dialogues
};

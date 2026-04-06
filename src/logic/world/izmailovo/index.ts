import type { WorldDistrict } from '../types';
import { npc_master_profile } from './npcs/npc_master/profile';
import { npc_master_dialogues } from './npcs/npc_master/dialogues';
import { npc_artisan_profile } from './npcs/npc_artisan/profile';
import { npc_artisan_dialogues } from './npcs/npc_artisan/dialogues';
import { npc_collector_profile } from './npcs/npc_collector/profile';
import { npc_collector_dialogues } from './npcs/npc_collector/dialogues';
import { npc_gennady_profile } from './npcs/npc_gennady/profile';
import { npc_gennady_dialogues } from './npcs/npc_gennady/dialogues';
import { npc_old_timer_profile } from './npcs/npc_old_timer/profile';
import { npc_old_timer_dialogues } from './npcs/npc_old_timer/dialogues';

import { shop_legendary_dialogues } from './objects/shop_legendary/dialogues';
import { bar_craft_dialogues } from './objects/bar_craft/dialogues';
import { term_craft_log_dialogues } from './objects/term_craft_log/dialogues';
import { job_craft_scrap_dialogues } from './objects/job_craft_scrap/dialogues';
import { combat_market_thieves_dialogues } from './objects/combat_market_thieves/dialogues';
import { combat_glitch_puppet_dialogues } from './objects/combat_glitch_puppet/dialogues';
import { term_taxi_izmailovo_dialogues } from './objects/term_taxi_izmailovo/dialogues';

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
        { id: 'npc_gennady', name: 'Гена Скупщик', type: 'npc', description: 'Черный рынок электроники.', x: 10, y: 50 },
        { id: 'npc_old_timer', name: 'Старый Радист', type: 'npc', description: 'Ветеран связи Voskhod.', x: 80, y: 80 },
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
    npc_master_profile,
    npc_artisan_profile,
    npc_collector_profile,
    npc_gennady_profile,
    npc_old_timer_profile
  ],
  dialogues: {
    npc_master: npc_master_dialogues,
    npc_artisan: npc_artisan_dialogues,
    npc_collector: npc_collector_dialogues,
    npc_gennady: npc_gennady_dialogues,
    npc_old_timer: npc_old_timer_dialogues,
    shop_legendary: shop_legendary_dialogues,
    bar_craft: bar_craft_dialogues,
    term_craft_log: term_craft_log_dialogues,
    job_craft_scrap: job_craft_scrap_dialogues,
    combat_market_thieves: combat_market_thieves_dialogues,
    combat_glitch_puppet: combat_glitch_puppet_dialogues,
    term_taxi_izmailovo: term_taxi_izmailovo_dialogues
  }
};

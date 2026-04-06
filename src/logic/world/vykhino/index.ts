import type { WorldDistrict } from '../types';
import { npc_grey_profile } from './npcs/npc_grey/profile';
import { npc_grey_dialogues } from './npcs/npc_grey/dialogues';
import { npc_vykhino_loader_profile } from './npcs/npc_vykhino_loader/profile';
import { npc_vykhino_loader_dialogues } from './npcs/npc_vykhino_loader/dialogues';
import { npc_link_manager_profile } from './npcs/npc_link_manager/profile';
import { npc_link_manager_dialogues } from './npcs/npc_link_manager/dialogues';
import { npc_corp_scout_profile } from './npcs/npc_corp_scout/profile';
import { npc_corp_scout_dialogues } from './npcs/npc_corp_scout/dialogues';
import { npc_job_boss_profile } from './npcs/npc_job_boss/profile';
import { npc_job_boss_dialogues } from './npcs/npc_job_boss/dialogues';
import { shop_metro_dialogues } from './objects/shop_metro/dialogues';
import { shop_black_market_dialogues } from './objects/shop_black_market/dialogues';
import { term_exchange_dialogues } from './objects/term_exchange/dialogues';
import { bar_transit_dialogues } from './objects/bar_transit/dialogues';
import { term_taxi_unlock_dialogues } from './objects/term_taxi_unlock/dialogues';
import { combat_cargo_dialogues } from './objects/combat_cargo/dialogues';

export const vykhino: WorldDistrict = {
  id: 'vykhino',
  node: {
    id: 'vykhino', 
    name: 'VYKHINO: TRADE_BRANCH', 
    description: 'Торговый хаб с бешеным трафиком. Центр незаконного обмена данными.', 
    x: 75, y: 70, stability: 85, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_grey', name: 'Грей (Гоп-хакер)', type: 'npc', description: 'Знает все лазейки метро.', x: 40, y: 50 },
      { id: 'npc_vykhino_loader', name: 'Грузчик данных', type: 'npc', description: 'Таскает тяжелые архивы между шлюзами.', x: 25, y: 15 },
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
    npc_grey_profile,
    npc_vykhino_loader_profile,
    npc_link_manager_profile,
    npc_corp_scout_profile,
    npc_job_boss_profile
  ],
  dialogues: {
    npc_grey: npc_grey_dialogues,
    npc_vykhino_loader: npc_vykhino_loader_dialogues,
    npc_link_manager: npc_link_manager_dialogues,
    npc_corp_scout: npc_corp_scout_dialogues,
    npc_job_boss: npc_job_boss_dialogues,
    shop_metro: shop_metro_dialogues,
    shop_black_market: shop_black_market_dialogues,
    term_exchange: term_exchange_dialogues,
    bar_transit: bar_transit_dialogues,
    term_taxi_unlock: term_taxi_unlock_dialogues,
    combat_cargo: combat_cargo_dialogues
  }
};

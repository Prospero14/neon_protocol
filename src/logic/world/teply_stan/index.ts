import type { WorldDistrict } from '../types';
import { npc_ranger_profile } from './npcs/npc_ranger/profile';
import { npc_ranger_dialogues } from './npcs/npc_ranger/dialogues';
import { npc_hermit_forest_profile } from './npcs/npc_hermit_forest/profile';
import { npc_hermit_forest_dialogues } from './npcs/npc_hermit_forest/dialogues';
import { npc_sre_recruit_profile } from './npcs/npc_sre_recruit/profile';
import { npc_sre_recruit_dialogues } from './npcs/npc_sre_recruit/dialogues';
import { shop_forest_dialogues } from './objects/shop_forest/dialogues';
import { shop_wild_dialogues } from './objects/shop_wild/dialogues';
import { bar_forest_shadow_dialogues } from './objects/bar_forest_shadow/dialogues';
import { term_nature_log_dialogues } from './objects/term_nature_log/dialogues';
import { combat_forest_hunt_dialogues } from './objects/combat_forest_hunt/dialogues';
import { combat_wild_node_dialogues } from './objects/combat_wild_node/dialogues';
import { combat_router_clash_dialogues } from './objects/combat_router_clash/dialogues';

export const teply_stan: WorldDistrict = {
  id: 'teply_stan',
  node: {
    id: 'teply_stan', 
    name: 'TEPLY_STAN: FOREST_EDGE', 
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
    npc_ranger_profile,
    npc_hermit_forest_profile,
    npc_sre_recruit_profile
  ],
  dialogues: {
    npc_ranger: npc_ranger_dialogues,
    npc_hermit_forest: npc_hermit_forest_dialogues,
    npc_sre_recruit: npc_sre_recruit_dialogues,
    shop_forest: shop_forest_dialogues,
    shop_wild: shop_wild_dialogues,
    bar_forest_shadow: bar_forest_shadow_dialogues,
    term_nature_log: term_nature_log_dialogues,
    combat_forest_hunt: combat_forest_hunt_dialogues,
    combat_wild_node: combat_wild_node_dialogues,
    combat_router_clash: combat_router_clash_dialogues
  }
};

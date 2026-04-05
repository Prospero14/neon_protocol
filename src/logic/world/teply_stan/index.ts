import type { WorldDistrict } from '../types';
import { teply_stan_npcs } from './npcs';
import { teply_stan_dialogues } from './dialogues';

export const teply_stan: WorldDistrict = {
  id: 'teply_stan',
  node: {
    id: 'teply_stan', 
    name: 'TEPLY_STAN: FOREST_EDGE', 
    description: 'Окраина Москвы, где город встречается con одичавшим лесом. Идеальное место для скрытых баз.', 
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
  npcs: teply_stan_npcs,
  dialogues: teply_stan_dialogues
};

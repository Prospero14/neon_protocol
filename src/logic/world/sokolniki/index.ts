import type { WorldDistrict } from '../types';
import { npc_hermit_profile } from './npcs/npc_hermit/profile';
import { npc_hermit_dialogues } from './npcs/npc_hermit/dialogues';
import { npc_druid_coder_profile } from './npcs/npc_druid_coder/profile';
import { npc_druid_coder_dialogues } from './npcs/npc_druid_coder/dialogues';
import { npc_forest_guard_profile } from './npcs/npc_forest_guard/profile';
import { npc_forest_guard_dialogues } from './npcs/npc_forest_guard/dialogues';
import { npc_ghost_server_profile } from './npcs/npc_ghost_server/profile';
import { npc_ghost_server_dialogues } from './npcs/npc_ghost_server/dialogues';

import { bar_deep_root_dialogues } from './objects/bar_deep_root/dialogues';
import { shop_nature_logic_dialogues } from './objects/shop_nature_logic/dialogues';
import { combat_recursive_loop_dialogues } from './objects/combat_recursive_loop/dialogues';
import { combat_wild_firewall_dialogues } from './objects/combat_wild_firewall/dialogues';
import { combat_fox_virus_dialogues } from './objects/combat_fox_virus/dialogues';
import { term_forest_log_dialogues } from './objects/term_forest_log/dialogues';
import { term_taxi_sokolniki_dialogues } from './objects/term_taxi_sokolniki/dialogues';

export const sokolniki: WorldDistrict = {
  id: 'sokolniki', 
  node: {
    id: 'sokolniki', 
    name: 'SOKOLNIKI: SERVER_FOREST', 
    description: 'Бывший парк, превращенный в серверный лабиринт. Пристанище старых кодеров.', 
    x: 70, y: 20, stability: 65, type: 'bar', tier: 4,
    subNodes: [
      { id: 'npc_hermit', name: 'Отшельник', type: 'npc', description: 'Лесной админ.', x: 30, y: 30 },
      { id: 'npc_druid_coder', name: 'Друид Арборис (Био-хакер)', type: 'npc', description: 'Верит в органический код.', x: 10, y: 60 },
      { id: 'npc_forest_guard', name: 'Лесник (SYS_SEC)', type: 'npc', description: 'Охраняет физические сервера.', x: 70, y: 15 },
      { id: 'bar_deep_root', name: 'Бар "Глубинный Корень"', type: 'bar', description: 'Тихое место среди жужжащих стоек.', x: 50, y: 80 },
      { id: 'combat_recursive_loop', name: 'Рекурсивная Петля', type: 'combat', description: 'Аномалия в центре парка.', x: 40, y: 50 },
      { id: 'combat_wild_firewall', name: 'Дикий Файрвол', type: 'combat', description: 'Защита, забытая создателями.', x: 85, y: 30 },
      { id: 'shop_nature_logic', name: 'Логика Природы', type: 'shop', description: 'Био-модификации.', x: 20, y: 85 },
      { id: 'term_forest_log', name: 'Журнал Леса', type: 'terminal', description: 'Данные о росте подсетей.', x: 60, y: 5 },
      { id: 'term_taxi_sokolniki', name: 'Такси: Сокольники', type: 'terminal', description: 'Вылет из леса.', x: 90, y: 50 },
      { id: 'combat_fox_virus', name: 'Вирус "Рыжий Хвост"', type: 'combat', description: 'Хитрый перехватчик данных.', x: 15, y: 20 },
      { id: 'npc_ghost_server', name: 'Призрак Серверной', type: 'npc', description: 'Мерцающая голограмма в пыльной серверной стойке.', x: 45, y: 45 }
    ]
  },
  npcs: [
    npc_hermit_profile,
    npc_druid_coder_profile,
    npc_forest_guard_profile,
    npc_ghost_server_profile
  ],
  dialogues: {
    npc_hermit: npc_hermit_dialogues,
    npc_druid_coder: npc_druid_coder_dialogues,
    npc_forest_guard: npc_forest_guard_dialogues,
    npc_ghost_server: npc_ghost_server_dialogues,
    bar_deep_root: bar_deep_root_dialogues,
    shop_nature_logic: shop_nature_logic_dialogues,
    combat_recursive_loop: combat_recursive_loop_dialogues,
    combat_wild_firewall: combat_wild_firewall_dialogues,
    combat_fox_virus: combat_fox_virus_dialogues,
    term_forest_log: term_forest_log_dialogues,
    term_taxi_sokolniki: term_taxi_sokolniki_dialogues
  }
};

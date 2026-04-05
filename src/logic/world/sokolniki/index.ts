import type { WorldDistrict } from '../types';
import { sokolniki_npcs } from './npcs';
import { sokolniki_dialogues } from './dialogues';

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
  npcs: sokolniki_npcs,
  dialogues: sokolniki_dialogues
};

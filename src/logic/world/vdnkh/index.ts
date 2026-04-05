import type { WorldDistrict } from '../types';
import { vdnkh_npcs } from './npcs';
import { vdnkh_dialogues } from './dialogues';

export const vdnkh: WorldDistrict = {
  id: 'vdnkh', 
  node: {
    id: 'vdnkh', 
    name: 'VDNKH: PAVILION_ZERO', 
    description: 'Синтетические нейро-напитки и сборище легендарных хакеров в тени заброшенных павильонов.', 
    x: 52, y: 30, stability: 80, type: 'bar', tier: 3,
    subNodes: [
      { id: 'npc_besm', name: 'Генерал БЭСМ', type: 'npc', description: 'Цифровой призрак прошлого.', x: 10, y: 30 },
      { id: 'npc_guide_vdnkh', name: 'Экскурсовод', type: 'npc', description: 'Рассказывает сказки о золотом веке кода.', x: 25, y: 50 },
      { id: 'npc_scavenger', name: 'Стервятник', type: 'npc', description: 'Ищет ценное железо в руинах павильонов.', x: 55, y: 15 },
      { id: 'shop_vintage', name: 'Лавка "Ретро-Тех"', type: 'shop', description: 'Редкое Legacy.', x: 40, y: 60 },
      { id: 'bar_vostok', name: 'Бар "Восток-1"', type: 'bar', description: 'Напитки для космонавтов данных.', x: 80, y: 20 },
      { id: 'combat_pavilions', name: 'Зачистка Павильонов', type: 'combat', description: 'Бой с системными багами.', x: 60, y: 40 },
      { id: 'combat_retro_virus', name: 'Ретро-Вирус 86', type: 'combat', description: 'Древняя зараза, ожившая в старых сетях.', x: 20, y: 75 },
      { id: 'term_archive_data', name: 'Архив ВДНХ', type: 'terminal', description: 'Доступ к историческим логам выставок.', x: 70, y: 80 },
      { id: 'term_taxi_vdnkh', name: 'Такси: ВДНХ', type: 'terminal', description: 'Связь с городом.', x: 90, y: 55 },
      { id: 'npc_tea_master', name: 'Мастер Чая (Олег)', type: 'npc', description: 'Успокаивает нервы после тяжелых дампов.', x: 45, y: 10 }
    ]
  },
  npcs: vdnkh_npcs,
  dialogues: vdnkh_dialogues
};

import type { WorldDistrict } from '../types';
import { fili_npcs } from './npcs';
import { fili_dialogues } from './dialogues';

export const fili: WorldDistrict = {
  id: 'fili', 
  node: {
    id: 'fili', 
    name: 'FILI: ORBIT_LINK', 
    description: 'Район космических заводов и спутниковых линков. Высокая плотность SRE.', 
    x: 10, y: 40, stability: 70, type: 'trade', tier: 4,
    subNodes: [
      { id: 'npc_kosmos', name: 'Космос (SRE Nomad)', type: 'npc', description: 'Собирает экспедицию в облако.', x: 50, y: 50 },
      { id: 'npc_rocket_eng', name: 'Степаныч (Инженер)', type: 'npc', description: 'Старая гвардия Хруничева.', x: 20, y: 80 },
      { id: 'npc_orbit_stalker', name: 'Луна (Orbit Stalker)', type: 'npc', description: 'Перехватчик данных со спутников.', x: 80, y: 20 },
      { id: 'bar_cosmo_port', name: 'Бар "Байконур"', type: 'bar', description: 'Здесь пьют за удачный запуск.', x: 10, y: 40 },
      { id: 'shop_gravity', name: 'Магазин "Гравитация"', type: 'shop', description: 'Тяжелое железо и щиты.', x: 70, y: 60 },
      { id: 'combat_launch_guard', name: 'Охрана Пуска', type: 'combat', description: 'Автоматика на взводе.', x: 40, y: 15 },
      { id: 'combat_satellite_crash', name: 'Падение Данных', type: 'combat', description: 'Сбор обломков спутника под огнем.', x: 15, y: 90 },
      { id: 'term_uplink', name: 'Терминал Аплинка', type: 'terminal', description: 'Связь с орбитой.', x: 85, y: 50 },
      { id: 'term_taxi_fili', name: 'Такси: Фили', type: 'terminal', description: 'Улет из района.', x: 60, y: 95 },
      { id: 'job_board_fili', name: 'Центр Управления Найма', type: 'npc', description: 'Контракты на космические Bits.', x: 30, y: 5 },
      { id: 'npc_echo_broker', name: 'Эхо (Медиа-брокер)', type: 'npc', description: 'Сидит за терминалом, окруженная новостными лентами.', x: 35, y: 65 }
    ]
  },
  npcs: fili_npcs,
  dialogues: fili_dialogues
};

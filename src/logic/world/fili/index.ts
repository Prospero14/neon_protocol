import type { WorldDistrict } from '../types';
import { npc_kosmos_profile } from './npcs/npc_kosmos/profile';
import { npc_kosmos_dialogues } from './npcs/npc_kosmos/dialogues';
import { npc_rocket_eng_profile } from './npcs/npc_rocket_eng/profile';
import { npc_rocket_eng_dialogues } from './npcs/npc_rocket_eng/dialogues';
import { npc_orbit_stalker_profile } from './npcs/npc_orbit_stalker/profile';
import { npc_orbit_stalker_dialogues } from './npcs/npc_orbit_stalker/dialogues';
import { npc_echo_broker_profile } from './npcs/npc_echo_broker/profile';
import { npc_echo_broker_dialogues } from './npcs/npc_echo_broker/dialogues';
import { npc_archivist_profile } from './npcs/npc_archivist/profile';
import { npc_archivist_dialogues } from './npcs/npc_archivist/dialogues';

import { bar_cosmo_port_dialogues } from './objects/bar_cosmo_port/dialogues';
import { shop_gravity_dialogues } from './objects/shop_gravity/dialogues';
import { combat_launch_guard_dialogues } from './objects/combat_launch_guard/dialogues';
import { combat_satellite_crash_dialogues } from './objects/combat_satellite_crash/dialogues';
import { term_uplink_dialogues } from './objects/term_uplink/dialogues';
import { term_taxi_fili_dialogues } from './objects/term_taxi_fili/dialogues';
import { job_board_fili_dialogues } from './objects/job_board_fili/dialogues';

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
      { id: 'npc_archivist', name: 'Архивариус', type: 'npc', description: 'Хранитель старых логов.', x: 45, y: 35 },
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
  npcs: [
    npc_kosmos_profile,
    npc_rocket_eng_profile,
    npc_orbit_stalker_profile,
    npc_echo_broker_profile,
    npc_archivist_profile
  ],
  dialogues: {
    npc_kosmos: npc_kosmos_dialogues,
    npc_rocket_eng: npc_rocket_eng_dialogues,
    npc_orbit_stalker: npc_orbit_stalker_dialogues,
    npc_echo_broker: npc_echo_broker_dialogues,
    npc_archivist: npc_archivist_dialogues,
    bar_cosmo_port: bar_cosmo_port_dialogues,
    shop_gravity: shop_gravity_dialogues,
    combat_launch_guard: combat_launch_guard_dialogues,
    combat_satellite_crash: combat_satellite_crash_dialogues,
    term_uplink: term_uplink_dialogues,
    term_taxi_fili: term_taxi_fili_dialogues,
    job_board_fili: job_board_fili_dialogues
  }
};

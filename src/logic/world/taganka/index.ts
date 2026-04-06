import type { WorldDistrict } from '../types';
import { npc_auditor_profile } from './npcs/npc_auditor/profile';
import { npc_auditor_dialogues } from './npcs/npc_auditor/dialogues';
import { npc_informant_profile } from './npcs/npc_informant/profile';
import { npc_informant_dialogues } from './npcs/npc_informant/dialogues';
import { npc_bunker_guard_profile } from './npcs/npc_bunker_guard/profile';
import { npc_bunker_guard_dialogues } from './npcs/npc_bunker_guard/dialogues';

import { bar_cold_buffer_dialogues } from './objects/bar_cold_buffer/dialogues';
import { shop_state_secret_dialogues } from './objects/shop_state_secret/dialogues';
import { combat_deep_audit_dialogues } from './objects/combat_deep_audit/dialogues';
import { combat_ghost_process_dialogues } from './objects/combat_ghost_process/dialogues';
import { term_central_gate_dialogues } from './objects/term_central_gate/dialogues';
import { term_taxi_taganka_dialogues } from './objects/term_taxi_taganka/dialogues';
import { job_board_taganka_dialogues } from './objects/job_board_taganka/dialogues';

export const taganka: WorldDistrict = {
  id: 'taganka', 
  node: {
    id: 'taganka', 
    name: 'TAGANKA: BUNKER_CORE', 
    description: 'Глубокие правительственные бункеры. Резиденция Инквизиции и Аудиторов Ядра.', 
    x: 65, y: 55, stability: 50, type: 'combat', tier: 5, combatPack: 'java_advanced',
    subNodes: [
      { id: 'npc_auditor', name: 'Инквизитор', type: 'npc', description: 'Проверяет зрелость данных.', x: 50, y: 50 },
      { id: 'npc_informant', name: 'Информатор М.', type: 'npc', description: 'Посредник в тени.', x: 80, y: 80 },
      { id: 'npc_bunker_guard', name: 'Сержант Глухов', type: 'npc', description: 'Охрана Бункера.', x: 10, y: 20 },
      { id: 'bar_cold_buffer', name: 'Бар "Холодный Буфер"', type: 'bar', description: 'Где аудиторы пьют жидкий азот.', x: 20, y: 70 },
      { id: 'shop_state_secret', name: 'ГосТайна', type: 'shop', description: 'Запрещенные модули и ключи.', x: 85, y: 15 },
      { id: 'combat_deep_audit', name: 'Глубокий Аудит', type: 'combat', description: 'Тебя проверяют на всех уровнях.', x: 40, y: 40 },
      { id: 'combat_ghost_process', name: 'Призрачный Процесс', type: 'combat', description: 'Нечто живет в стенах бункера.', x: 60, y: 10 },
      { id: 'term_central_gate', name: 'Центральный Шлюз', type: 'terminal', description: 'Вход в Ядро Октября.', x: 50, y: 95 },
      { id: 'term_taxi_taganka', name: 'Такси: Таганка', type: 'terminal', description: 'Выход на поверхность.', x: 90, y: 50 },
      { id: 'job_board_taganka', name: 'Доска Розыска', type: 'npc', description: 'Охота на ренегатов Системы.', x: 15, y: 5 }
    ]
  },
  npcs: [
    npc_auditor_profile,
    npc_informant_profile,
    npc_bunker_guard_profile
  ],
  dialogues: {
    npc_auditor: npc_auditor_dialogues,
    npc_informant: npc_informant_dialogues,
    npc_bunker_guard: npc_bunker_guard_dialogues,
    bar_cold_buffer: bar_cold_buffer_dialogues,
    shop_state_secret: shop_state_secret_dialogues,
    combat_deep_audit: combat_deep_audit_dialogues,
    combat_ghost_process: combat_ghost_process_dialogues,
    term_central_gate: term_central_gate_dialogues,
    term_taxi_taganka: term_taxi_taganka_dialogues,
    job_board_taganka: job_board_taganka_dialogues
  }
};

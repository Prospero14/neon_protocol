import type { WorldDistrict } from '../types';
import { taganka_npcs } from './npcs';
import { taganka_dialogues } from './dialogues';

export const taganka: WorldDistrict = {
  id: 'taganka', 
  node: {
    id: 'taganka', 
    name: 'TAGANKA: BUNKER_CORE', 
    description: 'Глубокие правительственные бункеры. Резиденция Инквизиции и Аудиторов Ядра.', 
    x: 65, y: 55, stability: 50, type: 'combat', tier: 5, combatPack: 'java_advanced',
    subNodes: [
      { id: 'npc_auditor', name: 'Инквизитор (Аудитор Ядра)', type: 'npc', description: 'Проверяет зрелость данных.', x: 50, y: 50 },
      { id: 'npc_informant', name: 'Информатор М.', type: 'npc', description: 'Посредник в тени.', x: 80, y: 80 },
      { id: 'npc_bunker_guard', name: 'Сержант Глухов', type: 'npc', description: 'Охраная Бункера.', x: 10, y: 20 },
      { id: 'bar_cold_buffer', name: 'Бар "Холодный Буфер"', type: 'bar', description: 'Где аудиторы пьют жидкий азот.', x: 20, y: 70 },
      { id: 'shop_state_secret', name: 'ГосТайна', type: 'shop', description: 'Запрещенные модули и ключи.', x: 85, y: 15 },
      { id: 'combat_deep_audit', name: 'Глубокий Аудит', type: 'combat', description: 'Тебя проверяют на всех уровнях.', x: 40, y: 40 },
      { id: 'combat_ghost_process', name: 'Призрачный Процесс', type: 'combat', description: 'Нечто живет в стенах бункера.', x: 60, y: 10 },
      { id: 'term_central_gate', name: 'Центральный Шлюз', type: 'terminal', description: 'Вход в Ядро Октября.', x: 50, y: 95 },
      { id: 'term_taxi_taganka', name: 'Такси: Таганка', type: 'terminal', description: 'Выход на поверхность.', x: 90, y: 50 },
      { id: 'job_board_taganka', name: 'Доска Розыска', type: 'npc', description: 'Охота на ренегатов Системы.', x: 15, y: 5 }
    ]
  },
  npcs: taganka_npcs,
  dialogues: taganka_dialogues
};

import type { WorldDistrict } from '../types';
import { academy_npcs } from './npcs';
import { academy_dialogues } from './dialogues';

export const academy: WorldDistrict = {
  id: 'academy',
  node: {
    id: 'academy',
    name: 'ACADEMY: MAIN_CAMPUS',
    description: 'Учебный центр Silicon Hedge. Здесь начинается путь настоящей Элиты.',
    x: 45, y: 55, stability: 100, type: 'hub', tier: 1,
    subNodes: [
      { id: 'npc_professor_arkhipov', name: 'Профессор Туранов', type: 'npc', description: 'Ваш наставник в мире Java.', x: 50, y: 50 },
      { id: 'npc_academy_tutor', name: 'Тьютор-бот', type: 'npc', description: 'Помощник по боевой практике.', x: 70, y: 30 },
      { id: 'combat_tutorial_dummy', name: 'Тренировочный Манекен', type: 'combat', description: 'Для отработки теории на практике.', x: 30, y: 70 },
      { id: 'term_academy_rules', name: 'Устав Академии', type: 'terminal', description: 'Логи и правила учебного заведения.', x: 20, y: 20 },
    ]
  },
  npcs: academy_npcs,
  dialogues: academy_dialogues
};

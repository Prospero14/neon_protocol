import type { WorldDistrict } from '../types';
import { sokol_npcs } from './npcs';
import { sokol_dialogues } from './dialogues';

export const sokol: WorldDistrict = {
  id: 'sokol', 
  node: {
    id: 'sokol', 
    name: 'SOKOL: TECH_HUB', 
    description: 'Центр авиационных и космических исследований. Место сосредоточения старой технической элиты.', 
    x: 30, y: 15, stability: 90, type: 'combat', tier: 3,
    subNodes: [
      { id: 'npc_dean', name: 'Декан Колледжа', type: 'npc', description: 'Курирует аттестацию системных администраторов и QA-инженеров.', x: 40, y: 40 },
      { id: 'npc_lab_assistant', name: 'Лаборант Илья', type: 'npc', description: 'Помогает с практическими работами.', x: 55, y: 30 },
      { id: 'npc_drone_pilot', name: 'Пилот Дронов', type: 'npc', description: 'Сдает в аренду разведывательные модули.', x: 10, y: 20 },
      { id: 'npc_retired_tester', name: 'Семёныч', type: 'npc', description: 'Знает всё о багах старых авиасистем.', x: 80, y: 55 },
      { id: 'npc_avionics_dev', name: 'Авионик-Разработчик', type: 'npc', description: 'Специалист по встроенным системам.', x: 25, y: 15 },
      { id: 'college_tech', name: 'Колледж Информатики', type: 'shop', description: 'Академический центр EU Syntax.', x: 20, y: 60 },
      { id: 'bar_propeller', name: 'Бар "Пропеллер"', type: 'bar', description: 'Место встречи технарей старой закалки.', x: 45, y: 80 },
      { id: 'term_blueprint', name: 'Архив чертежей', type: 'terminal', description: 'Данные об архитектуре.', x: 70, y: 20 },
      { id: 'combat_drone_swarm', name: 'Рой Дронов', type: 'combat', description: 'Взломанная система защиты атакует всех подряд.', x: 60, y: 70 },
      { id: 'combat_server_overheat', name: 'Перегрев Серверной', type: 'combat', description: 'Бой в условиях критической температуры.', x: 15, y: 45 },
      { id: 'term_taxi_sokol', name: 'Такси: Сокол', type: 'terminal', description: 'Вылет в центр.', x: 85, y: 85 }
    ]
  },
  npcs: sokol_npcs,
  dialogues: sokol_dialogues
};

import type { WorldDistrict, NpcProfile } from '../types';
import type { DialogueTree } from '../../dialogues';

// === NPC Profiles ===
import { npc_dean_profile } from './npcs/npc_dean/profile';
import { npc_retired_tester_profile } from './npcs/npc_retired_tester/profile';
import { npc_lab_assistant_profile } from './npcs/npc_lab_assistant/profile';
import { npc_drone_pilot_profile } from './npcs/npc_drone_pilot/profile';
import { npc_avionics_dev_profile } from './npcs/npc_avionics_dev/profile';

// === NPC Dialogues ===
import { npc_dean_dialogue } from './npcs/npc_dean/dialogues';
import { npc_retired_tester_dialogue } from './npcs/npc_retired_tester/dialogues';
import { npc_lab_assistant_dialogue } from './npcs/npc_lab_assistant/dialogues';
import { npc_drone_pilot_dialogue } from './npcs/npc_drone_pilot/dialogues';
import { npc_avionics_dev_dialogue } from './npcs/npc_avionics_dev/dialogues';

// === Object Dialogues ===
import { college_tech_dialogue } from './objects/college_tech/dialogues';
import { bar_propeller_dialogue } from './objects/bar_propeller/dialogues';
import { term_blueprint_dialogue } from './objects/term_blueprint/dialogues';
import { combat_drone_swarm_dialogue } from './objects/combat_drone_swarm/dialogues';
import { combat_server_overheat_dialogue } from './objects/combat_server_overheat/dialogues';
import { term_taxi_sokol_dialogue } from './objects/term_taxi_sokol/dialogues';

const sokol_npcs: NpcProfile[] = [
  npc_dean_profile,
  npc_retired_tester_profile,
  npc_lab_assistant_profile,
  npc_drone_pilot_profile,
  npc_avionics_dev_profile,
];

const sokol_dialogues: Record<string, DialogueTree> = {
  // NPCs
  npc_dean: npc_dean_dialogue,
  npc_retired_tester: npc_retired_tester_dialogue,
  npc_lab_assistant: npc_lab_assistant_dialogue,
  npc_drone_pilot: npc_drone_pilot_dialogue,
  npc_avionics_dev: npc_avionics_dev_dialogue,
  // Objects
  college_tech: college_tech_dialogue,
  bar_propeller: bar_propeller_dialogue,
  term_blueprint: term_blueprint_dialogue,
  combat_drone_swarm: combat_drone_swarm_dialogue,
  combat_server_overheat: combat_server_overheat_dialogue,
  term_taxi_sokol: term_taxi_sokol_dialogue,
};

export const sokol: WorldDistrict = {
  id: 'sokol',
  node: {
    id: 'sokol',
    name: 'SOKOL: TECH_HUB',
    description: 'Центр авиационных и космических исследований. Место сосредоточения старой технической элиты EU Syntax. Родина Чистого Синтаксиса.',
    x: 30, y: 15, stability: 90, type: 'hub', tier: 3,
    dominantFactionId: 'EU_SYNTAX',
    imageSubstrate: '/assets/maps/sokol_blueprint.png',
    boundary: 'M 40 5 L 90 5 L 95 35 L 85 55 L 75 60 L 80 85 L 70 95 L 35 95 L 25 85 L 15 90 L 5 55 L 15 35 L 10 15 Z',
    features: [
      { type: 'label', path: 'M 15 15' },
      { type: 'label', path: 'M 85 85' },
    ],
    subNodes: [
      { id: 'npc_dean', name: 'Декан Колледжа', type: 'npc', description: 'Курирует аттестацию и сертификацию систем.', x: 40, y: 40 },
      { id: 'npc_retired_tester', name: 'Семёныч', type: 'npc', description: 'Знает всё о багах старых авиасистем.', x: 80, y: 55 },
      { id: 'npc_lab_assistant', name: 'Лаборант Илья', type: 'npc', description: 'Помогает с лабораторными работами.', x: 55, y: 30 },
      { id: 'npc_drone_pilot', name: 'Пилот Дронов', type: 'npc', description: 'Сдает в аренду разведывательные модули и рои.', x: 10, y: 20 },
      { id: 'npc_avionics_dev', name: 'Авионик-Разработчик', type: 'npc', description: 'Специалист по встроенным системам авионики.', x: 25, y: 15 },
      { id: 'college_tech', name: 'Колледж Информатики', type: 'shop', description: 'Академический центр сертификации EU Syntax.', x: 20, y: 60 },
      { id: 'bar_propeller', name: 'Бар "Пропеллер"', type: 'bar', description: 'Место встречи технарей старой закалки.', x: 45, y: 80 },
      { id: 'term_blueprint', name: 'Архив чертежей', type: 'terminal', description: 'Доступ к архитектуре авионики.', x: 70, y: 20 },
      { id: 'combat_drone_swarm', name: 'Рой Дронов', type: 'combat', description: 'Взломанная система защиты атакует всех подряд.', x: 60, y: 70 },
      { id: 'combat_server_overheat', name: 'Перегрев Серверной', type: 'combat', description: 'Бой в условиях критической температуры.', x: 15, y: 45 },
      { id: 'term_taxi_sokol', name: 'Такси: Сокол', type: 'terminal', description: 'Вылет в центр и Академию.', x: 85, y: 85 }
    ]
  },
  npcs: sokol_npcs,
  dialogues: sokol_dialogues
};

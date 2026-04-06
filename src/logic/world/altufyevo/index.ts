import type { WorldDistrict } from '../types';
import type { DialogueTree } from '../../dialogues';
import type { NpcProfile } from '../types';

// === NPC Profiles ===
import { npc_petrovich_profile } from './npcs/npc_petrovich/profile';
import { npc_varvar_profile } from './npcs/npc_varvar/profile';
import { npc_nixanna_profile } from './npcs/npc_nixanna/profile';

// === NPC Dialogues ===
import { npc_petrovich_dialogue } from './npcs/npc_petrovich/dialogues';
import { npc_varvar_dialogue } from './npcs/npc_varvar/dialogues';
import { npc_nixanna_dialogue } from './npcs/npc_nixanna/dialogues';

// === Object Dialogues ===
import { shop_scrap_dialogue } from './objects/shop_scrap/dialogues';
import { bar_chips_dialogue } from './objects/bar_chips/dialogues';
import { job_board_alt_dialogue } from './objects/job_board_alt/dialogues';
import { term_silo_7_dialogue } from './objects/term_silo_7/dialogues';
import { combat_nixanna_ritual_dialogue } from './objects/combat_nixanna_ritual/dialogues';
import { combat_magnus_toilet_dialogue } from './objects/combat_magnus_toilet/dialogues';

// === Assembled NPC list ===
const altufyevo_npcs: NpcProfile[] = [
  npc_petrovich_profile,
  npc_varvar_profile,
  npc_nixanna_profile,
  { id: 'job_board_alt', name: 'Доска Объявлений', districtId: 'altufyevo', role: 'Контракт-хаб', greeting: 'Северные Силосы: Список активных прерываний.', shortLore: 'Быстрые pre-class задачи.', factionId: 'INDEPENDENT' },
  { id: 'shop_scrap', name: 'Серый', districtId: 'altufyevo', role: 'Скупщик', greeting: 'Свалка ошибок и забытых данных.', shortLore: 'Торговец запчастями.', factionId: 'INDEPENDENT' },
];

// === Assembled dialogue map ===
const altufyevo_dialogues: Record<string, DialogueTree> = {
  npc_petrovich: npc_petrovich_dialogue,
  npc_varvar: npc_varvar_dialogue,
  npc_nixanna: npc_nixanna_dialogue,
  shop_scrap: shop_scrap_dialogue,
  bar_chips: bar_chips_dialogue,
  job_board_alt: job_board_alt_dialogue,
  term_silo_7: term_silo_7_dialogue,
  combat_nixanna_ritual: combat_nixanna_ritual_dialogue,
  combat_magnus_toilet: combat_magnus_toilet_dialogue,
};

export const altufyevo: WorldDistrict = {
  id: 'altufyevo',
  node: {
    id: 'altufyevo',
    name: 'ALTUFYEVO: NORTH_SILOS',
    description: 'Северные промышленные силосы. Место сбора старого железа и остатков серверов.',
    x: 52, y: 10, stability: 100, type: 'hub', tier: 1,
    dominantFactionId: 'NULLPOINTERS',
    imageSubstrate: '/assets/maps/altufyevo_blueprint.png',
    boundary: 'M 35 5 L 85 5 L 95 30 L 85 45 L 80 50 L 90 75 L 80 95 L 45 95 L 35 85 L 25 90 L 10 55 L 25 35 L 20 15 Z',
    features: [
      { type: 'label', path: 'M 15 15' },
      { type: 'label', path: 'M 85 85' },
    ],
    subNodes: [
      { id: 'npc_petrovich', name: 'Петрович', type: 'npc', description: 'Старый мастер по железу.', x: 45, y: 20 },
      { id: 'shop_scrap', name: 'Серый', type: 'shop', description: 'Сборник забытых файлов и битого железа. Рынок дешевых карт.', x: 70, y: 75 },
      { id: 'npc_varvar', name: 'ВАРВАР', type: 'npc', description: 'Параноик Силосов. Мастер низкоуровнего кода.', x: 28, y: 48 },
      { id: 'npc_nixanna', name: 'НИКСАННА', type: 'npc', description: 'Геймдизайнер. Видит мир как кривую бету.', x: 32, y: 52 },
      { id: 'combat_nixanna_ritual', name: 'Ритуал', type: 'combat', description: 'Сложный узел рендеринга.', x: 25, y: 55 },
      { id: 'combat_magnus_toilet', name: 'Уборная №4', type: 'combat', description: 'Кот Магнус заперт внутри.', x: 35, y: 45 },
      { id: 'job_board_alt', name: 'Доска объявлений', type: 'npc', description: 'Срочные контракты за Bits.', x: 55, y: 15 },
      { id: 'bar_chips', name: 'Синий Чип', type: 'bar', description: 'Дешевый охлад и восстановление.', x: 25, y: 70 },
      { id: 'combat_rats', name: 'Крысы-кодеры', type: 'combat', description: 'Мелкие вредители в кабельных каналах.', x: 45, y: 85 },
      { id: 'combat_client_proxy', name: 'Удаленный Прокси', type: 'combat', description: 'Слепая зона для выгрузки чужих логов.', x: 20, y: 80 },
      { id: 'term_silo_7', name: 'Силос №7', type: 'terminal', description: 'Инженерная панель глубокого залегания.', x: 88, y: 18 },
      { id: 'term_taxi_alt', name: 'Такси', type: 'terminal', description: 'Разблокировка города.', x: 52, y: 95 },
      { id: 'combat_silo_inner', name: 'Внутренний контур', type: 'combat', description: 'Сердце промышленного массива.', x: 82, y: 12 }
    ]
  },
  npcs: altufyevo_npcs,
  dialogues: altufyevo_dialogues
};

import type { WorldDistrict, NpcProfile } from '../types';
import type { DialogueTree } from '../../dialogues';

// === NPC Profiles ===
import { npc_tanya_profile } from './npcs/npc_tanya/profile';
import { npc_rat_profile } from './npcs/npc_rat/profile';
import { npc_sarge_profile } from './npcs/npc_sarge/profile';

// === NPC Dialogues ===
import { npc_tanya_dialogue } from './npcs/npc_tanya/dialogues';
import { npc_rat_dialogue } from './npcs/npc_rat/dialogues';
import { npc_sarge_dialogue } from './npcs/npc_sarge/dialogues';

// === Object Dialogues ===
import { shop_pharmacy_dialogue } from './objects/shop_pharmacy/dialogues';
import { bar_packet_dialogue } from './objects/bar_packet/dialogues';
import { term_taxi_maryino_dialogue } from './objects/term_taxi_maryino/dialogues';
import { term_404_dialogue } from './objects/term_404/dialogues';
import { combat_local_lan_dialogue } from './objects/combat_local_lan/dialogues';
import { combat_overflow_dialogue } from './objects/combat_overflow/dialogues';
import { combat_grid_patrol_dialogue } from './objects/combat_grid_patrol/dialogues';
import { job_delivery_dialogue } from './objects/job_delivery/dialogues';

const maryino_npcs: NpcProfile[] = [
  npc_tanya_profile,
  npc_rat_profile,
  npc_sarge_profile,
];

const maryino_dialogues: Record<string, DialogueTree> = {
  // NPCs
  npc_tanya: npc_tanya_dialogue,
  npc_rat: npc_rat_dialogue,
  npc_sarge: npc_sarge_dialogue,
  // Objects
  shop_pharmacy: shop_pharmacy_dialogue,
  bar_packet: bar_packet_dialogue,
  term_taxi_maryino: term_taxi_maryino_dialogue,
  term_404: term_404_dialogue,
  combat_local_lan: combat_local_lan_dialogue,
  combat_overflow: combat_overflow_dialogue,
  combat_grid_patrol: combat_grid_patrol_dialogue,
  job_delivery: job_delivery_dialogue,
};

export const maryino: WorldDistrict = {
  id: 'maryino',
  node: {
    id: 'maryino',
    name: 'MARYINO: GRID_EXHAUST',
    description: 'Гигантский жилой массив на юго-востоке. Перенаселенный, но богатый на дешевое железо и теневые дампы.',
    x: 80, y: 85, stability: 100, type: 'trade', tier: 1,
    dominantFactionId: 'REGULATORS',
    imageSubstrate: '/assets/maps/maryino_blueprint.png',
    boundary: 'M 40 5 L 90 5 L 95 35 L 85 55 L 75 60 L 80 85 L 70 95 L 35 95 L 25 85 L 15 90 L 5 55 L 15 35 L 10 15 Z',
    features: [
      { type: 'label', path: 'M 15 15' },
      { type: 'label', path: 'M 85 85' },
    ],
    subNodes: [
      { id: 'npc_tanya', name: 'Trace (Lead QA)', type: 'npc', description: 'Аудитор цепей и архитектор стабильности.', x: 20, y: 30 },
      { id: 'npc_rat', name: 'Крыса-курьер', type: 'npc', description: 'Маленький информатор из вентиляции.', x: 40, y: 15 },
      { id: 'combat_local_lan', name: 'Местная локалка', type: 'combat', description: 'Проверка периметра и стресс-тест.', x: 50, y: 70 },
      { id: 'combat_overflow', name: 'Buffer Overflow Zone', type: 'combat', description: 'Узел с критической ошибкой сегментации.', x: 70, y: 50 },
      { id: 'combat_grid_patrol', name: 'Патруль Сетки', type: 'combat', description: 'Дроны-надзиратели VOSKHOD.', x: 15, y: 85 },
      { id: 'shop_pharmacy', name: 'Дата-аптека', type: 'shop', description: 'Стимуляторы и патчи для оптимизации HP.', x: 85, y: 60 },
      { id: 'bar_packet', name: 'Бар "Пакет"', type: 'bar', description: 'Мутный притон для местных кодеров.', x: 10, y: 45 },
      { id: 'job_delivery', name: 'Доставка данных', type: 'combat', description: 'Опасный прогон пакетов.', x: 80, y: 20 },
      { id: 'npc_sarge', name: 'Сержант (VOSKHOD)', type: 'npc', description: 'Координатор шлюзов. Проверяет субординацию.', x: 5, y: 88 },
      { id: 'term_404', name: 'Терминал #404', type: 'terminal', description: 'Скрытые логи и дампы района.', x: 60, y: 80 },
      { id: 'term_taxi_maryino', name: 'Станция Такси', type: 'terminal', description: 'Выход в город.', x: 50, y: 90 }
    ]
  },
  npcs: maryino_npcs,
  dialogues: maryino_dialogues
};

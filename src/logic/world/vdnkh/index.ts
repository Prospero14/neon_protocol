import type { WorldDistrict, NpcProfile } from '../types';
import type { DialogueTree } from '../../dialogues';

// === NPC Profiles ===
import { npc_besm_profile } from './npcs/npc_besm/profile';
import { npc_guide_vdnkh_profile } from './npcs/npc_guide_vdnkh/profile';
import { npc_tea_master_profile } from './npcs/npc_tea_master/profile';
import { npc_scavenger_profile } from './npcs/npc_scavenger/profile';

// === NPC Dialogues ===
import { npc_besm_dialogue } from './npcs/npc_besm/dialogues';
import { npc_guide_vdnkh_dialogue } from './npcs/npc_guide_vdnkh/dialogues';
import { npc_tea_master_dialogue } from './npcs/npc_tea_master/dialogues';
import { npc_scavenger_dialogue } from './npcs/npc_scavenger/dialogues';

// === Object Dialogues ===
import { shop_vintage_dialogue } from './objects/shop_vintage/dialogues';
import { bar_vostok_dialogue } from './objects/bar_vostok/dialogues';
import { term_archive_data_dialogue } from './objects/term_archive_data/dialogues';
import { term_taxi_vdnkh_dialogue } from './objects/term_taxi_vdnkh/dialogues';
import { combat_pavilions_dialogue } from './objects/combat_pavilions/dialogues';
import { combat_retro_virus_dialogue } from './objects/combat_retro_virus/dialogues';

const vdnkh_npcs: NpcProfile[] = [
  npc_besm_profile,
  npc_guide_vdnkh_profile,
  npc_tea_master_profile,
  npc_scavenger_profile,
];

const vdnkh_dialogues: Record<string, DialogueTree> = {
  // NPCs
  npc_besm: npc_besm_dialogue,
  npc_guide_vdnkh: npc_guide_vdnkh_dialogue,
  npc_tea_master: npc_tea_master_dialogue,
  npc_scavenger: npc_scavenger_dialogue,
  // Objects
  shop_vintage: shop_vintage_dialogue,
  bar_vostok: bar_vostok_dialogue,
  term_archive_data: term_archive_data_dialogue,
  term_taxi_vdnkh: term_taxi_vdnkh_dialogue,
  combat_pavilions: combat_pavilions_dialogue,
  combat_retro_virus: combat_retro_virus_dialogue,
};

export const vdnkh: WorldDistrict = {
  id: 'vdnkh',
  node: {
    id: 'vdnkh',
    name: 'VDNKH: PAVILION_ZERO',
    description: 'Синтетические нейро-напитки и сборище легендарных хакеров в тени заброшенных павильонов. Хранилище Legacy-кода Москвы.',
    x: 52, y: 30, stability: 80, type: 'hub', tier: 3,
    dominantFactionId: 'VOSKHOD',
    imageSubstrate: '/assets/maps/vdnkh_blueprint.png',
    boundary: 'M 40 5 L 90 5 L 95 35 L 85 55 L 75 60 L 80 85 L 70 95 L 35 95 L 25 85 L 15 90 L 5 55 L 15 35 L 10 15 Z',
    features: [
      { type: 'label', path: 'M 15 15' },
      { type: 'label', path: 'M 85 85' },
    ],
    subNodes: [
      { id: 'npc_besm', name: 'Генерал БЭСМ', type: 'npc', description: 'Цифровой призрак прошлого.', x: 10, y: 30 },
      { id: 'npc_guide_vdnkh', name: 'Гид Раиса', type: 'npc', description: 'Рассказывает сказки о золотом веке советского кода.', x: 25, y: 50 },
      { id: 'npc_scavenger', name: 'Стервятник', type: 'npc', description: 'Ищет ценное железо в руинах павильонов.', x: 55, y: 15 },
      { id: 'npc_tea_master', name: 'Мастер Чая (Олег)', type: 'npc', description: 'Успокаивает нервы после тяжелых дампов.', x: 45, y: 10 },
      { id: 'shop_vintage', name: 'Лавка "Ретро-Тех"', type: 'shop', description: 'Редкое Legacy и фундамент реальности.', x: 40, y: 60 },
      { id: 'bar_vostok', name: 'Бар "Восток-1"', type: 'bar', description: 'Напитки для космонавтов данных.', x: 80, y: 20 },
      { id: 'combat_pavilions', name: 'Зачистка Павильонов', type: 'combat', description: 'Бой с системными багами уборщиков.', x: 60, y: 40 },
      { id: 'combat_retro_virus', name: 'Ретро-Вирус 86', type: 'combat', description: 'Древняя зараза, ожившая в старых сетях.', x: 20, y: 75 },
      { id: 'term_archive_data', name: 'Архив ВДНХ', type: 'terminal', description: 'Доступ к историческим логам выставок.', x: 70, y: 80 },
      { id: 'term_taxi_vdnkh', name: 'Такси: ВДНХ', type: 'terminal', description: 'Связь с городом.', x: 90, y: 55 }
    ]
  },
  npcs: vdnkh_npcs,
  dialogues: vdnkh_dialogues
};

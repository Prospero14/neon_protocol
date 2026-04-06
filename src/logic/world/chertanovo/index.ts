import type { WorldDistrict, NpcProfile } from '../types';
import type { DialogueTree } from '../../dialogues';

// === NPC Profiles ===
import { npc_zero_profile } from './npcs/npc_zero/profile';
import { npc_chertanovo_paranoid_profile } from './npcs/npc_chertanovo_paranoid/profile';
import { npc_ripper_jax_profile } from './npcs/npc_ripper_jax/profile';
import { npc_glitch_profile } from './npcs/npc_glitch/profile';
import { npc_scrap_dealer_profile } from './npcs/npc_scrap_dealer/profile';

// === NPC Dialogues ===
import { npc_zero_dialogue } from './npcs/npc_zero/dialogues';
import { npc_chertanovo_paranoid_dialogue } from './npcs/npc_chertanovo_paranoid/dialogues';
import { npc_ripper_jax_dialogue } from './npcs/npc_ripper_jax/dialogues';
import { npc_glitch_dialogue } from './npcs/npc_glitch/dialogues';
import { npc_scrap_dealer_dialogue } from './npcs/npc_scrap_dealer/dialogues';

// === Object Dialogues ===
import { shop_shady_dialogue } from './objects/shop_shady/dialogues';
import { bar_null_pointer_dialogue } from './objects/bar_null_pointer/dialogues';
import { bar_last_call_dialogue } from './objects/bar_last_call/dialogues';
import { term_void_link_dialogue } from './objects/term_void_link/dialogues';
import { combat_anarcho_cell_dialogue } from './objects/combat_anarcho_cell/dialogues';
import { combat_night_scan_dialogue } from './objects/combat_night_scan/dialogues';

const chertanovo_npcs: NpcProfile[] = [
  npc_zero_profile,
  npc_chertanovo_paranoid_profile,
  npc_ripper_jax_profile,
  npc_glitch_profile,
  npc_scrap_dealer_profile,
];

const chertanovo_dialogues: Record<string, DialogueTree> = {
  // NPCs
  npc_zero: npc_zero_dialogue,
  npc_chertanovo_paranoid: npc_chertanovo_paranoid_dialogue,
  npc_ripper_jax: npc_ripper_jax_dialogue,
  npc_glitch: npc_glitch_dialogue,
  npc_scrap_dealer: npc_scrap_dealer_dialogue,
  // Objects
  shop_shady: shop_shady_dialogue,
  bar_null_pointer: bar_null_pointer_dialogue,
  bar_last_call: bar_last_call_dialogue,
  term_void_link: term_void_link_dialogue,
  combat_anarcho_cell: combat_anarcho_cell_dialogue,
  combat_night_scan: combat_night_scan_dialogue,
};

export const chertanovo: WorldDistrict = {
  id: 'chertanovo',
  node: {
    id: 'chertanovo',
    name: 'CHERTANOVO: GLITCH_GHETTO',
    description: 'Мрачная жилая зона. Дом для многих радикальных фрилансеров и адептов Пустоты (Null Pointers).',
    x: 52, y: 80, stability: 40, type: 'hub', tier: 2,
    dominantFactionId: 'NULLPOINTERS',
    imageSubstrate: '/assets/maps/chertanovo_blueprint.png',
    boundary: 'M 40 5 L 90 5 L 95 35 L 85 55 L 75 60 L 80 85 L 70 95 L 35 95 L 25 85 L 15 90 L 5 55 L 15 35 L 10 15 Z',
    features: [
      { type: 'label', path: 'M 15 15' },
      { type: 'label', path: 'M 85 85' },
    ],
    subNodes: [
      { id: 'npc_zero', name: 'Z3R0 (Анархист)', type: 'npc', description: 'Лидер Нулевых Указателей. Мечтает о чистой Пустоте.', x: 50, y: 50 },
      { id: 'npc_chertanovo_paranoid', name: 'Параноик из высотки', type: 'npc', description: 'Боится, что Ядро читает его мысли.', x: 25, y: 15 },
      { id: 'npc_glitch', name: 'Глюк (Сломанный ИИ)', type: 'npc', description: 'Фрагмент старой системы. Говорит ошибками.', x: 10, y: 15 },
      { id: 'npc_scrap_dealer', name: 'Торговец Шламом', type: 'npc', description: 'Скупщик горелых чипов и "грязных" данных.', x: 85, y: 80 },
      { id: 'bar_null_pointer', name: 'Бар "Null Pointer"', type: 'bar', description: 'Где рождаются баги и умирает контроль.', x: 30, y: 70 },
      { id: 'bar_last_call', name: 'Рюмочная "Последний вызов"', type: 'bar', description: 'Самый дешевый охлад в секторе.', x: 60, y: 90 },
      { id: 'npc_ripper_jax', name: 'Риппердок Джакс', type: 'npc', description: 'Устанавливает импланты знаний задорого.', x: 70, y: 20 },
      { id: 'shop_shady', name: 'Лавка Шрама', type: 'shop', description: 'Нелегальные модификаторы стека.', x: 20, y: 40 },
      { id: 'term_void_link', name: 'Линк в Пустоту', type: 'terminal', description: 'Черный терминал. Ведет в темные уголки сети.', x: 50, y: 5 },
      { id: 'combat_anarcho_cell', name: 'Ячейка Анархистов', type: 'combat', description: 'Тренировочный бой с радикалами.', x: 80, y: 45 },
      { id: 'combat_night_scan', name: 'Ночной Скан', type: 'combat', description: 'Обнаружен враждебный процесс-перехватчик.', x: 40, y: 30 }
    ]
  },
  npcs: chertanovo_npcs,
  dialogues: chertanovo_dialogues
};

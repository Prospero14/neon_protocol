import type { WorldDistrict, NpcProfile } from '../types';
import type { DialogueTree } from '../../dialogues';

// === NPC Profiles ===
import { npc_signalman_profile } from './npcs/npc_signalman/profile';
import { npc_old_admin_profile } from './npcs/npc_old_admin/profile';
import { npc_crawler_profile } from './npcs/npc_crawler/profile';
import { npc_bibirevo_coder_profile } from './npcs/npc_bibirevo_coder/profile';
import { npc_jitter_signal_profile } from './npcs/npc_jitter_signal/profile';

// === NPC Dialogues ===
import { npc_signalman_dialogue } from './npcs/npc_signalman/dialogues';
import { npc_old_admin_dialogue } from './npcs/npc_old_admin/dialogues';
import { npc_crawler_dialogue } from './npcs/npc_crawler/dialogues';
import { npc_bibirevo_coder_dialogue } from './npcs/npc_bibirevo_coder/dialogues';
import { npc_jitter_signal_dialogue } from './npcs/npc_jitter_signal/dialogues';

// === Object Dialogues ===
import { shop_north_link_dialogue } from './objects/shop_north_link/dialogues';
import { bar_signal_dialogue } from './objects/bar_signal/dialogues';
import { job_board_bibi_dialogue } from './objects/job_board_bibi/dialogues';
import { term_relay_stats_dialogue } from './objects/term_relay_stats/dialogues';
import { term_taxi_bibi_dialogue } from './objects/term_taxi_bibi/dialogues';
import { combat_link_break_dialogue } from './objects/combat_link_break/dialogues';
import { combat_static_noise_dialogue } from './objects/combat_static_noise/dialogues';

const bibirevo_npcs: NpcProfile[] = [
  npc_signalman_profile,
  npc_old_admin_profile,
  npc_crawler_profile,
  npc_bibirevo_coder_profile,
  npc_jitter_signal_profile,
];

const bibirevo_dialogues: Record<string, DialogueTree> = {
  // NPCs
  npc_signalman: npc_signalman_dialogue,
  npc_old_admin: npc_old_admin_dialogue,
  npc_crawler: npc_crawler_dialogue,
  npc_bibirevo_coder: npc_bibirevo_coder_dialogue,
  npc_jitter_signal: npc_jitter_signal_dialogue,
  // Objects
  shop_north_link: shop_north_link_dialogue,
  bar_signal: bar_signal_dialogue,
  job_board_bibi: job_board_bibi_dialogue,
  term_relay_stats: term_relay_stats_dialogue,
  term_taxi_bibi: term_taxi_bibi_dialogue,
  combat_link_break: combat_link_break_dialogue,
  combat_static_noise: combat_static_noise_dialogue,
};

export const bibirevo: WorldDistrict = {
  id: 'bibirevo',
  node: {
    id: 'bibirevo',
    name: 'BIBIREVO: NORTH_HUB',
    description: 'Магистральный узел связи. Здесь шумят серверы и гудят волноводы. Центр северных подсетей Октября.',
    x: 52, y: 15, stability: 100, type: 'hub', tier: 1,
    dominantFactionId: 'NET_DRIVERS',
    imageSubstrate: '/assets/maps/bibirevo_blueprint.png',
    boundary: 'M 40 5 L 90 5 L 95 35 L 85 55 L 75 60 L 80 85 L 70 95 L 35 95 L 25 85 L 15 90 L 5 55 L 15 35 L 10 15 Z',
    features: [
      { type: 'label', path: 'M 15 15' },
      { type: 'label', path: 'M 85 85' },
    ],
    subNodes: [
      { id: 'npc_signalman', name: 'Связист Моня', type: 'npc', description: 'Старый инженер северных линий.', x: 48, y: 22 },
      { id: 'shop_north_link', name: 'Северный Поток', type: 'shop', description: 'Рынок высокочастотных модулей.', x: 72, y: 78 },
      { id: 'npc_old_admin', name: 'Старый Админ', type: 'npc', description: 'Хранитель старой школы и анархии.', x: 32, y: 45 },
      { id: 'npc_crawler', name: 'Кроулер', type: 'npc', description: 'Исследователь заброшенных подсетей.', x: 25, y: 58 },
      { id: 'npc_bibirevo_coder', name: 'Сонный Кодер', type: 'npc', description: 'Пишет код во сне. Не будите без повода.', x: 62, y: 35 },
      { id: 'npc_jitter_signal', name: 'Джиттер', type: 'npc', description: 'Дерзкий хакер теневых линий.', x: 18, y: 72 },
      { id: 'combat_link_break', name: 'Обрыв связи', type: 'combat', description: 'Сетевая аномалия в подсети.', x: 15, y: 55 },
      { id: 'combat_static_noise', name: 'Белый шум', type: 'combat', description: 'Зона высокой турбулентности.', x: 82, y: 18 },
      { id: 'job_board_bibi', name: 'Инфо-Панель', type: 'npc', description: 'Список активных контрактов.', x: 55, y: 12 },
      { id: 'bar_signal', name: 'Бар "Сигнал"', type: 'bar', description: 'Место для промывки плат и нейронов.', x: 28, y: 82 },
      { id: 'term_relay_stats', name: 'Статистика реле', type: 'terminal', description: 'Диагностика северных магистралей.', x: 88, y: 45 },
      { id: 'term_taxi_bibi', name: 'Такси', type: 'terminal', description: 'Разблокировка города.', x: 52, y: 95 }
    ]
  },
  npcs: bibirevo_npcs,
  dialogues: bibirevo_dialogues
};

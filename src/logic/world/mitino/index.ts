import type { WorldDistrict } from '../types';
import { npc_mentor_profile } from './npcs/npc_mentor/profile';
import { npc_mentor_dialogues } from './npcs/npc_mentor/dialogues';
import { npc_radio_ham_profile } from './npcs/npc_radio_ham/profile';
import { npc_radio_ham_dialogues } from './npcs/npc_radio_ham/dialogues';
import { npc_hardware_modder_profile } from './npcs/npc_hardware_modder/profile';
import { npc_hardware_modder_dialogues } from './npcs/npc_hardware_modder/dialogues';
import { npc_mitino_trader_profile } from './npcs/npc_mitino_trader/profile';
import { npc_mitino_trader_dialogues } from './npcs/npc_mitino_trader/dialogues';
import { npc_slick_shady_profile } from './npcs/npc_slick_shady/profile';
import { npc_slick_shady_dialogues } from './npcs/npc_slick_shady/dialogues';
import { npc_hardware_dealer_profile } from './npcs/npc_hardware_dealer/profile';
import { npc_hardware_dealer_dialogues } from './npcs/npc_hardware_dealer/dialogues';

import { bar_radio_wave_dialogues } from './objects/bar_radio_wave/dialogues';
import { shop_frequency_dialogues } from './objects/shop_frequency/dialogues';
import { combat_freq_jam_dialogues } from './objects/combat_freq_jam/dialogues';
import { combat_modder_clash_dialogues } from './objects/combat_modder_clash/dialogues';
import { term_radio_relay_dialogues } from './objects/term_radio_relay/dialogues';
import { term_taxi_mitino_dialogues } from './objects/term_taxi_mitino/dialogues';

export const mitino: WorldDistrict = {
  id: 'mitino', 
  node: {
    id: 'mitino', 
    name: 'MITINO: RADIO_STORM', 
    description: 'Радио-рынок планетарного масштаба. Центр разгона железа и нелегальных антенн.', 
    x: 10, y: 15, stability: 85, type: 'trade', tier: 5,
    subNodes: [
      { id: 'npc_mentor', name: 'Spring Mentor', type: 'npc', description: 'Учит финальным техникам.', x: 50, y: 50 },
      { id: 'npc_radio_ham', name: 'Дядя Ваня', type: 'npc', description: 'Ловит сигналы из будущего.', x: 20, y: 20 },
      { id: 'npc_hardware_modder', name: 'Флэш', type: 'npc', description: 'Мастер оверклокинга.', x: 80, y: 80 },
      { id: 'npc_mitino_trader', name: 'Барыга Миша', type: 'npc', description: 'Ключи от всего.', x: 10, y: 85 },
      { id: 'npc_hardware_dealer', name: 'Рэйвидж', type: 'npc', description: 'Экстремальное железо.', x: 30, y: 40 },
      { id: 'bar_radio_wave', name: 'Бар "Волна"', type: 'bar', description: 'Здесь всегда фонит.', x: 40, y: 10 },
      { id: 'shop_frequency', name: 'Частота 440', type: 'shop', description: 'Ускорители деки.', x: 70, y: 30 },
      { id: 'combat_freq_jam', name: 'Подавление Частот', type: 'combat', description: 'Бой в белом шуме.', x: 25, y: 60 },
      { id: 'combat_modder_clash', name: 'Стык Разгонщиков', type: 'combat', description: 'Разборка за детали.', x: 85, y: 50 },
      { id: 'term_radio_relay', name: 'Радио-Реле', type: 'terminal', description: 'Доступ к глобальной сетке.', x: 60, y: 90 },
      { id: 'term_taxi_mitino', name: 'Такси: Митино', type: 'terminal', description: 'Выход на МКАД.', x: 95, y: 5 },
      { id: 'npc_slick_shady', name: 'Слик (Скупщик)', type: 'npc', description: 'Теневой Скупщик. Тень среди антенн.', x: 75, y: 45 }
    ]
  },
  npcs: [
    npc_mentor_profile,
    npc_radio_ham_profile,
    npc_hardware_modder_profile,
    npc_mitino_trader_profile,
    npc_slick_shady_profile,
    npc_hardware_dealer_profile
  ],
  dialogues: {
    npc_mentor: npc_mentor_dialogues,
    npc_radio_ham: npc_radio_ham_dialogues,
    npc_hardware_modder: npc_hardware_modder_dialogues,
    npc_mitino_trader: npc_mitino_trader_dialogues,
    npc_slick_shady: npc_slick_shady_dialogues,
    npc_hardware_dealer: npc_hardware_dealer_dialogues,
    bar_radio_wave: bar_radio_wave_dialogues,
    shop_frequency: shop_frequency_dialogues,
    combat_freq_jam: combat_freq_jam_dialogues,
    combat_modder_clash: combat_modder_clash_dialogues,
    term_radio_relay: term_radio_relay_dialogues,
    term_taxi_mitino: term_taxi_mitino_dialogues
  }
};

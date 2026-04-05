import type { WorldDistrict } from '../types';
import { mitino_npcs } from './npcs';
import { mitino_dialogues } from './dialogues';

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
      { id: 'bar_radio_wave', name: 'Бар "Волна"', type: 'bar', description: 'Здесь всегда фонит.', x: 40, y: 10 },
      { id: 'shop_frequency', name: 'Частота 440', type: 'shop', description: 'Ускорители деки.', x: 70, y: 30 },
      { id: 'combat_freq_jam', name: 'Подавление Частот', type: 'combat', description: 'Бой в белом шуме.', x: 25, y: 60 },
      { id: 'combat_modder_clash', name: 'Стык Разгонщиков', type: 'combat', description: 'Разборка за детали.', x: 85, y: 50 },
      { id: 'term_radio_relay', name: 'Радио-Реле', type: 'terminal', description: 'Доступ к глобальной сетке.', x: 60, y: 90 },
      { id: 'term_taxi_mitino', name: 'Такси: Митино', type: 'terminal', description: 'Выход на МКАД.', x: 95, y: 5 },
      { id: 'npc_slick_shady', name: 'Слик (Скупщик)', type: 'npc', description: 'Слик (Теневой Скупщик). Тень среди антенн. Знает, где достать запрещенный софт.', x: 75, y: 45 }
    ]
  },
  npcs: mitino_npcs,
  dialogues: mitino_dialogues
};

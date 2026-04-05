import type { WorldDistrict } from '../types';
import { chertanovo_npcs } from './npcs';
import { chertanovo_dialogues } from './dialogues';

export const chertanovo: WorldDistrict = {
  id: 'chertanovo',
  node: {
    id: 'chertanovo', 
    name: 'CHERTANOVO: GLITCH_GHETTO', 
    description: 'Мрачная жилая зона. Дом для многих радикальных фрилансеров (Null Pointers).', 
    x: 52, y: 80, stability: 40, type: 'bar', tier: 2,
    subNodes: [
      { id: 'npc_zero', name: 'Z3R0 (Анархист)', type: 'npc', description: 'Лидер Нулевых Указателей. Мечтает о чистой Пустоте.', x: 50, y: 50 },
      { id: 'npc_chertanovo_paranoid', name: 'Параноик из высотки', type: 'npc', description: 'Боится, что Ядро читает его мысли через Wi-Fi.', x: 25, y: 15 },
      { id: 'npc_glitch', name: 'Глюк (Сломанный ИИ)', type: 'npc', description: 'Фрагмент старого помощника. Говорит загадками и ошибками.', x: 10, y: 15 },
      { id: 'npc_scrap_dealer', name: 'Торговец Шламом', type: 'npc', description: 'Скупщик горелых чипов и данных.', x: 85, y: 80 },
      { id: 'bar_null_pointer', name: 'Бар "Null Pointer"', type: 'bar', description: 'Где рождаются баги и умирает надежда.', x: 30, y: 70 },
      { id: 'bar_last_call', name: 'Рюмочная "Последний вызов"', type: 'bar', description: 'Самый дешевый и опасный бар в секторе.', x: 60, y: 90 },
      { id: 'npc_ripper_jax', name: 'Риппердок Джакс', type: 'npc', description: 'Устанавливает импланты знаний задорого. Больно, но нужно.', x: 70, y: 20 },
      { id: 'shop_shady', name: 'Лавка Шрама', type: 'shop', description: 'Нелегальные модификаторы стека.', x: 20, y: 40 },
      { id: 'term_void_link', name: 'Линк в Пустоту', type: 'terminal', description: 'Черный терминал. Ведет в самые темные углы сети.', x: 50, y: 5 },
      { id: 'combat_anarcho_cell', name: 'Ячейка Анархистов', type: 'combat', description: 'Тренировочный бой con радикалами.', x: 80, y: 45 },
      { id: 'combat_night_scan', name: 'Ночной Скан', type: 'combat', description: 'Обнаружен враждебный процесс-перехватчик.', x: 40, y: 30 }
    ]
  },
  npcs: chertanovo_npcs,
  dialogues: chertanovo_dialogues
};

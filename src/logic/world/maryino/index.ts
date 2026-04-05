import type { WorldDistrict } from '../types';
import { maryino_npcs } from './npcs';
import { maryino_dialogues } from './dialogues';

export const maryino: WorldDistrict = {
  id: 'maryino', 
  node: {
    id: 'maryino', 
    name: 'MARYINO: GRID_EXHAUST', 
    description: 'Гигантский жилой массив на юго-востоке. Перенаселенный, но богатый на дешевое железо.', 
    x: 80, y: 85, stability: 100, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_tanya', name: 'Trace (Lead QA)', type: 'npc', description: 'Аудитор цепей и архитектор стабильности.', x: 20, y: 30 },
      { id: 'npc_rat', name: 'Крыса-курьер', type: 'npc', description: 'Маленький информатор из вентиляции.', x: 40, y: 15 },
      { id: 'combat_local_lan', name: 'Местная локалка', type: 'combat', description: 'Проверка периметра.', x: 50, y: 70 },
      { id: 'combat_overflow', name: 'Buffer Overflow Zone', type: 'combat', description: 'Узел с критической ошибкой.', x: 70, y: 50 },
      { id: 'combat_grid_patrol', name: 'Патруль Сетки', type: 'combat', description: 'Дроны-надзиратели VOSKHOD.', x: 15, y: 85 },
      { id: 'shop_pharmacy', name: 'Дата-аптека', type: 'shop', description: 'Стимуляторы и патчи для HP.', x: 85, y: 60 },
      { id: 'bar_packet', name: 'Бар "Пакет"', type: 'bar', description: 'Мутный притон для местных.', x: 10, y: 45 },
      { id: 'job_delivery', name: 'Доставка данных', type: 'combat', description: 'Простая работа за 30 Bits.', x: 80, y: 20 },
      { id: 'npc_sarge', name: 'Сержант (VOSKHOD)', type: 'npc', description: 'Координатор уличного патруля. Проверяет ключи доступа.', x: 5, y: 88 },
      { id: 'term_404', name: 'Терминал #404', type: 'terminal', description: 'Скрытые логи района.', x: 60, y: 80 },
      { id: 'term_taxi_maryino', name: 'Станция Такси', type: 'terminal', description: 'Выход в город.', x: 50, y: 90 }
    ]
  },
  npcs: maryino_npcs,
  dialogues: maryino_dialogues
};

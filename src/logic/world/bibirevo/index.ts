import type { WorldDistrict } from '../types';
import { bibirevo_npcs } from './npcs';
import { bibirevo_dialogues } from './dialogues';

export const bibirevo: WorldDistrict = {
  id: 'bibirevo',
  node: {
    id: 'bibirevo',
    name: 'BIBIREVO: NORTH_LINK',
    description: 'Северный жилой массив. Сплетение старых линий связи и новых оптоволоконных жил.',
    x: 45, y: 5, stability: 90, type: 'hub', tier: 1,
    subNodes: [
      { id: 'npc_signalman', name: 'Связист Моня', type: 'npc', description: 'Ремонтирует обрывы нейросети. Постоянно жалуется на пинг.', x: 20, y: 30 },
      { id: 'npc_old_admin', name: 'Старый Админ', type: 'npc', description: 'Помнит времена, когда интернет был по карточкам.', x: 65, y: 15 },
      { id: 'npc_crawler', name: 'Кроулер', type: 'npc', description: 'Исследователь заброшенных подсетей.', x: 10, y: 55 },
      { id: 'npc_bibirevo_coder', name: 'Сонный Кодер', type: 'npc', description: 'Засыпает прямо во время компиляции.', x: 70, y: 10 },
      { id: 'shop_north_link', name: 'Узел: Северный Поток', type: 'shop', description: 'Компоненты связи и высокоскоростные карты.', x: 50, y: 50 },
      { id: 'bar_signal', name: 'Бар "Сигнал"', type: 'bar', description: 'Чистый спирт и никакой задержки.', x: 35, y: 80 },
      { id: 'term_relay_stats', name: 'Статистика Реле', type: 'terminal', description: 'Данные о пакетах, потерянных в секторе.', x: 15, y: 10 },
      { id: 'job_board_bibi', name: 'Инфо-панель: Бибирево', type: 'npc', description: 'Мелкие подработки по восстановлению линков.', x: 40, y: 70 },
      { id: 'combat_link_break', name: 'Обрыв Связи', type: 'combat', description: 'Процесс-паразит пожирает пакеты данных.', x: 85, y: 40 },
      { id: 'combat_static_noise', name: 'Статический Шум', type: 'combat', description: 'Бой в условиях сильных помех.', x: 55, y: 30 },
      { id: 'term_taxi_bibi', name: 'Такси: Бибирево', type: 'terminal', description: 'Вылет в центр.', x: 80, y: 85 },
      { id: 'npc_jitter_signal', name: 'Джиттер (Связист)', type: 'npc', description: 'Джиттер (Дерзкий Связист). Молодой и наглый. Хочет перехватить старые линии Мони.', x: 65, y: 35 }
    ]
  },
  npcs: bibirevo_npcs,
  dialogues: bibirevo_dialogues
};

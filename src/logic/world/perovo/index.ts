import type { WorldDistrict } from '../types';
import { perovo_npcs } from './npcs';
import { perovo_dialogues } from './dialogues';

export const perovo: WorldDistrict = {
  id: 'perovo',
  node: {
    id: 'perovo',
    name: 'PEROVO: DATA_SLUMS',
    description: 'Зона серых узлов и заводских корпусов. Здесь Киберкоммисы агитируют за равенство, а Net Drivers хранят историю Москвы в пыльных архивах.',
    x: 85, y: 45, stability: 92, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_marina', name: 'Марина (Архивариус)', type: 'npc', description: 'Хранительница забытых логов и данных.', x: 25, y: 40 },
      { id: 'npc_basement_coder', name: 'Подвальный кодер', type: 'npc', description: 'Знает обходные пути и Bits. Предлагает софт.', x: 15, y: 20 },
      { id: 'npc_resident_perovo', name: 'Местный житель', type: 'npc', description: 'Раздраженный, жалуется на шум серверов.', x: 55, y: 10 },
      { id: 'shop_logic_gate', name: 'Лавка "Логика"', type: 'shop', description: 'Бюджетные модули и расширения.', x: 80, y: 30 },
      { id: 'bar_basement', name: 'Бар "Подвал"', type: 'bar', description: 'Захудалый бар, где подают канифоль.', x: 10, y: 65 },
      { id: 'combat_data_mining', name: 'Процесс-майнер', type: 'combat', description: 'Вредоносный процесс, перегревающий архивы.', x: 65, y: 60 },
      { id: 'combat_rat_invasion', name: 'Крысиный набег', type: 'combat', description: 'Стая системных грызунов.', x: 45, y: 80 },
      { id: 'perovo_shluze_4', name: 'Шлюз №4: Конвой', type: 'combat', description: 'Охраняемый транспортный узел Gigabank.', x: 35, y: 55 },
      { id: 'job_board_perovo', name: 'Доска фриланса Перово', type: 'npc', description: 'Мелкие задачи для стажеров.', x: 50, y: 20 },
      { id: 'npc_commissar_byte', name: 'Комиссар Байт', type: 'npc', description: 'Агитатор Киберкоммисов. Ратует за равенство.', x: 75, y: 70 },
      { id: 'npc_foreman', name: 'Бригадир-Мастер', type: 'npc', description: 'Следит за планом и заводским оборудованием.', x: 60, y: 35 },
      { id: 'npc_zina', name: 'Зина (Бармен)', type: 'npc', description: 'Хозяйка бара "Подвал". Знает всё о районе.', x: 0, y: 65 },
      { id: 'engine_perovo', name: 'Заводская турбина', type: 'terminal', description: 'Главный силовой узел района. Постоянно гудит.', x: 90, y: 15 },
      { id: 'term_sub_net', name: 'Подсеть Перово', type: 'terminal', description: 'Доступ к локальным данным.', x: 30, y: 90 },
      { id: 'term_taxi_perovo', name: 'Такси: Перово', type: 'terminal', description: 'Вылет в город.', x: 85, y: 85 }
    ]
  },
  npcs: perovo_npcs,
  dialogues: perovo_dialogues
};

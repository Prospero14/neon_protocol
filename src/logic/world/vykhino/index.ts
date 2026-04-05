import type { WorldDistrict } from '../types';
import { vykhino_npcs } from './npcs';
import { vykhino_dialogues } from './dialogues';

export const vykhino: WorldDistrict = {
  id: 'vykhino',
  node: {
    id: 'vykhino', 
    name: 'VYKHINO: TRADE_BRANCH', 
    description: 'Торговый хаб с бешеным трафиком. Центр незаконного обмена данными.', 
    x: 75, y: 70, stability: 85, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_grey', name: 'Грей (Гоп-хакер)', type: 'npc', description: 'Знает все лазейки метро.', x: 40, y: 50 },
      { id: 'npc_vykhino_loader', name: 'Грузчик данных', type: 'npc', description: 'Таскает тяжелые архивы между шлюзами.', x: 25, y: 15 },
      { id: 'npc_link_manager', name: 'Менеджер Каналов', type: 'npc', description: 'Бюрократичный бот следит за трафиком.', x: 15, y: 20 },
      { id: 'npc_corp_scout', name: 'Скаут GIGA_BANK', type: 'npc', description: 'Ищет таланты для корпоративного рабства.', x: 60, y: 60 },
      { id: 'shop_metro', name: 'Радио-палатка', type: 'shop', description: 'Боевой софт.', x: 40, y: 30 },
      { id: 'shop_black_market', name: 'Черный Импорт', type: 'shop', description: 'Редкие карты по завышенным ценам.', x: 80, y: 20 },
      { id: 'npc_job_boss', name: 'Фиксер "Батя"', type: 'npc', description: 'Дает грязную работу за битсы.', x: 60, y: 20 },
      { id: 'term_exchange', name: 'Ликвид-Терминал', type: 'terminal', description: 'Обмен Bits на репутацию и обратно.', x: 20, y: 80 },
      { id: 'bar_transit', name: 'Рюмочная "Транзит"', type: 'bar', description: 'Место встречи проезжих хакеров.', x: 10, y: 40 },
      { id: 'combat_cargo', name: 'Перехват Груза', type: 'combat', description: 'Контейнер с данными остался без охраны.', x: 70, y: 45 },
      { id: 'term_taxi_unlock', name: 'Инфо-киоск Такси', type: 'terminal', description: 'Разблокировка города.', x: 80, y: 80 }
    ]
  },
  npcs: vykhino_npcs,
  dialogues: vykhino_dialogues
};

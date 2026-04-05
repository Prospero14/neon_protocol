import type { WorldDistrict } from '../types';
import { tekstilschiki_npcs } from './npcs';
import { tekstilschiki_dialogues } from './dialogues';

export const tekstilschiki: WorldDistrict = {
  id: 'tekstilschiki',
  node: {
    id: 'tekstilschiki',
    name: 'TEKSTILSCHIKI: TEXTILE_GRID',
    description: 'Старая промзона. Здесь "ткали" первые нейросети для госструктур.',
    x: 75, y: 60, stability: 85, type: 'combat', tier: 1,
    subNodes: [
      { id: 'npc_vlad', name: 'Влад-Ткач', type: 'npc', description: 'Мастер защитных плетений. Создает лучшие файрволы.', x: 20, y: 20 },
      { id: 'npc_weaver_senior', name: 'Старший Ткач', type: 'npc', description: 'Хранитель древних паттернов плетения.', x: 45, y: 10 },
      { id: 'npc_safety_auditor', name: 'Аудитор Безопасности', type: 'npc', description: 'Инспектирует код на наличие уязвимостей.', x: 80, y: 15 },
      { id: 'shop_armor_weave', name: 'Лавка Бронеплетения', type: 'shop', description: 'Защитные скрипты и карты-щиты.', x: 60, y: 40 },
      { id: 'bar_oil_can', name: 'Кабак "Масленка"', type: 'bar', description: 'Где инженеры смазывают шестеренки.', x: 10, y: 45 },
      { id: 'combat_textile_raid', name: 'Рейд на Промзону', type: 'combat', description: 'Зачистка от взбесившихся ткацких ботов.', x: 70, y: 55 },
      { id: 'combat_factory_bot', name: 'Заводской Бот: ТК-44', type: 'combat', description: 'Тяжелый дрон-охранник на пути.', x: 85, y: 80 },
      { id: 'job_board_tekstil', name: 'Узел: Текстильщики', type: 'npc', description: 'Контракты на зачистку и охрану.', x: 50, y: 70 },
      { id: 'term_loom_control', name: 'Узел Управления Станком', type: 'terminal', description: 'Доступ к производственным логам.', x: 30, y: 90 },
      { id: 'term_taxi_tekstil', name: 'Такси: Текстильщики', type: 'terminal', description: 'Выход на МКАД.', x: 80, y: 30 }
    ]
  },
  npcs: tekstilschiki_npcs,
  dialogues: tekstilschiki_dialogues
};

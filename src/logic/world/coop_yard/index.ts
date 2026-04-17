import type { WorldDistrict } from '../types';
import { coop_trader_gear_dialogue } from './objects/coop_trader_gear/dialogues';
import { coop_trader_ops_dialogue } from './objects/coop_trader_ops/dialogues';

/** Тренировочный двор коопа: боевые точки по сложности и два торговца. */
export const coop_yard: WorldDistrict = {
  id: 'coop_yard',
  node: {
    id: 'coop_yard',
    name: 'CO-OP: SPRINT_YARD',
    description:
      'Изолированный полигон для парного запуска: узлы с разной нагрузкой и снабжение без выхода в город.',
    x: 28,
    y: 72,
    stability: 100,
    type: 'combat',
    tier: 4,
    combatPack: 'java_core',
    subNodes: [
      {
        id: 'coop_cp_light',
        name: 'Точка «Разогрев»',
        type: 'combat',
        description: 'Лёгкий контур — два шага, для входа в ритм.',
        x: 22,
        y: 28
      },
      {
        id: 'coop_cp_medium',
        name: 'Узел «Середняк»',
        type: 'combat',
        description: 'Стандартная цепочка разведки и отбора данных.',
        x: 78,
        y: 32
      },
      {
        id: 'coop_cp_heavy',
        name: 'Сектор «Нагрузка»',
        type: 'combat',
        description: 'Длиннее цепочка, больше точек отказа.',
        x: 24,
        y: 72
      },
      {
        id: 'coop_cp_elite',
        name: 'Ядро «Дедлайн»',
        type: 'combat',
        description: 'Полный цикл под давлением — только когда готовы.',
        x: 76,
        y: 76
      },
      {
        id: 'coop_cp_boss',
        name: 'Ворота релиза (BOSS)',
        type: 'combat',
        description:
          'Junior: после 15 миссий полигона. Остальные тиры: после 25. Тогда открывается переход на следующий ранг.',
        x: 50,
        y: 50
      },
      {
        id: 'coop_trader_gear',
        name: 'Снабжение «Жёлтый ящик»',
        type: 'shop',
        description: 'Базовые скрипты и расходники для первых заходов.',
        x: 48,
        y: 18
      },
      {
        id: 'coop_trader_ops',
        name: 'Оператор «Спринт»',
        type: 'shop',
        description: 'Инфраструктура и «длинные» утилиты для связки вдвоём.',
        x: 52,
        y: 88
      }
    ]
  },
  npcs: [],
  dialogues: {
    coop_trader_gear: coop_trader_gear_dialogue,
    coop_trader_ops: coop_trader_ops_dialogue
  }
};

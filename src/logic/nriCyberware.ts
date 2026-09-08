/**
 * Конструктор киберимплантов Carbon 2185 — части, сборка, ограничения (Blood Tox, питание, слоты).
 */

import { abilityModifier } from './nriNpcGenerator';
import type { CyberEffectId } from './nriCyberEffects';

export type CyberSlot =
  | 'arm'
  | 'leg'
  | 'head'
  | 'torso'
  | 'internal'
  | 'neural'
  | 'external'
  | 'sensor'
  | 'cosmetic';

export type CyberPartKind =
  | 'chassis'
  | 'cpu'
  | 'memory'
  | 'power'
  | 'interface'
  | 'actuator'
  | 'sensor'
  | 'firmware'
  | 'weapon'
  | 'armor'
  | 'cosmetic';

export type CyberPartDef = {
  id: string;
  name: string;
  /** Коротко: что делает деталь простым языком. */
  blurb: string;
  kind: CyberPartKind;
  slots: CyberSlot[];
  c2185Mods: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>>;
  bloodTox: number;
  cpuMhz: number;
  ramGb: number;
  powerWh: number;
  powerDrawW: number;
  features: string[];
  /** Типизированные способности (УФ-зрение, смартлинк и т.д.). */
  effects?: CyberEffectId[];
  costBase: number;
};

export type CyberBlueprint = {
  slot: CyberSlot;
  name: string;
  partIds: string[];
  notes?: string;
  /** @deprecated только для старых сохранений */
  tuning?: {
    cpuMhz: number;
    ramGb: number;
    powerWh: number;
    powerDrawW: number;
  };
};

export type AssemblyTotals = {
  cpuMhz: number;
  ramGb: number;
  powerWh: number;
  powerDrawW: number;
};

export type PartPowerLine = {
  partId: string;
  partName: string;
  powerWh: number;
  powerDrawW: number;
  cpuMhz: number;
  ramGb: number;
};

export type CyberBuildResult = {
  name: string;
  slot: CyberSlot;
  c2185Mods: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>>;
  bloodTox: number;
  cpuMhz: number;
  ramGb: number;
  powerWh: number;
  powerDrawW: number;
  features: string[];
  effects: CyberEffectId[];
  priceWonlongs: number;
  overload: boolean;
  blocked: boolean;
  canSave: boolean;
  warnings: string[];
  totals: AssemblyTotals;
  partLines: PartPowerLine[];
};

export const C2185_ABILITY_LABELS: Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', string> = {
  STR: 'СИЛ',
  DEX: 'ЛОВ',
  CON: 'ВЫН',
  INT: 'ИНТ',
  TEC: 'ТЕХ',
  PEO: 'ХАР',
};

export const CYBER_SLOT_LABELS: Record<CyberSlot, string> = {
  arm: 'Рука / кисть',
  leg: 'Нога',
  head: 'Голова',
  torso: 'Торс',
  internal: 'Внутренние',
  neural: 'Нейро / нейролинк',
  external: 'Внешние',
  sensor: 'Сенсоры',
  cosmetic: 'Косметика',
};

export const CYBER_KIND_LABELS: Record<CyberPartKind, string> = {
  chassis: 'Корпус / рама',
  cpu: 'Процессор',
  memory: 'Память',
  power: 'Питание',
  interface: 'Интерфейс',
  actuator: 'Приводы',
  sensor: 'Сенсоры',
  firmware: 'Прошивка',
  weapon: 'Оружие',
  armor: 'Броня',
  cosmetic: 'Косметика',
};

export const ASSEMBLY_LABELS: Record<keyof AssemblyTotals, string> = {
  cpuMhz: 'CPU (сумма модулей), МГц',
  ramGb: 'RAM (сумма модулей), ГБ',
  powerWh: 'Батарея (сумма ячеек), Вт·ч',
  powerDrawW: 'Расход (сумма всех модулей), Вт',
};

/** @deprecated используйте ASSEMBLY_LABELS */
export const TUNING_LABELS = ASSEMBLY_LABELS;

/** Лимит Blood Tox на листе: 10 + мод ВЫН (Carbon 2185, Augmentations). */
export function bloodToxLimitFromCon(conScore: number): number {
  return Math.max(4, 10 + abilityModifier(conScore));
}

/** Правила и ограничения для UI мастера. */
export const CYBER_RULES_SUMMARY: { title: string; lines: string[] }[] = [
  {
    title: 'Blood Tox (токсичность крови)',
    lines: [
      'На листе: Blood Tox Limit = 10 + мод ВЫН. Current — сумма всех установленных имплантов.',
      'Превышение лимита → риск киберпсихоза, ghosting, штрафы к спасброскам Mind (решение мастера).',
      'Косметика обычно даёт 0 BT; боевые и нейро-модули — 1–4+ за компонент.',
      'Один имплант с BT > 8 — крайне рискованно даже при высокой ВЫН.',
    ],
  },
  {
    title: 'Слоты тела',
    lines: [
      'Каждая сборка занимает один анатомический слот: одна рука, одна нога, один нейролинк и т.д.',
      'Нельзя установить два нейролинка или две «головы» с полноценным CPU — только одна сборка на слот.',
      'Косметика накладывается отдельно и не заменяет функциональный имплант в том же регионе (мастер может уточнить).',
    ],
  },
  {
    title: 'Сборка импланта',
    lines: [
      'Одна сборка в конструкторе = один имплант в одном слоте тела (рука, нога, нейролинк…).',
      'Корпус + приводы + ячейка + LED на руке — это одна сборка «рука», не четыре отдельных импланта.',
      'Максимум 8 компонентов; 1 корпус, 1 CPU, 2 ячейки, 2 прошивки, до 2 оружейных модулей.',
      'Косметику можно вшить в боевую сборку, если деталь подходит к слоту (до 4 косм. вставок).',
    ],
  },
  {
    title: 'Питание',
    lines: [
      'Батарея (Вт·ч) = сумма ёмкостей всех блоков питания в сборке.',
      'Расход (Вт) = сумма расхода всех модулей (корпус, CPU, LED, оружие…).',
      'Если расход > ёмкости — перегруз: черновик сохранить можно, установить нельзя.',
      'Высокий CPU (≥5 ГГц) и RAM (≥16 ГБ) дают +1 BT и риск ghosting.',
    ],
  },
  {
    title: 'Сюжетные эффекты (hooks)',
    lines: [
      'Кроме статов детали дают effects: сцена «подделка голоса», «размытие лица», «пинг рынка» и т.д.',
      'Мастер использует их как разрешение сцены / намёк — не как автопобеду.',
      'Минусы (рекламный drip, маяк долга, утечка wetware) — тоже hooks: корп и коллекторы цепляются.',
      'На листе активны установленные импланты + экип с тегом cyber:<effect>.',
    ],
  },
  {
    title: 'Бой: смартлинк и контры',
    lines: [
      'Смартлинк: ровно +1 к атаке встроенным/smart-оружием (не стакается с двумя прошивками).',
      'Глушилка смартлинка на цели обнуляет этот +1. Optic flare: +1 AC vs дальний linked-выстрел.',
      'Маскировка оружия: +2 к скрытому ношению; сканер маскировки у обыскивающего снимает бонус.',
      'Сюжетные пары: voice↔auth, face/badge↔biometric, scent↔flare, lie↔pulse-shield, wire↔scrub, thermal↔baffle, UV↔cloak, RF↔faraday.',
    ],
  },
];

const BUILD_LIMITS = {
  maxParts: 8,
  maxCosmeticParts: 4,
  maxBloodToxPerImplant: 10,
  maxBloodToxCosmetic: 2,
  maxPowerCells: 2,
  maxFirmware: 2,
  maxWeapons: 2,
  exclusiveKinds: ['chassis', 'cpu', 'armor'] as CyberPartKind[],
};

export const CYBER_PARTS: CyberPartDef[] = [
  {
    id: 'chassis_limb_std',
    name: 'Корпус конечности (стандарт)',
    blurb: 'Базовая рама протеза руки или ноги: каркас, крепления, разъёмы под приводы и питание.',
    kind: 'chassis',
    slots: ['arm', 'leg'],
    c2185Mods: { CON: 1 },
    bloodTox: 2,
    cpuMhz: 200,
    ramGb: 0.5,
    powerWh: 8,
    powerDrawW: 2,
    features: [],
    costBase: 800,
  },
  {
    id: 'chassis_limb_heavy',
    name: 'Усиленный корпус конечности',
    blurb: 'Тяжёлая бронированная рама — прочнее, но тяжелее и неповоротливее.',
    kind: 'chassis',
    slots: ['arm', 'leg'],
    c2185Mods: { CON: 2, DEX: -1 },
    bloodTox: 3,
    cpuMhz: 150,
    ramGb: 0.5,
    powerWh: 12,
    powerDrawW: 3,
    features: ['Поглощение 1 дробящего (конечность)'],
    costBase: 1200,
  },
  {
    id: 'actuator_myomer',
    name: 'Миомерные приводы',
    blurb: 'Искусственные мышцы — усиливают удар и подъём, больше жрут энергию.',
    kind: 'actuator',
    slots: ['arm', 'leg'],
    c2185Mods: { STR: 1 },
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 4,
    features: ['+1 к проверкам СИЛ (конечность)'],
    costBase: 600,
  },
  {
    id: 'actuator_precision',
    name: 'Сервоприводы точной кисти',
    blurb: 'Тонкая моторика пальцев — для взлома, медицины, стрельбы.',
    kind: 'actuator',
    slots: ['arm'],
    c2185Mods: { DEX: 2 },
    bloodTox: 1,
    cpuMhz: 100,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Ловкость рук +2'],
    costBase: 900,
  },
  {
    id: 'actuator_bulk_grip',
    name: 'Промышленный захват',
    blurb: 'Грубая сила хвата — мощно, но пальцы как в перчатках: мелочь не возьмёшь.',
    kind: 'actuator',
    slots: ['arm'],
    c2185Mods: { STR: 2, DEX: -4 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 5,
    features: ['Нет тонкой моторики'],
    costBase: 500,
  },
  {
    id: 'cpu_cortex_2',
    name: 'Кортекс CPU 2 ГГц',
    blurb: 'Нейропроцессор средней мощности — для сенсоров и простого взлома.',
    kind: 'cpu',
    slots: ['neural', 'head', 'torso', 'internal'],
    c2185Mods: { INT: 1 },
    bloodTox: 2,
    cpuMhz: 2000,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 8,
    features: [],
    costBase: 1500,
  },
  {
    id: 'cpu_cortex_5',
    name: 'Кортекс CPU 5 ГГц',
    blurb: 'Топовый чип для нетрана — быстрый ICE, но сильно нагружает кровь и риск ghosting.',
    kind: 'cpu',
    slots: ['neural', 'head', 'internal'],
    c2185Mods: { INT: 2, TEC: 1 },
    bloodTox: 4,
    cpuMhz: 5000,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 18,
    features: ['Риск ghosting +1'],
    costBase: 4000,
  },
  {
    id: 'mem_syn_4',
    name: 'Синаптическая RAM 4 ГБ',
    blurb: 'Буфер для скриптов и многозадачности в сети.',
    kind: 'memory',
    slots: ['neural', 'head', 'internal'],
    c2185Mods: { INT: 1 },
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 4,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Вычисления / взлом +1'],
    costBase: 800,
  },
  {
    id: 'mem_syn_16',
    name: 'Синаптическая RAM 16 ГБ',
    blurb: 'Много потоков ICE и демонов одновременно — для серьёзного хакерства.',
    kind: 'memory',
    slots: ['neural', 'internal'],
    c2185Mods: { INT: 2, TEC: 1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 16,
    powerWh: 0,
    powerDrawW: 8,
    features: ['Параллельный ICE +1'],
    costBase: 2200,
  },
  {
    id: 'power_cell_s',
    name: 'Микроячейка (1)',
    blurb: 'Компактная батарея — почти незаметна, хватает на лёгкие модули.',
    kind: 'power',
    slots: ['arm', 'leg', 'head', 'torso', 'internal', 'external', 'cosmetic', 'neural'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 18,
    powerDrawW: 0,
    features: [],
    costBase: 350,
  },
  {
    id: 'power_cell_m',
    name: 'Стандартная ячейка (2)',
    blurb: 'Средний блок питания — заметный бугор под кожей или на корпусе.',
    kind: 'power',
    slots: ['arm', 'leg', 'head', 'torso', 'internal', 'external'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 38,
    powerDrawW: 0,
    features: ['Имплант заметен со стороны'],
    costBase: 550,
  },
  {
    id: 'power_cell_l',
    name: 'Усиленный силовой блок (3)',
    blurb: 'Тяжёлая ячейка — сильно видно даже под одеждой, зато долго держит нагрузку.',
    kind: 'power',
    slots: ['torso', 'internal', 'external', 'head'],
    c2185Mods: { CON: 1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 68,
    powerDrawW: 0,
    features: ['Сильно видно — не спрятать'],
    costBase: 900,
  },
  {
    id: 'power_cell_xl',
    name: 'Тяжёлый генератор (4)',
    blurb: 'Массивный силовой кокон на черепе или торсе — питает всё, выглядит почти как шлем.',
    kind: 'power',
    slots: ['head', 'external', 'torso', 'internal'],
    c2185Mods: { CON: 1, DEX: -1 },
    bloodTox: 3,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 115,
    powerDrawW: 0,
    features: ['Почти как шлем — массивный блок', 'Заметность максимальная'],
    costBase: 1600,
  },
  {
    id: 'iface_neural_bus',
    name: 'Нейроинтерфейсная шина',
    blurb: 'Прямое подключение мозга к сети — основа нейролинка и взлома.',
    kind: 'interface',
    slots: ['neural', 'head'],
    c2185Mods: { TEC: 2 },
    bloodTox: 3,
    cpuMhz: 500,
    ramGb: 1,
    powerWh: 0,
    powerDrawW: 6,
    features: ['Прямой доступ в сеть', 'Взлом +2'],
    effects: ['net_deep_scan'],
    costBase: 3500,
  },
  {
    id: 'iface_mesh_radio',
    name: 'Mesh-радиомодуль',
    blurb: 'Защищённая связь с командой без проводов.',
    kind: 'interface',
    slots: ['head', 'external', 'neural'],
    c2185Mods: { PEO: 1 },
    bloodTox: 1,
    cpuMhz: 200,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 4,
    features: ['Связь с группой', 'Присутствие +1'],
    costBase: 600,
  },
  {
    id: 'sensor_optics',
    name: 'Кибероптика',
    blurb: 'Замена глаз — зум, ночное зрение, запись.',
    kind: 'sensor',
    slots: ['head', 'sensor'],
    c2185Mods: { INT: 1 },
    bloodTox: 2,
    cpuMhz: 300,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Ночное зрение', 'Восприятие +2'],
    effects: ['vision_night'],
    costBase: 1100,
  },
  {
    id: 'chassis_eye',
    name: 'Глазной chassis',
    blurb: 'Корпус киберглаза с разъёмами под оптику и сенсоры.',
    kind: 'chassis',
    slots: ['head', 'sensor'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 100,
    ramGb: 0.25,
    powerWh: 4,
    powerDrawW: 1,
    features: ['База для оптики'],
    costBase: 400,
  },
  {
    id: 'sensor_uv',
    name: 'УФ-сканер',
    blurb: 'Ультрафиолетовый модуль — видит скрытые метки на бумаге и валюте.',
    kind: 'sensor',
    slots: ['head', 'sensor', 'external'],
    c2185Mods: { INT: 1 },
    bloodTox: 1,
    cpuMhz: 200,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 4,
    features: ['УФ-зрение', 'Метки на ₩'],
    effects: ['vision_uv', 'currency_uv'],
    costBase: 750,
  },
  {
    id: 'sensor_thermal',
    name: 'Тепловизор',
    blurb: 'ИК-матрица — тепловые контуры людей и техники сквозь дым.',
    kind: 'sensor',
    slots: ['head', 'sensor', 'external'],
    c2185Mods: { PEO: 1 },
    bloodTox: 2,
    cpuMhz: 350,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 5,
    features: ['Тепловизор', 'Восприятие +1'],
    effects: ['vision_thermal'],
    costBase: 1400,
  },
  {
    id: 'sensor_rf',
    name: 'RF-детектор',
    blurb: 'Ловит радиомаяки, жучки и mesh-трафик на близкой дистанции.',
    kind: 'sensor',
    slots: ['head', 'sensor', 'external', 'internal'],
    c2185Mods: { TEC: 1 },
    bloodTox: 1,
    cpuMhz: 150,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Поиск слежки', 'Investigation +2'],
    effects: ['surveillance_detect'],
    costBase: 650,
  },
  {
    id: 'sensor_audio',
    name: 'Аудиоусилитель',
    blurb: 'Слуховые импланты — фильтр шума, подслушивание на расстоянии.',
    kind: 'sensor',
    slots: ['head', 'sensor'],
    c2185Mods: { INT: 1 },
    bloodTox: 1,
    cpuMhz: 100,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Подслушивание +2'],
    costBase: 700,
  },
  {
    id: 'fw_reflex',
    name: 'Прошивка рефлексов',
    blurb: 'Ускоряет реакцию нервной системы — инициатива и уклонение.',
    kind: 'firmware',
    slots: ['neural', 'internal'],
    c2185Mods: { DEX: 1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 5,
    features: ['Инициатива +2', 'Спасбросок Ловкости +1'],
    costBase: 1800,
  },
  {
    id: 'fw_skillchip',
    name: 'Слот скилл-чипа',
    blurb: 'Разъём под обучающий чип — один навык без тренировок.',
    kind: 'firmware',
    slots: ['neural', 'head'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 2,
    powerWh: 0,
    powerDrawW: 2,
    features: ['1 обученный навык 1 ранга'],
    costBase: 1000,
  },
  {
    id: 'fw_smartlink',
    name: 'Прошивка смартлинка',
    blurb: 'Связывает зрение и оружие — прицеливание по нейроинтерфейсу.',
    kind: 'firmware',
    slots: ['neural', 'head', 'arm'],
    c2185Mods: { DEX: 1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 3,
    features: ['+1 к атаке умным оружием'],
    effects: ['weapon_smartlink'],
    costBase: 1200,
  },
  {
    id: 'fw_conceal_weapon',
    name: 'Маскировка оружия',
    blurb: 'Скрывает сигнатуру встроенного оружия от сканеров и обычного осмотра.',
    kind: 'firmware',
    slots: ['arm', 'leg', 'torso', 'internal'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 2,
    features: ['+2 к скрытому ношению'],
    effects: ['weapon_conceal'],
    costBase: 800,
  },
  {
    id: 'armor_subdermal',
    name: 'Подкожная броня',
    blurb: 'Пластины под кожей — лучше держит удар, чуть мешает двигаться.',
    kind: 'armor',
    slots: ['torso', 'internal'],
    c2185Mods: { CON: 1, DEX: -1 },
    bloodTox: 3,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 0,
    features: ['КБ +1', 'Поглощение 1 рубящего'],
    costBase: 2000,
  },
  {
    id: 'w_arm_blade',
    name: 'Втягиваемое клинок-лезвие',
    blurb: 'Спрятанное лезвие в предплечье — всегда под рукой.',
    kind: 'weapon',
    slots: ['arm'],
    c2185Mods: {},
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 3,
    features: ['1d8 рубящего (ближний бой)'],
    effects: ['weapon_conceal'],
    costBase: 1500,
  },
  {
    id: 'w_arm_pistol',
    name: 'Встроенный пистолет',
    blurb: 'Короткий ствол в предплечьи, 1 магазин.',
    kind: 'weapon',
    slots: ['arm'],
    c2185Mods: {},
    bloodTox: 3,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['2d6 баллистика', 'Шум +'],
    effects: ['weapon_smartlink'],
    costBase: 2200,
  },
  {
    id: 'w_arm_needle',
    name: 'Шприц-инъектор',
    blurb: 'Скрытый мед/яд в кисти — для доков и убийц.',
    kind: 'weapon',
    slots: ['arm'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['1d4 + яд', 'Medicine +1'],
    costBase: 900,
  },
  {
    id: 'w_leg_spur',
    name: 'Шпора / коготь ноги',
    blurb: 'Удар ногой с клинком — незаметно до выпадения.',
    kind: 'weapon',
    slots: ['leg'],
    c2185Mods: {},
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['1d6 рубящего'],
    costBase: 1100,
  },
  {
    id: 'w_leg_rifle',
    name: 'Складная нога-пушка',
    blurb: 'Ствол в бедре, тяжёлый калибр.',
    kind: 'weapon',
    slots: ['leg'],
    c2185Mods: { DEX: -1 },
    bloodTox: 4,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 4,
    features: ['2d8 баллистика', 'Скрыто +2'],
    costBase: 3500,
  },
  {
    id: 'w_head_ocular',
    name: 'Окулярный лазер',
    blurb: 'Луч из киберглаза — точный, но нагревает систему.',
    kind: 'weapon',
    slots: ['head', 'sensor'],
    c2185Mods: {},
    bloodTox: 3,
    cpuMhz: 200,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 6,
    features: ['2d6 энергетический', 'Perception +1'],
    costBase: 2800,
  },
  {
    id: 'w_torso_smg',
    name: 'Торсальный SMG-порт',
    blurb: 'Оружие в грудной клетке, выдвижной порт.',
    kind: 'weapon',
    slots: ['torso', 'internal'],
    c2185Mods: {},
    bloodTox: 4,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 3,
    features: ['2d6 автоматический'],
    costBase: 4000,
  },
  {
    id: 'w_neural_shock',
    name: 'Нейрошокер',
    blurb: 'Импульс через нейролинк — ближний цифровой удар.',
    kind: 'weapon',
    slots: ['neural', 'head'],
    c2185Mods: { TEC: 1 },
    bloodTox: 3,
    cpuMhz: 300,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 8,
    features: ['1d8 + Mind save', 'Ghosting +1'],
    costBase: 2600,
  },
  {
    id: 'w_ext_grenade',
    name: 'Гранатомёт (плечевой)',
    blurb: 'Внешний модуль — 1 граната, перезарядка вручную.',
    kind: 'weapon',
    slots: ['external', 'torso', 'arm'],
    c2185Mods: {},
    bloodTox: 3,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['3d6 взрыв', '1 выстрел / бой'],
    costBase: 3200,
  },
  {
    id: 'cosm_led_skin',
    name: 'LED-подсветка кожи',
    blurb: 'Светящиеся узоры под кожей — чистый стиль, без боевых бонусов.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'external', 'head', 'arm'],
    c2185Mods: {},
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['Световые узоры', 'Реакция на звук'],
    costBase: 200,
  },
  {
    id: 'cosm_chrome_nails',
    name: 'Хромированные ногти',
    blurb: 'Декоративная отделка кисти.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'arm'],
    c2185Mods: {},
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 0,
    features: ['Стиль +', 'Мелкий урон 1 (шутка)'],
    costBase: 80,
  },
  {
    id: 'cosm_holo_tattoo',
    name: 'Голо-тату проектор',
    blurb: 'Меняющиеся голограммы на коже.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'external', 'torso', 'arm'],
    c2185Mods: {},
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Сменные голограммы на коже'],
    costBase: 350,
  },
  {
    id: 'cosm_synth_hair',
    name: 'Синт-волосы (неон)',
    blurb: 'Светящиеся пряди, смена цвета по настроению.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'head'],
    c2185Mods: {},
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['Светящиеся пряди', 'Смена цвета'],
    costBase: 150,
  },
  {
    id: 'cosm_face_plate',
    name: 'Декоративная лицевая пластина',
    blurb: 'Хромированная маска — пугает и впечатляет.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'head'],
    c2185Mods: { PEO: 1 },
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['Запугивание +1 (внешний вид)'],
    costBase: 500,
  },
  {
    id: 'cosm_eye_glow',
    name: 'Светящиеся линзы',
    blurb: 'Неон в глазах — эффектно, BT 0.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'head', 'sensor'],
    c2185Mods: {},
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['Свечение глаз', 'Ночной стиль'],
    costBase: 120,
  },
  {
    id: 'cosm_audio_skin',
    name: 'Аудиореактивная кожа',
    blurb: 'Кожа пульсирует в такт музыке и шуму улицы.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'external'],
    c2185Mods: {},
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Пульсация под музыку'],
    costBase: 280,
  },
  {
    id: 'cosm_corp_logo',
    name: 'Корпоративный брендинг',
    blurb: 'Логотип корп на коже — узнаваемость в деловых кругах.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'external', 'torso'],
    c2185Mods: { PEO: 1 },
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 0,
    features: ['Узнаваемость корп', 'Соц. бонусы в сети корп'],
    costBase: 400,
  },
  // --- Расширение: сюжетные / соц / нет-крючки (те же kinds и лимиты сборки) ---
  {
    id: 'power_cell_neural',
    name: 'Нейроячейка (микро)',
    blurb: 'Тонкая батарея под нейропорт — кормит линк без горба на спине.',
    kind: 'power',
    slots: ['neural', 'head', 'internal'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 28,
    powerDrawW: 0,
    features: ['Питание нейролинка', 'Почти незаметна'],
    costBase: 480,
  },
  {
    id: 'fw_voice_mask',
    name: 'Прошивка голосовой маски',
    blurb: 'Синтез чужого тембра — сюжетный обман по рации и голосовым замкам.',
    kind: 'firmware',
    slots: ['neural', 'head'],
    c2185Mods: { PEO: 1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Сцена: выдать себя за другого по голосу', 'Сбой при глубоком биоскане'],
    effects: ['voice_synth_fake'],
    costBase: 1400,
  },
  {
    id: 'fw_face_blur',
    name: 'Прошивка размытия лица',
    blurb: 'Ломает дешёвые камеры и ID-киоски — «кто это был?»',
    kind: 'firmware',
    slots: ['neural', 'head'],
    c2185Mods: {},
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 4,
    features: ['Камеры улицы не сходятся с базой', 'Корп-СБ видит артефакт маски'],
    effects: ['face_scrambler'],
    costBase: 1600,
  },
  {
    id: 'sensor_scent_scrub',
    name: 'Скруббер запаха',
    blurb: 'Глушит биозапах — собаки и нюх-дроны теряют след.',
    kind: 'sensor',
    slots: ['head', 'external', 'torso'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 50,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Сцена погони: сорвать след', 'После боя эффект слабеет'],
    effects: ['scent_mask'],
    costBase: 900,
  },
  {
    id: 'fw_pain_gate',
    name: 'Гейт боли',
    blurb: 'Режет болевые сигналы — допрос пыткой сам по себе не ломает.',
    kind: 'firmware',
    slots: ['neural', 'internal'],
    c2185Mods: { CON: 1 },
    bloodTox: 3,
    cpuMhz: 0,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 4,
    features: ['Сцена допроса: нужен другой рычаг', 'Риск не заметить смертельную рану'],
    effects: ['pain_editor'],
    costBase: 2100,
  },
  {
    id: 'mem_trauma_cache',
    name: 'Травма-кэш (wipe)',
    blurb: 'Буфер на ~30 секунд памяти — можно сжечь свой фрагмент сцены.',
    kind: 'memory',
    slots: ['neural', 'internal', 'head'],
    c2185Mods: { INT: -1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 2,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Раз за сцену: стереть короткий кусок памяти', 'Дыры в алиби — палка о двух концах'],
    effects: ['memory_wipe_local'],
    costBase: 1800,
  },
  {
    id: 'iface_corp_badge',
    name: 'Эмулятор корп-бейджа',
    blurb: 'Низкий гостевой пропуск — турникеты «белый воротничок».',
    kind: 'interface',
    slots: ['external', 'arm', 'head'],
    c2185Mods: { PEO: 1 },
    bloodTox: 1,
    cpuMhz: 100,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Сцена: пройти КПП уровня guest/clerk', 'Не тянет на executive'],
    effects: ['corp_badge_spoof'],
    costBase: 1100,
  },
  {
    id: 'fw_lie_pulse',
    name: 'Прошивка пульса лжи',
    blurb: 'Касание показывает стресс-паттерн собеседника — намёк мастера, не оракул.',
    kind: 'firmware',
    slots: ['neural', 'arm'],
    c2185Mods: { PEO: 1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Рукопожатие → намёк «врёт / блокирует»', 'Имплант-контрмеры врага глушат'],
    effects: ['lie_pulse'],
    costBase: 1500,
  },
  {
    id: 'sensor_corpse_id',
    name: 'Форензик-ридер ID',
    blurb: 'Считывает чип с тела или изъятого порта — долги, роль, метки фракций.',
    kind: 'sensor',
    slots: ['head', 'sensor', 'arm'],
    c2185Mods: { INT: 1 },
    bloodTox: 1,
    cpuMhz: 200,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Сцена расследования у трупа', 'Шифрованные корп-чипы — отдельный ICE'],
    effects: ['corpse_id_scan'],
    costBase: 1200,
  },
  {
    id: 'iface_ghost_hand',
    name: 'Ghost-handshake модуль',
    blurb: 'Анонимный пакет в mesh без логина — передача улик / паролей.',
    kind: 'interface',
    slots: ['neural', 'head', 'external'],
    c2185Mods: { TEC: 1 },
    bloodTox: 2,
    cpuMhz: 300,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 5,
    features: ['Сцена: скинуть пакет без аккаунта', 'ISP корп может оставить тень'],
    effects: ['ghost_handshake'],
    costBase: 2000,
  },
  {
    id: 'fw_black_market',
    name: 'Прошивка серого индекса',
    blurb: 'Подсвечивает, где в районе «можно купить Х» — намёк мастера.',
    kind: 'firmware',
    slots: ['neural', 'head'],
    c2185Mods: { TEC: 1 },
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 1,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Сцена бара/рынка: открыть серый лоток', 'Ложные наводки в чужих районах'],
    effects: ['black_market_ping'],
    costBase: 950,
  },
  {
    id: 'actuator_silent_step',
    name: 'Демпферы шага',
    blurb: 'Глушат стук протеза — крыши и коридоры тише.',
    kind: 'actuator',
    slots: ['leg'],
    c2185Mods: { DEX: 1 },
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Сцена стелса по полу/железу', 'Не отменяет камеры'],
    effects: ['silent_step'],
    costBase: 700,
  },
  {
    id: 'sensor_crowd_read',
    name: 'Сенсор настроения толпы',
    blurb: 'Считывает агрессию/страх в толпе — мастер даёт тон сцены до броска.',
    kind: 'sensor',
    slots: ['head', 'sensor', 'external'],
    c2185Mods: { PEO: 2 },
    bloodTox: 1,
    cpuMhz: 150,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Тон толпы до действия', 'В пустом месте бесполезен'],
    effects: ['crowd_read'],
    costBase: 1300,
  },
  {
    id: 'iface_polyglot',
    name: 'Полиглот-чип',
    blurb: 'Уличный и корп-жаргон, базовый перевод сцен.',
    kind: 'interface',
    slots: ['neural', 'head'],
    c2185Mods: { INT: 1, PEO: 1 },
    bloodTox: 1,
    cpuMhz: 100,
    ramGb: 1,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Сцена переговоров без полного языка', 'Поэзия и намёки — мимо'],
    effects: ['polyglot_chip'],
    costBase: 1000,
  },
  {
    id: 'w_arm_recorder',
    name: 'Скрытый диктофон-провод',
    blurb: 'Пишет разговор как улику — шантаж или сдача фракции.',
    kind: 'weapon',
    slots: ['arm'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 1,
    features: ['Улика на запись', 'Если найдут — компромат на тебя'],
    effects: ['evidence_wire', 'weapon_conceal'],
    costBase: 850,
  },
  {
    id: 'fw_trauma_buffer',
    name: 'Буфер кибертравмы',
    blurb: 'Откладывает срыв/панику на одну сцену — счёт всё равно придёт.',
    kind: 'firmware',
    slots: ['neural', 'internal'],
    c2185Mods: { CON: 1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 3,
    features: ['1× за сессию: отложить киберпсихоз', 'Потом штраф сильнее — решение мастера'],
    effects: ['trauma_buffer'],
    costBase: 1700,
  },
  {
    id: 'cpu_low_profile',
    name: 'Кортекс «серый» 1.2 ГГц',
    blurb: 'Слабый CPU с низким профилем в сети — меньше внимания ICE.',
    kind: 'cpu',
    slots: ['neural', 'head', 'internal'],
    c2185Mods: { TEC: 1 },
    bloodTox: 1,
    cpuMhz: 1200,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 4,
    features: ['Сюжет: «серый» трафик', 'Для тяжёлого ICE слабоват'],
    effects: ['ghost_handshake'],
    costBase: 900,
  },
  {
    id: 'chassis_limb_street',
    name: 'Уличный корпус (латка)',
    blurb: 'Сборный протез с барахолки — дёшево, следы ремонта, соц. метка «свой».',
    kind: 'chassis',
    slots: ['arm', 'leg'],
    c2185Mods: { CON: 1, PEO: 1 },
    bloodTox: 2,
    cpuMhz: 80,
    ramGb: 0.25,
    powerWh: 6,
    powerDrawW: 2,
    features: ['В трущобах «свой»', 'В корп-лобби — метка бедности', 'Легко чинить у риппердока'],
    effects: ['black_market_ping'],
    costBase: 450,
  },
  {
    id: 'cosm_fashion_sig',
    name: 'Модный сигнал-узор',
    blurb: 'Живой узор под кожей — пропуск в тусовки и яд в трущобах.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'external', 'arm', 'torso'],
    c2185Mods: { PEO: 1 },
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['Клубная очередь мимо', 'В трущобах — «понт»'],
    effects: ['fashion_signal'],
    costBase: 320,
  },
  {
    id: 'cosm_ad_skin',
    name: 'Рекламный дерма-контракт',
    blurb: 'Дёшевая кожа с корп-рекламой — бесплатно ставят, но HUD орёт баннерами.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'external', 'torso'],
    c2185Mods: {},
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['Цена установки 0 ₩ у корп-клиник', 'Минус: срыв стелса/фокуса — решение мастера'],
    effects: ['ad_drip', 'debt_beacon'],
    costBase: 0,
  },
  {
    id: 'armor_cheap_plate',
    name: 'Дешёвые подкожные пластины',
    blurb: 'Броня с барахолки — держит удар, течёт микростружка.',
    kind: 'armor',
    slots: ['torso', 'internal'],
    c2185Mods: { CON: 1, DEX: -1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 0,
    features: ['КБ +1 (улица)', 'Минус: био-след для форензики'],
    effects: ['wetware_leak'],
    costBase: 900,
  },
  {
    id: 'actuator_clinic_hand',
    name: 'Клиническая кисть',
    blurb: 'Мед-протез: уколы, швы, аккуратный захват — сцена полевой медицины.',
    kind: 'actuator',
    slots: ['arm'],
    c2185Mods: { DEX: 1 },
    bloodTox: 1,
    cpuMhz: 50,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Medicine / полевой шов +2 (сюжет)', 'Плохо для грубой силы'],
    costBase: 800,
  },
  {
    id: 'w_leg_grapple',
    name: 'Крюк-трос в голени',
    blurb: 'Выстрел тросом — сцена вертикали, побег по фасаду.',
    kind: 'weapon',
    slots: ['leg'],
    c2185Mods: {},
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Сцена: зацепиться / сорваться', '1d4 при срыве троса (мастер)'],
    effects: ['silent_step'],
    costBase: 1400,
  },
  // --- Контры смартлинка / сенсоров / сюжетных hooks (броня и внешние модули) ---
  {
    id: 'armor_reactive_weave',
    name: 'Реактивная бронеткань',
    blurb: 'Ткань с микробликами — сбивает смартлинк-прицел и чуть поднимает AC vs linked-выстрелов.',
    kind: 'armor',
    slots: ['torso', 'external'],
    c2185Mods: { DEX: -1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['КБ +1', 'Глушит смартлинк по тебе', '+1 AC vs linked дальних'],
    effects: ['smartlink_jam', 'optic_flare'],
    costBase: 2800,
  },
  {
    id: 'armor_faraday_liner',
    name: 'Faraday-подкладка',
    blurb: 'Сетка в куртке/жилете — глушит RF и mesh рядом с телом.',
    kind: 'armor',
    slots: ['torso', 'external'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['КБ +0', 'Тихий mesh / анти-детект'],
    effects: ['mesh_faraday'],
    costBase: 1100,
  },
  {
    id: 'armor_thermal_cloak',
    name: 'Тепловой плащ-экран',
    blurb: 'Слои, размывающие ИК-силуэт — против тепловизора.',
    kind: 'armor',
    slots: ['torso', 'external'],
    c2185Mods: { DEX: -1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 2,
    features: ['КБ +1', 'Контр тепловизору'],
    effects: ['thermal_baffle'],
    costBase: 1900,
  },
  {
    id: 'fw_smartlink_jammer',
    name: 'Прошивка глушилки прицела',
    blurb: 'Локальный jam смартлинка — вшивается в броню/нейро/торс.',
    kind: 'firmware',
    slots: ['torso', 'neural', 'external', 'head'],
    c2185Mods: {},
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 4,
    features: ['Снимает +1 смартлинка у атакующих по тебе'],
    effects: ['smartlink_jam'],
    costBase: 1600,
  },
  {
    id: 'sensor_optic_flare',
    name: 'Модуль оптического flare',
    blurb: 'Вспышка/блик против кибер-оптики и linked-прицела.',
    kind: 'sensor',
    slots: ['head', 'external', 'sensor'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 100,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 3,
    features: ['+1 AC vs дальний смартлинк'],
    effects: ['optic_flare'],
    costBase: 900,
  },
  {
    id: 'fw_biometric_lock',
    name: 'Biometric-lock пакет',
    blurb: 'Жёсткая проверка лица/бейджа — ломает scrambler и spoof рядом.',
    kind: 'firmware',
    slots: ['head', 'neural', 'external'],
    c2185Mods: { INT: 1 },
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0.5,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Контр face-scrambler / badge-spoof'],
    effects: ['biometric_lock'],
    costBase: 1400,
  },
  {
    id: 'sensor_scent_flare',
    name: 'Химмаркер (scent-flare)',
    blurb: 'Пшикает маркер — scent-mask больше не держит след.',
    kind: 'sensor',
    slots: ['external', 'arm', 'head'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 1,
    features: ['Срывает глушение запаха'],
    effects: ['scent_flare'],
    costBase: 550,
  },
  {
    id: 'fw_pulse_shield',
    name: 'Pulse-shield',
    blurb: 'Шумовая оболочка на биосигналы — lie-pulse читает мусор.',
    kind: 'firmware',
    slots: ['neural', 'internal', 'arm'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Контр пульсу лжи'],
    effects: ['pulse_shield'],
    costBase: 800,
  },
  {
    id: 'iface_voice_auth',
    name: 'Voice-auth модуль',
    blurb: 'Криптоподпись голоса — подделка тембра не проходит твой канал/замок.',
    kind: 'interface',
    slots: ['head', 'neural', 'external'],
    c2185Mods: { TEC: 1 },
    bloodTox: 1,
    cpuMhz: 150,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Контр подделке голоса'],
    effects: ['voice_auth'],
    costBase: 1200,
  },
  {
    id: 'fw_evidence_scrub',
    name: 'Evidence-scrub',
    blurb: 'Глушилка диктофонов в радиусе стола/разговора.',
    kind: 'firmware',
    slots: ['external', 'torso', 'head'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 3,
    features: ['Контр evidence-wire'],
    effects: ['evidence_scrub'],
    costBase: 1000,
  },
  {
    id: 'sensor_conceal_scan',
    name: 'Сканер маскировки оружия',
    blurb: 'При обыске игнорирует бонус weapon_conceal у цели.',
    kind: 'sensor',
    slots: ['head', 'sensor', 'arm'],
    c2185Mods: { INT: 1 },
    bloodTox: 1,
    cpuMhz: 100,
    ramGb: 0.25,
    powerWh: 0,
    powerDrawW: 2,
    features: ['Perception vs скрытое оружие без −2 штрафа цели'],
    effects: ['conceal_scan'],
    costBase: 750,
  },
  {
    id: 'cosm_uv_paint',
    name: 'УФ-глушащая краска',
    blurb: 'Покрытие меток — обычный УФ-глаз тебя не читает.',
    kind: 'cosmetic',
    slots: ['cosmetic', 'external', 'torso', 'arm'],
    c2185Mods: {},
    bloodTox: 0,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 0,
    powerDrawW: 0,
    features: ['Контр УФ-зрению на тебе'],
    effects: ['uv_cloak'],
    costBase: 200,
  },
];

export function getCyberPart(id: string): CyberPartDef | undefined {
  return CYBER_PARTS.find((p) => p.id === id);
}

/** Подписи к цифрам компонента для списка в конструкторе. */
export function formatCyberPartMeta(p: CyberPartDef): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: 'Токс. крови', value: String(p.bloodTox) },
  ];
  for (const k of ['STR', 'DEX', 'CON', 'INT', 'TEC', 'PEO'] as const) {
    const v = p.c2185Mods[k];
    if (v) rows.push({ label: C2185_ABILITY_LABELS[k], value: `${v >= 0 ? '+' : ''}${v}` });
  }
  if (p.powerDrawW > 0) rows.push({ label: 'Расход', value: `${p.powerDrawW} Вт` });
  if (p.powerWh > 0) rows.push({ label: 'Батарея', value: `+${p.powerWh} Вт·ч` });
  if (p.cpuMhz > 0) rows.push({ label: 'CPU', value: `${p.cpuMhz} МГц` });
  if (p.ramGb > 0) rows.push({ label: 'RAM', value: `${p.ramGb} ГБ` });
  rows.push({ label: 'Цена', value: `${p.costBase} ₩` });
  return rows;
}

export function partsForSlot(slot: CyberSlot): CyberPartDef[] {
  return CYBER_PARTS.filter((p) => p.slots.includes(slot));
}

export function partsGroupedForSlot(slot: CyberSlot): { kind: CyberPartKind; label: string; parts: CyberPartDef[] }[] {
  const parts = partsForSlot(slot);
  const kinds = [...new Set(parts.map((p) => p.kind))];
  const order: CyberPartKind[] = [
    'chassis',
    'actuator',
    'cpu',
    'memory',
    'power',
    'interface',
    'sensor',
    'firmware',
    'armor',
    'weapon',
    'cosmetic',
  ];
  return order
    .filter((k) => kinds.includes(k))
    .map((kind) => ({
      kind,
      label: CYBER_KIND_LABELS[kind],
      parts: parts.filter((p) => p.kind === kind),
    }));
}

export const CYBER_BLUEPRINT_PRESETS: CyberBlueprint[] = [
  {
    slot: 'arm',
    name: 'Протез руки (базовый)',
    partIds: ['chassis_limb_std', 'actuator_bulk_grip', 'power_cell_s'],
    notes: 'ВЫН +1, СИЛ +2, ЛОВ −4 — грубая хватка.',
  },
  {
    slot: 'arm',
    name: 'Рука + неон',
    partIds: ['chassis_limb_heavy', 'actuator_myomer', 'power_cell_s', 'cosm_led_skin'],
    notes: 'Корпус + миомеры + ячейка + LED — одна сборка в слот «рука».',
  },
  {
    slot: 'neural',
    name: 'Нейролинк (нетраннер)',
    partIds: ['iface_neural_bus', 'cpu_cortex_2', 'mem_syn_4', 'fw_reflex', 'power_cell_neural'],
    notes: 'ИНТ/ТЕХ, взлом — нейроячейка вместо L (L не для neural).',
  },
  {
    slot: 'head',
    name: 'УФ-оптика',
    partIds: ['chassis_eye', 'sensor_uv', 'power_cell_s'],
    notes: 'Глаз + УФ-сканер + батарея — видны УФ-метки на валюте и документах.',
  },
  {
    slot: 'head',
    name: 'Тепловизионная оптика',
    partIds: ['sensor_optics', 'sensor_thermal', 'power_cell_s'],
    notes: 'Киберглаз + ИК — тепловые следы и засады.',
  },
  {
    slot: 'head',
    name: 'Смартлинк-глаз',
    partIds: ['sensor_optics', 'fw_smartlink', 'power_cell_s'],
    notes: 'Оптика + смартлинк — точная стрельба встроенным оружием.',
  },
  {
    slot: 'head',
    name: 'Контрразведка (аудио+RF)',
    partIds: ['sensor_audio', 'sensor_rf', 'power_cell_s'],
    notes: 'Слух + RF — жучки и скрытая слежка.',
  },
  {
    slot: 'arm',
    name: 'Скрытое лезвие',
    partIds: ['chassis_limb_std', 'w_arm_blade', 'fw_conceal_weapon', 'power_cell_s'],
    notes: 'Протез + клинок + маскировка — незаметно до выпадения.',
  },
  {
    slot: 'arm',
    name: 'Смарт-пистолет',
    partIds: ['chassis_limb_std', 'w_arm_pistol', 'fw_smartlink', 'power_cell_s'],
    notes: 'Встроенный пистолет со смартлинком.',
  },
  {
    slot: 'head',
    name: 'Кибероптика + аудио',
    partIds: ['sensor_optics', 'sensor_audio', 'iface_mesh_radio', 'power_cell_s'],
    notes: 'Восприятие и расследование.',
  },
  {
    slot: 'torso',
    name: 'Подкожная броня + питание',
    partIds: ['armor_subdermal', 'power_cell_l'],
    notes: 'КБ/поглощение, ВЫН.',
  },
  {
    slot: 'cosmetic',
    name: 'Неон-комплект',
    partIds: ['cosm_led_skin', 'cosm_synth_hair', 'cosm_eye_glow', 'power_cell_s'],
    notes: 'Косметика + микроячейка (без батареи был overload).',
  },
  {
    slot: 'neural',
    name: 'Личина (голос+лицо)',
    partIds: ['fw_voice_mask', 'fw_face_blur', 'power_cell_neural'],
    notes: 'Сюжетный обман: рация и камеры. 2 прошивки — лимит.',
  },
  {
    slot: 'arm',
    name: 'Дипломат-кисть',
    partIds: ['chassis_limb_std', 'actuator_clinic_hand', 'fw_lie_pulse', 'power_cell_s'],
    notes: 'Переговоры + пульс лжи касанием.',
  },
  {
    slot: 'arm',
    name: 'Шантажист (запись)',
    partIds: ['chassis_limb_street', 'w_arm_recorder', 'fw_conceal_weapon', 'power_cell_s'],
    notes: 'Скрытая запись + уличный корпус — сцена компромата.',
  },
  {
    slot: 'leg',
    name: 'Крышный бегун',
    partIds: ['chassis_limb_street', 'actuator_silent_step', 'w_leg_grapple', 'power_cell_s'],
    notes: 'Тихий шаг + крюк — вертикальный побег.',
  },
  {
    slot: 'head',
    name: 'Инфильтратор КПП',
    partIds: ['iface_corp_badge', 'sensor_scent_scrub', 'fw_face_blur', 'power_cell_s'],
    notes: 'Бейдж guest + размытие + запах — сцена проникновения.',
  },
  {
    slot: 'head',
    name: 'Следователь улиц',
    partIds: ['sensor_corpse_id', 'sensor_crowd_read', 'power_cell_s'],
    notes: 'ID с тела + тон толпы — расследование.',
  },
  {
    slot: 'neural',
    name: 'Серый курьер',
    partIds: ['cpu_low_profile', 'iface_ghost_hand', 'fw_black_market', 'power_cell_neural'],
    notes: 'Анонимный пакет + пинг рынка.',
  },
  {
    slot: 'neural',
    name: 'Железная воля',
    partIds: ['fw_pain_gate', 'fw_trauma_buffer', 'mem_trauma_cache', 'power_cell_neural'],
    notes: 'Допрос/срыв: боль, буфер, wipe — чистый сюжетный стек.',
  },
  {
    slot: 'torso',
    name: 'Барахолка-танк',
    partIds: ['armor_cheap_plate', 'sensor_scent_scrub', 'power_cell_m'],
    notes: 'Дешёвая броня + скруббер; минус wetware_leak.',
  },
  {
    slot: 'cosmetic',
    name: 'Тусовка / контракт',
    partIds: ['cosm_fashion_sig', 'cosm_ad_skin', 'power_cell_s'],
    notes: 'Модный сигнал + рекламный контракт (минусы ad_drip/debt).',
  },
  {
    slot: 'head',
    name: 'Переводчик улиц',
    partIds: ['iface_polyglot', 'iface_mesh_radio', 'power_cell_s'],
    notes: 'Полиглот + mesh — переговоры в чужом районе.',
  },
  {
    slot: 'torso',
    name: 'Анти-смартлинк жилет',
    partIds: ['armor_reactive_weave', 'power_cell_m'],
    notes: 'smartlink_jam + optic_flare — контр пистолету+глазу.',
  },
  {
    slot: 'torso',
    name: 'Тихий жилет (Faraday)',
    partIds: ['armor_faraday_liner', 'fw_evidence_scrub', 'power_cell_s'],
    notes: 'Анти-RF и глушение диктофонов.',
  },
  {
    slot: 'torso',
    name: 'ИК-плащ',
    partIds: ['armor_thermal_cloak', 'power_cell_s'],
    notes: 'thermal_baffle против тепловизора.',
  },
  {
    slot: 'head',
    name: 'КПП-страж',
    partIds: ['fw_biometric_lock', 'sensor_conceal_scan', 'power_cell_s'],
    notes: 'Ломает face-scrambler/spoof и маскировку оружия.',
  },
  {
    slot: 'external',
    name: 'Охотник на личину',
    partIds: ['sensor_optic_flare', 'sensor_scent_flare', 'iface_voice_auth', 'power_cell_s'],
    notes: 'Flare + scent + voice-auth — пакет контр разведке.',
  },
  {
    slot: 'neural',
    name: 'Глушилка + щит пульса',
    partIds: ['fw_smartlink_jammer', 'fw_pulse_shield', 'power_cell_neural'],
    notes: 'Личный jam смартлинка и защита от lie-pulse.',
  },
  {
    slot: 'cosmetic',
    name: 'УФ-глушение',
    partIds: ['cosm_uv_paint', 'power_cell_s'],
    notes: 'uv_cloak — метки на тебе не читает обычный УФ-глаз.',
  },
];

function sumMods(
  acc: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>>,
  add: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>>
) {
  for (const k of ['STR', 'DEX', 'CON', 'INT', 'TEC', 'PEO'] as const) {
    const v = add[k];
    if (v) acc[k] = (acc[k] ?? 0) + v;
  }
}

function tuningMods(totals: AssemblyTotals): Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>> {
  const out: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>> = {};
  if (totals.cpuMhz >= 4000) {
    out.INT = (out.INT ?? 0) + 1;
    out.TEC = (out.TEC ?? 0) + 1;
  } else if (totals.cpuMhz >= 2500) {
    out.INT = (out.INT ?? 0) + 1;
  }
  if (totals.ramGb >= 12) out.TEC = (out.TEC ?? 0) + 1;
  if (totals.ramGb >= 8) out.INT = (out.INT ?? 0) + 1;
  return out;
}

function partBaseTuning(parts: CyberPartDef[]): AssemblyTotals {
  return parts.reduce(
    (acc, p) => ({
      cpuMhz: acc.cpuMhz + p.cpuMhz,
      ramGb: acc.ramGb + p.ramGb,
      powerWh: acc.powerWh + p.powerWh,
      powerDrawW: acc.powerDrawW + p.powerDrawW,
    }),
    { cpuMhz: 0, ramGb: 0, powerWh: 0, powerDrawW: 0 }
  );
}

export function computeAssemblyTotals(partIds: string[]): AssemblyTotals {
  const parts = partIds.map(getCyberPart).filter(Boolean) as CyberPartDef[];
  return partBaseTuning(parts);
}

export function buildPartLines(partIds: string[]): PartPowerLine[] {
  return partIds
    .map(getCyberPart)
    .filter(Boolean)
    .map((p) => ({
      partId: p!.id,
      partName: p!.name,
      powerWh: p!.powerWh,
      powerDrawW: p!.powerDrawW,
      cpuMhz: p!.cpuMhz,
      ramGb: p!.ramGb,
    }));
}

function validateBuild(blueprint: CyberBlueprint, parts: CyberPartDef[]): string[] {
  const warnings: string[] = [];
  const errors: string[] = [];
  const isCosmetic = blueprint.slot === 'cosmetic';

  const invalid = blueprint.partIds.filter((id) => !getCyberPart(id));
  if (invalid.length) errors.push(`Неизвестные части: ${invalid.join(', ')}`);

  for (const p of parts) {
    if (!p.slots.includes(blueprint.slot)) {
      errors.push(`«${p.name}» не подходит для слота «${CYBER_SLOT_LABELS[blueprint.slot]}».`);
    }
  }

  const maxParts = isCosmetic ? BUILD_LIMITS.maxCosmeticParts : BUILD_LIMITS.maxParts;
  if (parts.length > maxParts) {
    errors.push(`Слишком много компонентов: ${parts.length}/${maxParts}.`);
  }
  if (parts.length === 0) warnings.push('Добавьте хотя бы один компонент.');

  for (const kind of BUILD_LIMITS.exclusiveKinds) {
    const count = parts.filter((p) => p.kind === kind).length;
    if (count > 1) errors.push(`Только один модуль типа «${CYBER_KIND_LABELS[kind]}» (сейчас ${count}).`);
  }

  const powerCount = parts.filter((p) => p.kind === 'power').length;
  if (powerCount > BUILD_LIMITS.maxPowerCells) {
    errors.push(`Не более ${BUILD_LIMITS.maxPowerCells} блоков питания.`);
  }

  const fwCount = parts.filter((p) => p.kind === 'firmware').length;
  if (fwCount > BUILD_LIMITS.maxFirmware) {
    errors.push(`Не более ${BUILD_LIMITS.maxFirmware} прошивок.`);
  }

  const weaponCount = parts.filter((p) => p.kind === 'weapon').length;
  if (weaponCount > BUILD_LIMITS.maxWeapons) {
    errors.push(`Не более ${BUILD_LIMITS.maxWeapons} оружейных модулей.`);
  }

  if (isCosmetic) {
    const hasCpu = parts.some((p) => p.kind === 'cpu');
    if (hasCpu) errors.push('Косметическая сборка не может содержать CPU.');
    const nonCosm = parts.filter((p) => p.kind !== 'cosmetic' && p.kind !== 'power');
    if (nonCosm.length > 0) {
      warnings.push('В косметике лучше только косметические модули и питание.');
    }
  } else {
    const cosmOnly = parts.filter((p) => p.kind === 'cosmetic');
    if (cosmOnly.length > 3) warnings.push('Много косметики в боевой сборке — уточните у мастера.');
  }

  const totals = partBaseTuning(parts);
  let bloodTox = parts.reduce((s, p) => s + p.bloodTox, 0);
  if (totals.cpuMhz >= 5000) bloodTox += 1;
  if (totals.ramGb >= 16) bloodTox += 1;

  const maxBt = isCosmetic ? BUILD_LIMITS.maxBloodToxCosmetic : BUILD_LIMITS.maxBloodToxPerImplant;
  if (bloodTox > maxBt) {
    errors.push(`Blood Tox сборки ${bloodTox} — максимум ${maxBt} на один имплант.`);
  } else if (bloodTox > 6 && !isCosmetic) {
    warnings.push(`Высокий Blood Tox (${bloodTox}) — риск ghosting и превышения лимита персонажа.`);
  }

  if (totals.powerDrawW > 0 && totals.powerWh > 0 && totals.powerDrawW > totals.powerWh) {
    warnings.push(
      `Перегруз питания: расход ${totals.powerDrawW} Вт > ёмкость ${totals.powerWh} Вт·ч — установка запрещена.`
    );
  } else if (totals.powerDrawW > 0 && totals.powerWh === 0) {
    warnings.push(`Нет батареи при расходе ${totals.powerDrawW} Вт — добавьте ячейку питания.`);
  }

  return [...errors, ...warnings];
}

const HARD_ERROR_RE =
  /Слишком много|Только один|Не более|не подходит|Неизвестные|не может|Blood Tox сборки/;

function isHardCyberIssue(msg: string): boolean {
  return HARD_ERROR_RE.test(msg);
}

export function buildCyberImplant(blueprint: CyberBlueprint): CyberBuildResult {
  const parts = blueprint.partIds.map(getCyberPart).filter(Boolean) as CyberPartDef[];
  const issues = validateBuild(blueprint, parts);
  const errors = issues.filter(isHardCyberIssue);

  const totals = partBaseTuning(parts);
  const partLines = parts.map((p) => ({
    partId: p.id,
    partName: p.name,
    powerWh: p.powerWh,
    powerDrawW: p.powerDrawW,
    cpuMhz: p.cpuMhz,
    ramGb: p.ramGb,
  }));

  const c2185Mods: CyberBuildResult['c2185Mods'] = {};
  let bloodTox = 0;
  let price = 500;
  const features = new Set<string>();
  const effects = new Set<CyberEffectId>();

  for (const p of parts) {
    sumMods(c2185Mods, p.c2185Mods);
    bloodTox += p.bloodTox;
    price += p.costBase;
    p.features.forEach((f) => features.add(f));
    p.effects?.forEach((e) => effects.add(e));
  }

  sumMods(c2185Mods, tuningMods(totals));

  const { cpuMhz, ramGb, powerWh, powerDrawW } = totals;
  const overload = powerDrawW > 0 && (powerWh === 0 || powerDrawW > powerWh);

  if (cpuMhz >= 5000) {
    bloodTox += 1;
    features.add('Риск ghosting: DC +2');
  }
  if (ramGb >= 16) {
    bloodTox += 1;
    features.add('Параллельные потоки ICE +1');
  }

  const blocked = errors.length > 0 || parts.length === 0;

  return {
    name: blueprint.name.trim() || 'Свой имплант',
    slot: blueprint.slot,
    c2185Mods,
    bloodTox,
    cpuMhz,
    ramGb,
    powerWh,
    powerDrawW,
    features: [...features],
    effects: [...effects],
    priceWonlongs: Math.round(price * (1 + bloodTox * 0.05)),
    overload,
    blocked,
    canSave: !blocked,
    warnings: issues,
    totals,
    partLines,
  };
}

export function blueprintToInventoryItem(blueprint: CyberBlueprint, build = buildCyberImplant(blueprint)) {
  return {
    id: `cyber_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: build.name,
    kind: 'cyberware' as const,
    blurb: `${CYBER_SLOT_LABELS[build.slot]} · BT ${build.bloodTox} · ${build.powerDrawW}/${build.powerWh} Вт`,
    qty: 1,
    c2185Mods: build.c2185Mods,
    cyber: {
      slot: build.slot,
      blueprint,
      bloodTox: build.bloodTox,
      powerDrawW: build.powerDrawW,
      powerWh: build.powerWh,
      cpuMhz: build.cpuMhz,
      ramGb: build.ramGb,
      features: build.features,
      effects: build.effects,
    },
    priceWonlongs: build.priceWonlongs,
  };
}

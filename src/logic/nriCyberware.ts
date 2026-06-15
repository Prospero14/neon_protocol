/**
 * Конструктор киберимплантов Carbon 2185 — части, сборка, ограничения (Blood Tox, питание, слоты).
 */

import { abilityModifier } from './nriNpcGenerator';

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
    name: 'Топливная ячейка (малая)',
    blurb: 'Компактная батарея — питает имплант несколько часов боя.',
    kind: 'power',
    slots: ['arm', 'leg', 'torso', 'internal', 'external', 'cosmetic'],
    c2185Mods: {},
    bloodTox: 1,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 20,
    powerDrawW: 0,
    features: [],
    costBase: 400,
  },
  {
    id: 'power_cell_l',
    name: 'Топливная ячейка (большая)',
    blurb: 'Тяжёлый силовой блок в торс — долго держит энергоёмкие сборки.',
    kind: 'power',
    slots: ['torso', 'internal'],
    c2185Mods: { CON: 1 },
    bloodTox: 2,
    cpuMhz: 0,
    ramGb: 0,
    powerWh: 60,
    powerDrawW: 0,
    features: [],
    costBase: 900,
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
    costBase: 1100,
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
    partIds: ['iface_neural_bus', 'cpu_cortex_2', 'mem_syn_4', 'fw_reflex', 'power_cell_l'],
    notes: 'ИНТ/ТЕХ, взлом — BT на пределе (10).',
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
    partIds: ['cosm_led_skin', 'cosm_synth_hair', 'cosm_eye_glow', 'cosm_holo_tattoo'],
    notes: 'Косметика, BT 0 — для витрины риппердока.',
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

  for (const p of parts) {
    sumMods(c2185Mods, p.c2185Mods);
    bloodTox += p.bloodTox;
    price += p.costBase;
    p.features.forEach((f) => features.add(f));
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
    },
    priceWonlongs: build.priceWonlongs,
  };
}

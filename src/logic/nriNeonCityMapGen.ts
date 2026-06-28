/**
 * Neon City v4 — раскладка в духе CP2077 / Cyberpunk RED / Carbon 2185.
 * Шесть мегарайонов, именованные субрайоны, плотная мозаика без перекрытий.
 */

export type MapZoneType =
  | 'corp'
  | 'mid'
  | 'slum'
  | 'park'
  | 'highway'
  | 'tunnel'
  | 'overpass'
  | 'industrial';

export type MapZoneSeed = {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: MapZoneType;
  x: number;
  y: number;
  w: number;
  h: number;
  parentZoneKey?: string;
  placeType?: string;
  districtStyle?: string;
  gridRow?: number;
  gridCol?: number;
  megaDistrict?: string;
  corpName?: string;
  locked?: boolean;
  pois?: string[];
};

export const MAP_LAYOUT_VERSION = 'v4-canon-ru';
export const MAP_VIEW = { w: 240, h: 165 };

const CORPS = [
  'Arasaka',
  'Militech',
  'Kang Tao',
  'Biotechnica',
  'Trauma Team',
  'NetWatch',
  'Zetatech',
  'Orbital Air',
  'SovOil',
  'EBM',
] as const;

type SubDef = {
  key: string;
  name: string;
  zoneType: MapZoneType;
  /** Прямоугольник внутри мегарайона (целые пиксели). */
  bx: number;
  by: number;
  bw: number;
  bh: number;
  corpName?: string;
  locked?: boolean;
  pois?: string[];
};

type MegaDef = {
  megaKey: string;
  megaLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  subs: SubDef[];
};

const MEGAS: MegaDef[] = [
  {
    megaKey: 'watson',
    megaLabel: 'ВАТСОН',
    x: 0,
    y: 0,
    w: 108,
    h: 22,
    subs: [
      {
        key: 'northside',
        name: 'Нортсайд',
        zoneType: 'industrial',
        bx: 0,
        by: 0,
        bw: 108,
        bh: 22,
        pois: ['доки', 'завод All Foods', 'промзоны'],
      },
    ],
  },
  {
    megaKey: 'watson',
    megaLabel: 'ВАТСОН',
    x: 118,
    y: 0,
    w: 122,
    h: 22,
    subs: [
      {
        key: 'arasaka_wf',
        name: 'Прибрежная зона Арасаки',
        zoneType: 'industrial',
        bx: 0,
        by: 0,
        bw: 122,
        bh: 22,
        pois: ['Militech', 'корп-доки', 'контейнеры'],
      },
    ],
  },
  {
    megaKey: 'westbrook',
    megaLabel: 'ВЕСТБРУК',
    x: 0,
    y: 22,
    w: 36,
    h: 53,
    subs: [
      {
        key: 'japantown',
        name: 'Джапантаун',
        zoneType: 'mid',
        bx: 0,
        by: 0,
        bw: 36,
        bh: 22,
        pois: ['Tyger Claws', 'клубы', 'рынок'],
      },
      {
        key: 'charter_hill',
        name: 'Чартер-Хилл',
        zoneType: 'mid',
        bx: 0,
        by: 22,
        bw: 36,
        bh: 18,
        pois: ['башни', 'медиа'],
      },
      {
        key: 'north_oaks',
        name: 'Норт-Оукс',
        zoneType: 'mid',
        bx: 0,
        by: 40,
        bw: 36,
        bh: 13,
        pois: ['виллы', 'охрана'],
      },
    ],
  },
  {
    megaKey: 'watson',
    megaLabel: 'ВАТСОН',
    x: 36,
    y: 22,
    w: 72,
    h: 53,
    subs: [
      {
        key: 'little_china',
        name: 'Маленькая Китайщина',
        zoneType: 'slum',
        bx: 0,
        by: 0,
        bw: 40,
        bh: 53,
        pois: ['Afterlife', 'мегабилдинг H10', 'нудл-бары'],
      },
      {
        key: 'kabuki',
        name: 'Кабуки',
        zoneType: 'slum',
        bx: 40,
        by: 0,
        bw: 32,
        bh: 53,
        pois: ['рынок Кабуки', 'Maelstrom', 'риппердок'],
      },
    ],
  },
  {
    megaKey: 'city_center',
    megaLabel: 'ЦЕНТР ГОРОДА',
    x: 118,
    y: 22,
    w: 70,
    h: 53,
    subs: [
      {
        key: 'corpo_plaza',
        name: 'Корпо-плаза',
        zoneType: 'corp',
        bx: 0,
        by: 0,
        bw: 70,
        bh: 31,
        pois: ['небоскрёбы', 'аренда офисов'],
      },
      {
        key: 'downtown',
        name: 'Даунтаун',
        zoneType: 'mid',
        bx: 0,
        by: 31,
        bw: 43,
        bh: 22,
        pois: ['7th Hell', 'бизнес-центры'],
      },
      {
        key: 'memorial',
        name: 'Мемориальный парк',
        zoneType: 'park',
        bx: 43,
        by: 31,
        bw: 27,
        bh: 22,
        pois: ['сквер', 'памятник'],
      },
    ],
  },
  {
    megaKey: 'santo_domingo',
    megaLabel: 'САНТО-ДОМИНГО',
    x: 188,
    y: 22,
    w: 52,
    h: 53,
    subs: [
      {
        key: 'arroyo',
        name: 'Арройо',
        zoneType: 'industrial',
        bx: 0,
        by: 0,
        bw: 52,
        bh: 29,
        pois: ['6th Street', 'цехи', 'электростанция'],
      },
      {
        key: 'rancho_coronado',
        name: 'Ранчо-Коронадо',
        zoneType: 'industrial',
        bx: 0,
        by: 29,
        bw: 52,
        bh: 24,
        pois: ['заводы', 'грузовики', 'Valentinos'],
      },
    ],
  },
  {
    megaKey: 'heywood',
    megaLabel: 'ХЕЙВУД',
    x: 0,
    y: 85,
    w: 108,
    h: 80,
    subs: [
      {
        key: 'the_glen',
        name: 'Глен',
        zoneType: 'mid',
        bx: 0,
        by: 0,
        bw: 108,
        bh: 29,
        pois: ['Valentinos', 'бары', 'жилые кварталы'],
      },
      {
        key: 'wellsprings',
        name: 'Уэллспрингс',
        zoneType: 'slum',
        bx: 0,
        by: 29,
        bw: 54,
        bh: 51,
        pois: ['рынок', 'хибары'],
      },
      {
        key: 'vista_del_rey',
        name: 'Виста-дель-Рей',
        zoneType: 'slum',
        bx: 54,
        by: 29,
        bw: 54,
        bh: 51,
        pois: ['банды', 'контрабанда'],
      },
    ],
  },
  {
    megaKey: 'santo_domingo',
    megaLabel: 'САНТО-ДОМИНГО',
    x: 118,
    y: 85,
    w: 52,
    h: 37,
    subs: [
      {
        key: 'industrial_ring',
        name: 'Промкольцо',
        zoneType: 'industrial',
        bx: 0,
        by: 0,
        bw: 52,
        bh: 37,
        pois: ['токсичные цеха', 'Biotechnica'],
      },
    ],
  },
  {
    megaKey: 'pacifica',
    megaLabel: 'ПАСИФИКА',
    x: 170,
    y: 85,
    w: 70,
    h: 37,
    subs: [
      {
        key: 'coastview',
        name: 'Коствью',
        zoneType: 'slum',
        bx: 0,
        by: 0,
        bw: 70,
        bh: 20,
        pois: ['Voodoo Boys', 'заброшки', 'рынок'],
      },
      {
        key: 'west_wind',
        name: 'Поместье Вест-Винд',
        zoneType: 'slum',
        bx: 0,
        by: 20,
        bw: 70,
        bh: 17,
        pois: ['отель-руины', 'контрабанда'],
      },
    ],
  },
  {
    megaKey: 'pacifica',
    megaLabel: 'ПАСИФИКА',
    x: 118,
    y: 122,
    w: 122,
    h: 43,
    subs: [
      {
        key: 'south_docks',
        name: 'Южные доки',
        zoneType: 'industrial',
        bx: 0,
        by: 0,
        bw: 55,
        bh: 43,
        pois: ['порт', 'контейнеры', 'смог'],
      },
      {
        key: 'pacifica_ruins',
        name: 'Руины Пасифики',
        zoneType: 'slum',
        bx: 55,
        by: 0,
        bw: 67,
        bh: 43,
        pois: ['Animals', 'беззаконие', 'заброшки'],
      },
    ],
  },
];

const HIGHWAYS: MapZoneSeed[] = [
  {
    zoneKey: 'hw_ns_n',
    sortOrder: 0,
    name: 'Гранд-авеню · север',
    zoneType: 'highway',
    x: 108,
    y: 0,
    w: 10,
    h: 75,
  },
  {
    zoneKey: 'hw_ns_s',
    sortOrder: 0,
    name: 'Гранд-авеню · юг',
    zoneType: 'highway',
    x: 108,
    y: 85,
    w: 10,
    h: 80,
  },
  {
    zoneKey: 'hw_ew_w',
    sortOrder: 0,
    name: 'Кольцевая петля · запад',
    zoneType: 'highway',
    x: 0,
    y: 75,
    w: 108,
    h: 10,
  },
  {
    zoneKey: 'hw_ew_e',
    sortOrder: 0,
    name: 'Кольцевая петля · восток',
    zoneType: 'highway',
    x: 118,
    y: 75,
    w: 122,
    h: 10,
  },
  {
    zoneKey: 'hw_core',
    sortOrder: 0,
    name: 'Кольцевая развязка',
    zoneType: 'overpass',
    x: 108,
    y: 75,
    w: 10,
    h: 10,
  },
];

const MEGA_WATERMARKS: { megaKey: string; megaLabel: string; x: number; y: number }[] = [
  { megaKey: 'watson', megaLabel: 'ВАТСОН', x: 54, y: 38 },
  { megaKey: 'westbrook', megaLabel: 'ВЕСТБРУК', x: 18, y: 48 },
  { megaKey: 'city_center', megaLabel: 'ЦЕНТР ГОРОДА', x: 153, y: 48 },
  { megaKey: 'santo_domingo', megaLabel: 'САНТО-ДОМИНГО', x: 214, y: 48 },
  { megaKey: 'heywood', megaLabel: 'ХЕЙВУД', x: 54, y: 125 },
  { megaKey: 'pacifica', megaLabel: 'ПАСИФИКА', x: 179, y: 132 },
];

export function getMegaWatermarks() {
  return MEGA_WATERMARKS;
}

export type MegaCluster = {
  clusterKey: string;
  megaKey: string;
  megaLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Канонические кластеры мегарайонов (не сливать через магистрали). */
export function getMegaClusters(): MegaCluster[] {
  return MEGAS.map((m) => ({
    clusterKey: `${m.megaKey}_${m.x}_${m.y}`,
    megaKey: m.megaKey,
    megaLabel: m.megaLabel,
    x: m.x,
    y: m.y,
    w: m.w,
    h: m.h,
  }));
}

function distributeInt(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const rem = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}

function buildMegaZones(): MapZoneSeed[] {
  const zones: MapZoneSeed[] = [];
  for (const mega of MEGAS) {
    for (const sub of mega.subs) {
      zones.push({
        zoneKey: `${mega.megaKey}_${sub.key}`,
        sortOrder: 0,
        name: sub.name,
        zoneType: sub.zoneType,
        megaDistrict: mega.megaLabel,
        x: mega.x + sub.bx,
        y: mega.y + sub.by,
        w: sub.bw,
        h: sub.bh,
        corpName: sub.corpName,
        locked: sub.locked,
        pois: sub.pois,
      });
    }
  }
  return zones;
}

function subdivideCorpoPlaza(zones: MapZoneSeed[]): MapZoneSeed[] {
  const out: MapZoneSeed[] = [];
  for (const z of zones) {
    if (z.zoneKey !== 'city_center_corpo_plaza') {
      out.push(z);
      continue;
    }
    const cols = 5;
    const rows = 2;
    const colWidths = distributeInt(z.w, cols);
    const rowHeights = distributeInt(z.h, rows);
    let i = 0;
    let y = z.y;
    for (let row = 0; row < rows; row++) {
      let x = z.x;
      for (let col = 0; col < cols; col++) {
        const corp = CORPS[i % CORPS.length]!;
        out.push({
          zoneKey: `corp_${corp.toLowerCase().replace(/\s+/g, '_')}`,
          sortOrder: 0,
          name: corp,
          zoneType: 'corp',
          megaDistrict: 'ЦЕНТР ГОРОДА',
          corpName: corp,
          x,
          y,
          w: colWidths[col]!,
          h: rowHeights[row]!,
        });
        x += colWidths[col]!;
        i++;
      }
      y += rowHeights[row]!;
    }
  }
  return out;
}

const LAYER_ORDER: Record<MapZoneType, number> = {
  highway: 0,
  overpass: 1,
  industrial: 2,
  slum: 3,
  mid: 4,
  park: 5,
  corp: 6,
  tunnel: 7,
};

export function generateNeonCityZones(): MapZoneSeed[] {
  let zones: MapZoneSeed[] = [...HIGHWAYS, ...buildMegaZones()];
  zones = subdivideCorpoPlaza(zones);

  zones.sort((a, b) => {
    const la = LAYER_ORDER[a.zoneType] ?? 3;
    const lb = LAYER_ORDER[b.zoneType] ?? 3;
    return la - lb || a.y - b.y || a.x - b.x;
  });

  return zones.map((z, i) => ({ ...z, sortOrder: i }));
}

/** Проверка полного покрытия без перекрытий (сетка 24×33). */
export function validateZoneCoverage(zones: MapZoneSeed[]): { ok: boolean; coverage: number; overlaps: number } {
  const COLS = 24;
  const ROWS = 33;
  const CW = MAP_VIEW.w / COLS;
  const CH = MAP_VIEW.h / ROWS;
  const map = new Uint16Array(COLS * ROWS);
  let overlaps = 0;
  for (const z of zones) {
    const c0 = Math.max(0, Math.floor(z.x / CW));
    const r0 = Math.max(0, Math.floor(z.y / CH));
    const c1 = Math.min(COLS, Math.ceil((z.x + z.w) / CW - 0.001));
    const r1 = Math.min(ROWS, Math.ceil((z.y + z.h) / CH - 0.001));
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        const idx = r * COLS + c;
        if (map[idx]! > 0) overlaps++;
        map[idx] = 1;
      }
    }
  }
  const coverage = map.reduce((a, b) => a + b, 0);
  return { ok: coverage === COLS * ROWS && overlaps === 0, coverage, overlaps };
}

export function megaKeyFromZoneKey(zoneKey: string): string | null {
  if (zoneKey.startsWith('corp_')) return 'city_center';
  const m = zoneKey.match(/^(watson|westbrook|city_center|heywood|santo_domingo|pacifica)_/);
  return m?.[1] ?? null;
}

const DEFAULT_MEGA_LABELS: Record<string, string> = {
  watson: 'ВАТСОН',
  westbrook: 'ВЕСТБРУК',
  city_center: 'ЦЕНТР ГОРОДА',
  heywood: 'ХЕЙВУД',
  santo_domingo: 'САНТО-ДОМИНГО',
  pacifica: 'ПАСИФИКА',
};

export function megaFromZoneKey(zoneKey: string): string | null {
  const mk = megaKeyFromZoneKey(zoneKey);
  return mk ? (DEFAULT_MEGA_LABELS[mk] ?? null) : null;
}


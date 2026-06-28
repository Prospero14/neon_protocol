/** Сетка квартала — типы клеток, стили, decay, соседи. См. docs/NRI_DISTRICT_GRID.md */

export const PLACE_TYPES = [
  'generic',
  'road',
  'bridge',
  'crossing',
  'house',
  'restaurant',
  'shop',
  'secondhand',
  'alley',
  'park',
  'plaza',
  'parking',
  'metro',
  'exit',
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

export const DISTRICT_STYLES = [
  'residential',
  'chinatown',
  'corp_clean',
  'slum',
  'industrial',
  'park_mixed',
] as const;

export type DistrictStyle = (typeof DISTRICT_STYLES)[number];

const PLACE_SET = new Set<string>(PLACE_TYPES);
const STYLE_SET = new Set<string>(DISTRICT_STYLES);

export function isPlaceType(v: string): v is PlaceType {
  return PLACE_SET.has(v);
}

export function isDistrictStyle(v: string): v is DistrictStyle {
  return STYLE_SET.has(v);
}

export function normalizePlaceType(raw: unknown): PlaceType {
  if (typeof raw === 'string' && isPlaceType(raw)) return raw;
  return 'generic';
}

export function normalizeDistrictStyle(raw: unknown): DistrictStyle | null {
  if (typeof raw === 'string' && isDistrictStyle(raw)) return raw;
  return null;
}

/** Стиль по умолчанию от gameplay zoneType родителя. */
export function defaultDistrictStyle(zoneType: string): DistrictStyle {
  switch (zoneType) {
    case 'corp':
      return 'corp_clean';
    case 'slum':
      return 'slum';
    case 'industrial':
      return 'industrial';
    case 'park':
      return 'park_mixed';
    default:
      return 'residential';
  }
}

export type GridTileRef = {
  zoneKey: string;
  gridRow: number;
  gridCol: number;
  placeType: PlaceType;
};

/** 0 = центр квартала, 1 = угол/край. */
export function tileCenterDecay(row: number, col: number, rows: number, cols: number): number {
  if (rows <= 1 || cols <= 1) return 1;
  const cy = (rows - 1) / 2;
  const cx = (cols - 1) / 2;
  const dy = Math.abs(row - cy) / Math.max(cy, 0.5);
  const dx = Math.abs(col - cx) / Math.max(cx, 0.5);
  return Math.min(1, Math.sqrt(dx * dx + dy * dy));
}

/** Уровень «грязи» / декора для пропсов и бомжей. */
export function tileDecayAmount(
  decay: number,
  style: DistrictStyle,
  placeType: PlaceType
): number {
  if (placeType === 'park' || placeType === 'plaza' || placeType === 'exit') return decay * 0.35;
  if (style === 'corp_clean') return decay * 0.15;
  if (style === 'slum') return 0.35 + decay * 0.65;
  if (style === 'chinatown') return decay * 0.45;
  return decay * 0.55;
}

export type TileNeighbors = {
  n?: PlaceType;
  s?: PlaceType;
  e?: PlaceType;
  w?: PlaceType;
};

export function neighborsForTile(
  row: number,
  col: number,
  byPos: Map<string, PlaceType>
): TileNeighbors {
  const at = (r: number, c: number) => byPos.get(`${r},${c}`);
  return {
    n: at(row - 1, col),
    s: at(row + 1, col),
    e: at(row, col + 1),
    w: at(row, col - 1),
  };
}

export function subTileZoneKey(parentZoneKey: string, row: number, col: number): string {
  return `${parentZoneKey}__${row}_${col}`;
}

export function parseSubTileGrid(zoneKey: string): { row: number; col: number } | null {
  const i = zoneKey.lastIndexOf('__');
  if (i < 0) return null;
  const tail = zoneKey.slice(i + 2);
  const m = /^(\d+)_(\d+)$/.exec(tail);
  if (!m) return null;
  return { row: Number(m[1]), col: Number(m[2]) };
}

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  generic: 'Пусто',
  road: 'Дорога',
  bridge: 'Мост',
  crossing: 'Перекрёсток',
  house: 'Жилой дом',
  restaurant: 'Ресторан',
  shop: 'Магазин',
  secondhand: 'Секонд-хенд',
  alley: 'Переулок',
  park: 'Парк',
  plaza: 'Площадь',
  parking: 'Парковка',
  metro: 'Подземка',
  exit: 'Выход в район',
};

export const DISTRICT_STYLE_LABELS: Record<DistrictStyle, string> = {
  residential: 'Спальный',
  chinatown: 'Чайна-таун',
  corp_clean: 'Корп (чисто)',
  slum: 'Трущобы',
  industrial: 'Промзона',
  park_mixed: 'Парк / зелень',
};

/** Детерминированный seed для пропсов клетки. */
export function tileDecorSeed(zoneKey: string): number {
  let h = 0;
  for (let i = 0; i < zoneKey.length; i++) {
    h = (h * 31 + zoneKey.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

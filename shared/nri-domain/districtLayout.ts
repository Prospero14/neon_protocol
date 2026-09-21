/** Layout + генерация сетки квартала (shared: client + server). */

import {
  defaultDistrictStyle,
  normalizeDistrictStyle,
  PLACE_TYPE_LABELS,
  subTileZoneKey,
  type DistrictStyle,
  type PlaceType,
} from './districtGrid.js';
import { canDrillIntoDistrict } from './mapZones.js';
import {
  PLAZA_BLOCK_SHAPE,
  CORP_HQ_SHAPE,
  CORP_HQ_SIZE,
  CORP_OFFICE_SIZE,
  blockShapeNxN,
  ensureShackMegaBlocks,
  normalizeParkingQuota,
  normalizePlazaLayout,
} from './plazaMega.js';

const CELL = 5.5;
/** Зазор между клетками — чтобы спрайты/асфальт не сливались. */
const GAP = 0.55;
const PAD = 0.55;

/** Холст клеточного района — совпадает с aspect-ratio карты (240×165). */
export const DISTRICT_DRILL_CANVAS = { w: 240, h: 165 } as const;

/** Городская карта (overview) — те же пропорции, что drill-холст. */
export const CITY_MAP_CANVAS = { w: 240, h: 165 } as const;

/**
 * Район на краю карты (центроид во внешней полосе ~22%).
 * Свалки только здесь — не в центре города.
 */
export function isEdgeDistrictOnCityMap(
  zone: { x: number; y: number; w: number; h: number },
  canvas: { w: number; h: number } = CITY_MAP_CANVAS
): boolean {
  if (canvas.w <= 0 || canvas.h <= 0) return false;
  const band = 0.22;
  const cx = (zone.x + zone.w / 2) / canvas.w;
  const cy = (zone.y + zone.h / 2) / canvas.h;
  return cx <= band || cx >= 1 - band || cy <= band || cy >= 1 - band;
}

/** Сколько одиночных свалок ставить в квартале. */
export function dumpQuotaForDistrict(style: DistrictStyle, isEdge: boolean, rng: () => number): number {
  if (!isEdge) return 0;
  if (style === 'corp_clean') return 0;
  if (style === 'residential') return 1;
  if (style === 'slum') return 2 + (rng() > 0.45 ? 1 : 0); // 2–3
  return 0;
}

function distributeInt(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const rem = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}

export type DistrictGridLayout = {
  rows: number;
  cols: number;
  colWidths: number[];
  rowHeights: number[];
  canvasW: number;
  canvasH: number;
};

/** Размер сетки клеток на drill-холсте (не от bbox района на карте города). */
export function computeDistrictGridLayout(
  canvas: { w: number; h: number } = DISTRICT_DRILL_CANVAS
): DistrictGridLayout {
  const innerW = canvas.w - PAD * 2;
  const innerH = canvas.h - PAD * 2;
  const cols = Math.max(8, Math.min(14, Math.floor((innerW + GAP) / (CELL + GAP))));
  const rows = Math.max(6, Math.min(12, Math.floor((innerH + GAP) / (CELL + GAP))));
  const colWidths = distributeInt(Math.max(1, Math.round(innerW - GAP * Math.max(0, cols - 1))), cols);
  const rowHeights = distributeInt(Math.max(1, Math.round(innerH - GAP * Math.max(0, rows - 1))), rows);
  return { rows, cols, colWidths, rowHeights, canvasW: canvas.w, canvasH: canvas.h };
}

type GridTileLike = {
  gridRow?: number | null;
  gridCol?: number | null;
};

/** Пересчёт x/y/w/h клеток по gridRow/gridCol на полный drill-холст. */
export function relayoutDistrictGridTiles<T extends GridTileLike>(
  tiles: T[],
  layout: DistrictGridLayout = computeDistrictGridLayout()
): Array<T & { x: number; y: number; w: number; h: number }> {
  const { colWidths, rowHeights } = layout;
  const colX: number[] = [];
  const rowY: number[] = [];
  let x = PAD;
  for (let c = 0; c < colWidths.length; c++) {
    colX[c] = x;
    x += colWidths[c]! + GAP;
  }
  let y = PAD;
  for (let r = 0; r < rowHeights.length; r++) {
    rowY[r] = y;
    y += rowHeights[r]! + GAP;
  }
  return tiles.map((tile) => {
    const r = tile.gridRow ?? 0;
    const c = tile.gridCol ?? 0;
    return {
      ...tile,
      x: colX[c] ?? PAD,
      y: rowY[r] ?? PAD,
      w: colWidths[c] ?? CELL,
      h: rowHeights[r] ?? CELL,
    };
  });
}

/** Детерминированный PRNG (mulberry32). */
export function districtRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashZoneSeed(zoneKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < zoneKey.length; i++) {
    h ^= zoneKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickWeighted(rng: () => number, weights: Array<{ type: PlaceType; w: number }>): PlaceType {
  const total = weights.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return 'house';
  let roll = rng() * total;
  for (const item of weights) {
    roll -= item.w;
    if (roll <= 0) return item.type;
  }
  return weights[weights.length - 1]!.type;
}

/** Веса застроек вдоль улицы по стилю квартала. */
export function buildingWeightsForStyle(style: DistrictStyle): Array<{ type: PlaceType; w: number }> {
  switch (style) {
    case 'chinatown':
      return [
        { type: 'shop_asian', w: 3.2 },
        { type: 'restaurant', w: 2.8 },
        { type: 'market', w: 2 },
        { type: 'house', w: 1.5 },
        { type: 'shop', w: 1.2 },
        { type: 'secondhand', w: 1 },
      ];
    case 'corp_clean':
      return [
        { type: 'hotel', w: 2.5 },
        { type: 'service', w: 2.2 },
        { type: 'corp_annex', w: 1.8 },
        { type: 'shop', w: 1.2 },
        { type: 'restaurant', w: 0.9 },
        { type: 'parking', w: 0.25 },
      ];
    case 'slum':
      return [
        { type: 'shack', w: 2.8 },
        { type: 'house', w: 1.8 },
        { type: 'secondhand', w: 1.4 },
        { type: 'shop', w: 0.8 },
        { type: 'gunshop', w: 0.35 },
        { type: 'restaurant', w: 0.5 },
      ];
    case 'industrial':
      return [
        { type: 'house', w: 2.2 },
        { type: 'shop', w: 1.6 },
        { type: 'secondhand', w: 1.2 },
        { type: 'gunshop', w: 0.7 },
        { type: 'restaurant', w: 0.6 },
        { type: 'shack', w: 0.5 },
        { type: 'parking', w: 0.12 },
      ];
    case 'park_mixed':
      return [
        { type: 'park', w: 4 },
        { type: 'house', w: 1.8 },
        { type: 'restaurant', w: 1.2 },
        { type: 'shop', w: 0.8 },
      ];
    case 'residential':
    default:
      return [
        { type: 'house', w: 3.2 },
        { type: 'shop', w: 1.4 },
        { type: 'restaurant', w: 1.1 },
        { type: 'park', w: 1 },
        { type: 'secondhand', w: 0.7 },
        { type: 'parking', w: 0.25 },
      ];
  }
}

function touchesRoad(grid: PlaceType[][], r: number, c: number): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const roadish = (t: PlaceType | undefined) =>
    t === 'road' || t === 'crossing' || t === 'bridge' || t === 'exit' || t === 'metro';
  return (
    roadish(grid[r - 1]?.[c]) ||
    roadish(grid[r + 1]?.[c]) ||
    roadish(grid[r]?.[c - 1]) ||
    roadish(grid[r]?.[c + 1]) ||
    (r === 0 || c === 0 || r === rows - 1 || c === cols - 1)
  );
}

function setIfGeneric(grid: PlaceType[][], r: number, c: number, type: PlaceType): boolean {
  if (r < 0 || c < 0 || r >= grid.length || c >= (grid[0]?.length ?? 0)) return false;
  if (grid[r]![c] !== 'generic') return false;
  grid[r]![c] = type;
  return true;
}

/** Компактные формы кластеров 1 / 3–5 клеток (относительно якоря). */
export const CLUSTER_SHAPES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[0, 0]],
  [
    [0, 0],
    [0, 1],
    [1, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 0],
    [2, 1],
  ],
];

function shapeFits(grid: PlaceType[][], r: number, c: number, shape: ReadonlyArray<readonly [number, number]>): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  for (const [dr, dc] of shape) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) return false;
    if (grid[rr]![cc] !== 'generic') return false;
  }
  return true;
}

function stampShape(
  grid: PlaceType[][],
  r: number,
  c: number,
  shape: ReadonlyArray<readonly [number, number]>,
  type: PlaceType
): number {
  let n = 0;
  for (const [dr, dc] of shape) {
    grid[r + dr]![c + dc] = type;
    n++;
  }
  return n;
}

/**
 * Ставит до `count` кластеров типа `type` размером из `sizes` (клетки только на generic).
 * Возвращает число занятых клеток.
 * @param opts.exactShapes — если задано, только эти формы (всё равно фильтруются по sizes).
 */
export function placeTypeClusters(
  grid: PlaceType[][],
  type: PlaceType,
  count: number,
  sizes: number[],
  rng: () => number,
  opts?: { exactShapes?: ReadonlyArray<ReadonlyArray<readonly [number, number]>> }
): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const sizeSet = new Set(sizes);
  const pool = opts?.exactShapes ?? CLUSTER_SHAPES;
  const shapes = pool.filter((s) => sizeSet.has(s.length));
  if (shapes.length === 0 || count <= 0) return 0;

  const candidates: Array<[number, number]> = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r]![c] === 'generic') candidates.push([r, c]);
    }
  }
  // shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  let placed = 0;
  let cells = 0;
  for (const [r, c] of candidates) {
    if (placed >= count) break;
    const shape = shapes[Math.floor(rng() * shapes.length)]!;
    if (!shapeFits(grid, r, c, shape)) continue;
    cells += stampShape(grid, r, c, shape, type);
    placed++;
  }
  return cells;
}

function isSideAccess(t?: PlaceType): boolean {
  return t === 'parking' || t === 'plaza';
}

function isTravelSurface(t?: PlaceType): boolean {
  return t === 'road' || t === 'crossing' || t === 'bridge' || t === 'exit';
}

/**
 * Перекрёсток только если есть и горизонт, и вертикаль (реальное пересечение).
 * Иначе → обычная дорога.
 */
export function normalizeRoadCrossings(grid: PlaceType[][]): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]![c] !== 'crossing') continue;
      const v = isTravelSurface(grid[r - 1]?.[c]) || isTravelSurface(grid[r + 1]?.[c]);
      const h = isTravelSurface(grid[r]?.[c - 1]) || isTravelSurface(grid[r]?.[c + 1]);
      if (v && h) continue;
      grid[r]![c] = 'road';
      n++;
    }
  }
  return n;
}

/**
 * Парковка/площадь по разные стороны дороги → эстакада (не перекрёсток:
 * перекрёсток только на пересечении дорог).
 */
export function promoteSideAccessJunctions(grid: PlaceType[][], _rng: () => number): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]![c] !== 'road') continue;
      const north = grid[r - 1]?.[c];
      const south = grid[r + 1]?.[c];
      const east = grid[r]?.[c + 1];
      const west = grid[r]?.[c - 1];
      const across =
        (isSideAccess(west) && isSideAccess(east)) || (isSideAccess(north) && isSideAccess(south));
      if (!across) continue;
      // уже настоящее пересечение дорог — оставляем normalize'у / compose
      const v = isTravelSurface(north) || isTravelSurface(south);
      const h = isTravelSurface(east) || isTravelSurface(west);
      if (v && h) continue;
      grid[r]![c] = 'bridge';
      n++;
    }
  }
  return n;
}

/**
 * Переулок убран: вместо него — ночной клуб (~1 на 20 клеток) + редкие landmark'и.
 * hospital / police / electronics — не больше 1–2 на район.
 */
export function placeDistrictLandmarks(grid: PlaceType[][], style: DistrictStyle, rng: () => number): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const total = rows * cols;

  const replaceable = (t: PlaceType) =>
    t === 'house' ||
    t === 'shack' ||
    t === 'generic' ||
    t === 'shop' ||
    t === 'secondhand';

  const candidates: Array<[number, number]> = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (!replaceable(grid[r]![c]!)) continue;
      if (!touchesRoad(grid, r, c)) continue;
      candidates.push([r, c]);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  let placed = 0;
  const take = (type: PlaceType, count: number) => {
    let n = 0;
    while (n < count && candidates.length > 0) {
      const [r, c] = candidates.pop()!;
      if (!replaceable(grid[r]![c]!)) continue;
      grid[r]![c] = type;
      n++;
      placed++;
    }
  };

  const clubs = Math.max(1, Math.floor(total / 20));
  take('nightclub', style === 'corp_clean' ? 1 : clubs);
  // Гарантированно по одному; второй — с шансом.
  take('hospital', 1);
  take('police', 1);
  take('electronics', 1);
  if (rng() > 0.55 && style !== 'park_mixed') {
    take('hospital', 1);
  }
  if (rng() > 0.6 && (style === 'industrial' || style === 'chinatown' || style === 'slum')) {
    take('electronics', 1);
  }

  const parks = grid.flat().filter((t) => t === 'park' || t === 'pond').length;
  if (parks < 2 && style !== 'industrial') {
    take('park', 1 + (rng() > 0.5 ? 1 : 0));
  }

  return placed;
}

/** Водоём внутри/рядом с парком. */
export function placePondsInParks(grid: PlaceType[][], rng: () => number): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const parks: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]![c] === 'park') parks.push([r, c]);
    }
  }
  if (parks.length === 0) return 0;

  // Сначала клетки внутри пятна (есть сосед-парк), иначе любая.
  const inner = parks.filter(([r, c]) => {
    return (
      grid[r - 1]?.[c] === 'park' ||
      grid[r + 1]?.[c] === 'park' ||
      grid[r]?.[c - 1] === 'park' ||
      grid[r]?.[c + 1] === 'park'
    );
  });
  const pool = inner.length > 0 ? inner : parks;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  const want = Math.min(2, Math.max(1, Math.floor(parks.length / 3)));
  let n = 0;
  for (const [r, c] of pool) {
    if (n >= want) break;
    grid[r]![c] = 'pond';
    n++;
  }
  return n;
}

/**
 * Композиция placeType: крест дорог + выходы + застройка/парки по стилю.
 * Детерминированно от seed (обычно hash zoneKey).
 * @param opts.isEdgeDistrict — район на краю городской карты (свалки только там).
 */
export function composeDistrictPlaceTypes(
  rows: number,
  cols: number,
  style: DistrictStyle,
  seed: number,
  opts?: { isEdgeDistrict?: boolean }
): PlaceType[][] {
  const rng = districtRng(seed);
  const isEdge = opts?.isEdgeDistrict === true;
  const grid: PlaceType[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 'generic' as PlaceType)
  );

  const midC = Math.floor(cols / 2);
  const midR = Math.floor(rows / 2);

  // Периметр: выходы по серединам сторон
  grid[0]![midC] = 'exit';
  grid[rows - 1]![midC] = 'exit';
  grid[midR]![0] = 'exit';
  grid[midR]![cols - 1] = 'exit';

  // Главный крест дорог → выходы
  for (let c = 0; c < cols; c++) {
    if (grid[midR]![c] !== 'exit') grid[midR]![c] = 'road';
  }
  for (let r = 0; r < rows; r++) {
    if (grid[r]![midC] !== 'exit') grid[r]![midC] = 'road';
  }
  grid[midR]![midC] = 'crossing';

  // В трущобах меньше вторичных улиц — место под гетто-блоки без дорог внутри
  const allowSecondary = style !== 'slum' || rng() > 0.55;
  let secR = -1;
  if (allowSecondary) {
    const secOffset = rng() > 0.5 ? 2 : -2;
    secR = midR + secOffset;
    if (secR > 0 && secR < rows - 1) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[secR]![c] === 'generic' || grid[secR]![c] === 'road') {
          // crossing только на пересечении с главной вертикалью
          grid[secR]![c] = c === midC ? 'crossing' : 'road';
        }
      }
    } else {
      secR = -1;
    }
  }
  if (allowSecondary && cols >= 10 && style !== 'slum' && rng() > 0.35) {
    const secC = midC + (rng() > 0.5 ? 2 : -2);
    if (secC > 0 && secC < cols - 1) {
      for (let r = 1; r < rows - 1; r++) {
        if (grid[r]![secC] === 'generic') grid[r]![secC] = 'road';
        // crossing только на пересечении с горизонтальными осями (не вся вертикаль)
        if (grid[r]![secC] === 'road' && (r === midR || r === secR)) {
          grid[r]![secC] = 'crossing';
        }
      }
    }
  }

  // Мост на главной оси
  if (style === 'industrial' || style === 'park_mixed' || rng() > 0.72) {
    const bc = Math.max(1, Math.min(cols - 2, midC + (rng() > 0.5 ? -2 : 2)));
    if (grid[midR]![bc] === 'road') grid[midR]![bc] = 'bridge';
  }

  // Метро у центра (не в трущобах/чистом парке)
  if (style !== 'slum' && style !== 'park_mixed') {
    const candidates: Array<[number, number]> = [
      [midR - 1, midC - 1],
      [midR - 1, midC + 1],
      [midR + 1, midC - 1],
      [midR + 1, midC + 1],
    ];
    for (const [r, c] of candidates) {
      if (setIfGeneric(grid, r, c, 'metro')) break;
    }
  }

  // Парки: мелкие (1) + цельные пятна 3–5 (общая картина)
  if (style === 'park_mixed') {
    placeTypeClusters(grid, 'park', 2 + Math.floor(rng() * 2), [3, 4, 5], rng);
    placeTypeClusters(grid, 'park', 2 + Math.floor(rng() * 2), [1], rng);
  } else if (style === 'corp_clean') {
    // HQ 6×6 + два корпуса 2×2; плаза опционально
    placeCorpCampus(grid, rng);
    if (rng() > 0.55) {
      placeTypeClusters(grid, 'plaza', 1, [4], rng, { exactShapes: [PLAZA_BLOCK_SHAPE] });
    }
  } else if (style === 'chinatown') {
    placeTypeClusters(grid, 'market', 1 + Math.floor(rng() * 2), [1, 3, 4], rng);
    placeTypeClusters(grid, 'park', 1, [3, 4], rng);
    if (rng() > 0.4) placeTypeClusters(grid, 'park', 1 + Math.floor(rng() * 2), [1], rng);
  } else if (style !== 'industrial') {
    placeTypeClusters(grid, 'park', 1, [3, 4], rng);
    if (rng() > 0.4) placeTypeClusters(grid, 'park', 1 + Math.floor(rng() * 2), [1], rng);
    if (style === 'residential' && rng() > 0.55) {
      placeTypeClusters(grid, 'plaza', 1, [4], rng, { exactShapes: [PLAZA_BLOCK_SHAPE] });
    }
  }

  // Гетто: заранее 2×2-панели + неровные пятна (финальную квоту добьёт ensureShackMegaBlocks).
  if (style === 'slum') {
    placeTypeClusters(grid, 'shack', 2 + Math.floor(rng() * 2), [4], rng, {
      exactShapes: [PLAZA_BLOCK_SHAPE],
    });
    placeTypeClusters(grid, 'shack', 2 + Math.floor(rng() * 2), [3, 5], rng);
  }

  // Одна угловая парковка только в жилых (корп — квота после fill).
  if (style === 'residential') {
    setIfGeneric(grid, 1, 1, 'parking');
  }

  // Застройка вдоль дорог
  const weights = buildingWeightsForStyle(style);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]![c] !== 'generic') continue;
      if (!touchesRoad(grid, r, c)) continue;
      grid[r]![c] = pickWeighted(rng, weights);
    }
  }

  // Остаток внутренних клеток
  const fillWeights =
    style === 'slum'
      ? [
          { type: 'shack' as PlaceType, w: 3.5 },
          { type: 'house' as PlaceType, w: 1.2 },
          { type: 'secondhand' as PlaceType, w: 0.8 },
        ]
      : style === 'park_mixed'
        ? [
            { type: 'park' as PlaceType, w: 4 },
            { type: 'house' as PlaceType, w: 1 },
          ]
        : style === 'industrial'
          ? [
              { type: 'house' as PlaceType, w: 2.4 },
              { type: 'shop' as PlaceType, w: 1.1 },
              { type: 'secondhand' as PlaceType, w: 0.9 },
              { type: 'gunshop' as PlaceType, w: 0.4 },
              { type: 'shack' as PlaceType, w: 0.5 },
              { type: 'parking' as PlaceType, w: 0.1 },
            ]
          : style === 'corp_clean'
            ? [
                { type: 'hotel' as PlaceType, w: 2.2 },
                { type: 'service' as PlaceType, w: 2 },
                { type: 'corp_annex' as PlaceType, w: 1.5 },
                { type: 'shop' as PlaceType, w: 0.8 },
              ]
            : style === 'chinatown'
              ? [
                  { type: 'shop_asian' as PlaceType, w: 2.5 },
                  { type: 'house' as PlaceType, w: 1.5 },
                  { type: 'market' as PlaceType, w: 1.2 },
                  { type: 'restaurant' as PlaceType, w: 1 },
                ]
              : [
                  { type: 'house' as PlaceType, w: 2.6 },
                  { type: 'shop' as PlaceType, w: 0.7 },
                  { type: 'restaurant' as PlaceType, w: 0.5 },
                  { type: 'secondhand' as PlaceType, w: 0.4 },
                ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]![c] !== 'generic') continue;
      grid[r]![c] = pickWeighted(rng, fillWeights);
    }
  }

  placePondsInParks(grid, rng);
  promoteSideAccessJunctions(grid, rng);
  placeDistrictLandmarks(grid, style, rng);
  placePondsInParks(grid, rng);
  placeDumpsForDistrict(grid, style, isEdge, rng);
  normalizeRoadCrossings(grid);
  normalizePlazaLayout(grid);
  normalizeParkingQuota(grid, style);
  diversifyHousingBlocks(grid, style, rng);
  ensureShackMegaBlocks(grid, rng);

  return grid;
}

/** Корп-кампус: HQ 6×6 (или меньше) + два office 2×2 рядом. */
export function placeCorpCampus(grid: PlaceType[][], rng: () => number): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let hqSize = CORP_HQ_SIZE;
  while (hqSize >= 3) {
    const n = placeTypeClusters(grid, 'corp_hq', 1, [hqSize * hqSize], rng, {
      exactShapes: [hqSize === CORP_HQ_SIZE ? CORP_HQ_SHAPE : blockShapeNxN(hqSize)],
    });
    if (n > 0) break;
    hqSize--;
  }
  let offices = 0;
  offices += placeTypeClusters(grid, 'corp_office', 2, [CORP_OFFICE_SIZE * CORP_OFFICE_SIZE], rng, {
    exactShapes: [blockShapeNxN(CORP_OFFICE_SIZE)],
  });
  // annex рядом с HQ
  let annex = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]![c] !== 'generic') continue;
      const nearHq = [
        grid[r - 1]?.[c],
        grid[r + 1]?.[c],
        grid[r]?.[c - 1],
        grid[r]?.[c + 1],
      ].some((t) => t === 'corp_hq' || t === 'corp_office');
      if (!nearHq) continue;
      if (rng() > 0.55) continue;
      grid[r]![c] = 'corp_annex';
      annex++;
      if (annex >= 6) break;
    }
    if (annex >= 6) break;
  }
  return offices + annex;
}

/**
 * Разбивает однотипные пятна house/shack: хаос сохраняется, появляется чередование.
 * Не трогает дороги, парки, ориентиры.
 */
export function diversifyHousingBlocks(
  grid: PlaceType[][],
  style: DistrictStyle,
  rng: () => number
): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const housing = (t: PlaceType) => t === 'house' || t === 'shack';
  const altFor = (t: PlaceType): PlaceType[] => {
    if (style === 'slum') {
      if (t === 'shack') return ['house', 'secondhand', 'shack'];
      return ['shack', 'secondhand', 'house'];
    }
    if (style === 'industrial') {
      if (t === 'house') return ['shop', 'secondhand', 'shack', 'house'];
      if (t === 'shack') return ['house', 'secondhand'];
      return ['house', 'shop'];
    }
    if (t === 'house') return ['restaurant', 'shop', 'secondhand', 'house'];
    return ['house', 'secondhand'];
  };

  let changed = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = grid[r]![c]!;
      if (!housing(t)) continue;
      let same = 0;
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        if (grid[r + dr]?.[c + dc] === t) same++;
      }
      // 2+ одинаковых соседа → с шансом сменить на другой «бытовой» тип
      if (same < 2) continue;
      const chance = same >= 3 ? 0.72 : 0.45;
      if (rng() > chance) continue;
      const pool = altFor(t);
      const next = pool[Math.floor(rng() * pool.length)]!;
      if (next === t) continue;
      grid[r]![c] = next;
      changed++;
    }
  }
  return changed;
}

/** Свалки: только край карты; корп — 0; жилые — 1; трущобы — 2–3. Ставятся у периметра сетки. */
export function placeDumpsForDistrict(
  grid: PlaceType[][],
  style: DistrictStyle,
  isEdge: boolean,
  rng: () => number
): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // снять любые dump — дальше выставим строго по квоте
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]![c] === 'dump') {
        grid[r]![c] = style === 'slum' ? 'shack' : 'house';
      }
    }
  }

  const want = dumpQuotaForDistrict(style, isEdge, rng);
  if (want <= 0) return 0;

  const replaceable = (t: PlaceType) =>
    t === 'house' || t === 'shack' || t === 'generic' || t === 'secondhand';

  const midR = Math.floor(rows / 2);
  const midC = Math.floor(cols / 2);
  /** Внешнее кольцо квартала (не главный крест дорог). */
  const onOuterRing = (r: number, c: number) =>
    r <= 1 || r >= rows - 2 || c <= 1 || c >= cols - 2;

  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!onOuterRing(r, c)) continue;
      if (r === midR || c === midC) continue;
      if (!replaceable(grid[r]![c]!)) continue;
      candidates.push([r, c]);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  let n = 0;
  while (n < want && candidates.length > 0) {
    const [r, c] = candidates.pop()!;
    if (!replaceable(grid[r]![c]!)) continue;
    grid[r]![c] = 'dump';
    n++;
  }
  return n;
}

export function defaultDistrictTileName(
  placeType: PlaceType,
  _row: number,
  _col: number,
  counters: Map<PlaceType, number>
): string {
  if (placeType === 'exit') return 'Выход';
  if (placeType === 'road' || placeType === 'crossing' || placeType === 'bridge') {
    return PLACE_TYPE_LABELS[placeType];
  }
  const n = (counters.get(placeType) ?? 0) + 1;
  counters.set(placeType, n);
  const label = PLACE_TYPE_LABELS[placeType];
  return n === 1 ? label : `${label} ${n}`;
}

/** Минимальный контракт родителя для генерации клеток. */
export type DistrictParentSeed = {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  parentZoneKey?: string | null;
  megaDistrict?: string | null;
  corpName?: string | null;
  /** Если задан на топ-зоне — перекрывает default от zoneType. */
  districtStyle?: string | null;
};

export type DistrictTileSeed = {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: string;
  parentZoneKey: string;
  placeType: PlaceType;
  districtStyle: string;
  gridRow: number;
  gridCol: number;
  x: number;
  y: number;
  w: number;
  h: number;
  megaDistrict?: string;
  corpName?: string;
  pois: string[];
};

/** Полная сетка клеток внутри родителя (без I/O). */
export function generateDistrictGrid(parent: DistrictParentSeed): DistrictTileSeed[] {
  if (!canDrillIntoDistrict(parent)) return [];

  const { rows, cols, colWidths, rowHeights } = computeDistrictGridLayout();
  const style =
    normalizeDistrictStyle(parent.districtStyle ?? '') ?? defaultDistrictStyle(parent.zoneType);
  const isEdge = isEdgeDistrictOnCityMap(parent);
  const placeGrid = composeDistrictPlaceTypes(rows, cols, style, hashZoneSeed(parent.zoneKey), {
    isEdgeDistrict: isEdge,
  });
  const nameCounters = new Map<PlaceType, number>();
  const out: DistrictTileSeed[] = [];

  let y = PAD;
  for (let r = 0; r < rows; r++) {
    let x = PAD;
    const h = rowHeights[r]!;
    for (let c = 0; c < cols; c++) {
      const w = colWidths[c]!;
      const placeType = placeGrid[r]![c]!;
      out.push({
        zoneKey: subTileZoneKey(parent.zoneKey, r, c),
        sortOrder: parent.sortOrder + 1000 + r * cols + c,
        name: defaultDistrictTileName(placeType, r, c, nameCounters),
        zoneType: parent.zoneType,
        parentZoneKey: parent.zoneKey,
        placeType,
        districtStyle: style,
        gridRow: r,
        gridCol: c,
        x: parent.x + x,
        y: parent.y + y,
        w,
        h,
        megaDistrict: parent.megaDistrict ?? undefined,
        corpName: parent.corpName ?? undefined,
        pois: [],
      });
      x += w + GAP;
    }
    y += h + GAP;
  }
  return out;
}

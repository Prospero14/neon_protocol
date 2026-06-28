import type { DistrictStyle, PlaceType, TileNeighbors } from './districtGrid';
import { tileCenterDecay, tileDecayAmount, tileDecorSeed } from './districtGrid';

export type EdgeFlags = { n: boolean; s: boolean; e: boolean; w: boolean };

export type RoadCore = 'h' | 'v' | 'both' | 'none';

export type StyleAccent = 'chinatown_lantern' | 'industrial_pipe' | 'corp_trim';

export type TileVisualProps = {
  patternClass: string;
  fillPatternId: string | null;
  /** Стыковка асфальта — только на клетках дороги. */
  roadLinks: EdgeFlags;
  roadCore: RoadCore;
  /** Сторона, куда выходит фасад здания. */
  streetFront: EdgeFlags;
  /** Рисовать объём здания (не заливать всю клетку дорогой). */
  showBuilding: boolean;
  showFacade: boolean;
  facadeDir: 'n' | 's' | 'e' | 'w' | null;
  softBlend: boolean;
  exitGap: 'n' | 's' | 'e' | 'w' | null;
  styleAccents: StyleAccent[];
  decor: Array<'trash' | 'drunk' | 'homeless' | 'cyber_junk' | 'car' | 'tree'>;
  animate: Array<'headlights' | 'windows' | 'neon' | 'tree_sway'>;
  neonVariant: 'default' | 'chinatown';
  edgeFade: boolean;
};

const ROAD_TEXTURE: ReadonlySet<PlaceType> = new Set([
  'road',
  'bridge',
  'crossing',
  'parking',
]);

const BUILDING_TYPES: ReadonlySet<PlaceType> = new Set([
  'house',
  'restaurant',
  'shop',
  'secondhand',
  'metro',
]);

export function isRoadLike(t?: PlaceType): boolean {
  if (!t) return false;
  return t === 'road' || t === 'crossing' || t === 'bridge' || t === 'exit';
}

export function isRoadSurface(placeType: PlaceType): boolean {
  return placeType === 'road' || placeType === 'crossing' || placeType === 'bridge' || placeType === 'parking';
}

function touchesStreet(side?: PlaceType): boolean {
  return side === 'road' || side === 'crossing' || side === 'bridge' || side === 'exit';
}

/** У каких сторон здания проходит улица (узкая полоса, не вся клетка). */
export function streetFrontFor(neighbors: TileNeighbors): EdgeFlags {
  return {
    n: touchesStreet(neighbors.n),
    s: touchesStreet(neighbors.s),
    e: touchesStreet(neighbors.e),
    w: touchesStreet(neighbors.w),
  };
}

export function roadLinksFor(placeType: PlaceType, neighbors: TileNeighbors): EdgeFlags {
  if (!isRoadSurface(placeType)) {
    return { n: false, s: false, e: false, w: false };
  }
  const links = (side?: PlaceType) => {
    if (!side) return false;
    if (isRoadLike(side)) return true;
    if (placeType === 'road' && side === 'parking') return true;
    if (placeType === 'parking' && isRoadLike(side)) return true;
    if (placeType === 'bridge' && (side === 'road' || side === 'crossing')) return true;
    return false;
  };
  return {
    n: links(neighbors.n),
    s: links(neighbors.s),
    e: links(neighbors.e),
    w: links(neighbors.w),
  };
}

export function resolveRoadCore(placeType: PlaceType, links: EdgeFlags): RoadCore {
  if (placeType === 'crossing') return 'both';
  if (!isRoadSurface(placeType)) return 'none';
  const h = links.e || links.w;
  const v = links.n || links.s;
  if (h && v) return 'both';
  if (v) return 'v';
  if (h) return 'h';
  if (placeType === 'bridge') return 'h';
  return 'both';
}

export function exitGapDirection(
  row: number,
  col: number,
  rows: number,
  _cols: number
): 'n' | 's' | 'e' | 'w' {
  const onN = row === 0;
  const onS = row >= rows - 1;
  const onW = col === 0;
  if (onN) return 'n';
  if (onS) return 's';
  if (onW) return 'w';
  return 'e';
}

export function districtFillPatternId(placeType: PlaceType, districtStyle: DistrictStyle): string | null {
  if (!ROAD_TEXTURE.has(placeType) && placeType !== 'alley' && placeType !== 'park' && placeType !== 'plaza') {
    return null;
  }
  return `ndi-${placeType}-${districtStyle}`;
}

function facadeDirection(neighbors: TileNeighbors): 'n' | 's' | 'e' | 'w' | null {
  if (touchesStreet(neighbors.s)) return 's';
  if (touchesStreet(neighbors.n)) return 'n';
  if (touchesStreet(neighbors.w)) return 'w';
  if (touchesStreet(neighbors.e)) return 'e';
  return null;
}

export function resolveTileVisual(input: {
  placeType: PlaceType;
  districtStyle: DistrictStyle;
  zoneKey: string;
  gridRow: number;
  gridCol: number;
  gridRows: number;
  gridCols: number;
  neighbors: TileNeighbors;
}): TileVisualProps {
  const { placeType, districtStyle, zoneKey, gridRow, gridCol, gridRows, gridCols, neighbors } = input;
  const decay = tileCenterDecay(gridRow, gridCol, gridRows, gridCols);
  const dirt = tileDecayAmount(decay, districtStyle, placeType);
  const seed = tileDecorSeed(zoneKey);
  const decor: TileVisualProps['decor'] = [];
  const animate: TileVisualProps['animate'] = [];
  const styleAccents: StyleAccent[] = [];
  const streetFront = streetFrontFor(neighbors);

  const patternClass = `nri-district-tile--${placeType} nri-district-tile--style-${districtStyle}`;
  const roadLinks = roadLinksFor(placeType, neighbors);
  const roadCore = resolveRoadCore(placeType, roadLinks);

  const showBuilding =
    BUILDING_TYPES.has(placeType) || (placeType === 'generic' && seed % 3 !== 0);

  if (placeType === 'road' || placeType === 'parking') {
    if (seed % 4 !== 0) decor.push('car');
    if (seed % 2 === 0) animate.push('headlights');
  }
  if (placeType === 'house' || (placeType === 'generic' && showBuilding)) {
    animate.push('windows');
  }
  if (placeType === 'restaurant' || placeType === 'shop' || placeType === 'secondhand') {
    animate.push('neon');
  }
  if (placeType === 'park') {
    decor.push('tree');
    if (seed % 2 === 0) animate.push('tree_sway');
  }
  if ((placeType === 'alley' || placeType === 'generic') && districtStyle !== 'corp_clean') {
    if (dirt > 0.55 && seed % 4 === 0) decor.push('trash');
    if (dirt > 0.7 && seed % 7 === 0) decor.push('homeless');
    if (dirt > 0.75 && seed % 9 === 0) decor.push('drunk');
    if (dirt > 0.5 && districtStyle === 'slum' && seed % 5 === 0) decor.push('cyber_junk');
  }

  if (districtStyle === 'chinatown' && ['restaurant', 'shop', 'alley'].includes(placeType)) {
    styleAccents.push('chinatown_lantern');
  }
  if (districtStyle === 'industrial' && ['generic', 'house'].includes(placeType) && seed % 2 === 0) {
    styleAccents.push('industrial_pipe');
  }
  if (districtStyle === 'corp_clean' && ['house', 'shop', 'restaurant'].includes(placeType)) {
    styleAccents.push('corp_trim');
  }

  const showFacade =
    BUILDING_TYPES.has(placeType) || (placeType === 'generic' && showBuilding);
  const facadeDir = showFacade ? facadeDirection(neighbors) : null;
  const exitGap =
    placeType === 'exit' ? exitGapDirection(gridRow, gridCol, gridRows, gridCols) : null;

  return {
    patternClass,
    fillPatternId: districtFillPatternId(placeType, districtStyle),
    roadLinks,
    roadCore,
    streetFront,
    showBuilding,
    showFacade,
    facadeDir,
    softBlend: placeType === 'park' || placeType === 'plaza',
    exitGap,
    styleAccents,
    decor,
    animate,
    neonVariant: districtStyle === 'chinatown' ? 'chinatown' : 'default',
    edgeFade: placeType === 'exit',
  };
}

export function tileAnimationCost(visual: Pick<TileVisualProps, 'animate' | 'decor'>): number {
  return visual.animate.length > 0 ? 1 : 0;
}

/** Доля клетки под корпус здания (остальное — двор/тротуар/улица). */
export function buildingBodyRect(
  facadeDir: 'n' | 's' | 'e' | 'w' | null,
  placeType: PlaceType
): { x: number; y: number; w: number; h: number } {
  const pad = placeType === 'shop' || placeType === 'restaurant' ? 0.06 : 0.1;
  const depth = placeType === 'metro' ? 0.88 : 0.78;
  if (facadeDir === 'n') return { x: pad, y: pad + 0.14, w: 1 - pad * 2, h: depth - 0.14 };
  if (facadeDir === 's') return { x: pad, y: pad, w: 1 - pad * 2, h: depth - 0.14 };
  if (facadeDir === 'w') return { x: pad + 0.14, y: pad, w: depth - 0.14, h: 1 - pad * 2 };
  if (facadeDir === 'e') return { x: pad, y: pad, w: depth - 0.14, h: 1 - pad * 2 };
  return { x: 0.14, y: 0.14, w: 0.72, h: 0.72 };
}

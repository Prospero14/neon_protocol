/** Связи exit-клеток с соседними районами (A2 roadmap). */

export type GridLayout = { rows: number; cols: number };

export type ZoneLinkTarget = {
  zoneKey: string;
  label?: string;
  travelMinutes?: number;
};

export type ZoneBounds = {
  zoneKey: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  parentZoneKey?: string | null;
  placeType?: string | null;
  gridRow?: number | null;
  gridCol?: number | null;
};

const EPS = 0.75;

function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 - EPS && b0 < a1 - EPS;
}

function zoneCenter(z: ZoneBounds): { x: number; y: number } {
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

export function travelMinutesBetween(from: ZoneBounds | null, to: ZoneBounds): number {
  if (!from) return 15;
  const a = zoneCenter(from);
  const b = zoneCenter(to);
  const dist = Math.hypot(a.x - b.x, a.y - b.y);
  return Math.max(5, Math.min(180, Math.round(dist * 1.35)));
}

export type ExitEdge = 'north' | 'south' | 'east' | 'west';

/** На какой стороне сетки находится exit-клетка. */
export function exitEdgeForTile(gridRow: number, gridCol: number, layout: GridLayout): ExitEdge | null {
  const { rows, cols } = layout;
  const midC = Math.floor(cols / 2);
  const midR = Math.floor(rows / 2);
  if (gridRow === 0 && gridCol === midC) return 'north';
  if (gridRow === rows - 1 && gridCol === midC) return 'south';
  if (gridCol === 0 && gridRow === midR) return 'west';
  if (gridCol === cols - 1 && gridRow === midR) return 'east';
  return null;
}

function oppositeEdge(edge: ExitEdge): ExitEdge {
  switch (edge) {
    case 'north':
      return 'south';
    case 'south':
      return 'north';
    case 'east':
      return 'west';
    case 'west':
      return 'east';
  }
}

export type ZoneBoundsWithType = ZoneBounds & { zoneType?: string };

function isDrillableTopZone(z: ZoneBoundsWithType): boolean {
  if (z.parentZoneKey) return false;
  return !['highway', 'overpass', 'tunnel', 'meta'].includes(z.zoneType ?? '');
}

export function findAdjacentDistrict(
  parent: ZoneBoundsWithType,
  edge: ExitEdge,
  topZones: ZoneBoundsWithType[]
): ZoneBoundsWithType | null {
  const candidates = topZones.filter(
    (z) => z.zoneKey !== parent.zoneKey && isDrillableTopZone(z)
  );
  for (const other of candidates) {
    if (edge === 'north' && Math.abs(other.y + other.h - parent.y) < EPS && rangesOverlap(other.x, other.x + other.w, parent.x, parent.x + parent.w)) {
      return other;
    }
    if (edge === 'south' && Math.abs(other.y - (parent.y + parent.h)) < EPS && rangesOverlap(other.x, other.x + other.w, parent.x, parent.x + parent.w)) {
      return other;
    }
    if (edge === 'west' && Math.abs(other.x + other.w - parent.x) < EPS && rangesOverlap(other.y, other.y + other.h, parent.y, parent.y + parent.h)) {
      return other;
    }
    if (edge === 'east' && Math.abs(other.x - (parent.x + parent.w)) < EPS && rangesOverlap(other.y, other.y + other.h, parent.y, parent.y + parent.h)) {
      return other;
    }
  }
  return null;
}

export function findMatchingExitTile(
  districtKey: string,
  edge: ExitEdge,
  layout: GridLayout,
  siblingTiles: ZoneBounds[]
): ZoneBounds | null {
  for (const t of siblingTiles) {
    if (t.parentZoneKey !== districtKey || t.placeType !== 'exit') continue;
    const gr = t.gridRow ?? -1;
    const gc = t.gridCol ?? -1;
    if (exitEdgeForTile(gr, gc, layout) === edge) return t;
  }
  return null;
}

export function parseStoredLinksTo(raw: unknown): ZoneLinkTarget[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: ZoneLinkTarget[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as ZoneLinkTarget;
    if (typeof o.zoneKey !== 'string' || !o.zoneKey.trim()) continue;
    out.push({
      zoneKey: o.zoneKey.trim(),
      label: typeof o.label === 'string' ? o.label : undefined,
      travelMinutes: typeof o.travelMinutes === 'number' ? o.travelMinutes : undefined,
    });
  }
  return out.length > 0 ? out : null;
}

/** Вычислить связь для exit-клетки, если в БД нет linksTo. */
export function computeExitLink(
  tile: ZoneBounds,
  parent: ZoneBoundsWithType,
  layout: GridLayout,
  topZones: ZoneBoundsWithType[],
  neighborSubTiles: ZoneBounds[]
): ZoneLinkTarget | null {
  if (tile.placeType !== 'exit') return null;
  const gr = tile.gridRow ?? -1;
  const gc = tile.gridCol ?? -1;
  const edge = exitEdgeForTile(gr, gc, layout);
  if (!edge) return null;

  const neighborDistrict = findAdjacentDistrict(parent, edge, topZones);
  if (!neighborDistrict) return null;

  const destEdge = oppositeEdge(edge);
  const destTile = findMatchingExitTile(neighborDistrict.zoneKey, destEdge, layout, neighborSubTiles);
  const target = destTile ?? neighborDistrict;
  const minutes = travelMinutesBetween(parent, target);

  return {
    zoneKey: target.zoneKey,
    label: neighborDistrict.name,
    travelMinutes: minutes,
  };
}

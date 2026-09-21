/** Metro graph: lines, stations, edges, pathfinding, travel time. */

export type MetroPoint = { x: number; y: number };

export type MetroLine = {
  id: string;
  name: string;
  color: string;
};

export type MetroStation = {
  id: string;
  name: string;
  x: number;
  y: number;
  lineIds: string[];
  districtZoneKey: string | null;
};

export type MetroEdge = {
  id: string;
  lineId: string;
  fromStationId: string;
  toStationId: string;
  /** Master override; if null, derive from distance. */
  travelSeconds: number | null;
};

export type MetroShop = {
  id: string;
  stationId: string;
  label: string;
  catalogIds: string[];
};

export const METRO_ZONE_PREFIX = 'metro:';

export function metroZoneKey(stationId: string): string {
  return `${METRO_ZONE_PREFIX}${stationId}`;
}

export function parseMetroStationId(zoneKey: string | null | undefined): string | null {
  if (!zoneKey || !zoneKey.startsWith(METRO_ZONE_PREFIX)) return null;
  const id = zoneKey.slice(METRO_ZONE_PREFIX.length).trim();
  return id || null;
}

export function distMapUnits(a: MetroPoint, b: MetroPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Default ride duration from map distance (viewBox 240×165). */
export function defaultTravelSeconds(from: MetroPoint, to: MetroPoint): number {
  const d = distMapUnits(from, to);
  return Math.max(8, Math.round(12 + d * 1.8));
}

export function edgeTravelSeconds(
  edge: MetroEdge,
  stations: Map<string, MetroStation>
): number {
  if (edge.travelSeconds != null && edge.travelSeconds > 0) return edge.travelSeconds;
  const a = stations.get(edge.fromStationId);
  const b = stations.get(edge.toStationId);
  if (!a || !b) return 30;
  return defaultTravelSeconds(a, b);
}

export type MetroPathHop = {
  fromStationId: string;
  toStationId: string;
  edgeId: string;
  lineId: string;
  seconds: number;
};

export type MetroPathResult =
  | { ok: true; hops: MetroPathHop[]; totalSeconds: number }
  | { ok: false; error: string };

/** BFS shortest path by hop count; ties broken by lower total seconds. */
export function findMetroPath(
  fromStationId: string,
  toStationId: string,
  stations: MetroStation[],
  edges: MetroEdge[]
): MetroPathResult {
  if (fromStationId === toStationId) {
    return { ok: true, hops: [], totalSeconds: 0 };
  }
  const byId = new Map(stations.map((s) => [s.id, s]));
  if (!byId.has(fromStationId) || !byId.has(toStationId)) {
    return { ok: false, error: 'Станция не найдена.' };
  }

  type Adj = { to: string; edge: MetroEdge; sec: number };
  const adj = new Map<string, Adj[]>();
  for (const e of edges) {
    const sec = edgeTravelSeconds(e, byId);
    const a = adj.get(e.fromStationId) ?? [];
    a.push({ to: e.toStationId, edge: e, sec });
    adj.set(e.fromStationId, a);
    const b = adj.get(e.toStationId) ?? [];
    b.push({ to: e.fromStationId, edge: e, sec });
    adj.set(e.toStationId, b);
  }

  type Node = { id: string; hops: MetroPathHop[]; total: number };
  const queue: Node[] = [{ id: fromStationId, hops: [], total: 0 }];
  const best = new Map<string, { hops: number; total: number }>();
  best.set(fromStationId, { hops: 0, total: 0 });

  let winner: Node | null = null;

  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.id === toStationId) {
      if (
        !winner ||
        cur.hops.length < winner.hops.length ||
        (cur.hops.length === winner.hops.length && cur.total < winner.total)
      ) {
        winner = cur;
      }
      continue;
    }
    const known = best.get(cur.id);
    if (known && (cur.hops.length > known.hops || (cur.hops.length === known.hops && cur.total > known.total))) {
      continue;
    }
    for (const n of adj.get(cur.id) ?? []) {
      const hop: MetroPathHop = {
        fromStationId: cur.id,
        toStationId: n.to,
        edgeId: n.edge.id,
        lineId: n.edge.lineId,
        seconds: n.sec,
      };
      const next: Node = {
        id: n.to,
        hops: [...cur.hops, hop],
        total: cur.total + n.sec,
      };
      const prev = best.get(n.to);
      if (
        prev &&
        (next.hops.length > prev.hops || (next.hops.length === prev.hops && next.total >= prev.total))
      ) {
        continue;
      }
      best.set(n.to, { hops: next.hops.length, total: next.total });
      queue.push(next);
    }
  }

  if (!winner) return { ok: false, error: 'Нет маршрута между станциями.' };
  return { ok: true, hops: winner.hops, totalSeconds: winner.total };
}

export function neighborStationIds(stationId: string, edges: MetroEdge[]): string[] {
  const out = new Set<string>();
  for (const e of edges) {
    if (e.fromStationId === stationId) out.add(e.toStationId);
    if (e.toStationId === stationId) out.add(e.fromStationId);
  }
  return [...out];
}

export const LAMP_COLOR_PRESETS = [
  { id: 'amber', color: '#ffb040', label: 'Янтарный' },
  { id: 'warm', color: '#ffd078', label: 'Тёплый' },
  { id: 'orange', color: '#ff7a2f', label: 'Оранжевый' },
  { id: 'red', color: '#ff4040', label: 'Красный' },
  { id: 'rose', color: '#ff6b9a', label: 'Розовый' },
  { id: 'magenta', color: '#ff4dc8', label: 'Магента' },
  { id: 'violet', color: '#b48cff', label: 'Фиолетовый' },
  { id: 'blue', color: '#4a7dff', label: 'Синий' },
  { id: 'cyan', color: '#4de8ff', label: 'Циан' },
  { id: 'teal', color: '#2ee6c5', label: 'Бирюза' },
  { id: 'green', color: '#5cff8a', label: 'Зелёный' },
  { id: 'lime', color: '#c8ff4d', label: 'Лайм' },
  { id: 'white', color: '#f0f4ff', label: 'Белый' },
  { id: 'cold', color: '#c8d8ff', label: 'Холодный' },
] as const;

/** Default metro shop catalog ids (exist in shared catalog). */
export const DEFAULT_METRO_SHOP_CATALOG = [
  'g_medkit',
  'g_trauma_injector',
  'g_flashbang',
  'g_underhive_passport',
] as const;

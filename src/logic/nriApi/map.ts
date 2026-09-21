/** Map zones, markers, travel */

import { generateNeonCityZones } from '../nriNeonCityMapGen.js';
import { generateDistrictGrid } from '../nriNeonCitySubzonesGen.js';
import { canDrillIntoDistrict } from '../../../shared/nri-domain/mapZones.js';
import { resolveCityScale } from '../../../shared/nri-domain/cityScale.js';
import type { ZoneLinkTarget } from '../../../shared/nri-domain/exitLinks.js';
import type { PopulationBand } from '../../../shared/nri-domain/cityScale.js';
import type { NriPlayerPosition } from '../nriLore';
import { nriAuthHeaders, nriParseJson, parseNriApiError, nriSafeFetch, NRI_NETWORK_ERROR, NRI_PATCH_TIMEOUT_MS } from './http.js';

const parseJson = nriParseJson;
const authHeaders = nriAuthHeaders;
const parseApiError = parseNriApiError;

export type NriMapMarker = {
  id: string;
  label: string;
  blurb: string | null;
  x: number;
  y: number;
  kind: 'host' | 'player';
  ownerUserId: string | null;
  ownerName: string | null;
  createdAt: number;
};

export type NriMapZone = {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  parentZoneKey?: string | null;
  placeType?: string | null;
  districtStyle?: string | null;
  gridRow?: number | null;
  gridCol?: number | null;
  rotation?: number;
  subTileCount?: number;
  megaDistrict?: string | null;
  corpName: string | null;
  locked: boolean;
  pois: string[];
  color: string | null;
  iconId?: string | null;
  artId?: string | null;
  updatedAt: number;
  populationBand?: PopulationBand | null;
  densityLabel?: string | null;
  trafficLevel?: number | null;
  nightlifeLevel?: number | null;
  linksTo?: ZoneLinkTarget[];
};

export type NriMapView = { w: number; h: number };

export type NriMapZonesResult =
  | { ok: true; zones: NriMapZone[]; view: NriMapView }
  | { ok: false; error: string };

/** Подтягивает x/y/w/h верхнего уровня из канона (только для offline fallback / миграций — не на live API). */
export function applyCanonCityGeometry(zones: NriMapZone[]): NriMapZone[] {
  const canon = new Map(
    generateNeonCityZones()
      .filter((z) => !z.parentZoneKey)
      .map((z) => [z.zoneKey, { x: z.x, y: z.y, w: z.w, h: z.h }] as const)
  );
  return zones.map((z) => {
    const g = canon.get(z.zoneKey);
    return g ? { ...z, ...g } : z;
  });
}

/** Локальная схема города, если API недоступен или вернул пустой список. */
export function nriFallbackCityZones(): NriMapZone[] {
  return generateNeonCityZones()
    .filter((z) => !z.parentZoneKey)
    .map((s) => {
      const scale = resolveCityScale({ zoneType: s.zoneType });
      return {
        zoneKey: s.zoneKey,
        sortOrder: s.sortOrder,
        name: s.name,
        zoneType: s.zoneType,
        x: s.x,
        y: s.y,
        w: s.w,
        h: s.h,
        parentZoneKey: null,
        placeType: s.placeType ?? null,
        districtStyle: s.districtStyle ?? null,
        gridRow: s.gridRow ?? null,
        gridCol: s.gridCol ?? null,
        corpName: s.corpName ?? null,
        locked: s.locked ?? false,
        pois: s.pois ?? [],
        color: null,
        iconId: null,
        megaDistrict: s.megaDistrict ?? null,
        subTileCount: canDrillIntoDistrict(s) ? generateDistrictGrid(s).length : 0,
        updatedAt: 0,
        ...scale,
        linksTo: [],
      };
    });
}

/** Локальная сетка клеток района, если API недоступен. */
export function nriFallbackDistrictTiles(parent: NriMapZone): NriMapZone[] {
  const seed =
    generateNeonCityZones().find((z) => z.zoneKey === parent.zoneKey) ??
    ({
      zoneKey: parent.zoneKey,
      sortOrder: parent.sortOrder,
      name: parent.name,
      zoneType: parent.zoneType as import('../nriNeonCityMapGen.js').MapZoneType,
      x: parent.x,
      y: parent.y,
      w: parent.w,
      h: parent.h,
      megaDistrict: parent.megaDistrict ?? undefined,
    } as const);
  return generateDistrictGrid(seed).map((s) => ({
    zoneKey: s.zoneKey,
    sortOrder: s.sortOrder,
    name: s.name,
    zoneType: s.zoneType,
    x: s.x,
    y: s.y,
    w: s.w,
    h: s.h,
    parentZoneKey: parent.zoneKey,
    placeType: s.placeType ?? 'generic',
    districtStyle: s.districtStyle ?? null,
    gridRow: s.gridRow ?? null,
    gridCol: s.gridCol ?? null,
    corpName: s.corpName ?? null,
    locked: false,
    pois: s.pois ?? [],
    color: null,
    iconId: null,
    megaDistrict: s.megaDistrict ?? parent.megaDistrict ?? null,
    updatedAt: 0,
    linksTo: [],
  }));
}

export async function nriFetchMapZones(
  token: string,
  code: string,
  opts?: { parentZoneKey?: string }
): Promise<NriMapZonesResult> {
  const qs = opts?.parentZoneKey ? `?parent=${encodeURIComponent(opts.parentZoneKey)}` : '';
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones${qs}`, {
    headers: authHeaders(token),
  });
  if (!out) {
    return { ok: false, error: NRI_NETWORK_ERROR };
  }
  const { res, data } = out;
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось загрузить районы карты.') };
  }
  return {
    ok: true,
    zones: (data.zones ?? []) as NriMapZone[],
    view: (data.view ?? { w: 240, h: 165 }) as NriMapView,
  };
}

type MapZonePatchResult = { ok: true; zone: NriMapZone } | { ok: false; error: string };

export const NRI_TIMEOUT_ERROR =
  'Таймаут запроса — сервер занят. Подождите пару секунд и повторите.';

export async function nriPatchMapZone(
  token: string,
  code: string,
  zoneKey: string,
  payload: {
    name?: string;
    corpName?: string | null;
    megaDistrict?: string;
    pois?: string[];
    color?: string | null;
    iconId?: string | null;
    placeType?: string;
    districtStyle?: string | null;
    rotation?: number;
    swapWithZoneKey?: string;
    artId?: string | null;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    zoneType?: string;
  }
): Promise<MapZonePatchResult> {
  const url = `/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones/${encodeURIComponent(zoneKey)}`;
  const init: RequestInit = {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 350 * attempt));
    }
    const out = await nriSafeFetch(url, init, { timeoutMs: NRI_PATCH_TIMEOUT_MS });
    if (!out) {
      if (attempt < 2) continue;
      return { ok: false, error: NRI_TIMEOUT_ERROR };
    }
    const { res, data } = out;
    if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить район') };
    if (!data.zone) return { ok: false, error: 'Сервер не вернул район' };
    return { ok: true, zone: data.zone as NriMapZone };
  }
  return { ok: false, error: NRI_TIMEOUT_ERROR };
}

export async function nriCreateMapSubZone(
  token: string,
  code: string,
  payload: { parentZoneKey: string; name: string; zoneType?: string; slug?: string }
): Promise<MapZonePatchResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать сабзону') };
  if (!data.zone) return { ok: false, error: 'Сервер не вернул сабзону' };
  return { ok: true, zone: data.zone };
}

export async function nriCreateMapTopZone(
  token: string,
  code: string,
  payload: {
    name: string;
    zoneType?: string;
    slug?: string;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    artId?: string | null;
    color?: string | null;
    megaDistrict?: string | null;
  }
): Promise<MapZonePatchResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать район') };
  if (!data.zone) return { ok: false, error: 'Сервер не вернул район' };
  return { ok: true, zone: data.zone as NriMapZone };
}

export async function nriRegenDistrictTiles(
  token: string,
  code: string,
  parentZoneKey: string
): Promise<
  | { ok: true; count: number; zones: NriMapZone[]; view: NriMapView }
  | { ok: false; error: string }
> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones/${encodeURIComponent(parentZoneKey)}/regen`,
    { method: 'POST', headers: authHeaders(token) }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось перегенерировать квартал') };
  return {
    ok: true,
    count: typeof data.count === 'number' ? data.count : 0,
    zones: Array.isArray(data.zones) ? (data.zones as NriMapZone[]) : [],
    view: (data.view as NriMapView) ?? { w: 240, h: 165 },
  };
}

export async function nriClearDistrictTiles(
  token: string,
  code: string,
  parentZoneKey: string
): Promise<
  | { ok: true; count: number; zones: NriMapZone[]; view: NriMapView }
  | { ok: false; error: string }
> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones/${encodeURIComponent(parentZoneKey)}/clear`,
    { method: 'POST', headers: authHeaders(token) }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось очистить квартал') };
  return {
    ok: true,
    count: typeof data.count === 'number' ? data.count : 0,
    zones: Array.isArray(data.zones) ? (data.zones as NriMapZone[]) : [],
    view: (data.view as NriMapView) ?? { w: 240, h: 165 },
  };
}

export type NriMapLamp = {
  id: string;
  x: number;
  y: number;
  color: string;
  on: boolean;
  radius: number;
  layer: string;
  parentZoneKey: string | null;
  createdAt: number;
};

export type NriMetroLineDto = { id: string; name: string; color: string; sortOrder: number };
export type NriMetroStationDto = {
  id: string;
  name: string;
  x: number;
  y: number;
  lineId: string;
  lineIds: string[];
  districtZoneKey: string | null;
};
export type NriMetroEdgeDto = {
  id: string;
  lineId: string;
  fromStationId: string;
  toStationId: string;
  travelSeconds: number | null;
};
export type NriMetroShopDto = {
  id: string;
  stationId: string;
  label: string;
  catalogIds: string[];
};

export type NriUnderhivePayload = {
  label: string;
  districtFrames: Array<{
    zoneKey: string;
    name: string;
    zoneType: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string | null;
  }>;
  corpUndergrounds: Array<{
    sourceZoneKey: string;
    corpName: string | null;
    name: string;
    zoneType: string;
    x: number;
    y: number;
    w: number;
    h: number;
    theme: {
      id: string;
      primary: string;
      secondary: string;
      accent: string;
      glow: string;
      label: string;
      abbrev: string;
    };
  }>;
  metro: {
    lines: NriMetroLineDto[];
    stations: NriMetroStationDto[];
    edges: NriMetroEdgeDto[];
    shops: NriMetroShopDto[];
  };
  lamps: NriMapLamp[];
};

export async function nriFetchUnderhive(
  token: string,
  code: string
): Promise<{ ok: true; data: NriUnderhivePayload } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/underhive`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Подулей недоступен') };
  return {
    ok: true,
    data: {
      label: typeof data.label === 'string' ? data.label : 'Подулей / Underhive',
      districtFrames: Array.isArray(data.districtFrames) ? data.districtFrames : [],
      corpUndergrounds: Array.isArray(data.corpUndergrounds) ? data.corpUndergrounds : [],
      metro: {
        lines: Array.isArray(data.metro?.lines) ? data.metro.lines : [],
        stations: Array.isArray(data.metro?.stations) ? data.metro.stations : [],
        edges: Array.isArray(data.metro?.edges) ? data.metro.edges : [],
        shops: Array.isArray(data.metro?.shops) ? data.metro.shops : [],
      },
      lamps: Array.isArray(data.lamps) ? data.lamps : [],
    },
  };
}

export async function nriFetchMapLamps(
  token: string,
  code: string,
  layer?: string
): Promise<NriMapLamp[]> {
  const qs = layer ? `?layer=${encodeURIComponent(layer)}` : '';
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/lamps${qs}`, {
    headers: authHeaders(token),
  });
  if (!out || !out.res.ok) return [];
  return (out.data.lamps as NriMapLamp[]) ?? [];
}

export async function nriCreateMapLamp(
  token: string,
  code: string,
  payload: {
    x: number;
    y: number;
    color?: string;
    on?: boolean;
    radius?: number;
    layer?: string;
    parentZoneKey?: string | null;
  }
): Promise<{ ok: true; lamp: NriMapLamp } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/lamps`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось поставить фонарь') };
  if (!data.lamp) return { ok: false, error: 'Сервер не вернул фонарь' };
  return { ok: true, lamp: data.lamp };
}

export async function nriPatchMapLamp(
  token: string,
  code: string,
  lampId: string,
  payload: { color?: string; on?: boolean; radius?: number; x?: number; y?: number }
): Promise<{ ok: true; lamp: NriMapLamp } | { ok: false; error: string }> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/lamps/${encodeURIComponent(lampId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(payload) }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить фонарь') };
  if (!data.lamp) return { ok: false, error: 'Сервер не вернул фонарь' };
  return { ok: true, lamp: data.lamp };
}

export async function nriDeleteMapLamp(token: string, code: string, lampId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/lamps/${encodeURIComponent(lampId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriCreateMetroLine(
  token: string,
  code: string,
  payload?: { name?: string; color?: string }
): Promise<{ ok: true; line: NriMetroLineDto } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/lines`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload ?? {}),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать ветку') };
  if (!data.line) return { ok: false, error: 'Нет ветки' };
  return { ok: true, line: data.line };
}

export async function nriCreateMetroStation(
  token: string,
  code: string,
  payload: {
    lineId: string;
    name?: string;
    x: number;
    y: number;
    districtZoneKey?: string | null;
    connectFromStationId?: string | null;
    travelSeconds?: number | null;
  }
): Promise<
  | { ok: true; station: NriMetroStationDto; edge: NriMetroEdgeDto | null }
  | { ok: false; error: string }
> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/stations`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать станцию') };
  if (!data.station) return { ok: false, error: 'Нет станции' };
  return { ok: true, station: data.station, edge: data.edge ?? null };
}

export async function nriDeleteMetroStation(
  token: string,
  code: string,
  stationId: string
): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/stations/${encodeURIComponent(stationId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriMetroEnter(
  token: string,
  code: string,
  stationId: string
): Promise<
  | { ok: true; station: NriMetroStationDto; neighbors: NriMetroStationDto[]; zoneKey: string }
  | { ok: false; error: string }
> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/enter`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ stationId }),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось войти на станцию') };
  return {
    ok: true,
    station: data.station,
    neighbors: Array.isArray(data.neighbors) ? data.neighbors : [],
    zoneKey: data.zoneKey,
  };
}

export async function nriMetroRide(
  token: string,
  code: string,
  toStationId: string
): Promise<
  | {
      ok: true;
      ride: {
        id: string;
        fromStationId: string;
        toStationId: string;
        totalSeconds: number;
        startedAt: number;
        arriveAt: number;
      };
    }
  | { ok: false; error: string }
> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/ride`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ toStationId }),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось начать поездку') };
  return { ok: true, ride: data.ride };
}

export async function nriMetroRideComplete(
  token: string,
  code: string,
  rideId: string
): Promise<
  | { ok: true; station?: NriMetroStationDto; neighbors?: NriMetroStationDto[]; zoneKey?: string }
  | { ok: false; error: string }
> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/ride/${encodeURIComponent(rideId)}/complete`,
    { method: 'POST', headers: authHeaders(token) }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось завершить поездку') };
  return { ok: true, station: data.station, neighbors: data.neighbors, zoneKey: data.zoneKey };
}

export async function nriMetroRideActive(
  token: string,
  code: string
): Promise<{
  ride: {
    id: string;
    fromStationId: string;
    toStationId: string;
    totalSeconds: number;
    startedAt: number;
    arriveAt: number;
    remainingMs: number;
  } | null;
}> {
  const out = await nriSafeFetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/ride/active`,
    { headers: authHeaders(token) }
  );
  if (!out || !out.res.ok) return { ride: null };
  const ride = out.data.ride;
  if (!ride || typeof ride !== 'object' || typeof (ride as { id?: unknown }).id !== 'string') {
    return { ride: null };
  }
  const r = ride as {
    id: string;
    fromStationId: string;
    toStationId: string;
    totalSeconds: number;
    startedAt: number;
    arriveAt: number;
    remainingMs: number;
  };
  return { ride: r };
}

export async function nriCreateMetroShop(
  token: string,
  code: string,
  payload: { stationId: string; label?: string; catalogIds?: string[] }
): Promise<{ ok: true; shop: NriMetroShopDto } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/shops`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать лавку') };
  if (!data.shop) return { ok: false, error: 'Нет лавки' };
  return { ok: true, shop: data.shop };
}

export async function nriMetroShopBuy(
  token: string,
  code: string,
  shopId: string,
  catalogId: string
): Promise<{ ok: true; item: unknown; price: number; wonlongs: number } | { ok: false; error: string }> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/metro/shops/${encodeURIComponent(shopId)}/buy`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ catalogId }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось купить') };
  return { ok: true, item: data.item, price: data.price ?? 0, wonlongs: data.wonlongs ?? 0 };
}

export async function nriDeleteMapSubZone(
  token: string,
  code: string,
  zoneKey: string,
  opts?: { confirmName?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const qs =
    opts?.confirmName != null && opts.confirmName !== ''
      ? `?confirmName=${encodeURIComponent(opts.confirmName)}`
      : '';
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones/${encodeURIComponent(zoneKey)}${qs}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
      body: opts?.confirmName != null ? JSON.stringify({ confirmName: opts.confirmName }) : undefined,
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось удалить зону') };
  return { ok: true };
}

export async function nriFetchMapMarkers(token: string, code: string): Promise<NriMapMarker[] | null> {
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/markers`, {
    headers: authHeaders(token),
  });
  if (!out || !out.res.ok) return null;
  return (out.data.markers as NriMapMarker[]) ?? [];
}

type MapMarkerResult = { ok: true; marker: NriMapMarker } | { ok: false; error: string };

export async function nriCreateMapMarker(
  token: string,
  code: string,
  payload: { label: string; blurb?: string; x: number; y: number; kind?: string }
): Promise<MapMarkerResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/markers`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось поставить метку') };
  if (!data.marker) return { ok: false, error: 'Сервер не вернул метку' };
  return { ok: true, marker: data.marker };
}

export async function nriDeleteMapMarker(token: string, code: string, markerId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/markers/${encodeURIComponent(markerId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriFetchMapPositions(token: string, code: string): Promise<NriPlayerPosition[]> {
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/positions`, {
    headers: authHeaders(token),
  });
  if (!out || !out.res.ok) return [];
  return (out.data.positions ?? []) as NriPlayerPosition[];
}

export async function nriMoveToZone(
  token: string,
  code: string,
  payload: { zoneKey: string; vehicleId?: string | null; overload?: boolean }
): Promise<
  | { ok: true; minutes: number; message: string; newAchievements?: import('./players.js').NriAchievementUnlock[] }
  | { ok: false; error: string }
> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/move`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось переместиться') };
  return {
    ok: true,
    minutes: data.minutes ?? 0,
    message: data.message ?? '',
    newAchievements: Array.isArray(data.newAchievements) ? data.newAchievements : undefined,
  };
}

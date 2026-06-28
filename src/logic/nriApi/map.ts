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
  subTileCount?: number;
  megaDistrict?: string | null;
  corpName: string | null;
  locked: boolean;
  pois: string[];
  color: string | null;
  iconId?: string | null;
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

/** Подтягивает x/y/w/h верхнего уровня из канона (актуально для corp grid после правок layout). */
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
    locked: s.locked ?? false,
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

export async function nriDeleteMapSubZone(
  token: string,
  code: string,
  zoneKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones/${encodeURIComponent(zoneKey)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось удалить сабзону') };
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

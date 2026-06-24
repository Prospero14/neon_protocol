/** Map zones, markers, travel */

import type { NriPlayerPosition } from '../nriLore';
import { nriAuthHeaders, nriParseJson, parseNriApiError } from './http.js';

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
  megaDistrict?: string | null;
  corpName: string | null;
  locked: boolean;
  pois: string[];
  color: string | null;
  iconId?: string | null;
  updatedAt: number;
};

export type NriMapView = { w: number; h: number };

export type NriMapZonesResult =
  | { ok: true; zones: NriMapZone[]; view: NriMapView }
  | { ok: false; error: string };

export async function nriFetchMapZones(token: string, code: string): Promise<NriMapZonesResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones`, {
    headers: authHeaders(token),
  });
  const data = (await parseJson(res)) as Record<string, unknown>;
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

export async function nriPatchMapZone(
  token: string,
  code: string,
  zoneKey: string,
  payload: { name?: string; corpName?: string | null; megaDistrict?: string; pois?: string[]; color?: string | null; iconId?: string | null }
): Promise<MapZonePatchResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones/${encodeURIComponent(zoneKey)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить район') };
  if (!data.zone) return { ok: false, error: 'Сервер не вернул район' };
  return { ok: true, zone: data.zone };
}

export async function nriFetchMapMarkers(token: string, code: string): Promise<NriMapMarker[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/markers`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.markers ?? [];
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
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/positions`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return (data.positions ?? []) as NriPlayerPosition[];
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

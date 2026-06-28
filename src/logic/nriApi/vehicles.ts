/** Table vehicles */

import { nriAuthHeaders, nriParseJson, nriSafeFetch, parseNriApiError } from './http.js';

const parseJson = nriParseJson;
const authHeaders = nriAuthHeaders;
const parseApiError = parseNriApiError;

export type NriTableVehicle = {
  id: string;
  catalogId: string;
  label: string | null;
  assignedUserId: string | null;
  assignedDisplayName: string | null;
  ownerClassId: string | null;
  ownerSheet: unknown;
  notes: string | null;
  createdAt: number;
};

export async function nriFetchVehicles(token: string, code: string): Promise<NriTableVehicle[]> {
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/vehicles`, {
    headers: authHeaders(token),
  });
  if (!out || !out.res.ok) return [];
  return (out.data.vehicles as NriTableVehicle[]) ?? [];
}

export async function nriCreateVehicle(
  token: string,
  code: string,
  payload: { catalogId: string; label?: string; notes?: string; assignedUserId?: string | null }
): Promise<{ ok: true; vehicle: NriTableVehicle } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/vehicles`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось добавить транспорт') };
  return { ok: true, vehicle: data.vehicle };
}

export async function nriPatchVehicle(
  token: string,
  code: string,
  vehicleId: string,
  patch: { label?: string | null; notes?: string | null; assignedUserId?: string | null }
): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/vehicles/${encodeURIComponent(vehicleId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(patch) }
  );
  return res.ok;
}

export async function nriDeleteVehicle(token: string, code: string, vehicleId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/vehicles/${encodeURIComponent(vehicleId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

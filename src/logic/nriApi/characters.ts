/** Presets, NPCs, combatants */

import type { NriInventoryItem } from '../nriInventory';
import { nriAuthHeaders, nriParseJson, nriSafeFetch, parseNriApiError } from './http.js';
import type { NriInventoryUpdateResult } from './players.js';

const parseJson = nriParseJson;
const authHeaders = nriAuthHeaders;
const parseApiError = parseNriApiError;

export type NriPresetCreateResult =
  | { ok: true; preset: NriPresetCharacter }
  | { ok: false; error: string };

export type NriNpcCreateResult =
  | { ok: true; npc: NriNpc }
  | { ok: false; error: string };

export type NriPresetCharacter = {
  id: string;
  label: string;
  classId: string;
  inventory: NriInventoryItem[];
  sheet: unknown;
  portraitUrl: string | null;
  publishedToPlayers: boolean;
  sortOrder: number;
  claimed: boolean;
  claimedByUserId: string | null;
  createdAt: number;
};

export type NriNpc = {
  id: string;
  name: string;
  classId: string | null;
  imageUrl: string | null;
  inventory: NriInventoryItem[];
  sheet: unknown;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type NriCombatant = {
  id: string;
  name: string;
  classId: string | null;
  archetypeId: string | null;
  threatTier: string;
  imageUrl: string | null;
  inventory: NriInventoryItem[];
  sheet: unknown;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type NriCombatantCreateResult =
  | { ok: true; combatant: NriCombatant }
  | { ok: false; error: string };

export type NriPresetsResponse = {
  presets: NriPresetCharacter[];
  meta?: {
    unclaimed: number;
    publishedUnclaimed: number;
    selectionRequired: boolean;
  };
};

export async function nriFetchPresets(
  token: string,
  code: string
): Promise<NriPresetsResponse | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/presets`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { presets: data.presets ?? [], meta: data.meta };
}

export async function nriCreatePreset(
  token: string,
  code: string,
  payload: {
    label: string;
    classId: string;
    inventory?: NriInventoryItem[];
    sheet?: unknown;
    portraitUrl?: string;
    publishedToPlayers?: boolean;
  }
): Promise<NriPresetCreateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/presets`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось создать персонажа') };
  }
  if (!data.preset) return { ok: false, error: 'Сервер не вернул пресет' };
  return { ok: true, preset: data.preset };
}

export async function nriDeletePreset(token: string, code: string, presetId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/presets/${encodeURIComponent(presetId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriPatchPreset(
  token: string,
  code: string,
  presetId: string,
  payload: {
    label?: string;
    classId?: string;
    inventory?: NriInventoryItem[];
    sheet?: unknown;
    portraitUrl?: string | null;
    sortOrder?: number;
    publishedToPlayers?: boolean;
  }
): Promise<NriPresetCreateResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/presets/${encodeURIComponent(presetId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить персонажа') };
  if (!data.preset) return { ok: false, error: 'Сервер не вернул пресет' };
  return { ok: true, preset: data.preset };
}

export async function nriFetchNpcs(token: string, code: string): Promise<NriNpc[] | null> {
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/npcs`, {
    headers: authHeaders(token),
  });
  if (!out || !out.res.ok) return null;
  return (out.data.npcs as NriNpc[]) ?? [];
}

export async function nriCreateNpc(
  token: string,
  code: string,
  payload: {
    name: string;
    classId?: string;
    imageUrl?: string;
    inventory?: NriInventoryItem[];
    sheet?: unknown;
    notes?: string;
  }
): Promise<NriNpcCreateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/npcs`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось создать НПС') };
  }
  if (!data.npc) return { ok: false, error: 'Сервер не вернул НПС' };
  return { ok: true, npc: data.npc };
}

export async function nriDeleteNpc(token: string, code: string, npcId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/npcs/${encodeURIComponent(npcId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriFetchCombatants(token: string, code: string): Promise<NriCombatant[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/combatants`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.combatants ?? [];
}

export async function nriCreateCombatant(
  token: string,
  code: string,
  payload: {
    name: string;
    classId?: string;
    archetypeId?: string;
    threatTier?: string;
    imageUrl?: string;
    inventory?: NriInventoryItem[];
    sheet?: unknown;
    notes?: string;
  }
): Promise<NriCombatantCreateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/combatants`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось создать боевика') };
  }
  if (!data.combatant) return { ok: false, error: 'Сервер не вернул боевика' };
  return { ok: true, combatant: data.combatant };
}

export async function nriDeleteCombatant(
  token: string,
  code: string,
  combatantId: string
): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/combatants/${encodeURIComponent(combatantId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriGrantNpcItem(
  token: string,
  code: string,
  npcId: string,
  catalogId: string,
  qty?: number
): Promise<NriInventoryUpdateResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/npcs/${encodeURIComponent(npcId)}/items/grant`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ catalogId, qty }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось выдать предмет НПС') };
  }
  return { ok: true, inventory: data.inventory ?? [] };
}

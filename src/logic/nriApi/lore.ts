/** Lore, factions, transfers, host alerts */

import type { NriFaction, NriHostAlert, NriLorePlace, FactionRelationMatrix } from '../nriLore';
import type { NriInventoryItem } from '../nriInventory';
import { nriAuthHeaders, nriParseJson, parseNriApiError } from './http.js';

const parseJson = nriParseJson;
const authHeaders = nriAuthHeaders;
const parseApiError = parseNriApiError;

export async function nriFetchLore(
  token: string,
  code: string
): Promise<{
  world: { body: string };
  entries: import('../nriLore').NriLoreEntry[];
  factions: NriFaction[];
  places: NriLorePlace[];
  factionRelations: FactionRelationMatrix;
} | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/lore`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data as {
    world: { body: string };
    entries: import('../nriLore').NriLoreEntry[];
    factions: NriFaction[];
    places: NriLorePlace[];
    factionRelations: FactionRelationMatrix;
  };
}

export async function nriCreateLoreEntry(
  token: string,
  code: string,
  payload: { title?: string; body?: string }
): Promise<{ ok: true; entry: import('../nriLore').NriLoreEntry } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/lore/entries`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать карточку') };
  return { ok: true, entry: data.entry };
}

export async function nriPatchLoreEntry(
  token: string,
  code: string,
  entryId: string,
  payload: { title?: string; body?: string }
): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/lore/entries/${encodeURIComponent(entryId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(payload) }
  );
  return res.ok;
}

export async function nriDeleteLoreEntry(token: string, code: string, entryId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/lore/entries/${encodeURIComponent(entryId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriPatchFactionRelations(
  token: string,
  code: string,
  payload: { enabled?: boolean; edges?: Record<string, string | null> }
): Promise<FactionRelationMatrix | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/lore/faction-relations`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return (data.factionRelations ?? null) as FactionRelationMatrix | null;
}

export async function nriTransferItem(
  token: string,
  code: string,
  payload: {
    toUserId: string;
    itemId?: string;
    fromNpcId?: string;
    asNpcId?: string;
    catalogId?: string;
    qty?: number;
  }
): Promise<
  | { ok: true; messageId: string; dmRoomId: string; text: string; inventory?: NriInventoryItem[] }
  | { ok: false; error: string }
> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/items/transfer`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось передать предмет') };
  return {
    ok: true,
    messageId: data.messageId,
    dmRoomId: data.dmRoomId,
    text: data.text ?? '',
    inventory: data.inventory,
  };
}

export async function nriBroadcastItemTransfer(
  token: string,
  code: string,
  messageId: string
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/items/transfer/broadcast`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ messageId }),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось показать предмет') };
  return { ok: true, text: data.text ?? '' };
}

export async function nriSaveLoreWorld(token: string, code: string, body: string): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/lore/world`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  });
  return res.ok;
}

export async function nriCreateFaction(
  token: string,
  code: string,
  payload: { name: string; description?: string; color?: string; kind?: string; zoneKeys?: string[] }
): Promise<{ ok: true; faction: NriFaction } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/lore/factions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать фракцию') };
  return { ok: true, faction: data.faction as NriFaction };
}

export async function nriPatchFaction(
  token: string,
  code: string,
  factionId: string,
  payload: Partial<NriFaction>
): Promise<{ ok: true; faction: NriFaction } | { ok: false; error: string }> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/lore/factions/${encodeURIComponent(factionId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(payload) }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить фракцию') };
  return { ok: true, faction: data.faction as NriFaction };
}

export async function nriDeleteFaction(token: string, code: string, factionId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/lore/factions/${encodeURIComponent(factionId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriPatchLorePlace(
  token: string,
  code: string,
  placeId: string,
  payload: { title?: string; body?: string }
): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/lore/places/${encodeURIComponent(placeId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(payload) }
  );
  return res.ok;
}

export async function nriFetchHostAlerts(token: string, code: string): Promise<NriHostAlert[]> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/host-alerts`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return (data.alerts ?? []) as NriHostAlert[];
}

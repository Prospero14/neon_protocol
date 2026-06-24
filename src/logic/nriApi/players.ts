/** NRI player / roster / items API. */

import type { NriInventoryItem } from '../nriInventory';
import type { NriAchievementDef } from '../../../shared/nri-domain/achievements';
import { nriAuthHeaders, nriParseJson, parseNriApiError } from './http.js';

export type NriPlayerDossier = {
  characterName: string;
  backstory: string;
  career: string;
  clothing: string;
  age: string;
};

export type NriPlayerAchievements = {
  unlocked: NriAchievementDef[];
  progress: {
    drugsUsed: string[];
    zonesVisited: string[];
    medConsumablesUsed: string[];
    mercWeaponZones: string[];
  };
};

export type NriAchievementUnlock = {
  id: string;
  title: string;
  blurb: string;
  icon: string;
  at: number;
};

export type NriPlayerProfile = {
  displayName: string;
  classId: string;
  inventory?: NriInventoryItem[];
  sheet?: unknown;
  portraitUrl?: string | null;
  presetId?: string | null;
  privateNotes?: string;
  dossier?: NriPlayerDossier;
  achievements?: NriPlayerAchievements;
};

export type NriRosterPlayer = NriPlayerProfile & {
  userId: string;
  username: string;
};

export type NriSavePlayerResult =
  | { ok: true; player: NriPlayerProfile }
  | { ok: false; error: string };

export type NriInventoryUpdateResult =
  | { ok: true; inventory: NriInventoryItem[] }
  | { ok: false; error: string };

export type NriUseItemResult =
  | { ok: true; inventory: NriInventoryItem[]; sheet: unknown; applied: string[]; newAchievements?: NriAchievementUnlock[] }
  | { ok: false; error: string };

export async function nriFetchPlayer(token: string, code: string): Promise<NriPlayerProfile | null | undefined> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/player`, {
    headers: nriAuthHeaders(token),
  });
  const data = await nriParseJson(res);
  if (!res.ok) return undefined;
  return data.player ?? null;
}

export async function nriFetchRoster(token: string, code: string): Promise<NriRosterPlayer[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/players`, {
    headers: nriAuthHeaders(token),
  });
  const data = await nriParseJson(res);
  if (!res.ok) return null;
  return data.players ?? [];
}

export async function nriSavePlayer(
  token: string,
  code: string,
  displayName: string,
  opts: { classId?: string; presetId?: string; sheet?: unknown; inventory?: unknown },
): Promise<NriSavePlayerResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/player`, {
    method: 'POST',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({
      displayName,
      classId: opts.classId,
      presetId: opts.presetId,
      sheet: opts.sheet,
      inventory: opts.inventory,
    }),
  });
  const data = await nriParseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseNriApiError(data, 'Не удалось сохранить персонажа') };
  }
  if (!data.player) return { ok: false, error: 'Сервер не вернул профиль' };
  return { ok: true, player: data.player };
}

export async function nriPatchPlayer(
  token: string,
  code: string,
  userId: string,
  payload: { displayName?: string; sheet?: unknown },
): Promise<NriSavePlayerResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/players/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: nriAuthHeaders(token),
      body: JSON.stringify(payload),
    },
  );
  const data = await nriParseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseNriApiError(data, 'Не удалось обновить персонажа') };
  }
  if (!data.player) return { ok: false, error: 'Сервер не вернул профиль' };
  return { ok: true, player: data.player };
}

export async function nriUseItem(token: string, code: string, itemId: string): Promise<NriUseItemResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/player/items/${encodeURIComponent(itemId)}/use`,
    { method: 'POST', headers: nriAuthHeaders(token) },
  );
  const data = await nriParseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseNriApiError(data, 'Не удалось использовать предмет') };
  }
  return {
    ok: true,
    inventory: data.inventory ?? [],
    sheet: data.sheet,
    applied: Array.isArray(data.applied) ? data.applied : [],
    newAchievements: Array.isArray(data.newAchievements) ? data.newAchievements : undefined,
  };
}

export async function nriToggleEquip(
  token: string,
  code: string,
  itemId: string,
): Promise<NriInventoryUpdateResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/player/items/${encodeURIComponent(itemId)}/toggle-equip`,
    { method: 'POST', headers: nriAuthHeaders(token) },
  );
  const data = await nriParseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseNriApiError(data, 'Не удалось экипировать') };
  }
  return { ok: true, inventory: data.inventory ?? [] };
}

export async function nriGrantItem(
  token: string,
  code: string,
  targetUserId: string,
  catalogId: string,
  opts?: { qty?: number; fromNpcId?: string },
): Promise<NriInventoryUpdateResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/players/${encodeURIComponent(targetUserId)}/items/grant`,
    {
      method: 'POST',
      headers: nriAuthHeaders(token),
      body: JSON.stringify({
        catalogId,
        qty: opts?.qty,
        fromNpcId: opts?.fromNpcId,
      }),
    },
  );
  const data = await nriParseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseNriApiError(data, 'Не удалось выдать предмет') };
  }
  return { ok: true, inventory: data.inventory ?? [] };
}

export async function nriSavePlayerNotes(
  token: string,
  code: string,
  notes: string,
): Promise<{ ok: true; privateNotes: string } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/player/notes`, {
    method: 'PATCH',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({ notes }),
  });
  const data = await nriParseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseNriApiError(data, 'Не удалось сохранить заметки') };
  }
  return {
    ok: true,
    privateNotes: typeof data.privateNotes === 'string' ? data.privateNotes : notes,
  };
}

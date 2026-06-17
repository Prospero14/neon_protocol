/** Cyberware catalog + install */

import type { NriPlayerProfile } from './players';
import { nriAuthHeaders, nriParseJson, parseNriApiError } from './http.js';

const parseJson = nriParseJson;
const authHeaders = nriAuthHeaders;
const parseApiError = parseNriApiError;

export type NriCyberProduct = {
  id: string;
  name: string;
  slot: string;
  blueprint: unknown;
  build: unknown;
  priceWonlongs: number;
  inShop: boolean;
  vendorNpcId: string | null;
  createdAt: number;
};

type CyberMutateResult = { ok: true; product: NriCyberProduct } | { ok: false; error: string };
type CyberGrantResult =
  | { ok: true; installed?: boolean; needsHoloTattooPick?: boolean }
  | { ok: false; error: string };

export async function nriFetchCyberProducts(token: string, code: string): Promise<NriCyberProduct[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/cyber`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.products ?? [];
}

export async function nriCreateCyberProduct(
  token: string,
  code: string,
  payload: {
    name: string;
    slot: string;
    blueprint: unknown;
    build: unknown;
    priceWonlongs?: number;
    inShop?: boolean;
  }
): Promise<CyberMutateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/cyber`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось сохранить имплант') };
  if (!data.product) return { ok: false, error: 'Сервер не вернул продукт' };
  return { ok: true, product: data.product };
}

export async function nriPatchCyberProduct(
  token: string,
  code: string,
  productId: string,
  patch: { inShop?: boolean; priceWonlongs?: number; name?: string }
): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/cyber/${encodeURIComponent(productId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(patch) }
  );
  return res.ok;
}

export async function nriDeleteCyberProduct(token: string, code: string, productId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/cyber/${encodeURIComponent(productId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriGrantCyberProduct(
  token: string,
  code: string,
  productId: string,
  targetUserId: string,
  install?: boolean
): Promise<CyberGrantResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/cyber/${encodeURIComponent(productId)}/grant`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ targetUserId, install: install === true }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось выдать имплант') };
  return { ok: true, installed: !!data.installed, needsHoloTattooPick: !!data.needsHoloTattooPick };
}

export async function nriGrantCyberProductToNpc(
  token: string,
  code: string,
  productId: string,
  npcId: string,
  install?: boolean
): Promise<CyberGrantResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/cyber/${encodeURIComponent(productId)}/grant-npc`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ npcId, install: install === true }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось выдать имплант НПС') };
  return { ok: true, installed: !!data.installed, needsHoloTattooPick: !!data.needsHoloTattooPick };
}

export async function nriInstallCyberItem(
  token: string,
  code: string,
  targetUserId: string,
  itemId: string
): Promise<CyberGrantResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/players/${encodeURIComponent(targetUserId)}/cyber/install`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ itemId }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось установить имплант') };
  return { ok: true, installed: true, needsHoloTattooPick: !!data.needsHoloTattooPick };
}

export type HoloTattooOption = {
  id: string;
  kind: string;
  label: string;
  blurb: string;
  factionId?: string;
};

export async function nriFetchHoloTattooOptions(
  token: string,
  code: string
): Promise<{ pending: boolean; options: HoloTattooOption[] } | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/player/holo-tattoo/options`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return {
    pending: !!data.pending,
    options: Array.isArray(data.options) ? data.options : [],
  };
}

export async function nriApplyHoloTattooPick(
  token: string,
  code: string,
  optionId: string
): Promise<{ ok: true; player: NriPlayerProfile } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/player/holo-tattoo`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ optionId }),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось применить татуировку') };
  if (!data.player) return { ok: false, error: 'Сервер не вернул профиль' };
  return { ok: true, player: data.player as NriPlayerProfile };
}

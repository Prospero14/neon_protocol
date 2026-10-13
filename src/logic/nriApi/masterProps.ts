/** Клиент: мастерские пропы (корзина + замки). */

import type { MasterLock, MasterPropsState, PlayBasketEntry } from '../../../shared/nri-domain/masterProps';

function authHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function nriFetchMasterProps(token: string, code: string): Promise<MasterPropsState | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/master-props`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  return (await parseJson(res)) as MasterPropsState;
}

export async function nriAddBasketEntry(
  token: string,
  code: string,
  body: {
    catalogId?: string;
    label?: string;
    qty?: number;
    itemKind?: 'ordinary' | 'quest';
    source?: string;
    notes?: string;
    fromPlayerUserId?: string;
    fromNpcId?: string;
    inventoryItemId?: string;
  },
): Promise<{ ok: true; entry: PlayBasketEntry; props: MasterPropsState } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/master-props/basket`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: String(data.error ?? data.message ?? 'Ошибка') };
  return { ok: true, entry: data.entry, props: data.props };
}

export async function nriRemoveBasketEntry(
  token: string,
  code: string,
  entryId: string,
): Promise<MasterPropsState | null> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/master-props/basket/${encodeURIComponent(entryId)}`,
    { method: 'DELETE', headers: authHeaders(token) },
  );
  if (!res.ok) return null;
  const data = await parseJson(res);
  return data.props as MasterPropsState;
}

export async function nriGrantBasketEntry(
  token: string,
  code: string,
  entryId: string,
  toUserId: string,
): Promise<MasterPropsState | null> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/master-props/basket/${encodeURIComponent(entryId)}/grant`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ toUserId }),
    },
  );
  if (!res.ok) return null;
  const data = await parseJson(res);
  return data.props as MasterPropsState;
}

export async function nriCreateLock(
  token: string,
  code: string,
  lock: Partial<MasterLock> & { label: string },
): Promise<{ ok: true; lock: MasterLock; props: MasterPropsState } | { ok: false }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/master-props/locks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(lock),
  });
  if (!res.ok) return { ok: false };
  const data = await parseJson(res);
  return { ok: true, lock: data.lock, props: data.props };
}

export async function nriPatchLock(
  token: string,
  code: string,
  lockId: string,
  patch: Partial<MasterLock>,
): Promise<MasterPropsState | null> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/master-props/locks/${encodeURIComponent(lockId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(patch) },
  );
  if (!res.ok) return null;
  const data = await parseJson(res);
  return data.props as MasterPropsState;
}

export async function nriDeleteLock(token: string, code: string, lockId: string): Promise<MasterPropsState | null> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/master-props/locks/${encodeURIComponent(lockId)}`,
    { method: 'DELETE', headers: authHeaders(token) },
  );
  if (!res.ok) return null;
  const data = await parseJson(res);
  return data.props as MasterPropsState;
}

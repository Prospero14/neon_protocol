/** Vault — session + global files */

import { nriAuthHeaders, nriParseJson, parseNriApiError } from './http.js';

const parseJson = nriParseJson;
const authHeaders = nriAuthHeaders;
const parseVaultError = parseNriApiError;

export type NriVaultFile = {
  id: string;
  title: string;
  body: string;
  protected: boolean;
  hasPassword?: boolean;
  passwordIsIceReward?: boolean;
  gameId: string | null;
  difficulty: string | null;
  createdAt: number;
};

export type VaultCreateResult =
  | { ok: true; file: NriVaultFile }
  | { ok: false; error: string };

function vaultCreateBody(payload: {
  title: string;
  body: string;
  usePassword?: boolean;
  useIce?: boolean;
  password?: string;
  gameId?: string;
  difficulty?: string;
}) {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    usePassword: payload.usePassword === true,
    useIce: payload.useIce === true,
    password: payload.password,
    gameId: payload.gameId,
    difficulty: payload.difficulty,
  });
}

export async function vaultDeleteFile(token: string, fileId: string): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/vault/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return res.ok;
}

export async function nriFetchVault(token: string, code: string): Promise<NriVaultFile[]> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/vault`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.files ?? [];
}

export async function nriCreateVaultFile(
  token: string,
  code: string,
  payload: {
    title: string;
    body: string;
    usePassword?: boolean;
    useIce?: boolean;
    password?: string;
    gameId?: string;
    difficulty?: string;
  }
): Promise<VaultCreateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/vault`, {
    method: 'POST',
    headers: authHeaders(token),
    body: vaultCreateBody(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseVaultError(data, 'Не удалось создать файл') };
  }
  if (!data.file) return { ok: false, error: 'Сервер не вернул файл' };
  return { ok: true, file: data.file };
}

export async function vaultFetchGlobal(token: string): Promise<NriVaultFile[]> {
  const res = await fetch('/neon_v1/services/vault/global', { headers: authHeaders(token) });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.files ?? [];
}

export async function vaultCreateGlobal(
  token: string,
  payload: {
    title: string;
    body: string;
    usePassword?: boolean;
    useIce?: boolean;
    password?: string;
    gameId?: string;
    difficulty?: string;
  }
): Promise<VaultCreateResult> {
  const res = await fetch('/neon_v1/services/vault/global', {
    method: 'POST',
    headers: authHeaders(token),
    body: vaultCreateBody(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseVaultError(data, 'Не удалось создать файл') };
  }
  if (!data.file) return { ok: false, error: 'Сервер не вернул файл' };
  return { ok: true, file: data.file };
}

export async function vaultFetchFile(
  token: string,
  fileId: string
): Promise<{ file: NriVaultFile; unlocked: boolean; icePassed?: boolean; rewardPassword?: string; body?: string } | null> {
  const res = await fetch(`/neon_v1/services/vault/files/${encodeURIComponent(fileId)}`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return {
    file: data.file,
    unlocked: data.unlocked,
    icePassed: data.icePassed,
    rewardPassword: data.rewardPassword,
    body: data.body,
  };
}

export async function vaultUnlockFile(
  token: string,
  fileId: string,
  opts?: { password?: string; viaIce?: boolean }
): Promise<{ body: string | null; rewardPassword?: string; icePassed?: boolean; error?: string }> {
  const bodyPayload: { password?: string; viaIce?: boolean } = {};
  if (opts?.password) bodyPayload.password = opts.password;
  if (opts?.viaIce) bodyPayload.viaIce = true;
  const res = await fetch(`/neon_v1/services/vault/files/${encodeURIComponent(fileId)}/unlock`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(bodyPayload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { body: null, error: parseVaultError(data, 'Не удалось разблокировать') };
  }
  return {
    body: data.body ?? null,
    rewardPassword: typeof data.rewardPassword === 'string' ? data.rewardPassword : undefined,
    icePassed: data.icePassed === true,
  };
}

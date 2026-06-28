/** NRI session lobby API (create, join, state). */

import { nriAuthHeaders, nriParseJson, nriSafeFetch, formatNriApiError, NRI_NETWORK_ERROR, NRI_FETCH_TIMEOUT_MS } from './http.js';

export type NriMember = {
  userId: string;
  username: string;
  isHost: boolean;
  displayName?: string | null;
};

export type NriSessionInfo = {
  id: string;
  inviteCode: string;
  title: string;
  hostUsername: string;
  chatRoomId: string;
  status: string;
  isHost?: boolean;
  isAdmin?: boolean;
  spamBotEnabled?: boolean;
  liveDialogEnabled?: boolean;
  liveDialogEndedAt?: number | null;
  spamPausedUntil?: number | null;
  spamPausedActive?: boolean;
};

export function parseNriInviteFromHash(hash: string): string | null {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return null;
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] !== 'nri') return null;
  const code = (parts[1] === 'join' ? parts[2] : parts[1])?.trim().toUpperCase();
  return code && code.startsWith('NRI-') ? code : null;
}

export function buildNriInviteUrl(inviteCode: string): string {
  if (typeof window === 'undefined') return `#nri/join/${inviteCode}`;
  return `${window.location.origin}${window.location.pathname}#nri/join/${inviteCode}`;
}

export async function nriFetchInfo(code: string): Promise<{ inviteCode: string; title: string; hostUsername: string } | null> {
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/info`);
  if (!out || !out.res.ok) return null;
  return out.data as { inviteCode: string; title: string; hostUsername: string };
}

export async function nriCreateSession(token: string, title?: string): Promise<NriSessionInfo | null> {
  const out = await nriSafeFetch('/neon_v1/services/nri/create', {
    method: 'POST',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({ title }),
  });
  if (!out || !out.res.ok) return null;
  return (out.data.session as NriSessionInfo) ?? null;
}

export async function nriJoinSession(token: string, code: string): Promise<{
  session: NriSessionInfo;
  members: NriMember[];
} | null> {
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({}),
  });
  if (!out) return null;
  if (!out.res.ok) return null;
  return { session: out.data.session as NriSessionInfo, members: (out.data.members as NriMember[]) ?? [] };
}

export async function nriFetchState(token: string, code: string): Promise<{
  session: NriSessionInfo;
  members: NriMember[];
} | null> {
  const out = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/state`, {
    headers: nriAuthHeaders(token),
  });
  if (!out) return null;
  if (!out.res.ok) return null;
  return { session: out.data.session as NriSessionInfo, members: (out.data.members as NriMember[]) ?? [] };
}

export type NriLobbyLoadResult =
  | { ok: true; session: NriSessionInfo; members: NriMember[] }
  | { ok: false; error: string };

/** state → при неудаче join; для лобби после логина / resume из save. */
export async function nriLoadTableLobby(token: string, code: string): Promise<NriLobbyLoadResult> {
  const normalized = code.trim().toUpperCase();
  const stateOut = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(normalized)}/state`, {
    headers: nriAuthHeaders(token),
  });
  if (stateOut?.res.ok) {
    return {
      ok: true,
      session: stateOut.data.session as NriSessionInfo,
      members: (stateOut.data.members as NriMember[]) ?? [],
    };
  }
  if (!stateOut) {
    return { ok: false, error: `${NRI_NETWORK_ERROR} (таймаут ${NRI_FETCH_TIMEOUT_MS / 1000} с)` };
  }
  const stateStatus = stateOut.res.status;
  const tryJoin = stateStatus === 401 || stateStatus === 403 || stateStatus === 404;
  if (!tryJoin) {
    return {
      ok: false,
      error: formatNriApiError(stateOut.data as Record<string, unknown>, 'Не удалось подключиться к столу.'),
    };
  }
  const joinOut = await nriSafeFetch(`/neon_v1/services/nri/${encodeURIComponent(normalized)}/join`, {
    method: 'POST',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({}),
  });
  if (joinOut?.res.ok) {
    return {
      ok: true,
      session: joinOut.data.session as NriSessionInfo,
      members: (joinOut.data.members as NriMember[]) ?? [],
    };
  }
  if (!joinOut) {
    return { ok: false, error: `${NRI_NETWORK_ERROR} (таймаут ${NRI_FETCH_TIMEOUT_MS / 1000} с)` };
  }
  const errBody = joinOut.data ?? stateOut.data ?? {};
  const hint = formatNriApiError(errBody as Record<string, unknown>, 'Не удалось подключиться к столу.');
  return { ok: false, error: hint };
}

export async function nriCloseSession(token: string, code: string): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/close`, {
    method: 'POST',
    headers: nriAuthHeaders(token),
  });
  return res.ok;
}

export async function nriSetSpamBot(token: string, code: string, enabled: boolean): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/spam-bot`, {
    method: 'POST',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) return false;
  const data = await nriParseJson(res);
  return data.ok === true;
}

export async function nriSetLiveDialog(token: string, code: string, enabled: boolean): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/live-dialog`, {
    method: 'POST',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) return false;
  const data = await nriParseJson(res);
  return data.ok === true;
}

export async function nriEndLiveDialog(token: string, code: string): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/live-dialog/end`, {
    method: 'POST',
    headers: nriAuthHeaders(token),
  });
  if (!res.ok) return false;
  const data = await nriParseJson(res);
  return data.ok === true;
}

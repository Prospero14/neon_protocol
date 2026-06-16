/** NRI session lobby API (create, join, state). */

import { nriAuthHeaders, nriParseJson } from './http.js';

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
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/info`);
  const data = await nriParseJson(res);
  if (!res.ok) return null;
  return data;
}

export async function nriCreateSession(token: string, title?: string): Promise<NriSessionInfo | null> {
  const res = await fetch('/neon_v1/services/nri/create', {
    method: 'POST',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({ title }),
  });
  const data = await nriParseJson(res);
  if (!res.ok) return null;
  return data.session ?? null;
}

export async function nriJoinSession(token: string, code: string): Promise<{
  session: NriSessionInfo;
  members: NriMember[];
} | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    headers: nriAuthHeaders(token),
    body: JSON.stringify({}),
  });
  const data = await nriParseJson(res);
  if (!res.ok) return null;
  return { session: data.session, members: data.members ?? [] };
}

export async function nriFetchState(token: string, code: string): Promise<{
  session: NriSessionInfo;
  members: NriMember[];
} | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/state`, {
    headers: nriAuthHeaders(token),
  });
  const data = await nriParseJson(res);
  if (!res.ok) return null;
  return { session: data.session, members: data.members ?? [] };
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

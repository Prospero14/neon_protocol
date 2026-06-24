/** Wallet, wonlongs, ICE */

import { nriAuthHeaders, nriParseJson, parseNriApiError } from './http.js';

const parseJson = nriParseJson;
const authHeaders = nriAuthHeaders;
const parseApiError = parseNriApiError;

export type NriWalletTransferTargets = {
  players: { userId: string; displayName: string }[];
  npcs: { id: string; name: string; wonlongs: number }[];
};

export type NriWalletInfo = {
  wonlongs: number;
  tableWonlongsSum: number;
  antispamPrice: number;
  spamPausedUntil: number | null;
  spamPausedActive: boolean;
  spamBotEnabled: boolean;
  transferTargets?: NriWalletTransferTargets;
};

export type NriWalletOpResult =
  | {
      ok: true;
      wonlongs: number;
      spamPausedUntil?: number | null;
      spamPausedActive?: boolean;
      newAchievements?: import('./players.js').NriAchievementUnlock[];
    }
  | { ok: false; error: string };

export async function nriFetchWallet(token: string, code: string): Promise<NriWalletInfo | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/wallet`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data as NriWalletInfo;
}

export async function nriPayAntispam(token: string, code: string): Promise<NriWalletOpResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/antispam/pay`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось оплатить антиспам') };
  }
  return {
    ok: true,
    wonlongs: data.wonlongs ?? 0,
    spamPausedUntil: data.spamPausedUntil ?? null,
    spamPausedActive: !!data.spamPausedActive,
    newAchievements: Array.isArray(data.newAchievements) ? data.newAchievements : undefined,
  };
}

export async function nriTransferWonlongs(
  token: string,
  code: string,
  payload: {
    amount: number;
    toPlayerUserId?: string;
    toNpcId?: string;
    memo?: string;
  }
): Promise<NriWalletOpResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/wonlongs/transfer`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось перевести') };
  }
  return {
    ok: true,
    wonlongs: data.wonlongs ?? 0,
    newAchievements: Array.isArray(data.newAchievements) ? data.newAchievements : undefined,
  };
}

export async function nriGrantWonlongs(
  token: string,
  code: string,
  payload: { playerUserId: string; amount: number; fromNpcId?: string; memo?: string }
): Promise<NriWalletOpResult & { playerUserId?: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/wonlongs/grant`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось выдать деньги') };
  }
  return { ok: true, wonlongs: data.wonlongs ?? 0, playerUserId: data.playerUserId };
}

export type NriIcePlayStatus = {
  consecutiveFails: number;
  hardwareBanned: boolean;
  canPlay: boolean;
  clearanceVia?: 'neural' | 'deck';
  tableAllBanned: boolean;
  failsUntilBan: number;
};

export async function nriFetchIceStatus(token: string, code: string): Promise<NriIcePlayStatus | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/status`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data as NriIcePlayStatus;
}

export async function nriReportIceResult(
  token: string,
  code: string,
  won: boolean
): Promise<
  | { ok: true; status: NriIcePlayStatus; newAchievements?: import('./players.js').NriAchievementUnlock[] }
  | { ok: false; error: string }
> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/result`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ won }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось сохранить результат ICE') };
  }
  return {
    ok: true,
    status: data.status as NriIcePlayStatus,
    newAchievements: Array.isArray(data.newAchievements) ? data.newAchievements : undefined,
  };
}

export type NriIceLeaderboardEntry = {
  userId: string;
  displayName: string;
  score: number;
  exfilPct: number;
  tracePct: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  at: number;
};

export async function nriFetchIceLeaderboard(
  token: string,
  code: string,
  gameId?: string
): Promise<NriIceLeaderboardEntry[]> {
  const q = gameId ? `?gameId=${encodeURIComponent(gameId)}` : '';
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/leaderboard${q}`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.entries ?? [];
}

export async function nriFetchIceLeaderboards(
  token: string,
  code: string
): Promise<Record<string, NriIceLeaderboardEntry[]>> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/leaderboards`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return {};
  return data.boards ?? {};
}

export async function nriSubmitIceScore(
  token: string,
  code: string,
  payload: {
    gameId?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    score: number;
    exfilPct: number;
    tracePct: number;
    won: boolean;
  }
): Promise<{ ok: true; newAchievements?: import('./players.js').NriAchievementUnlock[] } | { ok: false }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/score`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { ok: false };
  const data = await parseJson(res);
  return {
    ok: true,
    newAchievements: Array.isArray(data.newAchievements) ? data.newAchievements : undefined,
  };
}

/** Клиент API зоны ожидания коопа (требует JWT). */

export type CoopLobbyOnlineUser = {
  userId: string;
  displayName: string;
  coopRole: string;
  clientUsername: string;
};

export type CoopLobbyPartyMember = {
  userId: string;
  displayName: string;
  coopRole: string;
  clientUsername: string;
};

export type CoopLobbyParty = {
  id: string;
  hostId: string;
  isHost: boolean;
  members: CoopLobbyPartyMember[];
};

export type CoopLobbyChatMessage = {
  id: string;
  userId: string;
  displayName: string;
  coopRole: string;
  text: string;
  ts: number;
};

export type CoopMatchSharedState = {
  stress: number;
  infraReliability: number;
  infraResources: number;
  deadlineTicks: number;
  bugPressure: number;
  projectProgress: number;
  turn: number;
  activeRole: string;
  roleStress: Record<string, number>;
  roleTaskProgress: Record<string, number>;
};

export type CoopMatchState = {
  id: string;
  partyId: string;
  hostId: string;
  status: 'pending' | 'active' | 'finished';
  createdAt: number;
  updatedAt: number;
  memberIds: string[];
  roleByUserId: Record<string, string>;
  shared: CoopMatchSharedState;
  seq: number;
  recentEvents: Array<{
    seq: number;
    ts: number;
    type: string;
    actorUserId: string | null;
    payload: Record<string, unknown>;
  }>;
};

async function parseJson(res: Response) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return { error: t };
  }
}

export async function coopLobbyHeartbeat(
  token: string,
  body: { displayName: string; coopRole: string; clientUsername: string }
): Promise<{
  online: CoopLobbyOnlineUser[];
  party: CoopLobbyParty | null;
  activeMatchId: string | null;
  chat: CoopLobbyChatMessage[];
} | null> {
  const res = await fetch('/neon_v1/coop/heartbeat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return {
    online: data.online ?? [],
    party: data.party ?? null,
    activeMatchId: typeof data.activeMatchId === 'string' ? data.activeMatchId : null,
    chat: data.chat ?? [],
  };
}

export async function coopLobbyFetchState(token: string): Promise<{
  online: CoopLobbyOnlineUser[];
  party: CoopLobbyParty | null;
  activeMatchId: string | null;
  chat: CoopLobbyChatMessage[];
} | null> {
  const res = await fetch('/neon_v1/coop/state', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return {
    online: data.online ?? [],
    party: data.party ?? null,
    activeMatchId: typeof data.activeMatchId === 'string' ? data.activeMatchId : null,
    chat: data.chat ?? [],
  };
}

export async function coopLobbySendChat(token: string, text: string): Promise<boolean> {
  const res = await fetch('/neon_v1/coop/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  return res.ok;
}

export async function coopLobbyInvite(token: string, targetDisplayName: string): Promise<CoopLobbyParty | null> {
  const res = await fetch('/neon_v1/coop/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ targetDisplayName }),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.party ?? null;
}

export async function coopLobbyLeaveParty(token: string): Promise<boolean> {
  const res = await fetch('/neon_v1/coop/party/leave', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export async function coopMatchCreate(token: string): Promise<CoopMatchState | null> {
  const res = await fetch('/neon_v1/coop/match/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return (data.match ?? null) as CoopMatchState | null;
}

export async function coopMatchJoin(token: string, matchId: string): Promise<CoopMatchState | null> {
  const res = await fetch('/neon_v1/coop/match/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ matchId }),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return (data.match ?? null) as CoopMatchState | null;
}

export async function coopMatchFetchState(token: string, matchId: string): Promise<CoopMatchState | null> {
  const qp = new URLSearchParams({ matchId });
  const res = await fetch(`/neon_v1/coop/match/state?${qp.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return (data.match ?? null) as CoopMatchState | null;
}

export async function coopMatchAction(
  token: string,
  matchId: string,
  action: string,
  payload: Record<string, unknown> = {},
  expectedSeq?: number
): Promise<CoopMatchState | null> {
  const body: Record<string, unknown> = { matchId, action, payload };
  if (typeof expectedSeq === 'number' && Number.isFinite(expectedSeq)) {
    body.expectedSeq = Math.max(0, Math.floor(expectedSeq));
  }
  const res = await fetch('/neon_v1/coop/match/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return (data.match ?? null) as CoopMatchState | null;
}

export function coopMatchEventsSource(token: string, matchId: string): EventSource {
  const qp = new URLSearchParams({ matchId, token });
  return new EventSource(`/neon_v1/coop/match/events?${qp.toString()}`);
}

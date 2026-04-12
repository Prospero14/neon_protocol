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
    chat: data.chat ?? [],
  };
}

export async function coopLobbyFetchState(token: string): Promise<{
  online: CoopLobbyOnlineUser[];
  party: CoopLobbyParty | null;
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

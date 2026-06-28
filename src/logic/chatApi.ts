/** Клиент микросервиса чата (JWT). */

export type ChatRoomSummary = {
  id: string;
  kind: 'public' | 'dm' | string;
  title: string;
  lastMessage: ChatMessage | null;
};

export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  isAdmin: boolean;
  isSpam?: boolean;
  isBot?: boolean;
  isNpc?: boolean;
  npcName?: string;
  npcImageUrl?: string;
  npcArchetype?: string;
  npcId?: string;
  text: string;
  payload?: Record<string, unknown> | null;
  isFile?: boolean;
  fileId?: string;
  fileTitle?: string;
  fileProtected?: boolean;
  ts: number;
};

export type ChatUser = {
  id: string;
  username: string;
  isAdmin: boolean;
};

async function parseJson(res: Response) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return { error: t };
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function chatSafeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ res: Response; data: Record<string, unknown> } | null> {
  try {
    const res = await fetch(input, init);
    const data = (await parseJson(res)) as Record<string, unknown>;
    return { res, data };
  } catch (err) {
    console.error('[chat] fetch failed:', input, err);
    return null;
  }
}

export async function chatFetchRooms(token: string): Promise<{
  rooms: ChatRoomSummary[];
  me: { userId: string; username: string; isAdmin: boolean };
} | null> {
  const out = await chatSafeFetch('/neon_v1/services/chat/rooms', { headers: authHeaders(token) });
  if (!out || !out.res.ok) return null;
  return { rooms: (out.data.rooms as ChatRoomSummary[]) ?? [], me: out.data.me as { userId: string; username: string; isAdmin: boolean } };
}

export async function chatFetchUsers(token: string): Promise<ChatUser[]> {
  const out = await chatSafeFetch('/neon_v1/services/chat/users', { headers: authHeaders(token) });
  if (!out || !out.res.ok) return [];
  return (out.data.users as ChatUser[]) ?? [];
}

export async function chatOpenDm(
  token: string,
  targetUserId: string
): Promise<{ id: string; kind: string; title: string } | null> {
  const out = await chatSafeFetch('/neon_v1/services/chat/dm', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ targetUserId }),
  });
  if (!out || !out.res.ok) return null;
  return (out.data.room as { id: string; kind: string; title: string }) ?? null;
}

export async function chatFetchMessages(
  token: string,
  roomId: string,
  since = 0,
  day?: string
): Promise<ChatMessage[]> {
  const qp = new URLSearchParams();
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) qp.set('day', day);
  else if (since > 0) qp.set('since', String(since));
  const suffix = qp.toString() ? `?${qp.toString()}` : '';
  const out = await chatSafeFetch(`/neon_v1/services/chat/rooms/${roomId}/messages${suffix}`, {
    headers: authHeaders(token),
  });
  if (!out || !out.res.ok) return [];
  return (out.data.messages as ChatMessage[]) ?? [];
}

export async function chatSendMessage(
  token: string,
  roomId: string,
  text: string,
  opts?: { asNpcId?: string; dmTargetUserId?: string; nriCode?: string }
): Promise<ChatMessage | null> {
  const out = await chatSafeFetch(`/neon_v1/services/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      text,
      asNpcId: opts?.asNpcId,
      dmTargetUserId: opts?.dmTargetUserId,
      nriCode: opts?.nriCode,
    }),
  });
  if (!out || !out.res.ok) return null;
  return (out.data.message as ChatMessage) ?? null;
}

export async function chatSendFile(token: string, roomId: string, fileId: string): Promise<ChatMessage | null> {
  const out = await chatSafeFetch(`/neon_v1/services/chat/rooms/${roomId}/file`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ fileId }),
  });
  if (!out || !out.res.ok) return null;
  return (out.data.message as ChatMessage) ?? null;
}

/** Отправить файл в личку пользователю (открывает DM при необходимости). */
export async function chatSendFileToUser(
  token: string,
  fileId: string,
  targetUserId: string
): Promise<ChatMessage | null> {
  const dm = await chatOpenDm(token, targetUserId);
  if (!dm) return null;
  return chatSendFile(token, dm.id, fileId);
}

export async function chatGetSpamBot(token: string): Promise<{
  enabled: boolean;
  roomId: string;
  bot?: { username: string; label: string };
} | null> {
  const out = await chatSafeFetch('/neon_v1/services/chat/spam-bot', { headers: authHeaders(token) });
  if (!out || !out.res.ok) return null;
  return {
    enabled: !!out.data.enabled,
    roomId: String(out.data.roomId ?? ''),
    bot: out.data.bot as { username: string; label: string } | undefined,
  };
}

export type ChatParticipant = {
  userId: string;
  username: string;
  isAdmin?: boolean;
  isBot?: boolean;
  isHost?: boolean;
};

export async function chatFetchParticipants(
  token: string,
  roomId: string
): Promise<{ participants: ChatParticipant[]; spamBotEnabled: boolean } | null> {
  const out = await chatSafeFetch(`/neon_v1/services/chat/rooms/${roomId}/participants`, {
    headers: authHeaders(token),
  });
  if (!out || !out.res.ok) return null;
  return {
    participants: (out.data.participants as ChatParticipant[]) ?? [],
    spamBotEnabled: !!out.data.spamBotEnabled,
  };
}

export async function chatSetSpamBot(token: string, enabled: boolean): Promise<boolean> {
  const out = await chatSafeFetch('/neon_v1/services/chat/spam-bot', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ enabled }),
  });
  return !!out?.res.ok;
}

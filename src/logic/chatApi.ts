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

export async function chatFetchRooms(token: string): Promise<{
  rooms: ChatRoomSummary[];
  me: { userId: string; username: string; isAdmin: boolean };
} | null> {
  const res = await fetch('/neon_v1/services/chat/rooms', { headers: authHeaders(token) });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { rooms: data.rooms ?? [], me: data.me };
}

export async function chatFetchUsers(token: string): Promise<ChatUser[]> {
  const res = await fetch('/neon_v1/services/chat/users', { headers: authHeaders(token) });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.users ?? [];
}

export async function chatOpenDm(
  token: string,
  targetUserId: string
): Promise<{ id: string; kind: string; title: string } | null> {
  const res = await fetch('/neon_v1/services/chat/dm', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ targetUserId }),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.room ?? null;
}

export async function chatFetchMessages(
  token: string,
  roomId: string,
  since = 0
): Promise<ChatMessage[]> {
  const qp = new URLSearchParams();
  if (since > 0) qp.set('since', String(since));
  const suffix = qp.toString() ? `?${qp.toString()}` : '';
  const res = await fetch(`/neon_v1/services/chat/rooms/${roomId}/messages${suffix}`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.messages ?? [];
}

export async function chatSendMessage(
  token: string,
  roomId: string,
  text: string,
  opts?: { asNpcId?: string; dmTargetUserId?: string; nriCode?: string }
): Promise<ChatMessage | null> {
  const res = await fetch(`/neon_v1/services/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      text,
      asNpcId: opts?.asNpcId,
      dmTargetUserId: opts?.dmTargetUserId,
      nriCode: opts?.nriCode,
    }),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.message ?? null;
}

export async function chatSendFile(token: string, roomId: string, fileId: string): Promise<ChatMessage | null> {
  const res = await fetch(`/neon_v1/services/chat/rooms/${roomId}/file`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ fileId }),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.message ?? null;
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
  const res = await fetch('/neon_v1/services/chat/spam-bot', { headers: authHeaders(token) });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { enabled: !!data.enabled, roomId: data.roomId, bot: data.bot };
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
  const res = await fetch(`/neon_v1/services/chat/rooms/${roomId}/participants`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { participants: data.participants ?? [], spamBotEnabled: !!data.spamBotEnabled };
}

export async function chatSetSpamBot(token: string, enabled: boolean): Promise<boolean> {
  const res = await fetch('/neon_v1/services/chat/spam-bot', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ enabled }),
  });
  return res.ok;
}

const TTL_MS = 90_000;

type Member = {
  userId: string;
  username: string;
  lastSeen: number;
  isHost: boolean;
};

const membersByCode = new Map<string, Map<string, Member>>();

function prune(code: string) {
  const map = membersByCode.get(code);
  if (!map) return;
  const now = Date.now();
  for (const [uid, m] of map) {
    if (now - m.lastSeen > TTL_MS) map.delete(uid);
  }
  if (map.size === 0) membersByCode.delete(code);
}

export function nriTouchMember(code: string, userId: string, username: string, isHost = false) {
  let map = membersByCode.get(code);
  if (!map) {
    map = new Map();
    membersByCode.set(code, map);
  }
  map.set(userId, { userId, username, lastSeen: Date.now(), isHost: isHost || map.get(userId)?.isHost === true });
  prune(code);
}

export function nriIsMember(code: string, userId: string): boolean {
  prune(code);
  return membersByCode.get(code)?.has(userId) ?? false;
}

export function nriListMembers(code: string): Member[] {
  prune(code);
  const map = membersByCode.get(code);
  if (!map) return [];
  return [...map.values()].sort((a, b) => {
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    return a.username.localeCompare(b.username, 'ru');
  });
}

export function nriClearLobby(code: string) {
  membersByCode.delete(code);
}

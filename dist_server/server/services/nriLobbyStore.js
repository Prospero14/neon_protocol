const TTL_MS = 90_000;
const membersByCode = new Map();
function prune(code) {
    const map = membersByCode.get(code);
    if (!map)
        return;
    const now = Date.now();
    for (const [uid, m] of map) {
        if (now - m.lastSeen > TTL_MS)
            map.delete(uid);
    }
    if (map.size === 0)
        membersByCode.delete(code);
}
export function nriTouchMember(code, userId, username, isHost = false) {
    let map = membersByCode.get(code);
    if (!map) {
        map = new Map();
        membersByCode.set(code, map);
    }
    map.set(userId, { userId, username, lastSeen: Date.now(), isHost: isHost || map.get(userId)?.isHost === true });
    prune(code);
}
export function nriIsMember(code, userId) {
    prune(code);
    return membersByCode.get(code)?.has(userId) ?? false;
}
export function nriListMembers(code) {
    prune(code);
    const map = membersByCode.get(code);
    if (!map)
        return [];
    return [...map.values()].sort((a, b) => {
        if (a.isHost !== b.isHost)
            return a.isHost ? -1 : 1;
        return a.username.localeCompare(b.username, 'ru');
    });
}
export function nriClearLobby(code) {
    membersByCode.delete(code);
}
//# sourceMappingURL=nriLobbyStore.js.map
function rowToMatch(row) {
    return {
        id: row.id,
        partyId: row.partyId,
        hostId: row.hostId,
        status: row.status,
        createdAt: row.createdAt.getTime(),
        updatedAt: row.updatedAt.getTime(),
        memberIds: Array.isArray(row.memberIds) ? row.memberIds : [],
        roleByUserId: row.roleByUserId && typeof row.roleByUserId === 'object' && !Array.isArray(row.roleByUserId)
            ? row.roleByUserId
            : {},
        shared: row.shared,
        events: Array.isArray(row.events) ? row.events : [],
        intentQueue: Array.isArray(row.intentQueue) ? row.intentQueue : [],
        seq: row.seq,
        linkedObjectiveAwardedIds: Array.isArray(row.linkedObjectiveAwardedIds)
            ? row.linkedObjectiveAwardedIds
            : [],
    };
}
export async function loadActiveCoopMatches(prisma) {
    try {
        const rows = await prisma.coopLiveMatch.findMany({
            where: { status: { not: 'finished' } },
        });
        return rows.map(rowToMatch);
    }
    catch (e) {
        console.warn('[coopMatchStore] load skipped:', e?.message ?? e);
        return [];
    }
}
export async function persistCoopMatch(prisma, match) {
    try {
        await prisma.coopLiveMatch.upsert({
            where: { id: match.id },
            create: {
                id: match.id,
                partyId: match.partyId,
                hostId: match.hostId,
                status: match.status,
                memberIds: match.memberIds,
                roleByUserId: match.roleByUserId,
                shared: match.shared,
                events: match.events,
                intentQueue: match.intentQueue,
                seq: match.seq,
                linkedObjectiveAwardedIds: match.linkedObjectiveAwardedIds ?? [],
                createdAt: new Date(match.createdAt),
                updatedAt: new Date(match.updatedAt),
            },
            update: {
                hostId: match.hostId,
                status: match.status,
                memberIds: match.memberIds,
                roleByUserId: match.roleByUserId,
                shared: match.shared,
                events: match.events,
                intentQueue: match.intentQueue,
                seq: match.seq,
                linkedObjectiveAwardedIds: match.linkedObjectiveAwardedIds ?? [],
                updatedAt: new Date(match.updatedAt),
            },
        });
    }
    catch (e) {
        console.error('[coopMatchStore] persist failed:', e);
    }
}
export async function deleteCoopMatch(prisma, matchId) {
    try {
        await prisma.coopLiveMatch.delete({ where: { id: matchId } });
    }
    catch {
        // already gone
    }
}
/** Восстановить party из активных матчей после рестарта. */
export function partiesFromMatches(matches) {
    const parties = new Map();
    for (const match of matches) {
        if (match.status === 'finished')
            continue;
        parties.set(match.partyId, {
            id: match.partyId,
            hostId: match.hostId,
            memberIds: [...match.memberIds],
        });
    }
    return parties;
}
export function findMatchForUser(matches, matchByPartyId, userId) {
    for (const match of matches.values()) {
        if (match.status !== 'finished' && match.memberIds.includes(userId)) {
            return match.id;
        }
    }
    for (const [partyId, matchId] of matchByPartyId) {
        const m = matches.get(matchId);
        if (m && m.memberIds.includes(userId))
            return matchId;
        void partyId;
    }
    return null;
}
export function partyIdForUser(parties, matches, userId) {
    for (const p of parties.values()) {
        if (p.memberIds.includes(userId))
            return p.id;
    }
    for (const m of matches.values()) {
        if (m.status !== 'finished' && m.memberIds.includes(userId))
            return m.partyId;
    }
    return null;
}
//# sourceMappingURL=coopMatchStore.js.map
export async function touchNriMember(prisma, sessionId, userId, username, isHost) {
    const existing = await prisma.nriSessionMember.findUnique({
        where: { sessionId_userId: { sessionId, userId } },
    });
    await prisma.nriSessionMember.upsert({
        where: { sessionId_userId: { sessionId, userId } },
        create: { sessionId, userId, username, isHost },
        update: {
            username,
            isHost: isHost || existing?.isHost === true,
            lastSeenAt: new Date(),
        },
    });
}
export async function listNriMembers(prisma, sessionId) {
    const [members, players] = await Promise.all([
        prisma.nriSessionMember.findMany({
            where: { sessionId },
            orderBy: [{ isHost: 'desc' }, { username: 'asc' }],
        }),
        prisma.nriPlayer.findMany({
            where: { sessionId },
            select: { userId: true, displayName: true },
        }),
    ]);
    const displayByUser = new Map(players.map((p) => [p.userId, p.displayName]));
    return members.map((m) => ({
        userId: m.userId,
        username: m.username,
        isHost: m.isHost,
        displayName: displayByUser.get(m.userId) ?? null,
    }));
}
export async function isNriMember(prisma, sessionId, userId) {
    const row = await prisma.nriSessionMember.findUnique({
        where: { sessionId_userId: { sessionId, userId } },
    });
    return !!row;
}
/** Очистка данных стола при закрытии (чат, участники, чарники, файлы). */
export async function purgeNriSessionData(prisma, session) {
    await prisma.$transaction([
        prisma.chatMessage.deleteMany({ where: { roomId: session.chatRoomId } }),
        prisma.nriFileUnlock.deleteMany({
            where: { file: { sessionId: session.id } },
        }),
        prisma.nriVaultFile.deleteMany({ where: { sessionId: session.id } }),
        prisma.nriNpc.deleteMany({ where: { sessionId: session.id } }),
        prisma.nriCombatant.deleteMany({ where: { sessionId: session.id } }),
        prisma.nriPresetCharacter.deleteMany({ where: { sessionId: session.id } }),
        prisma.nriCyberProduct.deleteMany({ where: { sessionId: session.id } }),
        prisma.nriMapMarker.deleteMany({ where: { sessionId: session.id } }),
        prisma.nriPlayer.deleteMany({ where: { sessionId: session.id } }),
        prisma.nriSessionMember.deleteMany({ where: { sessionId: session.id } }),
    ]);
}
//# sourceMappingURL=nriMemberDb.js.map
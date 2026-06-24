import { ADMIN_USERNAME, isAdminUsername } from './auth.js';
import { isNriMember } from './nriMemberDb.js';
import { SPAM_BOT_USERNAME } from './messengerSpamPool.js';
import { isSpamPaused } from './nriWallet.js';
import { ensureSpamBotUser, spamBotKeyForGeneral, startRoomSpamBot, stopRoomSpamBot, } from './spamBotRunner.js';
import { resolveNpcPortraitUrl } from '../../shared/nri-domain/npcPortrait.js';
const PUBLIC_SLUG = 'general';
const MAX_MESSAGE_LEN = 500;
const MAX_MESSAGES_FETCH = 80;
const MAX_NRI_MESSAGES_FETCH = 500;
function dmKeyFor(userA, userB) {
    return [userA, userB].sort().join(':');
}
async function ensurePublicRoom(prisma) {
    let room = await prisma.chatRoom.findUnique({ where: { slug: PUBLIC_SLUG } });
    if (!room) {
        room = await prisma.chatRoom.create({
            data: { kind: 'public', slug: PUBLIC_SLUG },
        });
    }
    await prisma.chatRoomMeta.upsert({
        where: { roomId: room.id },
        create: { roomId: room.id, spamBotEnabled: false },
        update: {},
    });
    return room;
}
async function findOrCreateDmRoom(prisma, selfId, peerId) {
    const dmKey = dmKeyFor(selfId, peerId);
    let room = await prisma.chatRoom.findUnique({ where: { dmKey } });
    if (!room) {
        room = await prisma.chatRoom.create({
            data: { kind: 'dm', dmKey },
        });
    }
    return room;
}
async function canAccessRoom(prisma, room, userId, isAdmin) {
    if (room.kind === 'public')
        return true;
    if (room.kind === 'nri' && room.slug) {
        if (isAdmin)
            return true;
        const session = await prisma.nriSession.findUnique({ where: { inviteCode: room.slug } });
        if (!session || session.status !== 'open')
            return false;
        if (session.hostUserId === userId)
            return true;
        return isNriMember(prisma, session.id, userId);
    }
    if (room.kind === 'dm' && room.dmKey) {
        const parts = room.dmKey.split(':');
        return parts.includes(userId) || isAdmin;
    }
    return isAdmin;
}
function parsePayload(raw) {
    if (!raw)
        return null;
    try {
        const v = JSON.parse(raw);
        return v && typeof v === 'object' ? v : null;
    }
    catch {
        return null;
    }
}
function serializeMessage(msg) {
    const payload = parsePayload(msg.payload);
    const isFile = payload?.type === 'file';
    const isNpc = payload?.type === 'npc';
    return {
        id: msg.id,
        userId: msg.userId,
        username: msg.user.username,
        isAdmin: isAdminUsername(msg.user.username),
        isSpam: msg.user.username === SPAM_BOT_USERNAME || /\[РЕКЛАМА\]/i.test(msg.text),
        isBot: msg.user.username === SPAM_BOT_USERNAME,
        isNpc,
        npcName: isNpc && typeof payload?.displayName === 'string' ? payload.displayName : undefined,
        npcImageUrl: isNpc && typeof payload?.imageUrl === 'string' ? payload.imageUrl : undefined,
        npcArchetype: isNpc && typeof payload?.npcArchetype === 'string' ? payload.npcArchetype : undefined,
        npcId: isNpc && typeof payload?.npcId === 'string' ? payload.npcId : undefined,
        text: msg.text,
        payload,
        isFile,
        fileId: isFile && typeof payload?.fileId === 'string' ? payload.fileId : undefined,
        fileTitle: isFile && typeof payload?.title === 'string' ? payload.title : undefined,
        fileProtected: isFile && payload?.protected === true,
        ts: msg.createdAt.getTime(),
    };
}
/** Микросервис чата: общий канал + личные сообщения для авторизованных пользователей. */
export function mountChatService(app, deps) {
    const { prisma, jwtAuth, sendApiError } = deps;
    async function resolveUser(auth) {
        return prisma.user.findUnique({
            where: { id: auth.userId },
            select: { id: true, username: true },
        });
    }
    app.get('/neon_v1/services/chat/rooms', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'CHAT_USER_NOT_FOUND', 'Пользователь не найден.');
            const isAdmin = isAdminUsername(me.username);
            await ensurePublicRoom(prisma);
            const rooms = await prisma.chatRoom.findMany({
                where: isAdmin
                    ? {}
                    : {
                        OR: [{ kind: 'public' }, { kind: 'dm', dmKey: { contains: auth.userId } }],
                    },
                orderBy: { createdAt: 'asc' },
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: { user: { select: { username: true } } },
                    },
                },
            });
            const dmPeerIds = new Set();
            for (const r of rooms) {
                if (r.kind === 'dm' && r.dmKey) {
                    const [a, b] = r.dmKey.split(':');
                    dmPeerIds.add(a === auth.userId ? b : a);
                }
            }
            const peers = dmPeerIds.size > 0
                ? await prisma.user.findMany({
                    where: { id: { in: [...dmPeerIds] } },
                    select: { id: true, username: true },
                })
                : [];
            const peerById = new Map(peers.map((p) => [p.id, p.username]));
            res.json({
                rooms: rooms.map((r) => {
                    const last = r.messages[0];
                    let title = r.slug === PUBLIC_SLUG ? '#general' : 'DM';
                    if (r.kind === 'dm' && r.dmKey) {
                        const [a, b] = r.dmKey.split(':');
                        const peerId = a === auth.userId ? b : a;
                        const peerName = peerById.get(peerId) ?? peerId.slice(0, 8);
                        title = `@${peerName}`;
                    }
                    return {
                        id: r.id,
                        kind: r.kind,
                        title,
                        lastMessage: last ? serializeMessage(last) : null,
                    };
                }),
                me: { userId: me.id, username: me.username, isAdmin },
            });
        }
        catch (error) {
            console.error('chat/rooms:', error);
            return sendApiError(res, 500, 'CHAT_ROOMS_FAILED', 'Не удалось загрузить комнаты.');
        }
    });
    app.get('/neon_v1/services/chat/users', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'CHAT_USER_NOT_FOUND', 'Пользователь не найден.');
            const users = await prisma.user.findMany({
                where: { id: { not: auth.userId }, username: { not: SPAM_BOT_USERNAME } },
                select: { id: true, username: true },
                orderBy: { username: 'asc' },
                take: 100,
            });
            res.json({
                users: users.map((u) => ({
                    id: u.id,
                    username: u.username,
                    isAdmin: u.username === ADMIN_USERNAME,
                })),
            });
        }
        catch (error) {
            console.error('chat/users:', error);
            return sendApiError(res, 500, 'CHAT_USERS_FAILED', 'Не удалось загрузить список пользователей.');
        }
    });
    app.post('/neon_v1/services/chat/dm', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        const { targetUserId } = req.body;
        if (typeof targetUserId !== 'string' || !targetUserId.trim()) {
            return sendApiError(res, 400, 'CHAT_TARGET_REQUIRED', 'Укажите targetUserId.');
        }
        if (targetUserId === auth.userId) {
            return sendApiError(res, 400, 'CHAT_SELF_DM', 'Нельзя открыть личку с самим собой.');
        }
        try {
            const peer = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { id: true, username: true },
            });
            if (!peer)
                return sendApiError(res, 404, 'CHAT_PEER_NOT_FOUND', 'Пользователь не найден.');
            const room = await findOrCreateDmRoom(prisma, auth.userId, peer.id);
            res.json({
                room: {
                    id: room.id,
                    kind: room.kind,
                    title: `@${peer.username}`,
                    peer: { id: peer.id, username: peer.username, isAdmin: isAdminUsername(peer.username) },
                },
            });
        }
        catch (error) {
            console.error('chat/dm:', error);
            return sendApiError(res, 500, 'CHAT_DM_FAILED', 'Не удалось открыть личку.');
        }
    });
    app.get('/neon_v1/services/chat/rooms/:roomId/messages', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        const roomId = req.params.roomId;
        const sinceRaw = typeof req.query.since === 'string' ? Number(req.query.since) : 0;
        const since = Number.isFinite(sinceRaw) ? Math.max(0, sinceRaw) : 0;
        const dayRaw = typeof req.query.day === 'string' ? req.query.day.trim() : '';
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'CHAT_USER_NOT_FOUND', 'Пользователь не найден.');
            const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
            if (!room)
                return sendApiError(res, 404, 'CHAT_ROOM_NOT_FOUND', 'Комната не найдена.');
            const allowed = await canAccessRoom(prisma, room, auth.userId, isAdminUsername(me.username));
            if (!allowed)
                return sendApiError(res, 403, 'CHAT_FORBIDDEN', 'Нет доступа к комнате.');
            let messages;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dayRaw)) {
                const start = new Date(`${dayRaw}T00:00:00.000Z`);
                const end = new Date(`${dayRaw}T23:59:59.999Z`);
                const take = room.kind === 'nri' ? MAX_NRI_MESSAGES_FETCH : MAX_MESSAGES_FETCH;
                messages = await prisma.chatMessage.findMany({
                    where: { roomId, createdAt: { gte: start, lte: end } },
                    orderBy: { createdAt: 'asc' },
                    take,
                    include: { user: { select: { username: true } } },
                });
            }
            else if (since > 0) {
                messages = await prisma.chatMessage.findMany({
                    where: {
                        roomId,
                        createdAt: { gt: new Date(since) },
                    },
                    orderBy: { createdAt: 'asc' },
                    take: MAX_MESSAGES_FETCH,
                    include: { user: { select: { username: true } } },
                });
            }
            else {
                const take = room.kind === 'nri' ? MAX_NRI_MESSAGES_FETCH : MAX_MESSAGES_FETCH;
                const batch = await prisma.chatMessage.findMany({
                    where: { roomId },
                    orderBy: { createdAt: 'desc' },
                    take,
                    include: { user: { select: { username: true } } },
                });
                messages = batch.reverse();
            }
            res.json({ messages: messages.map(serializeMessage) });
        }
        catch (error) {
            console.error('chat/messages get:', error);
            return sendApiError(res, 500, 'CHAT_MESSAGES_FAILED', 'Не удалось загрузить сообщения.');
        }
    });
    app.post('/neon_v1/services/chat/rooms/:roomId/messages', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        const roomId = req.params.roomId;
        const { text, asNpcId, dmTargetUserId, nriCode } = req.body;
        if (typeof text !== 'string' || !text.trim()) {
            return sendApiError(res, 400, 'CHAT_TEXT_REQUIRED', 'Укажите текст сообщения.');
        }
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'CHAT_USER_NOT_FOUND', 'Пользователь не найден.');
            let room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
            if (!room)
                return sendApiError(res, 404, 'CHAT_ROOM_NOT_FOUND', 'Комната не найдена.');
            if (typeof dmTargetUserId === 'string' && dmTargetUserId.trim()) {
                room = await findOrCreateDmRoom(prisma, auth.userId, dmTargetUserId.trim());
            }
            const allowed = await canAccessRoom(prisma, room, auth.userId, isAdminUsername(me.username));
            if (!allowed)
                return sendApiError(res, 403, 'CHAT_FORBIDDEN', 'Нет доступа к комнате.');
            let payloadStr;
            if (typeof asNpcId === 'string' && asNpcId.trim()) {
                if (room.kind !== 'nri' && room.kind !== 'dm') {
                    return sendApiError(res, 400, 'CHAT_NPC_ROOM', 'НПС можно использовать только в столе НРИ или личке.');
                }
                let sessionId = null;
                if (room.kind === 'nri' && room.slug) {
                    const session = await prisma.nriSession.findUnique({ where: { inviteCode: room.slug } });
                    if (!session)
                        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
                    sessionId = session.id;
                    const platformAdmin = isAdminUsername(me.username);
                    if (session.hostUserId !== auth.userId && !platformAdmin) {
                        return sendApiError(res, 403, 'CHAT_NPC_HOST', 'От лица НПС пишет только мастер.');
                    }
                }
                else if (room.kind === 'dm') {
                    const code = typeof nriCode === 'string' ? nriCode.trim().toUpperCase() : '';
                    if (!code) {
                        return sendApiError(res, 400, 'CHAT_NPC_CODE', 'Укажите nriCode для сообщения НПС в личке.');
                    }
                    const session = await prisma.nriSession.findUnique({ where: { inviteCode: code } });
                    if (!session || session.status !== 'open') {
                        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
                    }
                    const platformAdmin = isAdminUsername(me.username);
                    if (session.hostUserId !== auth.userId && !platformAdmin) {
                        return sendApiError(res, 403, 'CHAT_NPC_HOST', 'От лица НПС пишет только мастер.');
                    }
                    sessionId = session.id;
                }
                if (!sessionId) {
                    return sendApiError(res, 400, 'CHAT_NPC_SESSION', 'Не удалось определить стол для НПС.');
                }
                const npc = await prisma.nriNpc.findFirst({
                    where: { id: asNpcId.trim(), sessionId },
                });
                if (!npc)
                    return sendApiError(res, 404, 'CHAT_NPC_NOT_FOUND', 'НПС не найден.');
                const sheet = npc.sheet && typeof npc.sheet === 'object'
                    ? npc.sheet
                    : null;
                const npcArchetype = typeof sheet?.npcArchetype === 'string' && sheet.npcArchetype.trim()
                    ? sheet.npcArchetype.trim()
                    : undefined;
                const portraitUrl = resolveNpcPortraitUrl(npc);
                if (room.kind === 'nri' && room.slug) {
                    const liveSession = await prisma.nriSession.findUnique({ where: { inviteCode: room.slug } });
                    if (liveSession?.liveDialogEnabled) {
                        await prisma.nriSession.update({
                            where: { id: liveSession.id },
                            data: { liveDialogEndedAt: null },
                        });
                    }
                }
                else if (room.kind === 'dm') {
                    const code = typeof nriCode === 'string' ? nriCode.trim().toUpperCase() : '';
                    if (code) {
                        const liveSession = await prisma.nriSession.findUnique({ where: { inviteCode: code } });
                        if (liveSession?.liveDialogEnabled) {
                            await prisma.nriSession.update({
                                where: { id: liveSession.id },
                                data: { liveDialogEndedAt: null },
                            });
                        }
                    }
                }
                payloadStr = JSON.stringify({
                    type: 'npc',
                    npcId: npc.id,
                    displayName: npc.name,
                    imageUrl: portraitUrl ?? null,
                    npcArchetype,
                });
            }
            const msg = await prisma.chatMessage.create({
                data: {
                    roomId: room.id,
                    userId: auth.userId,
                    text: text.trim().slice(0, MAX_MESSAGE_LEN),
                    payload: payloadStr,
                },
                include: { user: { select: { username: true } } },
            });
            res.json({ message: serializeMessage(msg) });
        }
        catch (error) {
            console.error('chat/messages post:', error);
            return sendApiError(res, 500, 'CHAT_SEND_FAILED', 'Не удалось отправить сообщение.');
        }
    });
    app.get('/neon_v1/services/chat/spam-bot', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'CHAT_USER_NOT_FOUND', 'Пользователь не найден.');
            const room = await ensurePublicRoom(prisma);
            const meta = await prisma.chatRoomMeta.findUnique({ where: { roomId: room.id } });
            res.json({
                enabled: meta?.spamBotEnabled ?? false,
                roomId: room.id,
                bot: { username: SPAM_BOT_USERNAME, label: 'рекламный бот' },
            });
        }
        catch (error) {
            console.error('chat/spam-bot get:', error);
            return sendApiError(res, 500, 'CHAT_SPAM_GET_FAILED', 'Не удалось прочитать SPAM-бота.');
        }
    });
    async function roomSpamBotEnabled(room) {
        if (room.kind === 'public' && room.slug === PUBLIC_SLUG) {
            const meta = await prisma.chatRoomMeta.findUnique({ where: { roomId: room.id } });
            return meta?.spamBotEnabled === true;
        }
        if (room.kind === 'nri' && room.slug) {
            const session = await prisma.nriSession.findUnique({ where: { inviteCode: room.slug } });
            return !!(session?.spamBotEnabled &&
                session.status === 'open' &&
                !isSpamPaused(session.spamPausedUntil));
        }
        return false;
    }
    app.get('/neon_v1/services/chat/rooms/:roomId/participants', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        const roomId = req.params.roomId;
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'CHAT_USER_NOT_FOUND', 'Пользователь не найден.');
            const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
            if (!room)
                return sendApiError(res, 404, 'CHAT_ROOM_NOT_FOUND', 'Комната не найдена.');
            const allowed = await canAccessRoom(prisma, room, auth.userId, isAdminUsername(me.username));
            if (!allowed)
                return sendApiError(res, 403, 'CHAT_FORBIDDEN', 'Нет доступа к комнате.');
            const recent = await prisma.chatMessage.findMany({
                where: { roomId },
                orderBy: { createdAt: 'desc' },
                take: 80,
                include: { user: { select: { id: true, username: true } } },
            });
            const byUser = new Map();
            for (const msg of recent) {
                if (msg.user.username === SPAM_BOT_USERNAME)
                    continue;
                if (!byUser.has(msg.userId)) {
                    byUser.set(msg.userId, {
                        userId: msg.userId,
                        username: msg.user.username,
                        isAdmin: isAdminUsername(msg.user.username),
                    });
                }
            }
            if (!byUser.has(me.id)) {
                byUser.set(me.id, {
                    userId: me.id,
                    username: me.username,
                    isAdmin: isAdminUsername(me.username),
                });
            }
            const spamOn = await roomSpamBotEnabled(room);
            const participants = [...byUser.values()];
            if (spamOn) {
                const botId = await ensureSpamBotUser(prisma);
                participants.unshift({
                    userId: botId,
                    username: SPAM_BOT_USERNAME,
                    isBot: true,
                });
            }
            if (room.kind === 'nri' && room.slug) {
                const session = await prisma.nriSession.findUnique({ where: { inviteCode: room.slug } });
                if (session) {
                    for (const p of participants) {
                        if (p.userId === session.hostUserId)
                            p.isHost = true;
                    }
                }
            }
            res.json({ participants, spamBotEnabled: spamOn });
        }
        catch (error) {
            console.error('chat/participants:', error);
            return sendApiError(res, 500, 'CHAT_PARTICIPANTS_FAILED', 'Не удалось загрузить участников.');
        }
    });
    app.post('/neon_v1/services/chat/spam-bot', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return sendApiError(res, 400, 'CHAT_SPAM_FLAG_REQUIRED', 'Укажите enabled: true|false.');
        }
        try {
            const me = await resolveUser(auth);
            if (!me || !isAdminUsername(me.username)) {
                return sendApiError(res, 403, 'CHAT_ADMIN_ONLY', 'SPAM-бот #general — только админ.');
            }
            const room = await ensurePublicRoom(prisma);
            await prisma.chatRoomMeta.upsert({
                where: { roomId: room.id },
                create: { roomId: room.id, spamBotEnabled: enabled },
                update: { spamBotEnabled: enabled },
            });
            if (enabled) {
                await startRoomSpamBot(prisma, spamBotKeyForGeneral(), room.id, async () => {
                    const meta = await prisma.chatRoomMeta.findUnique({ where: { roomId: room.id } });
                    return meta?.spamBotEnabled === true;
                });
            }
            else {
                stopRoomSpamBot(spamBotKeyForGeneral());
            }
            res.json({ ok: true, enabled });
        }
        catch (error) {
            console.error('chat/spam-bot post:', error);
            return sendApiError(res, 500, 'CHAT_SPAM_SET_FAILED', 'Не удалось переключить SPAM-бота.');
        }
    });
    app.post('/neon_v1/services/chat/rooms/:roomId/file', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'CHAT_NO_TOKEN', 'Нет токена авторизации.');
        const roomId = req.params.roomId;
        const { fileId } = req.body;
        if (typeof fileId !== 'string' || !fileId.trim()) {
            return sendApiError(res, 400, 'CHAT_FILE_REQUIRED', 'Укажите fileId.');
        }
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'CHAT_USER_NOT_FOUND', 'Пользователь не найден.');
            const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
            if (!room)
                return sendApiError(res, 404, 'CHAT_ROOM_NOT_FOUND', 'Комната не найдена.');
            const allowed = await canAccessRoom(prisma, room, auth.userId, isAdminUsername(me.username));
            if (!allowed)
                return sendApiError(res, 403, 'CHAT_FORBIDDEN', 'Нет доступа к комнате.');
            const file = await prisma.nriVaultFile.findUnique({ where: { id: fileId } });
            if (!file)
                return sendApiError(res, 404, 'CHAT_FILE_NOT_FOUND', 'Файл не найден.');
            const isAdmin = isAdminUsername(me.username);
            if (file.createdById !== auth.userId && !isAdmin) {
                return sendApiError(res, 403, 'CHAT_FILE_FORBIDDEN', 'Отправлять может только создатель файла.');
            }
            if (file.sessionId) {
                const session = await prisma.nriSession.findUnique({ where: { id: file.sessionId } });
                if (session && session.hostUserId !== auth.userId && !isAdmin) {
                    return sendApiError(res, 403, 'CHAT_FILE_HOST_ONLY', 'Файлы стола шлёт мастер.');
                }
            }
            const payload = JSON.stringify({
                type: 'file',
                fileId: file.id,
                title: file.title,
                protected: file.protected,
            });
            const msg = await prisma.chatMessage.create({
                data: {
                    roomId,
                    userId: auth.userId,
                    text: `📎 ${file.title}`,
                    payload,
                },
                include: { user: { select: { username: true } } },
            });
            res.json({ message: serializeMessage(msg) });
        }
        catch (error) {
            console.error('chat/file post:', error);
            return sendApiError(res, 500, 'CHAT_FILE_SEND_FAILED', 'Не удалось отправить файл.');
        }
    });
}
//# sourceMappingURL=chatService.js.map
/** Лобби стола — info, create, join, state, close, spam-bot */
import { isAdminUsername } from './auth.js';
import { isNriMember, listNriMembers, purgeNriSessionData, touchNriMember } from './nriMemberDb.js';
import { startNriSpamBot, stopNriSpamBot } from './nriSpamBot.js';
import { isSpamPaused } from './nriWallet.js';
import { parseRequestBody } from '../../shared/api-schemas/parseBody.js';
import { nriCreateSessionSchema, nriJoinSchema } from '../../shared/api-schemas/nri.js';
const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genInviteCode() {
    let tail = '';
    for (let i = 0; i < 4; i++) {
        tail += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
    }
    return `NRI-${tail}`;
}
export function mountNriSessionLobbyRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
    app.get('/neon_v1/services/nri/:code/info', async (req, res) => {
        const code = String(req.params.code ?? '').trim().toUpperCase();
        if (!code)
            return sendApiError(res, 400, 'NRI_CODE_REQUIRED', 'Укажите код стола.');
        try {
            const session = await prisma.nriSession.findUnique({
                where: { inviteCode: code },
                include: { host: { select: { username: true } } },
            });
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или уже закрыт.');
            }
            res.json({
                inviteCode: session.inviteCode,
                title: session.title,
                hostUsername: session.host.username,
                status: session.status,
            });
        }
        catch (error) {
            console.error('nri/info:', error);
            return sendApiError(res, 500, 'NRI_INFO_FAILED', 'Не удалось загрузить стол.');
        }
    });
    app.post('/neon_v1/services/nri/create', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const parsed = parseRequestBody(nriCreateSessionSchema, req.body);
        if (!parsed.ok)
            return sendApiError(res, 400, 'NRI_CREATE_INVALID', parsed.message);
        const sessionTitle = parsed.data.title?.trim() ? parsed.data.title.trim().slice(0, 80) : 'НРИ-сессия';
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            let inviteCode = genInviteCode();
            for (let attempt = 0; attempt < 8; attempt++) {
                const exists = await prisma.nriSession.findUnique({ where: { inviteCode } });
                if (!exists)
                    break;
                inviteCode = genInviteCode();
            }
            const room = await prisma.chatRoom.create({
                data: { kind: 'nri', slug: inviteCode },
            });
            const session = await prisma.nriSession.create({
                data: {
                    inviteCode,
                    hostUserId: me.id,
                    title: sessionTitle,
                    chatRoomId: room.id,
                },
                include: { host: { select: { username: true } } },
            });
            await touchNriMember(prisma, session.id, me.id, me.username, true);
            res.status(201).json({
                session: {
                    id: session.id,
                    inviteCode: session.inviteCode,
                    title: session.title,
                    hostUsername: session.host.username,
                    chatRoomId: session.chatRoomId,
                    status: session.status,
                    spamBotEnabled: session.spamBotEnabled,
                },
            });
        }
        catch (error) {
            console.error('nri/create:', error);
            return sendApiError(res, 500, 'NRI_CREATE_FAILED', 'Не удалось создать стол.');
        }
    });
    app.post('/neon_v1/services/nri/:code/join', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const bodyParsed = parseRequestBody(nriJoinSchema, req.body);
        if (!bodyParsed.ok)
            return sendApiError(res, 400, 'NRI_JOIN_INVALID', bodyParsed.message);
        const code = String(req.params.code ?? '').trim().toUpperCase();
        if (!code)
            return sendApiError(res, 400, 'NRI_CODE_REQUIRED', 'Укажите код стола.');
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const session = await prisma.nriSession.findUnique({
                where: { inviteCode: code },
                include: { host: { select: { username: true } } },
            });
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или уже закрыт.');
            }
            const isHost = session.hostUserId === me.id;
            await touchNriMember(prisma, session.id, me.id, me.username, isHost);
            const members = await listNriMembers(prisma, session.id);
            res.json({
                session: {
                    id: session.id,
                    inviteCode: session.inviteCode,
                    title: session.title,
                    hostUsername: session.host.username,
                    chatRoomId: session.chatRoomId,
                    status: session.status,
                    isHost,
                    isAdmin: isAdminUsername(me.username),
                    ...sessionExtras(session),
                },
                members,
            });
        }
        catch (error) {
            console.error('nri/join:', error);
            return sendApiError(res, 500, 'NRI_JOIN_FAILED', 'Не удалось войти за стол.');
        }
    });
    app.get('/neon_v1/services/nri/:code/state', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        if (!code)
            return sendApiError(res, 400, 'NRI_CODE_REQUIRED', 'Укажите код стола.');
        try {
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const session = await prisma.nriSession.findUnique({
                where: { inviteCode: code },
                include: { host: { select: { username: true } } },
            });
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const isHost = session.hostUserId === me.id;
            const wasMember = await isNriMember(prisma, session.id, me.id);
            if (session.status === 'open' || isHost || wasMember) {
                await touchNriMember(prisma, session.id, me.id, me.username, isHost);
            }
            const members = await listNriMembers(prisma, session.id);
            res.json({
                session: {
                    id: session.id,
                    inviteCode: session.inviteCode,
                    title: session.title,
                    hostUsername: session.host.username,
                    chatRoomId: session.chatRoomId,
                    status: session.status,
                    isHost,
                    isAdmin: isAdminUsername(me.username),
                    ...sessionExtras(session),
                },
                members,
            });
        }
        catch (error) {
            console.error('nri/state:', error);
            return sendApiError(res, 500, 'NRI_STATE_FAILED', 'Не удалось обновить лобби.');
        }
    });
    app.post('/neon_v1/services/nri/:code/close', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await prisma.nriSession.findUnique({ where: { inviteCode: code } });
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            if (session.hostUserId !== auth.userId && !platformAdmin) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Закрыть стол может только мастер.');
            }
            await prisma.nriSession.update({
                where: { id: session.id },
                data: { status: 'closed', spamBotEnabled: false },
            });
            stopNriSpamBot(code);
            await purgeNriSessionData(prisma, session);
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/close:', error);
            return sendApiError(res, 500, 'NRI_CLOSE_FAILED', 'Не удалось закрыть стол.');
        }
    });
    function sessionExtras(session) {
        const pausedUntil = session.spamPausedUntil?.getTime() ?? null;
        return {
            spamBotEnabled: session.spamBotEnabled,
            spamPausedUntil: pausedUntil,
            spamPausedActive: isSpamPaused(session.spamPausedUntil),
        };
    }
    app.post('/neon_v1/services/nri/:code/spam-bot', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return sendApiError(res, 400, 'NRI_SPAM_FLAG_REQUIRED', 'Укажите enabled: true|false.');
        }
        try {
            const session = await prisma.nriSession.findUnique({ where: { inviteCode: code } });
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            if (session.status !== 'open') {
                return sendApiError(res, 400, 'NRI_TABLE_CLOSED', 'Стол уже закрыт.');
            }
            const me = await resolveUser(auth);
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            if (session.hostUserId !== auth.userId && !platformAdmin) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'SPAM-бота включает только мастер стола.');
            }
            const updated = await prisma.nriSession.update({
                where: { id: session.id },
                data: { spamBotEnabled: enabled },
            });
            if (enabled) {
                await startNriSpamBot(prisma, code, session.chatRoomId);
            }
            else {
                stopNriSpamBot(code);
            }
            res.json({ ok: true, spamBotEnabled: updated.spamBotEnabled });
        }
        catch (error) {
            console.error('nri/spam-bot:', error);
            return sendApiError(res, 500, 'NRI_SPAM_BOT_FAILED', 'Не удалось переключить SPAM-бота.');
        }
    });
}
//# sourceMappingURL=nriSessionLobbyRoutes.js.map
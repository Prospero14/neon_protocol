import bcrypt from 'bcryptjs';
import { isAdminUsername } from './auth.js';
import { isNriMember, listNriMembers, purgeNriSessionData, touchNriMember } from './nriMemberDb.js';
import { startNriSpamBot, stopNriSpamBot } from './nriSpamBot.js';
import { tryInstallCyberItem } from './nriCyberInstall.js';
import { mergeInventoryItem, takeOneCatalogItem, toggleEquipServer } from './nriItemGrant.js';
import { tryUseItemServer } from './nriItemConsumeServer.js';
import { catalogToServerInventoryItem } from './nriItemCatalogServer.js';
import { antispamPrice, isSpamPaused, readWonlongs, writeWonlongs } from './nriWallet.js';
import { applyIceRunResult, buildIcePlayStatus, maybeAutoClearIceBan, } from './nriIceBan.js';
import { listMapZones, ensureMapZonesSeeded, patchMapZone } from './nriMapZones.js';
import { mountNriLoreTravelRoutes, propagatePlaceUpdate } from './nriLoreTravel.js';
import { mountNriItemTransferRoutes } from './nriItemTransfer.js';
import { mountNriCombatantRoutes } from './nriCombatantRoutes.js';
const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genInviteCode() {
    let tail = '';
    for (let i = 0; i < 4; i++) {
        tail += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
    }
    return `NRI-${tail}`;
}
function mergePlayerSheetFromPreset(presetSheet, displayName, clientSheet) {
    if (!presetSheet || typeof presetSheet !== 'object')
        return undefined;
    const base = { ...presetSheet };
    const trimmed = displayName.trim().slice(0, 40);
    let characterName = trimmed;
    if (clientSheet && typeof clientSheet === 'object') {
        const cn = clientSheet.characterName;
        if (typeof cn === 'string' && cn.trim())
            characterName = cn.trim().slice(0, 40);
    }
    return { ...base, characterName };
}
/** Микросервис столов НРИ: создание, вход по коду, лобби. */
export function mountNriService(app, deps) {
    const { prisma, jwtAuth, sendApiError } = deps;
    async function resolveUser(auth) {
        return prisma.user.findUnique({
            where: { id: auth.userId },
            select: { id: true, username: true },
        });
    }
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
        const { title } = req.body;
        const sessionTitle = typeof title === 'string' && title.trim() ? title.trim().slice(0, 80) : 'НРИ-сессия';
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
    async function tableWonlongsSum(sessionId) {
        const players = await prisma.nriPlayer.findMany({
            where: { sessionId },
            select: { sheet: true },
        });
        return players.reduce((s, p) => s + readWonlongs(p.sheet), 0);
    }
    async function iceTableAllBanned(sessionId) {
        const players = await prisma.nriPlayer.findMany({
            where: { sessionId },
            select: { sheet: true, inventory: true },
        });
        if (!players.length)
            return false;
        return players.every((p) => {
            const st = buildIcePlayStatus(p.sheet, p.inventory, false);
            return st.hardwareBanned && !st.canPlay;
        });
    }
    async function iceStatusForPlayer(sessionId, sheet, inventory) {
        const cleared = maybeAutoClearIceBan(sheet, inventory);
        const tableAllBanned = await iceTableAllBanned(sessionId);
        const nextSheet = cleared ?? sheet;
        const status = buildIcePlayStatus(nextSheet, inventory, tableAllBanned);
        return { sheet: nextSheet, status, cleared: !!cleared };
    }
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
    app.get('/neon_v1/services/nri/:code/wallet', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            const sum = await tableWonlongsSum(session.id);
            const price = antispamPrice(sum);
            const [otherPlayers, npcs] = await Promise.all([
                prisma.nriPlayer.findMany({
                    where: { sessionId: session.id, userId: { not: auth.userId } },
                    select: { userId: true, displayName: true },
                    orderBy: { displayName: 'asc' },
                }),
                prisma.nriNpc.findMany({
                    where: { sessionId: session.id },
                    select: { id: true, name: true, sheet: true },
                    orderBy: { name: 'asc' },
                }),
            ]);
            res.json({
                wonlongs: player ? readWonlongs(player.sheet) : 0,
                tableWonlongsSum: sum,
                antispamPrice: price,
                spamPausedUntil: session.spamPausedUntil?.getTime() ?? null,
                spamPausedActive: isSpamPaused(session.spamPausedUntil),
                spamBotEnabled: session.spamBotEnabled,
                transferTargets: {
                    players: otherPlayers.map((p) => ({ userId: p.userId, displayName: p.displayName })),
                    npcs: npcs.map((n) => ({
                        id: n.id,
                        name: n.name,
                        wonlongs: readWonlongs(n.sheet),
                    })),
                },
            });
        }
        catch (error) {
            console.error('nri/wallet get:', error);
            return sendApiError(res, 500, 'NRI_WALLET_GET_FAILED', 'Не удалось загрузить кошелёк.');
        }
    });
    app.post('/neon_v1/services/nri/:code/antispam/pay', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            if (!session.spamBotEnabled) {
                return sendApiError(res, 400, 'NRI_SPAM_OFF', 'SPAM-бот не активен на этом столе.');
            }
            if (isSpamPaused(session.spamPausedUntil)) {
                return sendApiError(res, 409, 'NRI_SPAM_ALREADY_PAUSED', 'Антиспам уже оплачен.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!player) {
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            }
            const sum = await tableWonlongsSum(session.id);
            const price = antispamPrice(sum);
            const balance = readWonlongs(player.sheet);
            if (balance < price) {
                return sendApiError(res, 400, 'NRI_INSUFFICIENT_FUNDS', `Нужно ₩${price}, у вас ₩${balance}.`);
            }
            const pausedUntil = new Date(Date.now() + 60 * 60 * 1000);
            const [updatedPlayer, updatedSession] = await prisma.$transaction([
                prisma.nriPlayer.update({
                    where: { id: player.id },
                    data: { sheet: writeWonlongs(player.sheet, balance - price) },
                }),
                prisma.nriSession.update({
                    where: { id: session.id },
                    data: { spamPausedUntil: pausedUntil },
                }),
            ]);
            res.json({
                ok: true,
                wonlongs: readWonlongs(updatedPlayer.sheet),
                antispamPrice: price,
                spamPausedUntil: updatedSession.spamPausedUntil?.getTime() ?? null,
                spamPausedActive: true,
            });
        }
        catch (error) {
            console.error('nri/antispam pay:', error);
            return sendApiError(res, 500, 'NRI_ANTISPAM_FAILED', 'Не удалось оплатить антиспам.');
        }
    });
    app.get('/neon_v1/services/nri/:code/ice/status', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!player) {
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            }
            const { sheet, status, cleared } = await iceStatusForPlayer(session.id, player.sheet, player.inventory);
            if (cleared) {
                await prisma.nriPlayer.update({
                    where: { id: player.id },
                    data: { sheet: sheet },
                });
            }
            res.json(status);
        }
        catch (error) {
            console.error('nri/ice status:', error);
            return sendApiError(res, 500, 'NRI_ICE_STATUS_FAILED', 'Не удалось загрузить статус ICE.');
        }
    });
    app.post('/neon_v1/services/nri/:code/ice/result', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { won } = req.body;
        if (typeof won !== 'boolean') {
            return sendApiError(res, 400, 'NRI_ICE_WON', 'Укажите won: true|false.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!player) {
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            }
            const { sheet: nextSheet } = applyIceRunResult(player.sheet, won);
            const { sheet, status } = await iceStatusForPlayer(session.id, nextSheet, player.inventory);
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { sheet: sheet },
            });
            res.json({ ok: true, status });
        }
        catch (error) {
            console.error('nri/ice result:', error);
            return sendApiError(res, 500, 'NRI_ICE_RESULT_FAILED', 'Не удалось сохранить результат ICE.');
        }
    });
    app.get('/neon_v1/services/nri/:code/ice/leaderboard', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const rows = await prisma.nriIceScore.findMany({
                where: { sessionId: session.id, won: true },
                orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
                take: 50,
            });
            const bestByUser = new Map();
            for (const row of rows) {
                const prev = bestByUser.get(row.userId);
                if (!prev || row.score > prev.score)
                    bestByUser.set(row.userId, row);
            }
            const leaderboard = [...bestByUser.values()].sort((a, b) => b.score - a.score);
            res.json({
                entries: leaderboard.map((r) => ({
                    userId: r.userId,
                    displayName: r.displayName,
                    score: r.score,
                    exfilPct: r.exfilPct,
                    tracePct: r.tracePct,
                    at: r.createdAt.getTime(),
                })),
            });
        }
        catch (error) {
            console.error('nri/ice leaderboard:', error);
            return sendApiError(res, 500, 'NRI_ICE_LB_FAILED', 'Не удалось загрузить рейтинг.');
        }
    });
    app.post('/neon_v1/services/nri/:code/ice/score', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { score, exfilPct, tracePct, won } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!player) {
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            }
            const pts = typeof score === 'number' && Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
            const row = await prisma.nriIceScore.create({
                data: {
                    sessionId: session.id,
                    userId: auth.userId,
                    displayName: player.displayName,
                    score: pts,
                    exfilPct: typeof exfilPct === 'number' ? Math.round(exfilPct) : 0,
                    tracePct: typeof tracePct === 'number' ? Math.round(tracePct) : 0,
                    won: won === true,
                },
            });
            res.status(201).json({
                ok: true,
                entry: {
                    userId: row.userId,
                    displayName: row.displayName,
                    score: row.score,
                    exfilPct: row.exfilPct,
                    tracePct: row.tracePct,
                    at: row.createdAt.getTime(),
                },
            });
        }
        catch (error) {
            console.error('nri/ice score:', error);
            return sendApiError(res, 500, 'NRI_ICE_SCORE_FAILED', 'Не удалось записать результат.');
        }
    });
    app.get('/neon_v1/services/nri/:code/vehicles', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const rows = await prisma.nriSessionVehicle.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'asc' },
            });
            const players = await prisma.nriPlayer.findMany({
                where: { sessionId: session.id },
                select: { userId: true, displayName: true, classId: true, sheet: true },
            });
            const playerByUser = new Map(players.map((p) => [p.userId, p]));
            res.json({
                vehicles: rows.map((v) => {
                    const owner = v.assignedUserId ? playerByUser.get(v.assignedUserId) : null;
                    return {
                        id: v.id,
                        catalogId: v.catalogId,
                        label: v.label,
                        assignedUserId: v.assignedUserId,
                        assignedDisplayName: owner?.displayName ?? null,
                        ownerClassId: owner?.classId ?? null,
                        ownerSheet: owner?.sheet ?? null,
                        notes: v.notes,
                        createdAt: v.createdAt.getTime(),
                    };
                }),
            });
        }
        catch (error) {
            console.error('nri/vehicles get:', error);
            return sendApiError(res, 500, 'NRI_VEHICLES_GET_FAILED', 'Не удалось загрузить транспорт.');
        }
    });
    app.post('/neon_v1/services/nri/:code/vehicles', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { catalogId, label, notes, assignedUserId } = req.body;
        if (typeof catalogId !== 'string' || !catalogId.trim()) {
            return sendApiError(res, 400, 'NRI_VEHICLE_CATALOG', 'Укажите тип транспорта.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Транспорт добавляет только мастер.');
            }
            const vehicle = await prisma.nriSessionVehicle.create({
                data: {
                    sessionId: session.id,
                    catalogId: catalogId.trim(),
                    label: typeof label === 'string' && label.trim() ? label.trim().slice(0, 60) : null,
                    notes: typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 200) : null,
                    assignedUserId: typeof assignedUserId === 'string' && assignedUserId.trim() ? assignedUserId.trim() : null,
                },
            });
            res.status(201).json({
                vehicle: {
                    id: vehicle.id,
                    catalogId: vehicle.catalogId,
                    label: vehicle.label,
                    assignedUserId: vehicle.assignedUserId,
                    notes: vehicle.notes,
                    createdAt: vehicle.createdAt.getTime(),
                },
            });
        }
        catch (error) {
            console.error('nri/vehicles post:', error);
            return sendApiError(res, 500, 'NRI_VEHICLE_CREATE_FAILED', 'Не удалось добавить транспорт.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/vehicles/:vehicleId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const vehicleId = req.params.vehicleId;
        const { label, notes, assignedUserId } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Транспорт редактирует только мастер.');
            }
            const existing = await prisma.nriSessionVehicle.findFirst({
                where: { id: vehicleId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_VEHICLE_NOT_FOUND', 'Транспорт не найден.');
            const vehicle = await prisma.nriSessionVehicle.update({
                where: { id: vehicleId },
                data: {
                    ...(label !== undefined ? { label: label && String(label).trim() ? String(label).trim().slice(0, 60) : null } : {}),
                    ...(notes !== undefined ? { notes: notes && String(notes).trim() ? String(notes).trim().slice(0, 200) : null } : {}),
                    ...(assignedUserId !== undefined
                        ? {
                            assignedUserId: assignedUserId && String(assignedUserId).trim() ? String(assignedUserId).trim() : null,
                        }
                        : {}),
                },
            });
            res.json({
                vehicle: {
                    id: vehicle.id,
                    catalogId: vehicle.catalogId,
                    label: vehicle.label,
                    assignedUserId: vehicle.assignedUserId,
                    notes: vehicle.notes,
                    createdAt: vehicle.createdAt.getTime(),
                },
            });
        }
        catch (error) {
            console.error('nri/vehicles patch:', error);
            return sendApiError(res, 500, 'NRI_VEHICLE_UPDATE_FAILED', 'Не удалось обновить транспорт.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/vehicles/:vehicleId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const vehicleId = req.params.vehicleId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Транспорт удаляет только мастер.');
            }
            const existing = await prisma.nriSessionVehicle.findFirst({
                where: { id: vehicleId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_VEHICLE_NOT_FOUND', 'Транспорт не найден.');
            await prisma.nriSessionVehicle.delete({ where: { id: vehicleId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/vehicles delete:', error);
            return sendApiError(res, 500, 'NRI_VEHICLE_DELETE_FAILED', 'Не удалось удалить транспорт.');
        }
    });
    app.get('/neon_v1/services/nri/:code/scenario', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Сценарий доступен только мастеру.');
            }
            const [nodes, progress, positions, players] = await Promise.all([
                prisma.nriScenarioNode.findMany({
                    where: { sessionId: session.id },
                    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
                }),
                prisma.nriScenarioProgress.findUnique({ where: { sessionId: session.id } }),
                prisma.nriPlayerPosition.findMany({ where: { sessionId: session.id } }),
                prisma.nriPlayer.findMany({ where: { sessionId: session.id }, select: { userId: true } }),
            ]);
            const currentId = progress?.currentScriptNodeId ?? null;
            const zoneKeys = positions.map((p) => p.zoneKey).filter(Boolean);
            const completedIds = Array.isArray(progress?.completedNodeIds)
                ? progress.completedNodeIds.filter((x) => typeof x === 'string')
                : [];
            res.json({
                nodes: nodes.map((n) => {
                    const base = serializeScenarioNode(n);
                    const links = (base.links ?? {});
                    const meet = links.meetCheckpoint === true && typeof links.zoneKey === 'string';
                    let checkpointMet = false;
                    if (meet && currentId === n.id && players.length > 0) {
                        checkpointMet = zoneKeys.filter((z) => z === links.zoneKey).length >= players.length;
                    }
                    return { ...base, checkpointMet };
                }),
                progress: {
                    currentScriptNodeId: currentId,
                    completedNodeIds: completedIds,
                    updatedAt: progress?.updatedAt.getTime() ?? Date.now(),
                },
            });
        }
        catch (error) {
            console.error('nri/scenario get:', error);
            return sendApiError(res, 500, 'NRI_SCENARIO_GET_FAILED', 'Не удалось загрузить сценарий.');
        }
    });
    app.post('/neon_v1/services/nri/:code/scenario', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { parentId, title, body, links, sortOrder } = req.body;
        if (typeof title !== 'string' || !title.trim()) {
            return sendApiError(res, 400, 'NRI_SCENARIO_TITLE', 'Укажите название узла.');
        }
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Сценарий редактирует только мастер.');
            }
            const pid = typeof parentId === 'string' && parentId.trim() ? parentId.trim() : null;
            if (pid) {
                const parent = await prisma.nriScenarioNode.findFirst({
                    where: { id: pid, sessionId: session.id },
                });
                if (!parent)
                    return sendApiError(res, 404, 'NRI_SCENARIO_PARENT', 'Родительский узел не найден.');
            }
            else {
                const rootCount = await prisma.nriScenarioNode.count({
                    where: { sessionId: session.id, parentId: null },
                });
                if (rootCount > 0) {
                    return sendApiError(res, 400, 'NRI_SCENARIO_ROOT', 'Основной сценарий уже есть — добавьте квест как дочерний узел.');
                }
            }
            const node = await prisma.nriScenarioNode.create({
                data: {
                    sessionId: session.id,
                    parentId: pid,
                    title: title.trim().slice(0, 120),
                    body: typeof body === 'string' ? body.slice(0, 20000) : '',
                    sortOrder: typeof sortOrder === 'number' && Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0,
                    links: links && typeof links === 'object' ? links : {},
                },
            });
            res.status(201).json({ node: serializeScenarioNode(node) });
        }
        catch (error) {
            console.error('nri/scenario post:', error);
            return sendApiError(res, 500, 'NRI_SCENARIO_CREATE_FAILED', 'Не удалось создать узел.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/scenario/:nodeId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const nodeId = req.params.nodeId;
        const { title, body, links, sortOrder, parentId } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Сценарий редактирует только мастер.');
            }
            const existing = await prisma.nriScenarioNode.findFirst({
                where: { id: nodeId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_SCENARIO_NOT_FOUND', 'Узел не найден.');
            let nextParentId = undefined;
            if (parentId !== undefined) {
                if (parentId === null) {
                    const otherRoot = await prisma.nriScenarioNode.findFirst({
                        where: { sessionId: session.id, parentId: null, NOT: { id: nodeId } },
                    });
                    if (otherRoot) {
                        return sendApiError(res, 400, 'NRI_SCENARIO_ROOT', 'Основной сценарий уже существует.');
                    }
                    nextParentId = null;
                }
                else if (typeof parentId === 'string' && parentId.trim()) {
                    if (parentId.trim() === nodeId) {
                        return sendApiError(res, 400, 'NRI_SCENARIO_CYCLE', 'Узел не может быть родителем сам себе.');
                    }
                    const parent = await prisma.nriScenarioNode.findFirst({
                        where: { id: parentId.trim(), sessionId: session.id },
                    });
                    if (!parent)
                        return sendApiError(res, 404, 'NRI_SCENARIO_PARENT', 'Родитель не найден.');
                    nextParentId = parent.id;
                }
            }
            let mergedLinks = links !== undefined && typeof links === 'object' ? { ...links } : null;
            if (mergedLinks?.syncToLore === true) {
                const placeTitle = (typeof mergedLinks.placeTitle === 'string' && mergedLinks.placeTitle.trim()) ||
                    (typeof title === 'string' && title.trim()) ||
                    existing.title;
                const lorePlaceId = typeof mergedLinks.lorePlaceId === 'string' ? mergedLinks.lorePlaceId : null;
                if (lorePlaceId) {
                    const updatedPlace = await prisma.nriLorePlace.update({
                        where: { id: lorePlaceId },
                        data: {
                            title: placeTitle.slice(0, 120),
                            zoneKey: typeof mergedLinks.zoneKey === 'string' ? mergedLinks.zoneKey : null,
                            mapMarkerId: typeof mergedLinks.mapMarkerId === 'string' ? mergedLinks.mapMarkerId : null,
                            sourceScenarioNodeId: nodeId,
                        },
                    });
                    await propagatePlaceUpdate(prisma, session.id, updatedPlace);
                }
                else {
                    const created = await prisma.nriLorePlace.create({
                        data: {
                            sessionId: session.id,
                            title: placeTitle.slice(0, 120),
                            body: '',
                            zoneKey: typeof mergedLinks.zoneKey === 'string' ? mergedLinks.zoneKey : null,
                            mapMarkerId: typeof mergedLinks.mapMarkerId === 'string' ? mergedLinks.mapMarkerId : null,
                            sourceScenarioNodeId: nodeId,
                        },
                    });
                    mergedLinks = { ...mergedLinks, lorePlaceId: created.id };
                    await propagatePlaceUpdate(prisma, session.id, created);
                }
            }
            const updated = await prisma.nriScenarioNode.update({
                where: { id: nodeId },
                data: {
                    ...(typeof title === 'string' && title.trim() ? { title: title.trim().slice(0, 120) } : {}),
                    ...(typeof body === 'string' ? { body: body.slice(0, 20000) } : {}),
                    ...(mergedLinks ? { links: mergedLinks } : links !== undefined && typeof links === 'object' ? { links: links } : {}),
                    ...(typeof sortOrder === 'number' && Number.isFinite(sortOrder)
                        ? { sortOrder: Math.floor(sortOrder) }
                        : {}),
                    ...(nextParentId !== undefined ? { parentId: nextParentId } : {}),
                },
            });
            res.json({ node: serializeScenarioNode(updated) });
        }
        catch (error) {
            console.error('nri/scenario patch:', error);
            return sendApiError(res, 500, 'NRI_SCENARIO_PATCH_FAILED', 'Не удалось обновить узел.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/scenario/:nodeId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const nodeId = req.params.nodeId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Сценарий редактирует только мастер.');
            }
            const existing = await prisma.nriScenarioNode.findFirst({
                where: { id: nodeId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_SCENARIO_NOT_FOUND', 'Узел не найден.');
            await prisma.nriScenarioNode.delete({ where: { id: nodeId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/scenario delete:', error);
            return sendApiError(res, 500, 'NRI_SCENARIO_DELETE_FAILED', 'Не удалось удалить узел.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/player/notes', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { notes } = req.body;
        if (typeof notes !== 'string') {
            return sendApiError(res, 400, 'NRI_NOTES_REQUIRED', 'Укажите текст заметок.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!player) {
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            }
            const updated = await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { privateNotes: notes.slice(0, 50000) },
            });
            res.json({ ok: true, privateNotes: updated.privateNotes });
        }
        catch (error) {
            console.error('nri/player notes:', error);
            return sendApiError(res, 500, 'NRI_NOTES_SAVE_FAILED', 'Не удалось сохранить заметки.');
        }
    });
    app.post('/neon_v1/services/nri/:code/wonlongs/transfer', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { amount, toPlayerUserId, toNpcId, memo } = req.body;
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return sendApiError(res, 400, 'NRI_AMOUNT', 'Укажите сумму > 0.');
        }
        const amt = Math.floor(amount);
        const toPlayer = typeof toPlayerUserId === 'string' && toPlayerUserId.trim() ? toPlayerUserId.trim() : null;
        const toNpc = typeof toNpcId === 'string' && toNpcId.trim() ? toNpcId.trim() : null;
        if (!toPlayer && !toNpc) {
            return sendApiError(res, 400, 'NRI_TRANSFER_TARGET', 'Укажите получателя (игрок или НПС).');
        }
        if (toPlayer && toNpc) {
            return sendApiError(res, 400, 'NRI_TRANSFER_ONE', 'Только один получатель за раз.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const sender = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!sender) {
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            }
            const senderBal = readWonlongs(sender.sheet);
            if (senderBal < amt) {
                return sendApiError(res, 400, 'NRI_INSUFFICIENT_FUNDS', `Недостаточно ₩ (есть ${senderBal}).`);
            }
            if (toPlayer) {
                if (toPlayer === auth.userId) {
                    return sendApiError(res, 400, 'NRI_TRANSFER_SELF', 'Нельзя перевести себе.');
                }
                const recipient = await prisma.nriPlayer.findUnique({
                    where: { sessionId_userId: { sessionId: session.id, userId: toPlayer } },
                });
                if (!recipient)
                    return sendApiError(res, 404, 'NRI_RECIPIENT_NOT_FOUND', 'Игрок не найден.');
                const recBal = readWonlongs(recipient.sheet);
                await prisma.$transaction([
                    prisma.nriPlayer.update({
                        where: { id: sender.id },
                        data: { sheet: writeWonlongs(sender.sheet, senderBal - amt) },
                    }),
                    prisma.nriPlayer.update({
                        where: { id: recipient.id },
                        data: { sheet: writeWonlongs(recipient.sheet, recBal + amt) },
                    }),
                ]);
                res.json({
                    ok: true,
                    wonlongs: senderBal - amt,
                    memo: memo ?? null,
                    transfer: { to: 'player', userId: toPlayer, amount: amt },
                });
                return;
            }
            const npc = await prisma.nriNpc.findFirst({ where: { id: toNpc, sessionId: session.id } });
            if (!npc)
                return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
            const npcBal = readWonlongs(npc.sheet);
            await prisma.$transaction([
                prisma.nriPlayer.update({
                    where: { id: sender.id },
                    data: { sheet: writeWonlongs(sender.sheet, senderBal - amt) },
                }),
                prisma.nriNpc.update({
                    where: { id: npc.id },
                    data: { sheet: writeWonlongs(npc.sheet, npcBal + amt) },
                }),
            ]);
            res.json({
                ok: true,
                wonlongs: senderBal - amt,
                memo: memo ?? null,
                transfer: { to: 'npc', npcId: npc.id, amount: amt },
            });
        }
        catch (error) {
            console.error('nri/wonlongs transfer:', error);
            return sendApiError(res, 500, 'NRI_TRANSFER_FAILED', 'Не удалось перевести деньги.');
        }
    });
    app.post('/neon_v1/services/nri/:code/wonlongs/grant', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { playerUserId, amount, fromNpcId, memo } = req.body;
        if (typeof playerUserId !== 'string' || !playerUserId.trim()) {
            return sendApiError(res, 400, 'NRI_PLAYER_ID', 'Укажите playerUserId.');
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return sendApiError(res, 400, 'NRI_AMOUNT', 'Укажите сумму > 0.');
        }
        const amt = Math.floor(amount);
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Выдаёт деньги только мастер.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: playerUserId.trim() } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
            let playerSheet = player.sheet;
            if (typeof fromNpcId === 'string' && fromNpcId.trim()) {
                const npc = await prisma.nriNpc.findFirst({
                    where: { id: fromNpcId.trim(), sessionId: session.id },
                });
                if (!npc)
                    return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
                const npcBal = readWonlongs(npc.sheet);
                if (npcBal < amt) {
                    return sendApiError(res, 400, 'NRI_NPC_FUNDS', `У НПС только ₩${npcBal}.`);
                }
                await prisma.nriNpc.update({
                    where: { id: npc.id },
                    data: { sheet: writeWonlongs(npc.sheet, npcBal - amt) },
                });
            }
            const bal = readWonlongs(playerSheet);
            const updated = await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { sheet: writeWonlongs(playerSheet, bal + amt) },
            });
            res.json({
                ok: true,
                playerUserId: player.userId,
                wonlongs: readWonlongs(updated.sheet),
                amount: amt,
                memo: memo ?? null,
            });
        }
        catch (error) {
            console.error('nri/wonlongs grant:', error);
            return sendApiError(res, 500, 'NRI_GRANT_FAILED', 'Не удалось выдать деньги.');
        }
    });
    function serializeVaultFile(f) {
        const hasPassword = !!f.passwordHash;
        const hasIce = !!f.gameId;
        const passwordIsIceReward = hasPassword && hasIce && !!f.iceRewardCode;
        return {
            id: f.id,
            title: f.title,
            body: f.body,
            protected: f.protected,
            hasPassword,
            passwordIsIceReward,
            gameId: f.gameId,
            difficulty: f.difficulty,
            createdAt: f.createdAt.getTime(),
        };
    }
    function vaultIsDualReward(file) {
        return !!file.passwordHash && !!file.gameId && !!file.iceRewardCode;
    }
    async function vaultBypassUnlock(file, userId) {
        if (file.createdById === userId)
            return true;
        const me = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        if (me && isAdminUsername(me.username))
            return true;
        if (!file.sessionId)
            return false;
        const session = await prisma.nriSession.findUnique({
            where: { id: file.sessionId },
            select: { hostUserId: true },
        });
        return session?.hostUserId === userId;
    }
    async function parseVaultCreatePayload(body) {
        const usePassword = body.usePassword === true;
        let useIce = body.useIce === true;
        if (!usePassword && !useIce && (body.isProtected === true || body.protected === true)) {
            useIce = true;
        }
        const passwordRaw = typeof body.password === 'string' ? body.password.trim() : '';
        if (usePassword && passwordRaw.length < 3) {
            return {
                error: useIce
                    ? 'Укажите код-награду после ICE (мин. 3 символа).'
                    : 'Пароль должен быть не короче 3 символов.',
            };
        }
        if (!usePassword && !useIce) {
            return {
                data: {
                    protected: false,
                    passwordHash: null,
                    iceRewardCode: null,
                    gameId: null,
                    difficulty: null,
                },
            };
        }
        const passwordHash = usePassword ? await bcrypt.hash(passwordRaw, 10) : null;
        const iceRewardCode = usePassword && useIce ? passwordRaw.slice(0, 64) : null;
        return {
            data: {
                protected: true,
                passwordHash,
                iceRewardCode,
                gameId: useIce && typeof body.gameId === 'string' ? body.gameId : null,
                difficulty: useIce && typeof body.difficulty === 'string' ? body.difficulty : null,
            },
        };
    }
    async function resolveSession(code) {
        return prisma.nriSession.findUnique({
            where: { inviteCode: code },
            include: { host: { select: { username: true } } },
        });
    }
    function serializePlayer(p) {
        return {
            displayName: p.displayName,
            classId: p.classId,
            inventory: Array.isArray(p.inventory) ? p.inventory : [],
            sheet: p.sheet ?? null,
            portraitUrl: p.portraitUrl ?? null,
            presetId: p.presetId ?? null,
            privateNotes: p.privateNotes ?? '',
        };
    }
    function serializeScenarioNode(n) {
        return {
            id: n.id,
            parentId: n.parentId,
            title: n.title,
            body: n.body,
            sortOrder: n.sortOrder,
            links: n.links ?? {},
            createdAt: n.createdAt.getTime(),
            updatedAt: n.updatedAt.getTime(),
        };
    }
    function serializePreset(p) {
        return {
            id: p.id,
            label: p.label,
            classId: p.classId,
            inventory: Array.isArray(p.inventory) ? p.inventory : [],
            sheet: p.sheet ?? null,
            portraitUrl: p.portraitUrl,
            publishedToPlayers: p.publishedToPlayers,
            sortOrder: p.sortOrder,
            claimed: !!p.claimedByUserId,
            claimedByUserId: p.claimedByUserId,
            createdAt: p.createdAt.getTime(),
        };
    }
    function serializeNpc(n) {
        return {
            id: n.id,
            name: n.name,
            classId: n.classId,
            imageUrl: n.imageUrl,
            inventory: Array.isArray(n.inventory) ? n.inventory : [],
            sheet: n.sheet ?? null,
            notes: n.notes,
            createdAt: n.createdAt.getTime(),
            updatedAt: n.updatedAt.getTime(),
        };
    }
    function parseJsonField(raw) {
        if (raw === null || raw === undefined)
            return null;
        return raw;
    }
    async function requireHost(session, auth, me) {
        const platformAdmin = me ? isAdminUsername(me.username) : false;
        if (session.hostUserId !== auth.userId && !platformAdmin) {
            return false;
        }
        return true;
    }
    app.get('/neon_v1/services/nri/:code/player', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            res.json({ player: player ? serializePlayer(player) : null });
        }
        catch (error) {
            console.error('nri/player get:', error);
            return sendApiError(res, 500, 'NRI_PLAYER_GET_FAILED', 'Не удалось загрузить профиль.');
        }
    });
    app.get('/neon_v1/services/nri/:code/players', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            const isHost = session.hostUserId === auth.userId;
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            if (!isHost && !platformAdmin) {
                return sendApiError(res, 403, 'NRI_ROSTER_FORBIDDEN', 'Чарники доступны только мастеру.');
            }
            const players = await prisma.nriPlayer.findMany({
                where: { sessionId: session.id },
                include: { user: { select: { username: true } } },
                orderBy: { displayName: 'asc' },
            });
            res.json({
                players: players.map((p) => ({
                    userId: p.userId,
                    username: p.user.username,
                    displayName: p.displayName,
                    classId: p.classId,
                    inventory: Array.isArray(p.inventory) ? p.inventory : [],
                    sheet: p.sheet ?? null,
                    portraitUrl: p.portraitUrl ?? null,
                    presetId: p.presetId ?? null,
                })),
            });
        }
        catch (error) {
            console.error('nri/players get:', error);
            return sendApiError(res, 500, 'NRI_ROSTER_GET_FAILED', 'Не удалось загрузить чарников.');
        }
    });
    app.post('/neon_v1/services/nri/:code/player', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { displayName, classId, presetId, sheet, inventory } = req.body;
        if (typeof displayName !== 'string' || !displayName.trim()) {
            return sendApiError(res, 400, 'NRI_NAME_REQUIRED', 'Укажите имя персонажа.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            let player;
            if (typeof presetId === 'string' && presetId.trim()) {
                const preset = await prisma.nriPresetCharacter.findFirst({
                    where: {
                        id: presetId.trim(),
                        sessionId: session.id,
                        claimedByUserId: null,
                        publishedToPlayers: true,
                    },
                });
                if (!preset) {
                    return sendApiError(res, 409, 'NRI_PRESET_TAKEN', 'Этот персонаж недоступен, уже занят или не опубликован.');
                }
                player = await prisma.$transaction(async (tx) => {
                    await tx.nriPresetCharacter.update({
                        where: { id: preset.id },
                        data: { claimedByUserId: auth.userId },
                    });
                    const mergedSheet = mergePlayerSheetFromPreset(preset.sheet, displayName.trim(), sheet);
                    return tx.nriPlayer.upsert({
                        where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
                        create: {
                            sessionId: session.id,
                            userId: auth.userId,
                            displayName: displayName.trim().slice(0, 40),
                            classId: preset.classId,
                            inventory: preset.inventory ?? [],
                            sheet: (mergedSheet ?? undefined),
                            portraitUrl: preset.portraitUrl,
                            presetId: preset.id,
                        },
                        update: {
                            displayName: displayName.trim().slice(0, 40),
                            classId: preset.classId,
                            inventory: preset.inventory ?? [],
                            sheet: (mergedSheet ?? undefined),
                            portraitUrl: preset.portraitUrl,
                            presetId: preset.id,
                        },
                    });
                });
            }
            else {
                const presetCount = await prisma.nriPresetCharacter.count({
                    where: { sessionId: session.id, publishedToPlayers: true },
                });
                if (presetCount > 0) {
                    return sendApiError(res, 400, 'NRI_PRESET_REQUIRED', 'Мастер подготовил персонажей — выберите одного из списка.');
                }
                if (typeof classId !== 'string' || !classId.trim()) {
                    return sendApiError(res, 400, 'NRI_CLASS_REQUIRED', 'Выберите класс.');
                }
                const sheetPayload = sheet && typeof sheet === 'object' && sheet.abilities?.STR != null
                    ? sheet
                    : undefined;
                const inventoryPayload = Array.isArray(inventory) ? inventory : [];
                player = await prisma.nriPlayer.upsert({
                    where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
                    create: {
                        sessionId: session.id,
                        userId: auth.userId,
                        displayName: displayName.trim().slice(0, 40),
                        classId: classId.trim(),
                        sheet: sheetPayload ?? undefined,
                        inventory: inventoryPayload,
                    },
                    update: {
                        displayName: displayName.trim().slice(0, 40),
                        classId: classId.trim(),
                        ...(sheetPayload ? { sheet: sheetPayload } : {}),
                        inventory: inventoryPayload,
                    },
                });
            }
            await touchNriMember(prisma, session.id, auth.userId, me.username, session.hostUserId === auth.userId);
            res.json({ player: serializePlayer(player) });
        }
        catch (error) {
            console.error('nri/player post:', error);
            return sendApiError(res, 500, 'NRI_PLAYER_SAVE_FAILED', 'Не удалось сохранить профиль.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/players/:userId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const targetUserId = req.params.userId;
        const { displayName, sheet } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Редактирует только мастер.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: targetUserId } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
            const prevSheet = player.sheet && typeof player.sheet === 'object' ? { ...player.sheet } : {};
            const nextSheet = sheet !== undefined && sheet && typeof sheet === 'object'
                ? { ...prevSheet, ...sheet }
                : prevSheet;
            const updated = await prisma.nriPlayer.update({
                where: { id: player.id },
                data: {
                    ...(typeof displayName === 'string' && displayName.trim()
                        ? { displayName: displayName.trim().slice(0, 40) }
                        : {}),
                    ...(sheet !== undefined ? { sheet: nextSheet } : {}),
                },
            });
            res.json({ player: serializePlayer(updated) });
        }
        catch (error) {
            console.error('nri/player patch:', error);
            return sendApiError(res, 500, 'NRI_PLAYER_PATCH_FAILED', 'Не удалось обновить персонажа.');
        }
    });
    function serializeMapMarker(m, ctx) {
        const isHostMarker = m.kind === 'host' || m.kind === 'pin' || m.ownerUserId === ctx.hostUserId;
        return {
            id: m.id,
            label: m.label,
            blurb: m.blurb,
            x: m.x,
            y: m.y,
            kind: isHostMarker ? 'host' : 'player',
            ownerUserId: m.ownerUserId ?? (isHostMarker ? ctx.hostUserId : null),
            ownerName: ctx.ownerName,
            createdAt: m.createdAt.getTime(),
        };
    }
    async function mapMarkerOwnerNames(sessionId, hostUserId) {
        const [players, members, host] = await Promise.all([
            prisma.nriPlayer.findMany({
                where: { sessionId },
                select: { userId: true, displayName: true },
            }),
            prisma.nriSessionMember.findMany({
                where: { sessionId },
                select: { userId: true, username: true },
            }),
            prisma.user.findUnique({ where: { id: hostUserId }, select: { username: true } }),
        ]);
        const byUser = new Map();
        for (const m of members)
            byUser.set(m.userId, m.username);
        for (const p of players)
            byUser.set(p.userId, p.displayName);
        const hostLabel = byUser.get(hostUserId) ?? host?.username ?? 'Мастер';
        byUser.set(hostUserId, hostLabel);
        return byUser;
    }
    async function canAccessMap(session, userId) {
        if (session.hostUserId === userId)
            return true;
        if (await isNriMember(prisma, session.id, userId))
            return true;
        const player = await prisma.nriPlayer.findUnique({
            where: { sessionId_userId: { sessionId: session.id, userId } },
        });
        return !!player;
    }
    app.get('/neon_v1/services/nri/:code/map/zones', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const wasMember = await isNriMember(prisma, session.id, me.id);
            const allowed = session.status === 'open'
                ? await canAccessMap(session, me.id)
                : session.hostUserId === me.id || wasMember;
            if (!allowed) {
                return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Нет доступа к карте стола.');
            }
            const zones = await listMapZones(prisma);
            res.json({ zones, view: { w: 240, h: 165 } });
        }
        catch (error) {
            console.error('nri/map zones get:', error);
            return sendApiError(res, 500, 'NRI_MAP_ZONES_FAILED', 'Не удалось загрузить карту.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/map/zones/:zoneKey', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const zoneKey = req.params.zoneKey;
        const { name, corpName, pois, megaDistrict, color } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Редактирует только мастер.');
            }
            await ensureMapZonesSeeded(prisma);
            const zone = await patchMapZone(prisma, zoneKey, { name, corpName, pois, megaDistrict, color });
            if (!zone)
                return sendApiError(res, 404, 'NRI_ZONE_NOT_FOUND', 'Район не найден.');
            res.json({ zone });
        }
        catch (error) {
            console.error('nri/map zone patch:', error);
            return sendApiError(res, 500, 'NRI_ZONE_PATCH_FAILED', 'Не удалось обновить район.');
        }
    });
    app.get('/neon_v1/services/nri/:code/map/markers', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const wasMember = await isNriMember(prisma, session.id, me.id);
            const allowed = session.status === 'open'
                ? await canAccessMap(session, me.id)
                : session.hostUserId === me.id || wasMember;
            if (!allowed) {
                return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Нет доступа к карте стола.');
            }
            const markers = await prisma.nriMapMarker.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'asc' },
            });
            const ownerNames = await mapMarkerOwnerNames(session.id, session.hostUserId);
            res.json({
                markers: markers.map((m) => serializeMapMarker(m, {
                    hostUserId: session.hostUserId,
                    ownerName: m.ownerUserId
                        ? (ownerNames.get(m.ownerUserId) ?? null)
                        : ownerNames.get(session.hostUserId) ?? null,
                })),
            });
        }
        catch (error) {
            console.error('nri/map markers get:', error);
            return sendApiError(res, 500, 'NRI_MAP_GET_FAILED', 'Не удалось загрузить метки.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/markers', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { label, blurb, x, y, kind } = req.body;
        if (typeof label !== 'string' || !label.trim()) {
            return sendApiError(res, 400, 'NRI_MAP_LABEL', 'Укажите подпись метки.');
        }
        if (typeof x !== 'number' || typeof y !== 'number') {
            return sendApiError(res, 400, 'NRI_MAP_XY', 'Укажите координаты метки.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            if (!(await canAccessMap(session, me.id))) {
                return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Метки ставят только участники стола.');
            }
            const isHost = session.hostUserId === me.id;
            const markerKind = isHost ? 'host' : 'player';
            const marker = await prisma.nriMapMarker.create({
                data: {
                    sessionId: session.id,
                    ownerUserId: me.id,
                    label: label.trim().slice(0, 80),
                    blurb: typeof blurb === 'string' && blurb.trim() ? blurb.trim().slice(0, 500) : null,
                    x: Math.max(0, Math.min(100, x)),
                    y: Math.max(0, Math.min(100, y)),
                    kind: markerKind,
                },
            });
            const ownerNames = await mapMarkerOwnerNames(session.id, session.hostUserId);
            res.status(201).json({
                marker: serializeMapMarker(marker, {
                    hostUserId: session.hostUserId,
                    ownerName: ownerNames.get(me.id) ?? me.username,
                }),
            });
        }
        catch (error) {
            console.error('nri/map markers post:', error);
            return sendApiError(res, 500, 'NRI_MAP_CREATE_FAILED', 'Не удалось создать метку.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/map/markers/:markerId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const markerId = req.params.markerId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const existing = await prisma.nriMapMarker.findFirst({
                where: { id: markerId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_MAP_NOT_FOUND', 'Метка не найдена.');
            const isHost = await requireHost(session, auth, me);
            const ownsMarker = existing.ownerUserId === me.id;
            if (!isHost && !ownsMarker) {
                return sendApiError(res, 403, 'NRI_MAP_DELETE_FORBIDDEN', 'Удалить можно только свою метку.');
            }
            await prisma.nriMapMarker.delete({ where: { id: markerId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/map markers delete:', error);
            return sendApiError(res, 500, 'NRI_MAP_DELETE_FAILED', 'Не удалось удалить метку.');
        }
    });
    app.get('/neon_v1/services/nri/:code/vault', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            const isHost = session.hostUserId === auth.userId;
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            if (!isHost && !platformAdmin) {
                return sendApiError(res, 403, 'NRI_VAULT_FORBIDDEN', 'Файлохранилище доступно мастеру.');
            }
            const files = await prisma.nriVaultFile.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'desc' },
            });
            res.json({ files: files.map(serializeVaultFile) });
        }
        catch (error) {
            console.error('nri/vault get:', error);
            return sendApiError(res, 500, 'NRI_VAULT_GET_FAILED', 'Не удалось загрузить файлы.');
        }
    });
    app.post('/neon_v1/services/nri/:code/vault', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { title, body, protected: protectedAlias, isProtected, gameId, difficulty, password, usePassword, useIce } = req.body;
        if (typeof title !== 'string' || !title.trim()) {
            return sendApiError(res, 400, 'NRI_FILE_TITLE_REQUIRED', 'Укажите название файла.');
        }
        const fileBody = typeof body === 'string' ? body : '';
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            const isHost = session.hostUserId === auth.userId;
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            if (!isHost && !platformAdmin) {
                return sendApiError(res, 403, 'NRI_VAULT_FORBIDDEN', 'Создавать файлы может только мастер.');
            }
            const lock = await parseVaultCreatePayload({
                password,
                usePassword,
                useIce,
                isProtected,
                protected: protectedAlias,
                gameId,
                difficulty,
            });
            if ('error' in lock) {
                return sendApiError(res, 400, 'NRI_VAULT_PASSWORD_INVALID', lock.error ?? 'Некорректная защита файла.');
            }
            const file = await prisma.nriVaultFile.create({
                data: {
                    sessionId: session.id,
                    title: title.trim().slice(0, 80),
                    body: fileBody.slice(0, 8000),
                    protected: lock.data.protected,
                    passwordHash: lock.data.passwordHash,
                    iceRewardCode: lock.data.iceRewardCode,
                    gameId: lock.data.gameId,
                    difficulty: lock.data.difficulty,
                    createdById: auth.userId,
                },
            });
            res.status(201).json({ file: serializeVaultFile(file) });
        }
        catch (error) {
            console.error('nri/vault post:', error);
            return sendApiError(res, 500, 'NRI_VAULT_CREATE_FAILED', 'Не удалось создать файл.');
        }
    });
    app.get('/neon_v1/services/nri/:code/presets', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            const isHost = session.hostUserId === auth.userId;
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            const presets = await prisma.nriPresetCharacter.findMany({
                where: {
                    sessionId: session.id,
                    ...(isHost || platformAdmin
                        ? {}
                        : { publishedToPlayers: true, claimedByUserId: null }),
                },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            });
            const unclaimed = await prisma.nriPresetCharacter.count({
                where: { sessionId: session.id, claimedByUserId: null },
            });
            const publishedUnclaimed = await prisma.nriPresetCharacter.count({
                where: { sessionId: session.id, claimedByUserId: null, publishedToPlayers: true },
            });
            res.json({
                presets: presets.map(serializePreset),
                meta: { unclaimed, publishedUnclaimed, selectionRequired: unclaimed > 0 },
            });
        }
        catch (error) {
            console.error('nri/presets get:', error);
            return sendApiError(res, 500, 'NRI_PRESETS_GET_FAILED', 'Не удалось загрузить персонажей.');
        }
    });
    app.post('/neon_v1/services/nri/:code/presets', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { label, classId, inventory, sheet, portraitUrl, sortOrder, publishedToPlayers } = req.body;
        if (typeof label !== 'string' || !label.trim()) {
            return sendApiError(res, 400, 'NRI_PRESET_LABEL', 'Укажите название пресета.');
        }
        if (typeof classId !== 'string' || !classId.trim()) {
            return sendApiError(res, 400, 'NRI_CLASS_REQUIRED', 'Выберите класс.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Персонажей создаёт только мастер.');
            }
            const preset = await prisma.nriPresetCharacter.create({
                data: {
                    sessionId: session.id,
                    label: label.trim().slice(0, 60),
                    classId: classId.trim(),
                    inventory: Array.isArray(inventory) ? inventory : [],
                    sheet: parseJsonField(sheet) ?? undefined,
                    portraitUrl: typeof portraitUrl === 'string' && portraitUrl.trim() ? portraitUrl.trim().slice(0, 2000) : null,
                    sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
                    publishedToPlayers: publishedToPlayers !== false,
                },
            });
            res.status(201).json({ preset: serializePreset(preset) });
        }
        catch (error) {
            console.error('nri/presets post:', error);
            return sendApiError(res, 500, 'NRI_PRESET_CREATE_FAILED', 'Не удалось создать персонажа.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/presets/:presetId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const presetId = req.params.presetId;
        const { label, classId, inventory, sheet, portraitUrl, sortOrder, publishedToPlayers } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Редактирует только мастер.');
            }
            const existing = await prisma.nriPresetCharacter.findFirst({
                where: { id: presetId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_PRESET_NOT_FOUND', 'Персонаж не найден.');
            if (existing.claimedByUserId) {
                const changingStructure = (typeof classId === 'string' && classId.trim() && classId.trim() !== existing.classId) ||
                    inventory !== undefined;
                if (changingStructure) {
                    return sendApiError(res, 409, 'NRI_PRESET_CLAIMED', 'Персонаж уже закреплён — меняйте только имя и бэкстори.');
                }
            }
            const nextSheet = sheet !== undefined ? parseJsonField(sheet) ?? undefined : undefined;
            const preset = await prisma.nriPresetCharacter.update({
                where: { id: presetId },
                data: {
                    ...(typeof label === 'string' && label.trim() ? { label: label.trim().slice(0, 60) } : {}),
                    ...(typeof classId === 'string' && classId.trim() ? { classId: classId.trim() } : {}),
                    ...(inventory !== undefined ? { inventory: Array.isArray(inventory) ? inventory : [] } : {}),
                    ...(sheet !== undefined ? { sheet: nextSheet } : {}),
                    ...(portraitUrl !== undefined
                        ? {
                            portraitUrl: typeof portraitUrl === 'string' && portraitUrl.trim()
                                ? portraitUrl.trim().slice(0, 2000)
                                : null,
                        }
                        : {}),
                    ...(typeof sortOrder === 'number' ? { sortOrder } : {}),
                    ...(typeof publishedToPlayers === 'boolean' ? { publishedToPlayers } : {}),
                },
            });
            if (existing.claimedByUserId && (nextSheet || (typeof label === 'string' && label.trim()))) {
                const player = await prisma.nriPlayer.findFirst({
                    where: { sessionId: session.id, presetId: preset.id },
                });
                if (player) {
                    const prevSheet = player.sheet && typeof player.sheet === 'object'
                        ? { ...player.sheet }
                        : {};
                    await prisma.nriPlayer.update({
                        where: { id: player.id },
                        data: {
                            ...(typeof label === 'string' && label.trim()
                                ? { displayName: label.trim().slice(0, 40) }
                                : {}),
                            ...(nextSheet ? { sheet: { ...prevSheet, ...nextSheet } } : {}),
                        },
                    });
                }
            }
            res.json({ preset: serializePreset(preset) });
        }
        catch (error) {
            console.error('nri/presets patch:', error);
            return sendApiError(res, 500, 'NRI_PRESET_UPDATE_FAILED', 'Не удалось обновить персонажа.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/presets/:presetId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const presetId = req.params.presetId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Удаляет только мастер.');
            }
            const existing = await prisma.nriPresetCharacter.findFirst({
                where: { id: presetId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_PRESET_NOT_FOUND', 'Персонаж не найден.');
            if (existing.claimedByUserId) {
                return sendApiError(res, 409, 'NRI_PRESET_CLAIMED', 'Нельзя удалить закреплённого персонажа.');
            }
            await prisma.nriPresetCharacter.delete({ where: { id: presetId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/presets delete:', error);
            return sendApiError(res, 500, 'NRI_PRESET_DELETE_FAILED', 'Не удалось удалить персонажа.');
        }
    });
    app.get('/neon_v1/services/nri/:code/npcs', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'НПС доступны только мастеру.');
            }
            const npcs = await prisma.nriNpc.findMany({
                where: { sessionId: session.id },
                orderBy: { name: 'asc' },
            });
            res.json({ npcs: npcs.map(serializeNpc) });
        }
        catch (error) {
            console.error('nri/npcs get:', error);
            return sendApiError(res, 500, 'NRI_NPCS_GET_FAILED', 'Не удалось загрузить НПС.');
        }
    });
    app.post('/neon_v1/services/nri/:code/npcs', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { name, classId, imageUrl, inventory, sheet, notes } = req.body;
        if (typeof name !== 'string' || !name.trim()) {
            return sendApiError(res, 400, 'NRI_NPC_NAME', 'Укажите имя НПС.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'НПС создаёт только мастер.');
            }
            const npc = await prisma.nriNpc.create({
                data: {
                    sessionId: session.id,
                    name: name.trim().slice(0, 60),
                    classId: typeof classId === 'string' && classId.trim() ? classId.trim() : null,
                    imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim().slice(0, 2000) : null,
                    inventory: Array.isArray(inventory) ? inventory : [],
                    sheet: parseJsonField(sheet) ?? undefined,
                    notes: typeof notes === 'string' ? notes.slice(0, 2000) : null,
                },
            });
            res.status(201).json({ npc: serializeNpc(npc) });
        }
        catch (error) {
            console.error('nri/npcs post:', error);
            return sendApiError(res, 500, 'NRI_NPC_CREATE_FAILED', 'Не удалось создать НПС.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/npcs/:npcId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const npcId = req.params.npcId;
        const { name, classId, imageUrl, inventory, sheet, notes } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Редактирует только мастер.');
            }
            const existing = await prisma.nriNpc.findFirst({ where: { id: npcId, sessionId: session.id } });
            if (!existing)
                return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
            const npc = await prisma.nriNpc.update({
                where: { id: npcId },
                data: {
                    ...(typeof name === 'string' && name.trim() ? { name: name.trim().slice(0, 60) } : {}),
                    ...(classId !== undefined
                        ? { classId: typeof classId === 'string' && classId.trim() ? classId.trim() : null }
                        : {}),
                    ...(imageUrl !== undefined
                        ? {
                            imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim().slice(0, 2000) : null,
                        }
                        : {}),
                    ...(inventory !== undefined ? { inventory: Array.isArray(inventory) ? inventory : [] } : {}),
                    ...(sheet !== undefined ? { sheet: parseJsonField(sheet) ?? undefined } : {}),
                    ...(notes !== undefined ? { notes: typeof notes === 'string' ? notes.slice(0, 2000) : null } : {}),
                },
            });
            res.json({ npc: serializeNpc(npc) });
        }
        catch (error) {
            console.error('nri/npcs patch:', error);
            return sendApiError(res, 500, 'NRI_NPC_UPDATE_FAILED', 'Не удалось обновить НПС.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/npcs/:npcId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const npcId = req.params.npcId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Удаляет только мастер.');
            }
            const existing = await prisma.nriNpc.findFirst({ where: { id: npcId, sessionId: session.id } });
            if (!existing)
                return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
            await prisma.nriNpc.delete({ where: { id: npcId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/npcs delete:', error);
            return sendApiError(res, 500, 'NRI_NPC_DELETE_FAILED', 'Не удалось удалить НПС.');
        }
    });
    mountNriCombatantRoutes(app, {
        prisma,
        jwtAuth,
        sendApiError,
        resolveSession,
        resolveUser,
        requireHost,
        parseJsonField,
    });
    function serializeCyberProduct(row) {
        return {
            id: row.id,
            name: row.name,
            slot: row.slot,
            blueprint: row.blueprint ?? null,
            build: row.build ?? null,
            priceWonlongs: row.priceWonlongs,
            inShop: row.inShop,
            vendorNpcId: row.vendorNpcId,
            createdAt: row.createdAt.getTime(),
        };
    }
    app.get('/neon_v1/services/nri/:code/cyber', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Киберимпланты доступны мастеру.');
            }
            const products = await prisma.nriCyberProduct.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'desc' },
            });
            res.json({ products: products.map(serializeCyberProduct) });
        }
        catch (error) {
            console.error('nri/cyber get:', error);
            return sendApiError(res, 500, 'NRI_CYBER_GET_FAILED', 'Не удалось загрузить киберимпланты.');
        }
    });
    app.post('/neon_v1/services/nri/:code/cyber', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { name, slot, blueprint, build, priceWonlongs, inShop } = req.body;
        if (typeof name !== 'string' || !name.trim()) {
            return sendApiError(res, 400, 'NRI_CYBER_NAME', 'Укажите название импланта.');
        }
        if (typeof slot !== 'string' || !slot.trim()) {
            return sendApiError(res, 400, 'NRI_CYBER_SLOT', 'Укажите слот.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Создаёт только мастер.');
            }
            const product = await prisma.nriCyberProduct.create({
                data: {
                    sessionId: session.id,
                    name: name.trim().slice(0, 80),
                    slot: slot.trim(),
                    blueprint: parseJsonField(blueprint) ?? {},
                    build: parseJsonField(build) ?? {},
                    priceWonlongs: typeof priceWonlongs === 'number' ? Math.max(0, Math.round(priceWonlongs)) : 0,
                    inShop: inShop === true,
                },
            });
            res.status(201).json({ product: serializeCyberProduct(product) });
        }
        catch (error) {
            console.error('nri/cyber post:', error);
            return sendApiError(res, 500, 'NRI_CYBER_CREATE_FAILED', 'Не удалось сохранить имплант.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/cyber/:productId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const productId = req.params.productId;
        const { inShop, priceWonlongs, name } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Редактирует только мастер.');
            }
            const existing = await prisma.nriCyberProduct.findFirst({
                where: { id: productId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_CYBER_NOT_FOUND', 'Имплант не найден.');
            const product = await prisma.nriCyberProduct.update({
                where: { id: productId },
                data: {
                    ...(typeof inShop === 'boolean' ? { inShop } : {}),
                    ...(typeof priceWonlongs === 'number' ? { priceWonlongs: Math.max(0, Math.round(priceWonlongs)) } : {}),
                    ...(typeof name === 'string' && name.trim() ? { name: name.trim().slice(0, 80) } : {}),
                },
            });
            res.json({ product: serializeCyberProduct(product) });
        }
        catch (error) {
            console.error('nri/cyber patch:', error);
            return sendApiError(res, 500, 'NRI_CYBER_PATCH_FAILED', 'Не удалось обновить имплант.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/cyber/:productId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const productId = req.params.productId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Удаляет только мастер.');
            }
            const existing = await prisma.nriCyberProduct.findFirst({
                where: { id: productId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_CYBER_NOT_FOUND', 'Имплант не найден.');
            await prisma.nriCyberProduct.delete({ where: { id: productId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/cyber delete:', error);
            return sendApiError(res, 500, 'NRI_CYBER_DELETE_FAILED', 'Не удалось удалить имплант.');
        }
    });
    app.post('/neon_v1/services/nri/:code/cyber/:productId/grant', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const productId = req.params.productId;
        const { targetUserId, install } = req.body;
        if (typeof targetUserId !== 'string' || !targetUserId.trim()) {
            return sendApiError(res, 400, 'NRI_GRANT_TARGET', 'Укажите targetUserId игрока.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Выдаёт только мастер.');
            }
            const product = await prisma.nriCyberProduct.findFirst({
                where: { id: productId, sessionId: session.id },
            });
            if (!product)
                return sendApiError(res, 404, 'NRI_CYBER_NOT_FOUND', 'Имплант не найден.');
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: targetUserId.trim() } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден на столе.');
            const build = (product.build && typeof product.build === 'object' ? product.build : {});
            const item = {
                id: `cyber_${product.id}_${Date.now()}`,
                name: product.name,
                kind: 'cyberware',
                blurb: `${product.slot} · BT ${build.bloodTox ?? '?'} · ₩${product.priceWonlongs}`,
                qty: 1,
                c2185Mods: build.c2185Mods ?? {},
                cyber: {
                    slot: product.slot,
                    blueprint: product.blueprint,
                    bloodTox: build.bloodTox,
                    powerDrawW: build.powerDrawW,
                    powerWh: build.powerWh,
                    cpuMhz: build.cpuMhz,
                    ramGb: build.ramGb,
                    features: build.features,
                },
                priceWonlongs: product.priceWonlongs,
            };
            const inv = Array.isArray(player.inventory) ? [...player.inventory] : [];
            inv.push(item);
            let nextSheet = player.sheet;
            let nextInv = inv;
            let installed = false;
            if (install === true) {
                const result = tryInstallCyberItem(player.sheet, inv, item.id);
                if (!result.ok) {
                    return sendApiError(res, 400, 'NRI_CYBER_INSTALL_FAILED', result.reason);
                }
                nextSheet = result.sheet;
                nextInv = result.inventory;
                installed = true;
            }
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: {
                    inventory: nextInv,
                    sheet: nextSheet ?? undefined,
                },
            });
            res.json({ ok: true, item, installed });
        }
        catch (error) {
            console.error('nri/cyber grant:', error);
            return sendApiError(res, 500, 'NRI_CYBER_GRANT_FAILED', 'Не удалось выдать имплант.');
        }
    });
    app.post('/neon_v1/services/nri/:code/cyber/:productId/grant-npc', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const productId = req.params.productId;
        const { npcId, install } = req.body;
        if (typeof npcId !== 'string' || !npcId.trim()) {
            return sendApiError(res, 400, 'NRI_GRANT_NPC', 'Укажите npcId.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Выдаёт только мастер.');
            }
            const product = await prisma.nriCyberProduct.findFirst({
                where: { id: productId, sessionId: session.id },
            });
            if (!product)
                return sendApiError(res, 404, 'NRI_CYBER_NOT_FOUND', 'Имплант не найден.');
            const npc = await prisma.nriNpc.findFirst({
                where: { id: npcId.trim(), sessionId: session.id },
            });
            if (!npc)
                return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
            const build = (product.build && typeof product.build === 'object' ? product.build : {});
            const item = {
                id: `cyber_${product.id}_${Date.now()}`,
                name: product.name,
                kind: 'cyberware',
                blurb: `${product.slot} · BT ${build.bloodTox ?? '?'} · ₩${product.priceWonlongs}`,
                qty: 1,
                c2185Mods: build.c2185Mods ?? {},
                cyber: {
                    slot: product.slot,
                    blueprint: product.blueprint,
                    bloodTox: build.bloodTox,
                    powerDrawW: build.powerDrawW,
                    powerWh: build.powerWh,
                    cpuMhz: build.cpuMhz,
                    ramGb: build.ramGb,
                    features: build.features,
                },
                priceWonlongs: product.priceWonlongs,
            };
            const inv = Array.isArray(npc.inventory) ? [...npc.inventory] : [];
            inv.push(item);
            let nextSheet = npc.sheet;
            let nextInv = inv;
            let installed = false;
            if (install === true) {
                const result = tryInstallCyberItem(npc.sheet, inv, item.id);
                if (!result.ok) {
                    return sendApiError(res, 400, 'NRI_CYBER_INSTALL_FAILED', result.reason);
                }
                nextSheet = result.sheet;
                nextInv = result.inventory;
                installed = true;
            }
            await prisma.nriNpc.update({
                where: { id: npc.id },
                data: {
                    inventory: nextInv,
                    sheet: nextSheet ?? undefined,
                },
            });
            res.json({ ok: true, item, installed });
        }
        catch (error) {
            console.error('nri/cyber grant-npc:', error);
            return sendApiError(res, 500, 'NRI_CYBER_GRANT_FAILED', 'Не удалось выдать имплант НПС.');
        }
    });
    app.post('/neon_v1/services/nri/:code/players/:userId/cyber/install', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const targetUserId = req.params.userId;
        const { itemId } = req.body;
        if (typeof itemId !== 'string' || !itemId.trim()) {
            return sendApiError(res, 400, 'NRI_ITEM_ID', 'Укажите itemId из инвентаря.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            const isHost = session.hostUserId === auth.userId;
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            const isSelf = auth.userId === targetUserId;
            if (!isHost && !platformAdmin && !isSelf) {
                return sendApiError(res, 403, 'NRI_CYBER_INSTALL_FORBIDDEN', 'Установку делает мастер или владелец предмета.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: targetUserId } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
            const result = tryInstallCyberItem(player.sheet, player.inventory, itemId.trim());
            if (!result.ok) {
                return sendApiError(res, 400, 'NRI_CYBER_INSTALL_FAILED', result.reason);
            }
            let sheet = result.sheet;
            const cleared = maybeAutoClearIceBan(sheet, result.inventory);
            if (cleared)
                sheet = cleared;
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { sheet, inventory: result.inventory },
            });
            res.json({ ok: true, installed: true });
        }
        catch (error) {
            console.error('nri/cyber install:', error);
            return sendApiError(res, 500, 'NRI_CYBER_INSTALL_ERR', 'Не удалось установить имплант.');
        }
    });
    app.post('/neon_v1/services/nri/:code/player/items/:itemId/toggle-equip', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const itemId = String(req.params.itemId ?? '').trim();
        if (!itemId)
            return sendApiError(res, 400, 'NRI_ITEM_ID', 'Укажите предмет.');
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Персонаж не найден.');
            const inv = Array.isArray(player.inventory) ? ([...player.inventory]) : [];
            const next = toggleEquipServer(inv, itemId);
            if (!next)
                return sendApiError(res, 400, 'NRI_EQUIP_FAILED', 'Предмет нельзя экипировать.');
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { inventory: next },
            });
            res.json({ ok: true, inventory: next });
        }
        catch (error) {
            console.error('nri/toggle-equip:', error);
            return sendApiError(res, 500, 'NRI_EQUIP_ERR', 'Не удалось сменить экипировку.');
        }
    });
    app.post('/neon_v1/services/nri/:code/player/items/:itemId/use', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const itemId = String(req.params.itemId ?? '').trim();
        if (!itemId)
            return sendApiError(res, 400, 'NRI_ITEM_ID', 'Укажите предмет.');
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Персонаж не найден.');
            const inv = Array.isArray(player.inventory) ? ([...player.inventory]) : [];
            const result = tryUseItemServer(player.sheet, inv, itemId);
            if (!result.ok) {
                return sendApiError(res, 400, 'NRI_USE_FAILED', result.reason);
            }
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { sheet: result.sheet, inventory: result.inventory },
            });
            res.json({ ok: true, inventory: result.inventory, sheet: result.sheet, applied: result.applied });
        }
        catch (error) {
            console.error('nri/use-item:', error);
            return sendApiError(res, 500, 'NRI_USE_ERR', 'Не удалось использовать предмет.');
        }
    });
    app.post('/neon_v1/services/nri/:code/players/:userId/items/grant', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const targetUserId = req.params.userId;
        const { catalogId, qty, fromNpcId } = req.body;
        if (typeof catalogId !== 'string' || !catalogId.trim()) {
            return sendApiError(res, 400, 'NRI_CATALOG_ID', 'Укажите catalogId.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            const isHost = session.hostUserId === auth.userId;
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            if (!isHost && !platformAdmin) {
                return sendApiError(res, 403, 'NRI_GRANT_FORBIDDEN', 'Выдавать предметы может только мастер.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: targetUserId } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
            const item = catalogToServerInventoryItem(catalogId.trim());
            if (!item)
                return sendApiError(res, 400, 'NRI_CATALOG_UNKNOWN', 'Неизвестный предмет каталога.');
            if (typeof qty === 'number' && qty > 1)
                item.qty = qty;
            let npcName = null;
            if (typeof fromNpcId === 'string' && fromNpcId.trim()) {
                const npc = await prisma.nriNpc.findFirst({
                    where: { id: fromNpcId.trim(), sessionId: session.id },
                });
                if (!npc)
                    return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
                npcName = npc.name;
                const npcInv = Array.isArray(npc.inventory) ? [...npc.inventory] : [];
                const taken = takeOneCatalogItem(npcInv, catalogId.trim());
                if (taken.taken) {
                    await prisma.nriNpc.update({
                        where: { id: npc.id },
                        data: { inventory: taken.inventory },
                    });
                }
            }
            const inv = Array.isArray(player.inventory) ? [...player.inventory] : [];
            const next = mergeInventoryItem(inv, item);
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { inventory: next },
            });
            res.json({ ok: true, inventory: next });
        }
        catch (error) {
            console.error('nri/grant item:', error);
            return sendApiError(res, 500, 'NRI_GRANT_ERR', 'Не удалось выдать предмет.');
        }
    });
    app.post('/neon_v1/services/nri/:code/npcs/:npcId/items/grant', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const npcId = req.params.npcId;
        const { catalogId, qty } = req.body;
        if (typeof catalogId !== 'string' || !catalogId.trim()) {
            return sendApiError(res, 400, 'NRI_CATALOG_ID', 'Укажите catalogId.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const npc = await prisma.nriNpc.findFirst({
                where: { id: npcId, sessionId: session.id },
            });
            if (!npc)
                return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
            const item = catalogToServerInventoryItem(catalogId.trim());
            if (!item)
                return sendApiError(res, 400, 'NRI_CATALOG_UNKNOWN', 'Неизвестный предмет каталога.');
            if (typeof qty === 'number' && qty > 1)
                item.qty = qty;
            const inv = Array.isArray(npc.inventory) ? [...npc.inventory] : [];
            const next = mergeInventoryItem(inv, item);
            await prisma.nriNpc.update({
                where: { id: npc.id },
                data: { inventory: next },
            });
            res.json({ ok: true, inventory: next });
        }
        catch (error) {
            console.error('nri/grant npc item:', error);
            return sendApiError(res, 500, 'NRI_GRANT_ERR', 'Не удалось выдать предмет НПС.');
        }
    });
    app.get('/neon_v1/services/vault/global', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        try {
            const me = await resolveUser(auth);
            if (!me || !isAdminUsername(me.username)) {
                return sendApiError(res, 403, 'VAULT_ADMIN_ONLY', 'Глобальное хранилище — только админ.');
            }
            const files = await prisma.nriVaultFile.findMany({
                where: { sessionId: null },
                orderBy: { createdAt: 'desc' },
            });
            res.json({ files: files.map(serializeVaultFile) });
        }
        catch (error) {
            console.error('vault/global get:', error);
            return sendApiError(res, 500, 'VAULT_GLOBAL_GET_FAILED', 'Не удалось загрузить файлы.');
        }
    });
    app.post('/neon_v1/services/vault/global', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const { title, body, protected: protectedAlias, isProtected, gameId, difficulty, password, usePassword, useIce } = req.body;
        if (typeof title !== 'string' || !title.trim()) {
            return sendApiError(res, 400, 'NRI_FILE_TITLE_REQUIRED', 'Укажите название файла.');
        }
        const fileBody = typeof body === 'string' ? body : '';
        try {
            const me = await resolveUser(auth);
            if (!me || !isAdminUsername(me.username)) {
                return sendApiError(res, 403, 'VAULT_ADMIN_ONLY', 'Создавать файлы может только админ.');
            }
            const lock = await parseVaultCreatePayload({
                password,
                usePassword,
                useIce,
                isProtected,
                protected: protectedAlias,
                gameId,
                difficulty,
            });
            if ('error' in lock) {
                return sendApiError(res, 400, 'NRI_VAULT_PASSWORD_INVALID', lock.error ?? 'Некорректная защита файла.');
            }
            const file = await prisma.nriVaultFile.create({
                data: {
                    sessionId: null,
                    title: title.trim().slice(0, 80),
                    body: fileBody.slice(0, 8000),
                    protected: lock.data.protected,
                    passwordHash: lock.data.passwordHash,
                    iceRewardCode: lock.data.iceRewardCode,
                    gameId: lock.data.gameId,
                    difficulty: lock.data.difficulty,
                    createdById: auth.userId,
                },
            });
            res.status(201).json({ file: serializeVaultFile(file) });
        }
        catch (error) {
            console.error('vault/global post:', error);
            return sendApiError(res, 500, 'VAULT_GLOBAL_CREATE_FAILED', 'Не удалось создать файл.');
        }
    });
    app.get('/neon_v1/services/vault/files/:fileId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const fileId = req.params.fileId;
        try {
            const file = await prisma.nriVaultFile.findUnique({ where: { id: fileId } });
            if (!file)
                return sendApiError(res, 404, 'VAULT_FILE_NOT_FOUND', 'Файл не найден.');
            const unlock = await prisma.nriFileUnlock.findUnique({
                where: { fileId_userId: { fileId, userId: auth.userId } },
            });
            const bypass = await vaultBypassUnlock(file, auth.userId);
            const dualReward = vaultIsDualReward(file);
            const unlocked = !file.protected || bypass || !!unlock?.unlockedAt;
            const icePassed = !!unlock?.icePassedAt;
            res.json({
                file: serializeVaultFile(file),
                unlocked,
                icePassed,
                canReadBody: unlocked,
                body: unlocked ? file.body : undefined,
                rewardPassword: icePassed && !unlocked && dualReward ? file.iceRewardCode ?? undefined : undefined,
            });
        }
        catch (error) {
            console.error('vault/file get:', error);
            return sendApiError(res, 500, 'VAULT_FILE_GET_FAILED', 'Не удалось открыть файл.');
        }
    });
    app.post('/neon_v1/services/vault/files/:fileId/unlock', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const fileId = req.params.fileId;
        const { password, viaIce } = req.body;
        try {
            const file = await prisma.nriVaultFile.findUnique({ where: { id: fileId } });
            if (!file)
                return sendApiError(res, 404, 'VAULT_FILE_NOT_FOUND', 'Файл не найден.');
            if (!file.protected) {
                return res.json({ ok: true, unlocked: true, body: file.body });
            }
            if (await vaultBypassUnlock(file, auth.userId)) {
                return res.json({ ok: true, unlocked: true, body: file.body });
            }
            const hasPassword = !!file.passwordHash;
            const hasIce = !!file.gameId;
            const dualReward = vaultIsDualReward(file);
            const passwordRaw = typeof password === 'string' ? password.trim() : '';
            if (viaIce === true) {
                if (!hasIce) {
                    return sendApiError(res, 400, 'VAULT_ICE_NOT_AVAILABLE', 'Для этого файла нет ICE.');
                }
                if (dualReward) {
                    await prisma.nriFileUnlock.upsert({
                        where: { fileId_userId: { fileId, userId: auth.userId } },
                        create: { fileId, userId: auth.userId, icePassedAt: new Date() },
                        update: { icePassedAt: new Date() },
                    });
                    return res.json({
                        ok: true,
                        unlocked: false,
                        icePassed: true,
                        rewardPassword: file.iceRewardCode,
                    });
                }
                await prisma.nriFileUnlock.upsert({
                    where: { fileId_userId: { fileId, userId: auth.userId } },
                    create: { fileId, userId: auth.userId, unlockedAt: new Date() },
                    update: { unlockedAt: new Date() },
                });
                return res.json({ ok: true, unlocked: true, body: file.body });
            }
            if (dualReward) {
                const progress = await prisma.nriFileUnlock.findUnique({
                    where: { fileId_userId: { fileId, userId: auth.userId } },
                });
                if (!progress?.icePassedAt) {
                    return sendApiError(res, 403, 'VAULT_ICE_REQUIRED', 'Сначала пройдите ICE, чтобы получить код доступа.');
                }
                if (!passwordRaw) {
                    return sendApiError(res, 400, 'VAULT_PASSWORD_REQUIRED', 'Введите код доступа.');
                }
                if (!file.passwordHash || !(await bcrypt.compare(passwordRaw, file.passwordHash))) {
                    return sendApiError(res, 403, 'VAULT_PASSWORD_WRONG', 'Неверный код доступа.');
                }
                await prisma.nriFileUnlock.update({
                    where: { fileId_userId: { fileId, userId: auth.userId } },
                    data: { unlockedAt: new Date() },
                });
                return res.json({ ok: true, unlocked: true, body: file.body });
            }
            if (hasPassword && !hasIce) {
                if (!passwordRaw) {
                    return sendApiError(res, 400, 'VAULT_PASSWORD_REQUIRED', 'Введите пароль.');
                }
                if (!file.passwordHash || !(await bcrypt.compare(passwordRaw, file.passwordHash))) {
                    return sendApiError(res, 403, 'VAULT_PASSWORD_WRONG', 'Неверный пароль.');
                }
                await prisma.nriFileUnlock.upsert({
                    where: { fileId_userId: { fileId, userId: auth.userId } },
                    create: { fileId, userId: auth.userId, unlockedAt: new Date() },
                    update: { unlockedAt: new Date() },
                });
                return res.json({ ok: true, unlocked: true, body: file.body });
            }
            if (hasIce) {
                return sendApiError(res, 400, 'VAULT_ICE_REQUIRED', 'Пройдите ICE для доступа к файлу.');
            }
            return sendApiError(res, 403, 'VAULT_UNLOCK_FORBIDDEN', 'Файл нельзя разблокировать.');
        }
        catch (error) {
            console.error('vault/unlock:', error);
            return sendApiError(res, 500, 'VAULT_UNLOCK_FAILED', 'Не удалось разблокировать файл.');
        }
    });
    app.delete('/neon_v1/services/vault/files/:fileId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const fileId = req.params.fileId;
        try {
            const file = await prisma.nriVaultFile.findUnique({ where: { id: fileId } });
            if (!file)
                return sendApiError(res, 404, 'VAULT_FILE_NOT_FOUND', 'Файл не найден.');
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            if (file.sessionId) {
                const session = await prisma.nriSession.findUnique({ where: { id: file.sessionId } });
                if (!session)
                    return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
                const isHost = session.hostUserId === auth.userId;
                const platformAdmin = isAdminUsername(me.username);
                if (!isHost && !platformAdmin) {
                    return sendApiError(res, 403, 'NRI_VAULT_FORBIDDEN', 'Удалять файлы стола может только мастер.');
                }
            }
            else if (!isAdminUsername(me.username)) {
                return sendApiError(res, 403, 'VAULT_GLOBAL_FORBIDDEN', 'Глобальные файлы удаляет только админ.');
            }
            await prisma.nriVaultFile.delete({ where: { id: fileId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('vault/delete:', error);
            return sendApiError(res, 500, 'VAULT_DELETE_FAILED', 'Не удалось удалить файл.');
        }
    });
    mountNriLoreTravelRoutes(app, {
        prisma,
        jwtAuth,
        sendApiError,
        resolveSession,
        resolveUser,
        requireHost,
    });
    mountNriItemTransferRoutes(app, {
        prisma,
        jwtAuth,
        sendApiError,
        resolveSession,
        resolveUser,
    });
}
//# sourceMappingURL=nriService.js.map
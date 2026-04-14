import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
/** Склеивает строку GameState из БД с clientSnapshot (расширенный прогресс клиента). */
function publicGameState(gs) {
    if (!gs)
        return null;
    const snap = gs.clientSnapshot;
    const fromSnap = typeof snap === 'object' && snap !== null && !Array.isArray(snap) ? { ...snap } : {};
    const { clientSnapshot: _drop, ...row } = gs;
    return {
        ...fromSnap,
        ...row,
        stress: gs.stress,
        maxStress: gs.maxStress,
        bits: gs.bits,
        ramPool: gs.ramPool,
        xp: gs.xp,
        level: gs.level,
        activeDeck: gs.activeDeck,
        inventory: gs.inventory,
        artifacts: gs.artifacts,
        completedQuests: gs.completedQuests,
        reputation: gs.reputation ?? fromSnap.reputation,
        intel: gs.intel ?? fromSnap.intel,
    };
}
function hasMissingColumn(error, columnName) {
    const msg = String(error?.message ?? error ?? '');
    if (!msg.includes('no such column'))
        return false;
    return columnName ? msg.includes(columnName) : true;
}
/** Единый JSON для ошибок neon_v1: текст для человека + стабильный `code` для клиента/логов. */
function sendApiError(res, status, code, message) {
    res.status(status).json({ error: message, code });
}
/**
 * HTTP API (auth, sync, coop lobby) + SPA static. Лобби — in-memory на инстанс приложения.
 */
export function createApp(opts) {
    const { prisma, jwtSecret, getIsDbReady, port, databaseUrl, isAmvera } = opts;
    const app = express();
    app.use(cors());
    app.use(express.json());
    const LOBBY_TTL_MS = 50_000;
    const MAX_PARTY = 4;
    const MAX_CHAT = 120;
    const lobbyByUser = new Map();
    const parties = new Map();
    const chatLog = [];
    function lobbyAuth(req) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader)
                return null;
            const token = authHeader.split(' ')[1];
            return jwt.verify(token, jwtSecret);
        }
        catch {
            return null;
        }
    }
    function pruneLobbyUsers() {
        const now = Date.now();
        for (const [uid, u] of lobbyByUser) {
            if (now - u.lastSeen > LOBBY_TTL_MS) {
                lobbyByUser.delete(uid);
                const p = u.partyId ? parties.get(u.partyId) : null;
                if (p) {
                    p.memberIds = p.memberIds.filter((id) => id !== uid);
                    if (p.memberIds.length === 0)
                        parties.delete(p.id);
                    else if (p.hostId === uid) {
                        p.hostId = p.memberIds[0];
                    }
                }
            }
        }
    }
    function serializeParty(partyId, selfId) {
        if (!partyId)
            return null;
        const p = parties.get(partyId);
        if (!p)
            return null;
        return {
            id: p.id,
            hostId: p.hostId,
            isHost: p.hostId === selfId,
            members: p.memberIds.map((mid) => {
                const u = lobbyByUser.get(mid);
                return {
                    userId: mid,
                    displayName: u?.displayName ?? mid,
                    coopRole: u?.coopRole ?? '?',
                    clientUsername: u?.clientUsername ?? '',
                };
            }),
        };
    }
    app.get('/neon_v1/health', (_req, res) => {
        res.json({
            status: getIsDbReady() ? 'active' : 'initializing',
            port,
            dbPath: databaseUrl,
            isAmvera,
        });
    });
    app.post('/neon_v1/auth/register', async (req, res) => {
        try {
            const body = (req.body ?? {});
            const username = typeof body.username === 'string' ? body.username.trim() : '';
            const password = typeof body.password === 'string' ? body.password : '';
            if (!username || !password) {
                return sendApiError(res, 400, 'REGISTER_INVALID_INPUT', 'Укажите логин и пароль.');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const starterDeck = [
                { id: 'script_ping', count: 1 },
                { id: 'script_grep', count: 1 },
                { id: 'script_wash_logs', count: 1 },
                { id: 'soft_coffee', count: 1 },
            ];
            await prisma.user.create({
                data: {
                    username,
                    passwordHash: hashedPassword,
                    gameState: {
                        create: {
                            bits: 150,
                            ramPool: 1.0,
                            stress: 0,
                            maxStress: 100,
                            activeDeck: starterDeck,
                            inventory: starterDeck,
                            artifacts: [],
                            completedQuests: [],
                            reputation: {},
                            intel: [],
                        },
                    },
                },
            });
            res.status(201).json({ message: 'User created' });
        }
        catch (error) {
            console.error('Registration Error:', error);
            if (error.code === 'P2002') {
                return sendApiError(res, 400, 'REGISTER_DUPLICATE', 'Такой логин уже есть. Войдите или выберите другой логин.');
            }
            return sendApiError(res, 400, 'REGISTER_FAILED', 'Не удалось создать аккаунт (ошибка сервера).');
        }
    });
    app.post('/neon_v1/auth/login', async (req, res) => {
        try {
            const body = (req.body ?? {});
            const username = typeof body.username === 'string' ? body.username.trim() : '';
            const password = typeof body.password === 'string' ? body.password : '';
            if (!username || !password)
                return sendApiError(res, 401, 'LOGIN_REJECTED', 'Неверный логин или пароль.');
            let user;
            try {
                user = await prisma.user.findUnique({ where: { username }, include: { gameState: true } });
            }
            catch (e) {
                if (!hasMissingColumn(e))
                    throw e;
                // Legacy /data DB on host can miss part of new GameState columns.
                user = await prisma.user.findUnique({
                    where: { username },
                    include: {
                        gameState: {
                            select: {
                                id: true,
                                userId: true,
                                bits: true,
                                xp: true,
                                level: true,
                                ramPool: true,
                                stress: true,
                                maxStress: true,
                                activeDeck: true,
                                inventory: true,
                                artifacts: true,
                                completedQuests: true,
                            },
                        },
                    },
                });
            }
            if (!user || !(await bcrypt.compare(password, user.passwordHash)))
                return sendApiError(res, 401, 'LOGIN_REJECTED', 'Неверный логин или пароль.');
            const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '24h' });
            const rawGs = user.gameState;
            res.json({
                token,
                user: { id: user.id, username: user.username, gameState: publicGameState(rawGs) },
            });
        }
        catch (error) {
            console.error('Login Error:', error);
            sendApiError(res, 500, 'LOGIN_SERVER', 'Ошибка входа. Попробуйте позже.');
        }
    });
    app.post('/neon_v1/game/sync', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader)
                return sendApiError(res, 401, 'SYNC_NO_TOKEN', 'Нет токена авторизации.');
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, jwtSecret);
            const body = req.body;
            const { stress, maxStress, bits, xp, level, activeDeck, inventory, artifacts, completedQuests } = body;
            let updatedState;
            try {
                updatedState = await prisma.gameState.update({
                    where: { userId: decoded.userId },
                    data: {
                        stress,
                        maxStress,
                        bits,
                        xp,
                        level,
                        activeDeck,
                        inventory,
                        artifacts,
                        completedQuests,
                        clientSnapshot: body,
                    },
                });
            }
            catch (e) {
                if (!hasMissingColumn(e, 'clientSnapshot'))
                    throw e;
                updatedState = await prisma.gameState.update({
                    where: { userId: decoded.userId },
                    data: {
                        stress,
                        maxStress,
                        bits,
                        xp,
                        level,
                        activeDeck,
                        inventory,
                        artifacts,
                        completedQuests,
                    },
                });
            }
            res.json(publicGameState(updatedState));
        }
        catch (error) {
            console.error('Sync Error:', error);
            const name = error?.name ?? '';
            if (name === 'JsonWebTokenError' || name === 'TokenExpiredError' || name === 'NotBeforeError') {
                return sendApiError(res, 401, 'SYNC_INVALID_TOKEN', 'Токен недействителен или истёк.');
            }
            return sendApiError(res, 500, 'SYNC_FAILED', 'Не удалось сохранить прогресс.');
        }
    });
    app.post('/neon_v1/coop/heartbeat', (req, res) => {
        const auth = lobbyAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
        const { displayName, coopRole, clientUsername } = req.body;
        if (typeof displayName !== 'string' || !displayName.trim()) {
            return sendApiError(res, 400, 'COOP_DISPLAY_NAME_REQUIRED', 'Укажите displayName.');
        }
        const role = typeof coopRole === 'string' ? coopRole : 'developer';
        const cname = typeof clientUsername === 'string' ? clientUsername : '';
        pruneLobbyUsers();
        const prev = lobbyByUser.get(auth.userId);
        lobbyByUser.set(auth.userId, {
            userId: auth.userId,
            clientUsername: cname,
            displayName: displayName.trim().slice(0, 48),
            coopRole: role,
            lastSeen: Date.now(),
            partyId: prev?.partyId ?? null,
        });
        const online = [...lobbyByUser.entries()]
            .filter(([id]) => id !== auth.userId)
            .map(([id, u]) => ({
            userId: id,
            displayName: u.displayName,
            coopRole: u.coopRole,
            clientUsername: u.clientUsername,
        }));
        res.json({
            ok: true,
            online,
            party: serializeParty(lobbyByUser.get(auth.userId)?.partyId ?? null, auth.userId),
            chat: chatLog.slice(-40),
        });
    });
    app.get('/neon_v1/coop/state', (req, res) => {
        const auth = lobbyAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
        pruneLobbyUsers();
        const me = lobbyByUser.get(auth.userId);
        const online = [...lobbyByUser.entries()]
            .filter(([id]) => id !== auth.userId)
            .map(([id, u]) => ({
            userId: id,
            displayName: u.displayName,
            coopRole: u.coopRole,
            clientUsername: u.clientUsername,
        }));
        res.json({
            online,
            party: serializeParty(me?.partyId ?? null, auth.userId),
            chat: chatLog.slice(-40),
        });
    });
    app.post('/neon_v1/coop/chat', (req, res) => {
        const auth = lobbyAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
        const { text } = req.body;
        if (typeof text !== 'string' || !text.trim())
            return sendApiError(res, 400, 'COOP_CHAT_TEXT_REQUIRED', 'Укажите текст сообщения.');
        const me = lobbyByUser.get(auth.userId);
        if (!me)
            return sendApiError(res, 400, 'COOP_HEARTBEAT_FIRST', 'Сначала отправьте heartbeat.');
        const entry = {
            id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            userId: auth.userId,
            displayName: me.displayName,
            coopRole: me.coopRole,
            text: text.trim().slice(0, 500),
            ts: Date.now(),
        };
        chatLog.push(entry);
        while (chatLog.length > MAX_CHAT)
            chatLog.shift();
        res.json({ ok: true, message: entry });
    });
    app.post('/neon_v1/coop/invite', (req, res) => {
        const auth = lobbyAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
        const { targetDisplayName } = req.body;
        if (typeof targetDisplayName !== 'string' || !targetDisplayName.trim()) {
            return sendApiError(res, 400, 'COOP_TARGET_DISPLAY_NAME_REQUIRED', 'Укажите targetDisplayName.');
        }
        pruneLobbyUsers();
        const me = lobbyByUser.get(auth.userId);
        if (!me)
            return sendApiError(res, 400, 'COOP_HEARTBEAT_FIRST', 'Сначала отправьте heartbeat.');
        const needle = targetDisplayName.trim().toLowerCase();
        let targetId = null;
        for (const [id, u] of lobbyByUser) {
            if (id === auth.userId)
                continue;
            if (u.displayName.toLowerCase() === needle) {
                targetId = id;
                break;
            }
        }
        if (!targetId)
            return sendApiError(res, 404, 'COOP_PLAYER_NOT_ONLINE', 'Игрок не в сети.');
        const target = lobbyByUser.get(targetId);
        if (!target)
            return sendApiError(res, 404, 'COOP_TARGET_GONE', 'Игрок уже недоступен.');
        if (target.partyId && target.partyId !== me.partyId) {
            return sendApiError(res, 400, 'COOP_TARGET_IN_PARTY', 'Игрок уже в другой группе.');
        }
        let partyId = me.partyId;
        if (!partyId) {
            partyId = `party_${auth.userId}_${Date.now()}`;
            parties.set(partyId, { id: partyId, hostId: auth.userId, memberIds: [auth.userId] });
            me.partyId = partyId;
        }
        const party = parties.get(partyId);
        if (!party)
            return sendApiError(res, 500, 'COOP_PARTY_INTERNAL', 'Ошибка группы.');
        if (party.memberIds.length >= MAX_PARTY)
            return sendApiError(res, 400, 'COOP_PARTY_FULL', 'Группа заполнена.');
        if (!party.memberIds.includes(targetId)) {
            if (target.partyId && target.partyId !== partyId) {
                return sendApiError(res, 400, 'COOP_TARGET_IN_PARTY', 'Игрок уже в другой группе.');
            }
            party.memberIds.push(targetId);
            target.partyId = partyId;
        }
        res.json({ ok: true, party: serializeParty(partyId, auth.userId) });
    });
    app.post('/neon_v1/coop/party/leave', (req, res) => {
        const auth = lobbyAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
        pruneLobbyUsers();
        const me = lobbyByUser.get(auth.userId);
        if (!me?.partyId)
            return res.json({ ok: true, party: null });
        const p = parties.get(me.partyId);
        if (p) {
            p.memberIds = p.memberIds.filter((id) => id !== auth.userId);
            if (p.memberIds.length === 0) {
                parties.delete(p.id);
            }
            else if (p.hostId === auth.userId) {
                p.hostId = p.memberIds[0];
            }
        }
        me.partyId = null;
        res.json({ ok: true, party: null });
    });
    const DIST = path.join(process.cwd(), 'dist');
    const sendHtmlNoCache = (res, file) => {
        res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
        res.sendFile(file);
    };
    app.use('/assets', express.static(path.join(DIST, 'assets'), {
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
    }));
    app.use(express.static(DIST, {
        setHeaders: (_res, filePath) => {
            if (filePath.endsWith('.html')) {
                _res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
            }
        },
    }));
    const indexPath = fs.existsSync(path.join(DIST, 'index.html'))
        ? path.join(DIST, 'index.html')
        : path.join(DIST, 'src/index.html');
    app.get('/', (_req, res) => {
        if (fs.existsSync(indexPath)) {
            sendHtmlNoCache(res, indexPath);
        }
        else {
            res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
        }
    });
    app.get(/.*/, (req, res) => {
        if (req.path.startsWith('/neon_v1'))
            return sendApiError(res, 404, 'API_NOT_FOUND', 'Маршрут не найден.');
        if (fs.existsSync(indexPath)) {
            sendHtmlNoCache(res, indexPath);
        }
        else {
            res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
        }
    });
    return app;
}
//# sourceMappingURL=createApp.js.map
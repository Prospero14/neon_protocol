import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { mountCoopRoutes } from './coop/mountCoopRoutes.js';
import { registerNeonServices } from './services/registerServices.js';
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
/** SQLite: `no such column`. Prisma 7 + driver adapter: `P2022`, «does not exist», `ColumnNotFound`. */
function hasMissingColumn(error, columnName) {
    const err = error;
    const msg = String(err.message ?? error ?? '');
    const metaCol = String(err.meta?.column_name ?? '');
    const haystack = `${msg}\n${metaCol}`;
    const sqlite = msg.includes('no such column');
    const prismaMissing = err.code === 'P2022' || msg.includes('does not exist') || msg.includes('ColumnNotFound');
    if (!sqlite && !prismaMissing)
        return false;
    if (!columnName)
        return true;
    return haystack.includes(columnName);
}
/** Единый JSON для ошибок neon_v1: текст для человека + стабильный `code` для клиента/логов. */
function sendApiError(res, status, code, message) {
    res.status(status).json({ error: message, code });
}
/**
 * HTTP API (auth, sync, coop lobby) + SPA static.
 * Coop live-матчи — SQLite (CoopLiveMatch); presence-лобби — in-memory TTL.
 */
export function createApp(opts) {
    const { prisma, jwtSecret, getIsDbReady, port, databaseUrl, isAmvera } = opts;
    const app = express();
    app.use(cors());
    app.use(express.json());
    mountCoopRoutes(app, { prisma, jwtSecret, sendApiError });
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
            const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
            const bodyToken = req.body && typeof req.body === 'object' && typeof req.body.token === 'string'
                ? req.body.token
                : null;
            const token = (authHeader && authHeader.split(' ')[1]) ||
                queryToken ||
                bodyToken;
            if (!token)
                return sendApiError(res, 401, 'SYNC_NO_TOKEN', 'Нет токена авторизации.');
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
            const name = error?.name ?? '';
            if (name === 'JsonWebTokenError' || name === 'TokenExpiredError' || name === 'NotBeforeError') {
                console.warn('[sync] JWT rejected:', name);
                return sendApiError(res, 401, 'SYNC_INVALID_TOKEN', 'Токен недействителен или истёк.');
            }
            console.error('Sync Error:', error);
            return sendApiError(res, 500, 'SYNC_FAILED', 'Не удалось сохранить прогресс.');
        }
    });
    registerNeonServices(app, { prisma, jwtSecret, sendApiError });
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
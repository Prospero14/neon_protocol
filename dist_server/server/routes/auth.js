import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authCredentialsSchema } from '../../shared/api-schemas/auth.js';
import { gameSyncPayloadSchema } from '../../shared/api-schemas/gameSync.js';
import { parseRequestBody } from '../../shared/api-schemas/parseBody.js';
import { hasMissingColumn, publicGameState } from '../gameStatePublic.js';
/** Регистрация, вход и синхронизация solo-прогресса. */
export function mountAuthRoutes(app, deps) {
    const { prisma, jwtSecret, sendApiError } = deps;
    app.post('/neon_v1/auth/register', async (req, res) => {
        try {
            const parsed = parseRequestBody(authCredentialsSchema, req.body);
            if (!parsed.ok) {
                return sendApiError(res, 400, 'REGISTER_INVALID_INPUT', parsed.message);
            }
            const { username, password } = parsed.data;
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
            const code = error?.code;
            if (code === 'P2002') {
                return sendApiError(res, 400, 'REGISTER_DUPLICATE', 'Такой логин уже есть. Войдите или выберите другой логин.');
            }
            return sendApiError(res, 400, 'REGISTER_FAILED', 'Не удалось создать аккаунт (ошибка сервера).');
        }
    });
    app.post('/neon_v1/auth/login', async (req, res) => {
        try {
            const parsed = parseRequestBody(authCredentialsSchema, req.body);
            if (!parsed.ok) {
                return sendApiError(res, 401, 'LOGIN_REJECTED', 'Неверный логин или пароль.');
            }
            const { username, password } = parsed.data;
            let user;
            try {
                user = await prisma.user.findUnique({ where: { username }, include: { gameState: true } });
            }
            catch (e) {
                if (!hasMissingColumn(e))
                    throw e;
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
            if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
                return sendApiError(res, 401, 'LOGIN_REJECTED', 'Неверный логин или пароль.');
            }
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
            const token = (authHeader && authHeader.split(' ')[1]) || queryToken || bodyToken;
            if (!token)
                return sendApiError(res, 401, 'SYNC_NO_TOKEN', 'Нет токена авторизации.');
            const decoded = jwt.verify(token, jwtSecret);
            const parsed = parseRequestBody(gameSyncPayloadSchema, req.body);
            if (!parsed.ok) {
                return sendApiError(res, 400, 'SYNC_INVALID_BODY', parsed.message);
            }
            const body = parsed.data;
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
}
//# sourceMappingURL=auth.js.map
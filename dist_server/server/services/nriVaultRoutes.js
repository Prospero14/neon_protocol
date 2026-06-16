/** Vault — session + global files */
import bcrypt from 'bcryptjs';
import { isAdminUsername } from './auth.js';
export function mountNriVaultRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
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
}
//# sourceMappingURL=nriVaultRoutes.js.map
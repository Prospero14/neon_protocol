/** Кошелёk, ICE, wonlongs */
import { antispamPrice, isSpamPaused, readWonlongs, writeWonlongs } from './nriWallet.js';
import { applyHardwareBan, applyIceRunResult, buildIcePlayStatus, clearIceBan, maybeAutoClearIceBan, readIceBan, } from './nriIceBan.js';
import { applyCounterCommandPick, brickDecksInInventory, buildCounterStage, enemyProgressFromTime, inventoryHasDeck, isCounterHackExpired, readCounterHack, SIREN_MESSAGE, writeCounterHack, } from '../../shared/nri-domain/iceCounterHack.js';
import { processPlayerAchievements } from './nriAchievementService.js';
import { parseRequestBody } from '../../shared/api-schemas/parseBody.js';
import { nriIceResultSchema, nriIceScoreSchema, nriWonlongsGrantSchema, nriWonlongsTransferSchema, } from '../../shared/api-schemas/nri.js';
import { buildAllIceLeaderboards, buildIceLeaderboardForGame, DEFAULT_ICE_GAME_ID, isNriIceGameId, } from '../../shared/nri-domain/iceLeaderboard.js';
export function mountNriIceWalletRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
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
            const newAchievements = await processPlayerAchievements(prisma, player.id, [{ type: 'antispam_paid' }]);
            res.json({
                ok: true,
                wonlongs: readWonlongs(updatedPlayer.sheet),
                antispamPrice: price,
                spamPausedUntil: updatedSession.spamPausedUntil?.getTime() ?? null,
                spamPausedActive: true,
                newAchievements,
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
        const parsed = parseRequestBody(nriIceResultSchema, req.body);
        if (!parsed.ok)
            return sendApiError(res, 400, 'NRI_ICE_WON', parsed.message);
        const { won } = parsed.data;
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
            const isHost = session.hostUserId === auth.userId;
            if (!isHost && !inventoryHasDeck(player.inventory)) {
                return sendApiError(res, 400, 'NRI_NO_DECK', 'Нужна кибердека в инвентаре.');
            }
            const applied = applyIceRunResult(player.sheet, won, {
                userId: auth.userId,
                displayName: player.displayName,
            });
            const banBefore = readIceBan(player.sheet);
            const { sheet, status } = await iceStatusForPlayer(session.id, applied.sheet, player.inventory);
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { sheet: sheet },
            });
            if (applied.counterHackStarted) {
                await prisma.nriHostAlert.create({
                    data: {
                        sessionId: session.id,
                        fromUserId: auth.userId,
                        kind: 'ice_counterhack',
                        body: `Встречный взлом: ${player.displayName} перехвачен после серии провалов ICE. Таймер пошёл — защитите деку.`,
                    },
                });
            }
            const banAfter = readIceBan(sheet);
            const newAchievements = await processPlayerAchievements(prisma, player.id, !banBefore.hardwareBanned && banAfter.hardwareBanned ? [{ type: 'ice_hardware_ban' }] : []);
            res.json({
                ok: true,
                status,
                newAchievements,
                counterHackStarted: applied.counterHackStarted,
                counterHack: readCounterHack(sheet),
            });
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
        const gameIdRaw = typeof req.query.gameId === 'string' ? req.query.gameId.trim() : DEFAULT_ICE_GAME_ID;
        const gameId = isNriIceGameId(gameIdRaw) ? gameIdRaw : DEFAULT_ICE_GAME_ID;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const rows = await prisma.nriIceScore.findMany({
                where: { sessionId: session.id, won: true },
                orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
                take: 500,
            });
            const entries = buildIceLeaderboardForGame(rows, gameId);
            res.json({ gameId, entries });
        }
        catch (error) {
            console.error('nri/ice leaderboard:', error);
            return sendApiError(res, 500, 'NRI_ICE_LB_FAILED', 'Не удалось загрузить рейтинг.');
        }
    });
    app.get('/neon_v1/services/nri/:code/ice/leaderboards', async (req, res) => {
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
                take: 2000,
            });
            res.json({ boards: buildAllIceLeaderboards(rows) });
        }
        catch (error) {
            console.error('nri/ice leaderboards:', error);
            return sendApiError(res, 500, 'NRI_ICE_LB_FAILED', 'Не удалось загрузить рейтинги.');
        }
    });
    app.post('/neon_v1/services/nri/:code/ice/score', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const scoreParsed = parseRequestBody(nriIceScoreSchema, req.body);
        if (!scoreParsed.ok)
            return sendApiError(res, 400, 'NRI_ICE_SCORE_INVALID', scoreParsed.message);
        const { score, exfilPct, tracePct, won, gameId: gameIdRaw, difficulty: difficultyRaw } = scoreParsed.data;
        const gameId = typeof gameIdRaw === 'string' && isNriIceGameId(gameIdRaw.trim())
            ? gameIdRaw.trim()
            : DEFAULT_ICE_GAME_ID;
        const difficulty = difficultyRaw === 'easy' || difficultyRaw === 'hard' ? difficultyRaw : 'medium';
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
                    gameId,
                    difficulty,
                    score: pts,
                    exfilPct: typeof exfilPct === 'number' ? Math.round(exfilPct) : 0,
                    tracePct: typeof tracePct === 'number' ? Math.round(tracePct) : 0,
                    won: won === true,
                },
            });
            const newAchievements = won === true
                ? await processPlayerAchievements(prisma, player.id, [
                    {
                        type: 'ice_won',
                        won: true,
                        tracePct: typeof tracePct === 'number' ? Math.round(tracePct) : undefined,
                    },
                ], { checkCybersportsman: true })
                : [];
            res.status(201).json({
                ok: true,
                entry: {
                    userId: row.userId,
                    displayName: row.displayName,
                    gameId: row.gameId,
                    difficulty: row.difficulty,
                    score: row.score,
                    exfilPct: row.exfilPct,
                    tracePct: row.tracePct,
                    at: row.createdAt.getTime(),
                },
                newAchievements,
            });
        }
        catch (error) {
            console.error('nri/ice score:', error);
            return sendApiError(res, 500, 'NRI_ICE_SCORE_FAILED', 'Не удалось записать результат.');
        }
    });
    app.post('/neon_v1/services/nri/:code/wonlongs/transfer', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const parsed = parseRequestBody(nriWonlongsTransferSchema, req.body);
        if (!parsed.ok)
            return sendApiError(res, 400, 'NRI_AMOUNT', parsed.message);
        const { amount, toPlayerUserId, toNpcId, memo } = parsed.data;
        const amt = Math.floor(amount);
        const toPlayer = toPlayerUserId?.trim() || null;
        const toNpc = toNpcId?.trim() || null;
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
                const newAchievements = await processPlayerAchievements(prisma, sender.id, [
                    {
                        type: 'transfer_sent',
                        toPlayer: true,
                        amount: amt,
                        hasMemo: !!(memo && String(memo).trim()),
                    },
                ]);
                res.json({
                    ok: true,
                    wonlongs: senderBal - amt,
                    memo: memo ?? null,
                    transfer: { to: 'player', userId: toPlayer, amount: amt },
                    newAchievements,
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
        const parsed = parseRequestBody(nriWonlongsGrantSchema, req.body);
        if (!parsed.ok)
            return sendApiError(res, 400, 'NRI_PLAYER_ID', parsed.message);
        const { playerUserId, amount, fromNpcId, memo } = parsed.data;
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
            await processPlayerAchievements(prisma, player.id, [
                { type: 'wonlongs_balance', amount: readWonlongs(updated.sheet) },
                ...(typeof fromNpcId === 'string' && fromNpcId.trim()
                    ? [{ type: 'wonlongs_grant_from_npc' }]
                    : []),
            ]);
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
    app.get('/neon_v1/services/nri/:code/ice/counterhack', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const isHost = session.hostUserId === auth.userId;
            const players = await prisma.nriPlayer.findMany({ where: { sessionId: session.id } });
            const mine = players.find((p) => p.userId === auth.userId);
            const active = players
                .map((p) => ({ player: p, ch: readCounterHack(p.sheet) }))
                .find((x) => x.ch?.active) ?? null;
            if (!active?.ch) {
                return res.json({ active: false, isHost, counterHack: null, stage: null });
            }
            const ch = {
                ...active.ch,
                enemyProgress: enemyProgressFromTime(active.ch),
            };
            const stage = buildCounterStage(ch.stageIndex, ch.startedAt);
            const canPlay = mine?.userId === active.player.userId;
            let payloadCh = ch;
            if (isCounterHackExpired(ch)) {
                payloadCh = {
                    ...ch,
                    active: false,
                    resolved: 'lost',
                    enemyProgress: 100,
                    sirenMessage: SIREN_MESSAGE,
                };
                const sheet = applyHardwareBan(writeCounterHack(active.player.sheet, payloadCh));
                const inventory = brickDecksInInventory(active.player.inventory);
                await prisma.nriPlayer.update({
                    where: { id: active.player.id },
                    data: { sheet: sheet, inventory },
                });
                await prisma.nriHostAlert.create({
                    data: {
                        sessionId: session.id,
                        fromUserId: active.player.userId,
                        kind: 'ice_counterhack_lost',
                        body: `${active.player.displayName}: дека выжжена (таймер). ${SIREN_MESSAGE}`,
                    },
                });
                return res.json({
                    active: false,
                    isHost,
                    canPlay: false,
                    targetName: payloadCh.targetName ?? active.player.displayName,
                    counterHack: payloadCh,
                    stage: null,
                    sirenMessage: SIREN_MESSAGE,
                    decksBricked: true,
                });
            }
            res.json({
                active: true,
                isHost,
                canPlay,
                targetName: payloadCh.targetName ?? active.player.displayName,
                counterHack: payloadCh,
                stage: {
                    id: stage.id,
                    title: stage.title,
                    hint: stage.hint,
                    need: stage.need,
                    commands: stage.commands.map((c) => ({ id: c.id, label: c.label })),
                },
            });
        }
        catch (error) {
            console.error('nri/ice counterhack get:', error);
            return sendApiError(res, 500, 'NRI_COUNTERHACK_FAILED', 'Не удалось загрузить встречный взлом.');
        }
    });
    app.post('/neon_v1/services/nri/:code/ice/counterhack/pick', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const commandId = typeof req.body?.commandId === 'string' ? req.body.commandId.trim() : '';
        if (!commandId)
            return sendApiError(res, 400, 'NRI_CMD', 'Нужна команда.');
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            let ch = readCounterHack(player.sheet);
            if (!ch?.active) {
                return sendApiError(res, 400, 'NRI_NO_COUNTERHACK', 'Встречный взлом не активен.');
            }
            ch = { ...ch, enemyProgress: enemyProgressFromTime(ch) };
            if (isCounterHackExpired(ch)) {
                ch = {
                    ...ch,
                    active: false,
                    resolved: 'lost',
                    enemyProgress: 100,
                    sirenMessage: SIREN_MESSAGE,
                };
            }
            else {
                const stage = buildCounterStage(ch.stageIndex, ch.startedAt);
                const pick = applyCounterCommandPick(ch, stage, commandId);
                ch = pick.state;
            }
            let inventory = Array.isArray(player.inventory)
                ? player.inventory
                : [];
            let sheet = writeCounterHack(player.sheet, ch);
            if (ch.resolved === 'lost') {
                inventory = brickDecksInInventory(player.inventory);
                sheet = applyHardwareBan(writeCounterHack(player.sheet, ch));
            }
            else if (ch.resolved === 'won') {
                sheet = clearIceBan(writeCounterHack(player.sheet, ch));
            }
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { sheet: sheet, inventory },
            });
            if (ch.resolved === 'lost') {
                await prisma.nriHostAlert.create({
                    data: {
                        sessionId: session.id,
                        fromUserId: auth.userId,
                        kind: 'ice_counterhack_lost',
                        body: `${player.displayName}: дека выжжена. ${SIREN_MESSAGE}`,
                    },
                });
            }
            const stage = ch.active && !ch.resolved
                ? buildCounterStage(ch.stageIndex, ch.startedAt)
                : null;
            res.json({
                ok: true,
                counterHack: ch,
                sirenMessage: ch.sirenMessage,
                decksBricked: ch.resolved === 'lost',
                stage: stage
                    ? {
                        id: stage.id,
                        title: stage.title,
                        hint: stage.hint,
                        need: stage.need,
                        commands: stage.commands.map((c) => ({ id: c.id, label: c.label })),
                    }
                    : null,
            });
        }
        catch (error) {
            console.error('nri/ice counterhack pick:', error);
            return sendApiError(res, 500, 'NRI_COUNTERHACK_PICK', 'Не удалось обработать команду.');
        }
    });
}
//# sourceMappingURL=nriIceWalletRoutes.js.map
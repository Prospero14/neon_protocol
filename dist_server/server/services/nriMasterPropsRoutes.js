/** Мастерские пропы: play basket + locks. */
import { emptyMasterProps, newId, readMasterProps, } from '../../shared/nri-domain/masterProps.js';
import { catalogToServerInventoryItem } from './nriItemCatalogServer.js';
import { mergeInventoryItem } from './nriItemGrant.js';
async function loadProps(prisma, sessionId) {
    const row = await prisma.nriSession.findUnique({
        where: { id: sessionId },
        select: { masterProps: true },
    });
    return readMasterProps(row?.masterProps);
}
async function saveProps(prisma, sessionId, props) {
    await prisma.nriSession.update({
        where: { id: sessionId },
        data: { masterProps: props },
    });
    return props;
}
export function mountNriMasterPropsRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
    app.get('/neon_v1/services/nri/:code/master-props', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const props = await loadProps(prisma, session.id);
            res.json(props);
        }
        catch (error) {
            console.error('master-props get:', error);
            return sendApiError(res, 500, 'NRI_PROPS_FAILED', 'Не удалось загрузить пропы.');
        }
    });
    app.put('/neon_v1/services/nri/:code/master-props', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const next = readMasterProps(req.body ?? emptyMasterProps());
            const saved = await saveProps(prisma, session.id, next);
            res.json(saved);
        }
        catch (error) {
            console.error('master-props put:', error);
            return sendApiError(res, 500, 'NRI_PROPS_SAVE', 'Не удалось сохранить пропы.');
        }
    });
    app.post('/neon_v1/services/nri/:code/master-props/basket', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const body = req.body;
            const props = await loadProps(prisma, session.id);
            let entry = null;
            if (typeof body.fromPlayerUserId === 'string' && body.fromPlayerUserId.trim()) {
                const player = await prisma.nriPlayer.findUnique({
                    where: {
                        sessionId_userId: { sessionId: session.id, userId: body.fromPlayerUserId.trim() },
                    },
                });
                if (!player)
                    return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
                const inv = Array.isArray(player.inventory) ? player.inventory : [];
                const item = body.inventoryItemId
                    ? inv.find((i) => i.id === body.inventoryItemId)
                    : inv.find((i) => i.catalogId === body.catalogId);
                if (!item)
                    return sendApiError(res, 404, 'NRI_ITEM', 'Предмет не найден у игрока.');
                entry = {
                    id: newId('b'),
                    catalogId: item.catalogId,
                    label: item.name || item.catalogId || 'Item',
                    qty: 1,
                    itemKind: body.itemKind === 'quest' ? 'quest' : 'ordinary',
                    source: `player:${player.displayName}`,
                };
            }
            else if (typeof body.fromNpcId === 'string' && body.fromNpcId.trim()) {
                const npc = await prisma.nriNpc.findFirst({
                    where: { id: body.fromNpcId.trim(), sessionId: session.id },
                });
                if (!npc)
                    return sendApiError(res, 404, 'NRI_NPC', 'НПС не найден.');
                const inv = Array.isArray(npc.inventory) ? npc.inventory : [];
                const item = body.inventoryItemId
                    ? inv.find((i) => i.id === body.inventoryItemId)
                    : inv.find((i) => i.catalogId === body.catalogId) ?? inv[0];
                if (!item)
                    return sendApiError(res, 404, 'NRI_ITEM', 'Предмет не найден у НПС.');
                entry = {
                    id: newId('b'),
                    catalogId: item.catalogId,
                    label: item.name || item.catalogId || 'Item',
                    qty: 1,
                    itemKind: body.itemKind === 'quest' ? 'quest' : 'ordinary',
                    source: `npc:${npc.name}`,
                };
            }
            else {
                const catalogId = typeof body.catalogId === 'string' ? body.catalogId.trim() : '';
                const label = typeof body.label === 'string' && body.label.trim()
                    ? body.label.trim()
                    : catalogId || 'Item';
                entry = {
                    id: newId('b'),
                    catalogId: catalogId || undefined,
                    label,
                    qty: typeof body.qty === 'number' && body.qty > 0 ? Math.floor(body.qty) : 1,
                    itemKind: body.itemKind === 'quest' ? 'quest' : 'ordinary',
                    source: body.source,
                    notes: typeof body.notes === 'string' ? body.notes : undefined,
                };
            }
            props.playBasket = [...props.playBasket, entry];
            const saved = await saveProps(prisma, session.id, props);
            res.status(201).json({ ok: true, entry, props: saved });
        }
        catch (error) {
            console.error('master-props basket:', error);
            return sendApiError(res, 500, 'NRI_BASKET', 'Не удалось добавить в корзину.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/master-props/basket/:entryId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const entryId = String(req.params.entryId ?? '');
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const props = await loadProps(prisma, session.id);
            props.playBasket = props.playBasket.filter((e) => e.id !== entryId);
            const saved = await saveProps(prisma, session.id, props);
            res.json({ ok: true, props: saved });
        }
        catch (error) {
            console.error('master-props basket del:', error);
            return sendApiError(res, 500, 'NRI_BASKET_DEL', 'Не удалось удалить.');
        }
    });
    app.post('/neon_v1/services/nri/:code/master-props/basket/:entryId/grant', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const entryId = String(req.params.entryId ?? '');
        const toUserId = typeof req.body?.toUserId === 'string' ? req.body.toUserId.trim() : '';
        if (!toUserId)
            return sendApiError(res, 400, 'NRI_TARGET', 'Нужен toUserId.');
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const props = await loadProps(prisma, session.id);
            const entry = props.playBasket.find((e) => e.id === entryId);
            if (!entry)
                return sendApiError(res, 404, 'NRI_BASKET_ENTRY', 'Нет в корзине.');
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: toUserId } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
            let nextInv = Array.isArray(player.inventory)
                ? player.inventory
                : [];
            if (entry.catalogId) {
                const item = catalogToServerInventoryItem(entry.catalogId);
                if (!item)
                    return sendApiError(res, 400, 'NRI_CATALOG', 'Неизвестный catalogId.');
                if (entry.itemKind === 'quest') {
                    const tags = Array.isArray(item.tags) ? item.tags.filter((t) => typeof t === 'string') : [];
                    item.tags = [...new Set([...tags, 'quest'])];
                }
                nextInv = mergeInventoryItem(nextInv, item);
            }
            else {
                nextInv = mergeInventoryItem(nextInv, {
                    id: newId('i'),
                    name: entry.label,
                    tags: entry.itemKind === 'quest' ? ['quest'] : [],
                });
            }
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: { inventory: nextInv },
            });
            props.playBasket = props.playBasket.filter((e) => e.id !== entryId);
            const saved = await saveProps(prisma, session.id, props);
            res.json({ ok: true, props: saved });
        }
        catch (error) {
            console.error('master-props grant:', error);
            return sendApiError(res, 500, 'NRI_GRANT', 'Не удалось выдать.');
        }
    });
    app.post('/neon_v1/services/nri/:code/master-props/locks', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const body = req.body;
            const lock = {
                id: newId('l'),
                label: typeof body.label === 'string' && body.label.trim() ? body.label.trim() : 'Замок',
                kind: body.kind || 'door',
                method: body.method || 'mechanical',
                dc: typeof body.dc === 'number' ? Math.max(5, Math.min(30, Math.floor(body.dc))) : 15,
                state: body.state || 'locked',
                anchorType: body.anchorType || 'free',
                anchorId: typeof body.anchorId === 'string' ? body.anchorId : undefined,
                notes: typeof body.notes === 'string' ? body.notes : undefined,
            };
            const props = await loadProps(prisma, session.id);
            props.locks = [...props.locks, lock];
            const saved = await saveProps(prisma, session.id, props);
            res.status(201).json({ ok: true, lock, props: saved });
        }
        catch (error) {
            console.error('master-props locks:', error);
            return sendApiError(res, 500, 'NRI_LOCK', 'Не удалось создать замок.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/master-props/locks/:lockId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const lockId = String(req.params.lockId ?? '');
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const props = await loadProps(prisma, session.id);
            const idx = props.locks.findIndex((l) => l.id === lockId);
            if (idx < 0)
                return sendApiError(res, 404, 'NRI_LOCK_NF', 'Замок не найден.');
            const prev = props.locks[idx];
            const body = req.body;
            const next = {
                ...prev,
                ...(typeof body.label === 'string' ? { label: body.label.trim() || prev.label } : {}),
                ...(body.kind ? { kind: body.kind } : {}),
                ...(body.method ? { method: body.method } : {}),
                ...(typeof body.dc === 'number' ? { dc: Math.max(5, Math.min(30, Math.floor(body.dc))) } : {}),
                ...(body.state ? { state: body.state } : {}),
                ...(body.notes !== undefined ? { notes: body.notes } : {}),
            };
            props.locks = props.locks.map((l, i) => (i === idx ? next : l));
            const saved = await saveProps(prisma, session.id, props);
            res.json({ ok: true, lock: next, props: saved });
        }
        catch (error) {
            console.error('master-props lock patch:', error);
            return sendApiError(res, 500, 'NRI_LOCK_PATCH', 'Не удалось обновить замок.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/master-props/locks/:lockId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const lockId = String(req.params.lockId ?? '');
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Только мастер.');
            }
            const props = await loadProps(prisma, session.id);
            props.locks = props.locks.filter((l) => l.id !== lockId);
            const saved = await saveProps(prisma, session.id, props);
            res.json({ ok: true, props: saved });
        }
        catch (error) {
            console.error('master-props lock del:', error);
            return sendApiError(res, 500, 'NRI_LOCK_DEL', 'Не удалось удалить замок.');
        }
    });
}
//# sourceMappingURL=nriMasterPropsRoutes.js.map
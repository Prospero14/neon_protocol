/** НПС стола + grant items */
import { parseNriJsonField } from './nriSessionHelpers.js';
import { mergeInventoryItem } from './nriItemGrant.js';
import { catalogToServerInventoryItem } from './nriItemCatalogServer.js';
export function mountNriNpcRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
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
                    sheet: parseNriJsonField(sheet) ?? undefined,
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
                    ...(sheet !== undefined ? { sheet: parseNriJsonField(sheet) ?? undefined } : {}),
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
}
//# sourceMappingURL=nriNpcRoutes.js.map
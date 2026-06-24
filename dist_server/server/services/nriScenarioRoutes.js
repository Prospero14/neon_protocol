/** Сценарий стола — nodes, progress */
import { propagatePlaceUpdate } from './nriLoreTravel.js';
import { normalizeScenarioNodeInput, normalizeScenarioLinks, } from '../../shared/nri-domain/scenarioSchema.js';
import { ensureAllNriLoreDbColumns } from './nriSchemaBootstrap.js';
function serializeScenarioNode(n) {
    return {
        id: n.id,
        parentId: n.parentId,
        title: n.title,
        summary: n.summary ?? '',
        body: n.body,
        sortOrder: n.sortOrder,
        links: n.links ?? {},
        createdAt: n.createdAt.getTime(),
        updatedAt: n.updatedAt.getTime(),
    };
}
export function mountNriScenarioRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
    app.get('/neon_v1/services/nri/:code/scenario', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            await ensureAllNriLoreDbColumns(prisma);
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
        const parsed = normalizeScenarioNodeInput(req.body);
        if (!parsed.ok)
            return sendApiError(res, 400, parsed.code, parsed.message);
        const { parentId, title, summary, body, links, sortOrder } = parsed.data;
        try {
            await ensureAllNriLoreDbColumns(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Сценарий редактирует только мастер.');
            }
            const pid = parentId ?? null;
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
                    title: title,
                    summary: summary ?? '',
                    body: body ?? '',
                    sortOrder: sortOrder ?? 0,
                    links: (links ?? normalizeScenarioLinks({})),
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
        const parsed = normalizeScenarioNodeInput(req.body, true);
        if (!parsed.ok)
            return sendApiError(res, 400, parsed.code, parsed.message);
        const { title, summary, body, links, sortOrder, parentId } = parsed.data;
        try {
            await ensureAllNriLoreDbColumns(prisma);
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
            let mergedLinks = links !== undefined ? { ...links } : null;
            if (mergedLinks?.syncToLore === true) {
                const placeTitle = (typeof mergedLinks.placeTitle === 'string' && mergedLinks.placeTitle.trim()) ||
                    title ||
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
                    ...(title !== undefined ? { title } : {}),
                    ...(summary !== undefined ? { summary } : {}),
                    ...(body !== undefined ? { body } : {}),
                    ...(mergedLinks ? { links: mergedLinks } : links !== undefined ? { links: links } : {}),
                    ...(sortOrder !== undefined ? { sortOrder } : {}),
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
}
//# sourceMappingURL=nriScenarioRoutes.js.map
/** Лор, прогресс сценария, перемещение игроков, уведомления мастеру. */
import { getServerVehicleDef } from './nriVehiclesServer.js';
import { formatFactionTitle, normalizeFactionKind, parseZoneKeys, } from './nriFactionKinds.js';
import { patchMapZone, ensureMapZonesSeeded } from './nriMapZones.js';
import { ensureNriLoreEntryTable, listLoreEntries } from './nriLoreSchema.js';
import { ensureAllNriLoreDbColumns, apiErrorHint } from './nriSchemaBootstrap.js';
import { parseFactionRelationMatrix } from '../../shared/nri-domain/factionRelations.js';
import { buildLoreCardIndex } from '../../shared/nri-domain/loreCards.js';
import { isNriMember } from './nriMemberDb.js';
import { defaultZoneIconId, defaultEntityIconId } from '../../shared/nri-domain/zoneIcons.js';
import { normalizeEntityTag } from '../../shared/nri-domain/entityTags.js';
function parseIdList(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.filter((x) => typeof x === 'string');
}
function parseScenarioLinks(raw) {
    if (!raw || typeof raw !== 'object')
        return {};
    const o = raw;
    return {
        syncToLore: o.syncToLore === true,
        lorePlaceId: typeof o.lorePlaceId === 'string' ? o.lorePlaceId : null,
        placeTitle: typeof o.placeTitle === 'string' ? o.placeTitle : undefined,
        mapMarkerId: typeof o.mapMarkerId === 'string' ? o.mapMarkerId : null,
        zoneKey: typeof o.zoneKey === 'string' ? o.zoneKey : null,
        meetCheckpoint: o.meetCheckpoint === true,
    };
}
function evaluateCheckpoint(node, currentScriptNodeId, playerZoneKeys, playerCount) {
    const links = node.links;
    if (!links.meetCheckpoint || !links.zoneKey)
        return { met: false };
    if (currentScriptNodeId !== node.id)
        return { met: false };
    if (playerCount <= 0)
        return { met: false };
    const atPlace = playerZoneKeys.filter((z) => z === links.zoneKey).length;
    return { met: atPlace >= playerCount };
}
function zoneCenter(z) {
    return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}
function travelMinutes(from, to, opts) {
    if (!from || from.zoneKey === to.zoneKey)
        return 0;
    const dist = Math.hypot(zoneCenter(from).x - zoneCenter(to).x, zoneCenter(from).y - zoneCenter(to).y);
    if (opts.onFoot || !opts.vehicleSpeed)
        return Math.max(5, Math.round(dist * 0.35));
    return Math.max(2, Math.round((dist * 0.35) / (Math.max(40, opts.vehicleSpeed) / 80)));
}
function formatTravelMessage(opts) {
    const mode = opts.vehicleName
        ? opts.overload
            ? `на «${opts.vehicleName}» (ПЕРЕГРУЗ мест)`
            : `на «${opts.vehicleName}»`
        : 'пешком';
    return `${opts.displayName}: ${opts.fromLabel} → ${opts.toLabel} · ${mode} · ~${opts.minutes} мин`;
}
function dmKeyFor(a, b) {
    return [a, b].sort().join(':');
}
async function sendServiceDmToHost(prisma, hostUserId, fromUserId, text, sessionId) {
    const key = dmKeyFor(fromUserId, hostUserId);
    let room = await prisma.chatRoom.findUnique({ where: { dmKey: key } });
    if (!room) {
        room = await prisma.chatRoom.create({ data: { kind: 'dm', dmKey: key } });
    }
    await prisma.chatMessage.create({
        data: {
            roomId: room.id,
            userId: fromUserId,
            text: `[Служебное] ${text}`.slice(0, 2000),
            payload: JSON.stringify({ type: 'nri_service', sessionId }),
        },
    });
}
function serializeFaction(f) {
    const kind = normalizeFactionKind(f.kind);
    const name = f.name;
    return {
        id: f.id,
        kind,
        name,
        displayName: formatFactionTitle(kind, name),
        summary: f.summary ?? '',
        description: f.description,
        color: f.color,
        iconId: f.iconId ?? defaultEntityIconId(kind),
        zoneKeys: parseZoneKeys(f.zoneKeys),
        memberPlayerIds: parseIdList(f.memberPlayerIds),
        memberNpcIds: parseIdList(f.memberNpcIds),
        createdAt: f.createdAt.getTime(),
        updatedAt: f.updatedAt.getTime(),
    };
}
function serializeLoreEntry(e) {
    return {
        id: e.id,
        title: e.title,
        summary: e.summary ?? '',
        body: e.body,
        sortOrder: e.sortOrder,
        createdAt: e.createdAt.getTime(),
        updatedAt: e.updatedAt.getTime(),
    };
}
function serializeLorePlace(p) {
    return {
        id: p.id,
        title: p.title,
        summary: p.summary ?? '',
        body: p.body,
        zoneKey: p.zoneKey,
        mapMarkerId: p.mapMarkerId,
        x: p.x,
        y: p.y,
        sourceScenarioNodeId: p.sourceScenarioNodeId,
        sourceFactionId: p.sourceFactionId,
        entityTag: p.entityTag ?? null,
        iconId: p.iconId ?? null,
        createdAt: p.createdAt.getTime(),
        updatedAt: p.updatedAt.getTime(),
    };
}
function placeBodyFromZone(zone) {
    const mega = zone.megaDistrict ? `${zone.megaDistrict} · ` : '';
    const corp = zone.corpName ? ` · ${zone.corpName}` : '';
    return `${mega}Район Night City · ${zone.zoneType}${corp}. Описание: ${zone.name}.`;
}
function placeSummaryFromZone(zone) {
    const mega = zone.megaDistrict ? `${zone.megaDistrict} · ` : '';
    return `${mega}${zone.name}`;
}
async function loadLorePlacesResilient(prisma, sessionId) {
    const run = () => prisma.nriLorePlace.findMany({
        where: { sessionId },
        orderBy: { title: 'asc' },
    });
    try {
        return await run();
    }
    catch (error) {
        console.error('lore places:', error);
        await ensureAllNriLoreDbColumns(prisma);
        try {
            return await run();
        }
        catch (retryErr) {
            console.error('lore places retry:', retryErr);
            return [];
        }
    }
}
async function loadLoreFactionsResilient(prisma, sessionId) {
    const run = () => prisma.nriFaction.findMany({
        where: { sessionId },
        orderBy: { name: 'asc' },
    });
    try {
        return await run();
    }
    catch (error) {
        console.error('lore factions:', error);
        await ensureAllNriLoreDbColumns(prisma);
        try {
            return await run();
        }
        catch (retryErr) {
            console.error('lore factions retry:', retryErr);
            return [];
        }
    }
}
/** Читает источники карточек для чата — каждый список независимо, без синка карты. */
async function loadLoreCardBundle(prisma, sessionId) {
    await ensureAllNriLoreDbColumns(prisma);
    let places = [];
    let factions = [];
    let entries = [];
    try {
        places = await loadLorePlacesResilient(prisma, sessionId);
    }
    catch (error) {
        console.error('lore/cards places:', error);
    }
    try {
        factions = await loadLoreFactionsResilient(prisma, sessionId);
    }
    catch (error) {
        console.error('lore/cards factions:', error);
    }
    try {
        entries = await listLoreEntries(prisma, sessionId);
    }
    catch (error) {
        console.error('lore/cards entries:', error);
    }
    return { places, factions, entries };
}
export async function ensureSessionLorePlacesFromMap(prisma, sessionId) {
    await ensureAllNriLoreDbColumns(prisma);
    await ensureMapZonesSeeded(prisma);
    const zones = await prisma.nriMapZone.findMany({
        where: { NOT: { zoneKey: { startsWith: '__' } } },
        orderBy: { sortOrder: 'asc' },
    });
    if (zones.length === 0)
        return;
    const existing = await prisma.nriLorePlace.findMany({
        where: { sessionId, zoneKey: { not: null } },
    });
    const byZone = new Map(existing.filter((p) => p.zoneKey).map((p) => [p.zoneKey, p]));
    for (const zone of zones) {
        const hit = byZone.get(zone.zoneKey);
        const body = placeBodyFromZone(zone);
        const summary = placeSummaryFromZone(zone);
        const iconId = zone.iconId ?? defaultZoneIconId(zone.zoneType, zone.zoneKey);
        const entityTag = zone.zoneType === 'corp' ? 'corp' : null;
        if (hit) {
            const patch = {};
            if (!hit.body.trim()) {
                patch.title = zone.name;
                patch.body = body;
            }
            if (!hit.summary?.trim())
                patch.summary = summary;
            if (!hit.iconId)
                patch.iconId = iconId;
            if (!hit.entityTag && entityTag)
                patch.entityTag = entityTag;
            if (Object.keys(patch).length > 0) {
                await prisma.nriLorePlace.update({ where: { id: hit.id }, data: patch });
            }
            continue;
        }
        await prisma.nriLorePlace.create({
            data: {
                sessionId,
                title: zone.name,
                summary,
                body,
                zoneKey: zone.zoneKey,
                iconId,
                entityTag,
            },
        });
    }
}
/** Авто-фракции для корпоративных клеток карты. */
export async function ensureSessionFactionsFromCorpZones(prisma, sessionId) {
    await ensureAllNriLoreDbColumns(prisma);
    await ensureMapZonesSeeded(prisma);
    const corpZones = await prisma.nriMapZone.findMany({
        where: { zoneType: 'corp', NOT: { zoneKey: { startsWith: '__' } } },
        orderBy: { sortOrder: 'asc' },
    });
    if (corpZones.length === 0)
        return;
    const factions = await prisma.nriFaction.findMany({ where: { sessionId } });
    const zoneTaken = new Set();
    for (const f of factions) {
        for (const zk of parseZoneKeys(f.zoneKeys))
            zoneTaken.add(zk);
    }
    for (const zone of corpZones) {
        if (zoneTaken.has(zone.zoneKey))
            continue;
        const name = (zone.corpName?.trim() || zone.name.trim() || zone.zoneKey).slice(0, 80);
        const f = await prisma.nriFaction.create({
            data: {
                sessionId,
                kind: 'corp',
                name,
                description: placeBodyFromZone(zone),
                iconId: 'corp',
                zoneKeys: [zone.zoneKey],
                memberPlayerIds: [],
                memberNpcIds: [],
            },
        });
        zoneTaken.add(zone.zoneKey);
        await syncFactionZonePlaces(prisma, sessionId, f.id, [zone.zoneKey], f.name, 'corp');
    }
}
/** Карта → лор: после правки района на карте обновить связанные карточки. */
export async function syncLorePlacesFromZonePatch(prisma, sessionId, zone) {
    const places = await prisma.nriLorePlace.findMany({
        where: { sessionId, zoneKey: zone.zoneKey },
    });
    const iconId = zone.iconId ?? defaultZoneIconId(zone.zoneType, zone.zoneKey);
    const entityTag = zone.zoneType === 'corp' ? 'corp' : null;
    if (places.length === 0) {
        await prisma.nriLorePlace.create({
            data: {
                sessionId,
                title: zone.name,
                body: placeBodyFromZone({
                    name: zone.name,
                    zoneType: zone.zoneType,
                    corpName: zone.corpName,
                    megaDistrict: zone.megaDistrict ?? null,
                }),
                zoneKey: zone.zoneKey,
                iconId,
                entityTag,
            },
        });
        return;
    }
    const bodyHint = placeBodyFromZone({
        name: zone.name,
        zoneType: zone.zoneType,
        corpName: zone.corpName,
        megaDistrict: zone.megaDistrict ?? null,
    });
    for (const place of places) {
        await prisma.nriLorePlace.update({
            where: { id: place.id },
            data: {
                title: zone.name,
                body: place.body.trim() ? place.body : bodyHint,
                iconId: place.iconId ?? iconId,
                entityTag: place.entityTag ?? entityTag,
            },
        });
    }
}
async function syncFactionZonePlaces(prisma, sessionId, factionId, zoneKeys, factionName, kind) {
    for (const zoneKey of zoneKeys) {
        const zone = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
        if (!zone || zoneKey.startsWith('__'))
            continue;
        const existing = await prisma.nriLorePlace.findFirst({
            where: { sessionId, zoneKey },
        });
        const bodyHint = `Район Night City · ${formatFactionTitle(kind, factionName)}.`;
        if (existing) {
            await prisma.nriLorePlace.update({
                where: { id: existing.id },
                data: {
                    title: zone.name,
                    sourceFactionId: factionId,
                    ...(existing.body.trim() ? {} : { body: bodyHint }),
                },
            });
        }
        else {
            await prisma.nriLorePlace.create({
                data: {
                    sessionId,
                    title: zone.name,
                    body: bodyHint,
                    zoneKey,
                    sourceFactionId: factionId,
                },
            });
        }
    }
    const stale = await prisma.nriLorePlace.findMany({
        where: {
            sessionId,
            sourceFactionId: factionId,
            ...(zoneKeys.length > 0 ? { zoneKey: { notIn: zoneKeys } } : {}),
        },
    });
    for (const place of stale) {
        if (place.sourceScenarioNodeId) {
            await prisma.nriLorePlace.update({
                where: { id: place.id },
                data: { sourceFactionId: null },
            });
        }
        else {
            await prisma.nriLorePlace.delete({ where: { id: place.id } });
        }
    }
}
export async function propagatePlaceUpdate(prisma, sessionId, place) {
    if (place.zoneKey && !place.zoneKey.startsWith('__')) {
        await patchMapZone(prisma, place.zoneKey, {
            name: place.title,
            ...(place.iconId != null ? { iconId: place.iconId } : {}),
        });
        await prisma.nriLorePlace.updateMany({
            where: { sessionId, zoneKey: place.zoneKey, NOT: { id: place.id } },
            data: {
                title: place.title,
                body: place.body,
                ...(place.iconId != null ? { iconId: place.iconId } : {}),
                ...(place.entityTag != null ? { entityTag: place.entityTag } : {}),
            },
        });
    }
    const nodes = await prisma.nriScenarioNode.findMany({ where: { sessionId } });
    for (const node of nodes) {
        const links = parseScenarioLinks(node.links);
        const linked = links.lorePlaceId === place.id || (place.zoneKey && links.zoneKey === place.zoneKey);
        if (!linked)
            continue;
        const nextLinks = { ...node.links };
        if (links.lorePlaceId === place.id) {
            nextLinks.placeTitle = place.title;
        }
        if (place.zoneKey && links.zoneKey === place.zoneKey) {
            nextLinks.placeTitle = place.title;
        }
        await prisma.nriScenarioNode.update({
            where: { id: node.id },
            data: { links: nextLinks },
        });
    }
}
async function syncLorePlaceFromNode(prisma, sessionId, nodeId, title, links) {
    if (!links.syncToLore)
        return links.lorePlaceId ?? null;
    const placeTitle = links.placeTitle?.trim() || title;
    if (links.lorePlaceId) {
        await prisma.nriLorePlace.update({
            where: { id: links.lorePlaceId },
            data: {
                title: placeTitle.slice(0, 120),
                zoneKey: links.zoneKey ?? undefined,
                mapMarkerId: links.mapMarkerId ?? undefined,
                sourceScenarioNodeId: nodeId,
            },
        });
        return links.lorePlaceId;
    }
    const created = await prisma.nriLorePlace.create({
        data: {
            sessionId,
            title: placeTitle.slice(0, 120),
            body: '',
            zoneKey: links.zoneKey ?? null,
            mapMarkerId: links.mapMarkerId ?? null,
            sourceScenarioNodeId: nodeId,
        },
    });
    return created.id;
}
export function mountNriLoreTravelRoutes(app, deps) {
    const { prisma, jwtAuth, sendApiError, resolveSession, resolveUser, requireHost } = deps;
    app.get('/neon_v1/services/nri/:code/lore', async (req, res) => {
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
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Лор доступен только мастеру.');
            }
            await ensureAllNriLoreDbColumns(prisma);
            try {
                await ensureSessionLorePlacesFromMap(prisma, session.id);
                await ensureSessionFactionsFromCorpZones(prisma, session.id);
            }
            catch (syncErr) {
                console.error('nri/lore sync:', syncErr);
            }
            const world = await prisma.nriLoreWorld.findUnique({ where: { sessionId: session.id } });
            const { places, factions, entries: entriesRaw } = await loadLoreCardBundle(prisma, session.id);
            let relationState = null;
            try {
                relationState = await prisma.nriFactionRelationState.findUnique({
                    where: { sessionId: session.id },
                });
            }
            catch (relErr) {
                console.warn('nri/lore faction-relations:', relErr);
            }
            let entries = entriesRaw;
            if (entries.length === 0 && world?.body?.trim()) {
                try {
                    const migrated = await prisma.nriLoreEntry.create({
                        data: {
                            sessionId: session.id,
                            title: 'Общий лор',
                            body: world.body,
                            sortOrder: 0,
                        },
                    });
                    entries = [migrated];
                }
                catch (migrateErr) {
                    console.warn('nri/lore entry migrate:', migrateErr);
                }
            }
            res.json({
                world: { body: world?.body ?? '', updatedAt: world?.updatedAt.getTime() ?? Date.now() },
                entries: entries.map(serializeLoreEntry),
                factions: factions.map(serializeFaction),
                places: places.map(serializeLorePlace),
                factionRelations: parseFactionRelationMatrix(relationState
                    ? { enabled: relationState.enabled, edges: relationState.edges, updatedAt: relationState.updatedAt.getTime() }
                    : null),
            });
        }
        catch (error) {
            console.error('nri/lore get:', error);
            const hint = apiErrorHint(error);
            return sendApiError(res, 500, 'NRI_LORE_GET_FAILED', hint || 'Не удалось загрузить лор.');
        }
    });
    app.get('/neon_v1/services/nri/:code/lore/cards', async (req, res) => {
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
            const allowed = session.hostUserId === me.id ||
                (await isNriMember(prisma, session.id, me.id)) ||
                !!(await prisma.nriPlayer.findUnique({
                    where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
                }));
            if (!allowed) {
                return sendApiError(res, 403, 'NRI_LORE_CARDS_FORBIDDEN', 'Нет доступа к лору стола.');
            }
            const { places, factions, entries } = await loadLoreCardBundle(prisma, session.id);
            let scenarios = [];
            try {
                const nodes = await prisma.nriScenarioNode.findMany({
                    where: { sessionId: session.id },
                    select: { id: true, title: true, summary: true, body: true },
                });
                scenarios = nodes.map((n) => ({
                    id: n.id,
                    title: n.title,
                    summary: n.summary ?? '',
                    body: n.body,
                }));
            }
            catch (scenarioErr) {
                console.warn('nri/lore/cards scenarios:', scenarioErr);
            }
            const cards = buildLoreCardIndex({
                places: places.map(serializeLorePlace),
                factions: factions.map(serializeFaction),
                entries: entries.map(serializeLoreEntry),
                scenarios,
            });
            res.json({ cards });
        }
        catch (error) {
            console.error('nri/lore cards get:', error);
            const hint = apiErrorHint(error);
            return sendApiError(res, 500, 'NRI_LORE_CARDS_FAILED', hint || 'Не удалось загрузить карточки лора.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/lore/world', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { body } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Лор редактирует только мастер.');
            }
            const world = await prisma.nriLoreWorld.upsert({
                where: { sessionId: session.id },
                create: { sessionId: session.id, body: typeof body === 'string' ? body.slice(0, 50000) : '' },
                update: { body: typeof body === 'string' ? body.slice(0, 50000) : '' },
            });
            res.json({ body: world.body, updatedAt: world.updatedAt.getTime() });
        }
        catch (error) {
            console.error('nri/lore world patch:', error);
            return sendApiError(res, 500, 'NRI_LORE_WORLD_FAILED', 'Не удалось сохранить лор мира.');
        }
    });
    app.post('/neon_v1/services/nri/:code/lore/entries', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { title, body, summary } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Лор редактирует только мастер.');
            }
            await ensureNriLoreEntryTable(prisma);
            const count = await prisma.nriLoreEntry.count({ where: { sessionId: session.id } });
            const entry = await prisma.nriLoreEntry.create({
                data: {
                    sessionId: session.id,
                    title: typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : 'Новая карточка',
                    summary: typeof summary === 'string' ? summary.slice(0, 500) : '',
                    body: typeof body === 'string' ? body.slice(0, 20000) : '',
                    sortOrder: count,
                },
            });
            res.status(201).json({ entry: serializeLoreEntry(entry) });
        }
        catch (error) {
            console.error('nri/lore entry post:', error);
            return sendApiError(res, 500, 'NRI_LORE_ENTRY_FAILED', 'Не удалось создать карточку.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/lore/entries/:entryId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const entryId = req.params.entryId;
        const { title, body, summary } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Лор редактирует только мастер.');
            }
            const existing = await prisma.nriLoreEntry.findFirst({
                where: { id: entryId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_LORE_ENTRY_NOT_FOUND', 'Карточка не найдена.');
            const updated = await prisma.nriLoreEntry.update({
                where: { id: entryId },
                data: {
                    ...(typeof title === 'string' && title.trim() ? { title: title.trim().slice(0, 120) } : {}),
                    ...(typeof summary === 'string' ? { summary: summary.slice(0, 500) } : {}),
                    ...(typeof body === 'string' ? { body: body.slice(0, 20000) } : {}),
                },
            });
            res.json({ entry: serializeLoreEntry(updated) });
        }
        catch (error) {
            console.error('nri/lore entry patch:', error);
            return sendApiError(res, 500, 'NRI_LORE_ENTRY_FAILED', 'Не удалось сохранить карточку.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/lore/entries/:entryId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const entryId = req.params.entryId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Лор редактирует только мастер.');
            }
            const existing = await prisma.nriLoreEntry.findFirst({
                where: { id: entryId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_LORE_ENTRY_NOT_FOUND', 'Карточка не найдена.');
            await prisma.nriLoreEntry.delete({ where: { id: entryId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/lore entry delete:', error);
            return sendApiError(res, 500, 'NRI_LORE_ENTRY_FAILED', 'Не удалось удалить карточку.');
        }
    });
    app.post('/neon_v1/services/nri/:code/lore/factions', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { name, description, summary, color, kind, zoneKeys, iconId } = req.body;
        if (typeof name !== 'string' || !name.trim()) {
            return sendApiError(res, 400, 'NRI_FACTION_NAME', 'Укажите название фракции.');
        }
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Фракции создаёт только мастер.');
            }
            await ensureAllNriLoreDbColumns(prisma);
            const f = await prisma.nriFaction.create({
                data: {
                    sessionId: session.id,
                    kind: normalizeFactionKind(kind),
                    name: name.trim().slice(0, 80),
                    summary: typeof summary === 'string' ? summary.slice(0, 500) : '',
                    description: typeof description === 'string' ? description.slice(0, 5000) : '',
                    color: typeof color === 'string' ? color.slice(0, 20) : null,
                    iconId: typeof iconId === 'string'
                        ? iconId.slice(0, 500)
                        : defaultEntityIconId(normalizeFactionKind(kind)),
                    zoneKeys: parseZoneKeys(zoneKeys),
                    memberPlayerIds: [],
                    memberNpcIds: [],
                },
            });
            await syncFactionZonePlaces(prisma, session.id, f.id, parseZoneKeys(f.zoneKeys), f.name, normalizeFactionKind(f.kind));
            const refreshed = await prisma.nriFaction.findUniqueOrThrow({ where: { id: f.id } });
            res.status(201).json({ faction: serializeFaction(refreshed) });
        }
        catch (error) {
            console.error('nri/faction post:', error);
            return sendApiError(res, 500, 'NRI_FACTION_CREATE_FAILED', 'Не удалось создать фракцию.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/lore/factions/:factionId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const factionId = req.params.factionId;
        const { name, description, summary, color, memberPlayerIds, memberNpcIds, kind, zoneKeys, iconId } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Фракции редактирует только мастер.');
            }
            const existing = await prisma.nriFaction.findFirst({
                where: { id: factionId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_FACTION_NOT_FOUND', 'Фракция не найдена.');
            const updated = await prisma.nriFaction.update({
                where: { id: factionId },
                data: {
                    ...(typeof name === 'string' && name.trim() ? { name: name.trim().slice(0, 80) } : {}),
                    ...(kind !== undefined ? { kind: normalizeFactionKind(kind) } : {}),
                    ...(typeof description === 'string' ? { description: description.slice(0, 5000) } : {}),
                    ...(typeof summary === 'string' ? { summary: summary.slice(0, 500) } : {}),
                    ...(color !== undefined ? { color: color ? String(color).slice(0, 20) : null } : {}),
                    ...(Array.isArray(zoneKeys) ? { zoneKeys: parseZoneKeys(zoneKeys) } : {}),
                    ...(Array.isArray(memberPlayerIds) ? { memberPlayerIds } : {}),
                    ...(Array.isArray(memberNpcIds) ? { memberNpcIds } : {}),
                    ...(iconId !== undefined
                        ? { iconId: typeof iconId === 'string' ? iconId.slice(0, 500) : null }
                        : {}),
                },
            });
            if (Array.isArray(zoneKeys) || kind !== undefined || typeof name === 'string') {
                await syncFactionZonePlaces(prisma, session.id, updated.id, parseZoneKeys(updated.zoneKeys), updated.name, normalizeFactionKind(updated.kind));
            }
            const refreshed = await prisma.nriFaction.findUniqueOrThrow({ where: { id: factionId } });
            res.json({ faction: serializeFaction(refreshed) });
        }
        catch (error) {
            console.error('nri/faction patch:', error);
            return sendApiError(res, 500, 'NRI_FACTION_PATCH_FAILED', 'Не удалось обновить фракцию.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/lore/factions/:factionId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const factionId = req.params.factionId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Фракции удаляет только мастер.');
            }
            const existing = await prisma.nriFaction.findFirst({
                where: { id: factionId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_FACTION_NOT_FOUND', 'Фракция не найдена.');
            await prisma.nriLorePlace.deleteMany({
                where: { sessionId: session.id, sourceFactionId: factionId },
            });
            await prisma.nriFaction.delete({ where: { id: factionId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/faction delete:', error);
            return sendApiError(res, 500, 'NRI_FACTION_DELETE_FAILED', 'Не удалось удалить фракцию.');
        }
    });
    app.get('/neon_v1/services/nri/:code/lore/faction-relations', async (req, res) => {
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
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Матрицу отношений видит только мастер.');
            }
            const state = await prisma.nriFactionRelationState.findUnique({ where: { sessionId: session.id } });
            res.json({
                factionRelations: parseFactionRelationMatrix(state
                    ? { enabled: state.enabled, edges: state.edges, updatedAt: state.updatedAt.getTime() }
                    : null),
            });
        }
        catch (error) {
            console.error('nri/faction-relations get:', error);
            return sendApiError(res, 500, 'NRI_FACTION_REL_GET_FAILED', 'Не удалось загрузить отношения фракций.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/lore/faction-relations', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { enabled, edges } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Отношения фракций настраивает только мастер.');
            }
            const prev = await prisma.nriFactionRelationState.findUnique({ where: { sessionId: session.id } });
            const prevMatrix = parseFactionRelationMatrix(prev ? { enabled: prev.enabled, edges: prev.edges } : null);
            const nextEdges = { ...prevMatrix.edges };
            if (edges && typeof edges === 'object') {
                for (const [k, v] of Object.entries(edges)) {
                    if (v === 'allied' || v === 'neutral' || v === 'wary' || v === 'hostile') {
                        nextEdges[k] = v;
                    }
                    else if (v === 'remove' || v === null) {
                        delete nextEdges[k];
                    }
                }
            }
            const state = await prisma.nriFactionRelationState.upsert({
                where: { sessionId: session.id },
                create: {
                    sessionId: session.id,
                    enabled: enabled === true,
                    edges: nextEdges,
                },
                update: {
                    ...(typeof enabled === 'boolean' ? { enabled } : {}),
                    edges: nextEdges,
                },
            });
            res.json({
                factionRelations: parseFactionRelationMatrix({
                    enabled: state.enabled,
                    edges: state.edges,
                    updatedAt: state.updatedAt.getTime(),
                }),
            });
        }
        catch (error) {
            console.error('nri/faction-relations patch:', error);
            return sendApiError(res, 500, 'NRI_FACTION_REL_PATCH_FAILED', 'Не удалось сохранить отношения фракций.');
        }
    });
    app.post('/neon_v1/services/nri/:code/lore/places', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { title, body, summary } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Места создаёт только мастер.');
            }
            const place = await prisma.nriLorePlace.create({
                data: {
                    sessionId: session.id,
                    title: typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : 'Новое место',
                    summary: typeof summary === 'string' ? summary.slice(0, 500) : '',
                    body: typeof body === 'string' ? body.slice(0, 10000) : '',
                },
            });
            res.status(201).json({ place: serializeLorePlace(place) });
        }
        catch (error) {
            console.error('nri/place post:', error);
            return sendApiError(res, 500, 'NRI_PLACE_CREATE_FAILED', 'Не удалось создать место.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/lore/places/:placeId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const placeId = req.params.placeId;
        const { title, body, summary, entityTag, iconId } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Места редактирует только мастер.');
            }
            const existing = await prisma.nriLorePlace.findFirst({
                where: { id: placeId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_PLACE_NOT_FOUND', 'Место не найдено.');
            const updated = await prisma.nriLorePlace.update({
                where: { id: placeId },
                data: {
                    ...(typeof title === 'string' && title.trim() ? { title: title.trim().slice(0, 120) } : {}),
                    ...(typeof summary === 'string' ? { summary: summary.slice(0, 500) } : {}),
                    ...(typeof body === 'string' ? { body: body.slice(0, 10000) } : {}),
                    ...(entityTag !== undefined ? { entityTag: entityTag ? normalizeEntityTag(entityTag) : null } : {}),
                    ...(iconId !== undefined ? { iconId: typeof iconId === 'string' ? iconId.slice(0, 500) : null } : {}),
                },
            });
            await propagatePlaceUpdate(prisma, session.id, updated);
            const synced = await prisma.nriLorePlace.findUniqueOrThrow({ where: { id: placeId } });
            res.json({ place: serializeLorePlace(synced) });
        }
        catch (error) {
            console.error('nri/place patch:', error);
            return sendApiError(res, 500, 'NRI_PLACE_PATCH_FAILED', 'Не удалось обновить место.');
        }
    });
    app.get('/neon_v1/services/nri/:code/scenario/progress', async (req, res) => {
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
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Прогресс сценария — только мастер.');
            }
            const progress = await prisma.nriScenarioProgress.findUnique({ where: { sessionId: session.id } });
            res.json({
                progress: {
                    currentScriptNodeId: progress?.currentScriptNodeId ?? null,
                    completedNodeIds: parseIdList(progress?.completedNodeIds),
                    updatedAt: progress?.updatedAt.getTime() ?? Date.now(),
                },
            });
        }
        catch (error) {
            console.error('nri/scenario progress get:', error);
            return sendApiError(res, 500, 'NRI_PROGRESS_GET_FAILED', 'Не удалось загрузить прогресс.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/scenario/progress', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { currentScriptNodeId, completeNodeId } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Прогресс сценария — только мастер.');
            }
            const prev = await prisma.nriScenarioProgress.findUnique({ where: { sessionId: session.id } });
            let completed = parseIdList(prev?.completedNodeIds);
            if (typeof completeNodeId === 'string' && completeNodeId.trim() && !completed.includes(completeNodeId.trim())) {
                completed = [...completed, completeNodeId.trim()];
            }
            const progress = await prisma.nriScenarioProgress.upsert({
                where: { sessionId: session.id },
                create: {
                    sessionId: session.id,
                    currentScriptNodeId: currentScriptNodeId === null
                        ? null
                        : typeof currentScriptNodeId === 'string'
                            ? currentScriptNodeId.trim() || null
                            : null,
                    completedNodeIds: completed,
                },
                update: {
                    ...(currentScriptNodeId !== undefined
                        ? {
                            currentScriptNodeId: currentScriptNodeId === null
                                ? null
                                : typeof currentScriptNodeId === 'string'
                                    ? currentScriptNodeId.trim() || null
                                    : null,
                        }
                        : {}),
                    ...(typeof completeNodeId === 'string' ? { completedNodeIds: completed } : {}),
                },
            });
            res.json({
                progress: {
                    currentScriptNodeId: progress.currentScriptNodeId,
                    completedNodeIds: parseIdList(progress.completedNodeIds),
                    updatedAt: progress.updatedAt.getTime(),
                },
            });
        }
        catch (error) {
            console.error('nri/scenario progress patch:', error);
            return sendApiError(res, 500, 'NRI_PROGRESS_PATCH_FAILED', 'Не удалось обновить прогресс.');
        }
    });
    app.get('/neon_v1/services/nri/:code/map/positions', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const [positions, players] = await Promise.all([
                prisma.nriPlayerPosition.findMany({ where: { sessionId: session.id } }),
                prisma.nriPlayer.findMany({
                    where: { sessionId: session.id },
                    select: { userId: true, displayName: true },
                }),
            ]);
            const names = new Map(players.map((p) => [p.userId, p.displayName]));
            res.json({
                positions: positions.map((p) => ({
                    userId: p.userId,
                    displayName: names.get(p.userId),
                    zoneKey: p.zoneKey,
                    x: p.x,
                    y: p.y,
                    vehicleId: p.vehicleId,
                    vehicleOverload: p.vehicleOverload,
                    updatedAt: p.updatedAt.getTime(),
                })),
            });
        }
        catch (error) {
            console.error('nri/map positions get:', error);
            return sendApiError(res, 500, 'NRI_POSITIONS_GET_FAILED', 'Не удалось загрузить позиции.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/move', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { zoneKey, vehicleId, overload } = req.body;
        if (typeof zoneKey !== 'string' || !zoneKey.trim()) {
            return sendApiError(res, 400, 'NRI_MOVE_ZONE', 'Укажите район назначения.');
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
            const targetZone = await prisma.nriMapZone.findUnique({ where: { zoneKey: zoneKey.trim() } });
            if (!targetZone)
                return sendApiError(res, 404, 'NRI_ZONE_NOT_FOUND', 'Район не найден.');
            const prev = await prisma.nriPlayerPosition.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            });
            let fromZone = null;
            if (prev?.zoneKey) {
                const z = await prisma.nriMapZone.findUnique({ where: { zoneKey: prev.zoneKey } });
                if (z)
                    fromZone = { zoneKey: z.zoneKey, x: z.x, y: z.y, w: z.w, h: z.h };
            }
            const toZone = {
                zoneKey: targetZone.zoneKey,
                x: targetZone.x,
                y: targetZone.y,
                w: targetZone.w,
                h: targetZone.h,
            };
            let vehicleName;
            let vehicleSpeed;
            let useVehicle = false;
            let vehicleOverload = false;
            if (typeof vehicleId === 'string' && vehicleId.trim()) {
                const vehicle = await prisma.nriSessionVehicle.findFirst({
                    where: { id: vehicleId.trim(), sessionId: session.id },
                });
                if (!vehicle)
                    return sendApiError(res, 404, 'NRI_VEHICLE_NOT_FOUND', 'Транспорт не найден.');
                if (vehicle.assignedUserId !== auth.userId) {
                    return sendApiError(res, 403, 'NRI_VEHICLE_NOT_YOURS', 'Этот транспорт вам не назначен.');
                }
                const def = getServerVehicleDef(vehicle.catalogId);
                vehicleName = vehicle.label || def?.name || vehicle.catalogId;
                vehicleSpeed = def?.speed;
                useVehicle = true;
                const occupants = await prisma.nriPlayerPosition.count({
                    where: { sessionId: session.id, vehicleId: vehicle.id },
                });
                const seats = def?.seats ?? 4;
                vehicleOverload = overload === true || occupants >= seats;
            }
            const minutes = travelMinutes(fromZone, toZone, {
                onFoot: !useVehicle,
                vehicleSpeed: vehicleSpeed,
            });
            const fromLabel = fromZone
                ? (await prisma.nriMapZone.findUnique({ where: { zoneKey: fromZone.zoneKey } }))?.name ?? fromZone.zoneKey
                : 'старт';
            const msg = formatTravelMessage({
                displayName: player.displayName,
                fromLabel,
                toLabel: targetZone.name,
                minutes,
                vehicleName: useVehicle ? vehicleName : undefined,
                overload: vehicleOverload,
            });
            await prisma.nriPlayerPosition.upsert({
                where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
                create: {
                    sessionId: session.id,
                    userId: auth.userId,
                    zoneKey: targetZone.zoneKey,
                    x: targetZone.x + targetZone.w / 2,
                    y: targetZone.y + targetZone.h / 2,
                    vehicleId: useVehicle && vehicleId ? vehicleId.trim() : null,
                    vehicleOverload,
                },
                update: {
                    zoneKey: targetZone.zoneKey,
                    x: targetZone.x + targetZone.w / 2,
                    y: targetZone.y + targetZone.h / 2,
                    vehicleId: useVehicle && vehicleId ? vehicleId.trim() : null,
                    vehicleOverload,
                },
            });
            await prisma.nriHostAlert.create({
                data: {
                    sessionId: session.id,
                    fromUserId: auth.userId,
                    kind: vehicleOverload ? 'vehicle_overload' : 'travel',
                    body: msg,
                },
            });
            await sendServiceDmToHost(prisma, session.hostUserId, auth.userId, msg, session.id);
            res.json({ ok: true, minutes, message: msg, zoneKey: targetZone.zoneKey, vehicleOverload });
        }
        catch (error) {
            console.error('nri/map move:', error);
            return sendApiError(res, 500, 'NRI_MOVE_FAILED', 'Не удалось переместить персонажа.');
        }
    });
    app.get('/neon_v1/services/nri/:code/host-alerts', async (req, res) => {
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
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Уведомления — только мастер.');
            }
            const alerts = await prisma.nriHostAlert.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            const players = await prisma.nriPlayer.findMany({
                where: { sessionId: session.id },
                select: { userId: true, displayName: true },
            });
            const names = new Map(players.map((p) => [p.userId, p.displayName]));
            res.json({
                alerts: alerts.map((a) => ({
                    id: a.id,
                    fromUserId: a.fromUserId,
                    fromDisplayName: names.get(a.fromUserId),
                    kind: a.kind,
                    body: a.body,
                    read: a.read,
                    createdAt: a.createdAt.getTime(),
                })),
            });
        }
        catch (error) {
            console.error('nri/host-alerts get:', error);
            return sendApiError(res, 500, 'NRI_ALERTS_GET_FAILED', 'Не удалось загрузить уведомления.');
        }
    });
    return { syncLorePlaceFromNode, evaluateScenarioCheckpoints: async (sessionId) => {
            const [nodes, progress, positions, players] = await Promise.all([
                prisma.nriScenarioNode.findMany({ where: { sessionId } }),
                prisma.nriScenarioProgress.findUnique({ where: { sessionId } }),
                prisma.nriPlayerPosition.findMany({ where: { sessionId } }),
                prisma.nriPlayer.findMany({ where: { sessionId }, select: { userId: true } }),
            ]);
            const currentId = progress?.currentScriptNodeId ?? null;
            const zoneKeys = positions.map((p) => p.zoneKey).filter(Boolean);
            return nodes.map((n) => {
                const links = parseScenarioLinks(n.links);
                const node = {
                    id: n.id,
                    parentId: n.parentId,
                    title: n.title,
                    body: n.body,
                    sortOrder: n.sortOrder,
                    links,
                    createdAt: n.createdAt.getTime(),
                    updatedAt: n.updatedAt.getTime(),
                };
                const { met } = evaluateCheckpoint(node, currentId, zoneKeys, players.length);
                return { ...node, checkpointMet: met };
            });
        } };
}
//# sourceMappingURL=nriLoreTravel.js.map
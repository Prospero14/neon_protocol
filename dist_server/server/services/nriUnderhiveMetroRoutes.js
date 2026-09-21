/** Underhive frame + map lamps + metro graph CRUD / rides / shops. */
import { DEFAULT_METRO_SHOP_CATALOG, findMetroPath, metroZoneKey, neighborStationIds, parseMetroStationId, } from '../../shared/nri-domain/metroGraph.js';
import { deriveCorpUndergrounds, deriveUnderhiveDistrictFrames } from '../../shared/nri-domain/underhiveDerive.js';
import { catalogToServerInventoryItem, getServerCatalogItem } from './nriItemCatalogServer.js';
import { mergeInventoryItem } from './nriItemGrant.js';
import { ensureNriMapSchema, apiErrorHint } from './nriSchemaBootstrap.js';
import { ensureMapZonesSeeded, listMapZones } from './nriMapZones.js';
import { readWonlongs, writeWonlongs } from './nriWallet.js';
import { isNriMember } from './nriMemberDb.js';
function asStringArray(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.filter((x) => typeof x === 'string');
}
async function canAccessMap(session, userId, prisma) {
    if (session.hostUserId === userId)
        return true;
    return isNriMember(prisma, session.id, userId);
}
async function assertUnderhiveAccess(ctx, session, me) {
    const { prisma, requireHost } = ctx;
    const isHost = session.hostUserId === me.id;
    if (isHost)
        return true;
    const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
        select: { inventory: true },
    });
    const inv = Array.isArray(player?.inventory) ? player.inventory : [];
    const hasPassport = inv.some((raw) => raw &&
        typeof raw === 'object' &&
        raw.catalogId === 'g_underhive_passport');
    return hasPassport ? true : 'Нужна Метка поручителя из Подулья.';
}
function serializeLamp(l) {
    return {
        id: l.id,
        x: l.x,
        y: l.y,
        color: l.color,
        on: l.on,
        radius: l.radius,
        layer: l.layer,
        parentZoneKey: l.parentZoneKey,
        createdAt: l.createdAt.getTime(),
    };
}
function serializeStation(s) {
    const extra = asStringArray(s.extraLineIds);
    const lineIds = [s.lineId, ...extra.filter((id) => id !== s.lineId)];
    return {
        id: s.id,
        name: s.name,
        x: s.x,
        y: s.y,
        lineId: s.lineId,
        lineIds,
        districtZoneKey: s.districtZoneKey,
    };
}
export function mountNriUnderhiveMetroRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
    /** Replace stub underhive GET with frames + corp mirrors + metro snapshot. */
    app.get('/neon_v1/services/nri/:code/map/underhive', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const access = await assertUnderhiveAccess(ctx, session, me);
            if (access !== true) {
                return sendApiError(res, 403, 'NRI_UNDERHIVE_LOCKED', access);
            }
            await ensureMapZonesSeeded(prisma);
            const zones = await listMapZones(prisma);
            const top = zones.filter((z) => !z.parentZoneKey);
            const districtFrames = deriveUnderhiveDistrictFrames(top);
            const corpUndergrounds = deriveCorpUndergrounds(top);
            const [lines, stations, edges, shops, lamps] = await Promise.all([
                prisma.nriMetroLine.findMany({ where: { sessionId: session.id }, orderBy: { sortOrder: 'asc' } }),
                prisma.nriMetroStation.findMany({ where: { sessionId: session.id } }),
                prisma.nriMetroEdge.findMany({ where: { sessionId: session.id } }),
                prisma.nriMetroShop.findMany({ where: { sessionId: session.id } }),
                prisma.nriMapLamp.findMany({
                    where: { sessionId: session.id, layer: 'underhive' },
                }),
            ]);
            res.json({
                layer: 'underhive',
                view: { w: 240, h: 165 },
                label: 'Подулей / Underhive',
                districtFrames,
                corpUndergrounds,
                metro: {
                    lines: lines.map((l) => ({ id: l.id, name: l.name, color: l.color, sortOrder: l.sortOrder })),
                    stations: stations.map(serializeStation),
                    edges: edges.map((e) => ({
                        id: e.id,
                        lineId: e.lineId,
                        fromStationId: e.fromStationId,
                        toStationId: e.toStationId,
                        travelSeconds: e.travelSeconds,
                    })),
                    shops: shops.map((s) => ({
                        id: s.id,
                        stationId: s.stationId,
                        label: s.label,
                        catalogIds: asStringArray(s.catalogIds),
                    })),
                },
                lamps: lamps.map(serializeLamp),
            });
        }
        catch (error) {
            console.error('nri/map underhive get:', error);
            return sendApiError(res, 500, 'NRI_UNDERHIVE_FAILED', apiErrorHint(error) || 'Не удалось открыть Подулей.');
        }
    });
    // —— Lamps ——
    app.get('/neon_v1/services/nri/:code/map/lamps', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const layer = typeof req.query.layer === 'string' ? req.query.layer : undefined;
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await canAccessMap(session, me.id, prisma))) {
                return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Нет доступа к карте.');
            }
            const lamps = await prisma.nriMapLamp.findMany({
                where: {
                    sessionId: session.id,
                    ...(layer ? { layer } : {}),
                },
                orderBy: { createdAt: 'asc' },
            });
            res.json({ lamps: lamps.map(serializeLamp) });
        }
        catch (error) {
            console.error('nri/map lamps get:', error);
            return sendApiError(res, 500, 'NRI_LAMPS_FAILED', 'Не удалось загрузить фонари.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/lamps', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { x, y, color, on, radius, layer, parentZoneKey } = req.body;
        if (typeof x !== 'number' || typeof y !== 'number') {
            return sendApiError(res, 400, 'NRI_LAMP_XY', 'Укажите координаты фонаря.');
        }
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Фонари ставит только мастер.');
            }
            const lamp = await prisma.nriMapLamp.create({
                data: {
                    sessionId: session.id,
                    x: Math.max(0, Math.min(100, x)),
                    y: Math.max(0, Math.min(100, y)),
                    color: typeof color === 'string' && color.trim() ? color.trim().slice(0, 32) : '#ffb040',
                    on: on !== false,
                    radius: typeof radius === 'number' && radius > 0 ? Math.min(40, radius) : 12,
                    layer: typeof layer === 'string' && layer.trim() ? layer.trim().slice(0, 32) : 'city',
                    parentZoneKey: typeof parentZoneKey === 'string' && parentZoneKey.trim() ? parentZoneKey.trim() : null,
                },
            });
            res.status(201).json({ lamp: serializeLamp(lamp) });
        }
        catch (error) {
            console.error('nri/map lamps post:', error);
            return sendApiError(res, 500, 'NRI_LAMP_CREATE_FAILED', 'Не удалось поставить фонарь.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/map/lamps/:lampId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const lampId = req.params.lampId;
        const { color, on, radius, x, y } = req.body;
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Фонари правит только мастер.');
            }
            const existing = await prisma.nriMapLamp.findFirst({
                where: { id: lampId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_LAMP_NOT_FOUND', 'Фонарь не найден.');
            const lamp = await prisma.nriMapLamp.update({
                where: { id: lampId },
                data: {
                    ...(typeof color === 'string' ? { color: color.trim().slice(0, 32) } : {}),
                    ...(typeof on === 'boolean' ? { on } : {}),
                    ...(typeof radius === 'number' && radius > 0 ? { radius: Math.min(40, radius) } : {}),
                    ...(typeof x === 'number' ? { x: Math.max(0, Math.min(100, x)) } : {}),
                    ...(typeof y === 'number' ? { y: Math.max(0, Math.min(100, y)) } : {}),
                },
            });
            res.json({ lamp: serializeLamp(lamp) });
        }
        catch (error) {
            console.error('nri/map lamps patch:', error);
            return sendApiError(res, 500, 'NRI_LAMP_PATCH_FAILED', 'Не удалось обновить фонарь.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/map/lamps/:lampId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const lampId = req.params.lampId;
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Фонари удаляет только мастер.');
            }
            const existing = await prisma.nriMapLamp.findFirst({
                where: { id: lampId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_LAMP_NOT_FOUND', 'Фонарь не найден.');
            await prisma.nriMapLamp.delete({ where: { id: lampId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/map lamps delete:', error);
            return sendApiError(res, 500, 'NRI_LAMP_DELETE_FAILED', 'Не удалось удалить фонарь.');
        }
    });
    // —— Metro graph ——
    app.get('/neon_v1/services/nri/:code/map/metro', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await canAccessMap(session, me.id, prisma))) {
                return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Нет доступа.');
            }
            const access = await assertUnderhiveAccess(ctx, session, me);
            if (access !== true) {
                return sendApiError(res, 403, 'NRI_UNDERHIVE_LOCKED', access);
            }
            const [lines, stations, edges, shops] = await Promise.all([
                prisma.nriMetroLine.findMany({ where: { sessionId: session.id }, orderBy: { sortOrder: 'asc' } }),
                prisma.nriMetroStation.findMany({ where: { sessionId: session.id } }),
                prisma.nriMetroEdge.findMany({ where: { sessionId: session.id } }),
                prisma.nriMetroShop.findMany({ where: { sessionId: session.id } }),
            ]);
            res.json({
                lines: lines.map((l) => ({ id: l.id, name: l.name, color: l.color, sortOrder: l.sortOrder })),
                stations: stations.map(serializeStation),
                edges: edges.map((e) => ({
                    id: e.id,
                    lineId: e.lineId,
                    fromStationId: e.fromStationId,
                    toStationId: e.toStationId,
                    travelSeconds: e.travelSeconds,
                })),
                shops: shops.map((s) => ({
                    id: s.id,
                    stationId: s.stationId,
                    label: s.label,
                    catalogIds: asStringArray(s.catalogIds),
                })),
            });
        }
        catch (error) {
            console.error('nri/map metro get:', error);
            return sendApiError(res, 500, 'NRI_METRO_FAILED', 'Не удалось загрузить метро.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/metro/lines', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { name, color } = req.body;
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Метро правит только мастер.');
            }
            const count = await prisma.nriMetroLine.count({ where: { sessionId: session.id } });
            const line = await prisma.nriMetroLine.create({
                data: {
                    sessionId: session.id,
                    name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : `Ветка ${count + 1}`,
                    color: typeof color === 'string' && color.trim() ? color.trim().slice(0, 32) : '#4de8ff',
                    sortOrder: count,
                },
            });
            res.status(201).json({ line: { id: line.id, name: line.name, color: line.color, sortOrder: line.sortOrder } });
        }
        catch (error) {
            console.error('nri/metro line post:', error);
            return sendApiError(res, 500, 'NRI_METRO_LINE_FAILED', 'Не удалось создать ветку.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/metro/stations', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { lineId, name, x, y, districtZoneKey, connectFromStationId, travelSeconds } = req.body;
        if (typeof lineId !== 'string' || !lineId.trim()) {
            return sendApiError(res, 400, 'NRI_METRO_LINE', 'Укажите ветку.');
        }
        if (typeof x !== 'number' || typeof y !== 'number') {
            return sendApiError(res, 400, 'NRI_METRO_XY', 'Укажите координаты станции.');
        }
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Метро правит только мастер.');
            }
            const line = await prisma.nriMetroLine.findFirst({
                where: { id: lineId, sessionId: session.id },
            });
            if (!line)
                return sendApiError(res, 404, 'NRI_METRO_LINE_NOT_FOUND', 'Ветка не найдена.');
            const station = await prisma.nriMetroStation.create({
                data: {
                    sessionId: session.id,
                    lineId: line.id,
                    name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : 'Станция',
                    x: Math.max(0, Math.min(240, x)),
                    y: Math.max(0, Math.min(165, y)),
                    districtZoneKey: typeof districtZoneKey === 'string' && districtZoneKey.trim() ? districtZoneKey.trim() : null,
                    extraLineIds: [],
                },
            });
            let edge = null;
            if (typeof connectFromStationId === 'string' && connectFromStationId.trim()) {
                const from = await prisma.nriMetroStation.findFirst({
                    where: { id: connectFromStationId, sessionId: session.id },
                });
                if (from) {
                    edge = await prisma.nriMetroEdge.create({
                        data: {
                            sessionId: session.id,
                            lineId: line.id,
                            fromStationId: from.id,
                            toStationId: station.id,
                            travelSeconds: typeof travelSeconds === 'number' && travelSeconds > 0
                                ? Math.min(3600, Math.floor(travelSeconds))
                                : null,
                        },
                    });
                }
            }
            res.status(201).json({
                station: serializeStation(station),
                edge: edge
                    ? {
                        id: edge.id,
                        lineId: edge.lineId,
                        fromStationId: edge.fromStationId,
                        toStationId: edge.toStationId,
                        travelSeconds: edge.travelSeconds,
                    }
                    : null,
            });
        }
        catch (error) {
            console.error('nri/metro station post:', error);
            return sendApiError(res, 500, 'NRI_METRO_STATION_FAILED', 'Не удалось создать станцию.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/map/metro/stations/:stationId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const stationId = req.params.stationId;
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Метро правит только мастер.');
            }
            const existing = await prisma.nriMetroStation.findFirst({
                where: { id: stationId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_METRO_STATION_NOT_FOUND', 'Станция не найдена.');
            await prisma.nriMetroEdge.deleteMany({
                where: {
                    sessionId: session.id,
                    OR: [{ fromStationId: stationId }, { toStationId: stationId }],
                },
            });
            await prisma.nriMetroShop.deleteMany({ where: { sessionId: session.id, stationId } });
            await prisma.nriMetroStation.delete({ where: { id: stationId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/metro station delete:', error);
            return sendApiError(res, 500, 'NRI_METRO_STATION_DEL_FAILED', 'Не удалось удалить станцию.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/metro/edges', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { lineId, fromStationId, toStationId, travelSeconds } = req.body;
        if (!lineId || !fromStationId || !toStationId) {
            return sendApiError(res, 400, 'NRI_METRO_EDGE', 'Укажите ветку и две станции.');
        }
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Метро правит только мастер.');
            }
            const edge = await prisma.nriMetroEdge.create({
                data: {
                    sessionId: session.id,
                    lineId,
                    fromStationId,
                    toStationId,
                    travelSeconds: typeof travelSeconds === 'number' && travelSeconds > 0
                        ? Math.min(3600, Math.floor(travelSeconds))
                        : null,
                },
            });
            res.status(201).json({
                edge: {
                    id: edge.id,
                    lineId: edge.lineId,
                    fromStationId: edge.fromStationId,
                    toStationId: edge.toStationId,
                    travelSeconds: edge.travelSeconds,
                },
            });
        }
        catch (error) {
            console.error('nri/metro edge post:', error);
            return sendApiError(res, 500, 'NRI_METRO_EDGE_FAILED', 'Не удалось создать ребро.');
        }
    });
    // —— Visit / ride ——
    app.post('/neon_v1/services/nri/:code/map/metro/enter', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { stationId } = req.body;
        if (typeof stationId !== 'string' || !stationId.trim()) {
            return sendApiError(res, 400, 'NRI_METRO_STATION', 'Укажите станцию.');
        }
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const access = await assertUnderhiveAccess(ctx, session, me);
            if (access !== true) {
                return sendApiError(res, 403, 'NRI_UNDERHIVE_LOCKED', access);
            }
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            const station = await prisma.nriMetroStation.findFirst({
                where: { id: stationId.trim(), sessionId: session.id },
            });
            if (!station)
                return sendApiError(res, 404, 'NRI_METRO_STATION_NOT_FOUND', 'Станция не найдена.');
            const edges = await prisma.nriMetroEdge.findMany({ where: { sessionId: session.id } });
            const neighbors = neighborStationIds(station.id, edges);
            await prisma.nriPlayerPosition.upsert({
                where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
                create: {
                    sessionId: session.id,
                    userId: me.id,
                    zoneKey: metroZoneKey(station.id),
                    x: station.x,
                    y: station.y,
                },
                update: {
                    zoneKey: metroZoneKey(station.id),
                    x: station.x,
                    y: station.y,
                    vehicleId: null,
                    vehicleOverload: false,
                },
            });
            const neighborStations = await prisma.nriMetroStation.findMany({
                where: { id: { in: neighbors }, sessionId: session.id },
            });
            res.json({
                ok: true,
                station: serializeStation(station),
                neighbors: neighborStations.map(serializeStation),
                zoneKey: metroZoneKey(station.id),
            });
        }
        catch (error) {
            console.error('nri/metro enter:', error);
            return sendApiError(res, 500, 'NRI_METRO_ENTER_FAILED', 'Не удалось спуститься на станцию.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/metro/ride', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { toStationId } = req.body;
        if (typeof toStationId !== 'string' || !toStationId.trim()) {
            return sendApiError(res, 400, 'NRI_METRO_DEST', 'Укажите станцию назначения.');
        }
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const access = await assertUnderhiveAccess(ctx, session, me);
            if (access !== true) {
                return sendApiError(res, 403, 'NRI_UNDERHIVE_LOCKED', access);
            }
            const pos = await prisma.nriPlayerPosition.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
            });
            const fromId = parseMetroStationId(pos?.zoneKey);
            if (!fromId) {
                return sendApiError(res, 400, 'NRI_METRO_NOT_ON_STATION', 'Сначала спуститесь на станцию.');
            }
            const [stations, edges] = await Promise.all([
                prisma.nriMetroStation.findMany({ where: { sessionId: session.id } }),
                prisma.nriMetroEdge.findMany({ where: { sessionId: session.id } }),
            ]);
            const metroStations = stations.map((s) => ({
                id: s.id,
                name: s.name,
                x: s.x,
                y: s.y,
                lineIds: [s.lineId, ...asStringArray(s.extraLineIds)],
                districtZoneKey: s.districtZoneKey,
            }));
            const path = findMetroPath(fromId, toStationId.trim(), metroStations, edges);
            if (!path.ok)
                return sendApiError(res, 400, 'NRI_METRO_NO_PATH', path.error);
            const dest = stations.find((s) => s.id === toStationId.trim());
            if (!dest)
                return sendApiError(res, 404, 'NRI_METRO_STATION_NOT_FOUND', 'Станция не найдена.');
            const startedAt = new Date();
            const arriveAt = new Date(startedAt.getTime() + path.totalSeconds * 1000);
            const ride = await prisma.nriMetroRide.create({
                data: {
                    sessionId: session.id,
                    userId: me.id,
                    fromStationId: fromId,
                    toStationId: dest.id,
                    pathJson: path.hops,
                    totalSeconds: path.totalSeconds,
                    startedAt,
                    arriveAt,
                },
            });
            // Immediate position update only when travel is 0; else client waits for complete/poll.
            if (path.totalSeconds <= 0) {
                await prisma.nriPlayerPosition.upsert({
                    where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
                    create: {
                        sessionId: session.id,
                        userId: me.id,
                        zoneKey: metroZoneKey(dest.id),
                        x: dest.x,
                        y: dest.y,
                    },
                    update: { zoneKey: metroZoneKey(dest.id), x: dest.x, y: dest.y },
                });
                await prisma.nriMetroRide.update({
                    where: { id: ride.id },
                    data: { completedAt: new Date() },
                });
            }
            res.status(201).json({
                ride: {
                    id: ride.id,
                    fromStationId: fromId,
                    toStationId: dest.id,
                    totalSeconds: path.totalSeconds,
                    startedAt: startedAt.getTime(),
                    arriveAt: arriveAt.getTime(),
                    hops: path.hops,
                },
            });
        }
        catch (error) {
            console.error('nri/metro ride:', error);
            return sendApiError(res, 500, 'NRI_METRO_RIDE_FAILED', 'Не удалось начать поездку.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/metro/ride/:rideId/complete', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const rideId = req.params.rideId;
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const ride = await prisma.nriMetroRide.findFirst({
                where: { id: rideId, sessionId: session.id, userId: me.id },
            });
            if (!ride)
                return sendApiError(res, 404, 'NRI_METRO_RIDE_NOT_FOUND', 'Поездка не найдена.');
            if (ride.completedAt) {
                return res.json({ ok: true, already: true, zoneKey: metroZoneKey(ride.toStationId) });
            }
            if (Date.now() < ride.arriveAt.getTime() - 500) {
                return sendApiError(res, 400, 'NRI_METRO_RIDE_EARLY', 'Поездка ещё не завершена.');
            }
            const dest = await prisma.nriMetroStation.findFirst({
                where: { id: ride.toStationId, sessionId: session.id },
            });
            if (!dest)
                return sendApiError(res, 404, 'NRI_METRO_STATION_NOT_FOUND', 'Станция не найдена.');
            await prisma.nriPlayerPosition.upsert({
                where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
                create: {
                    sessionId: session.id,
                    userId: me.id,
                    zoneKey: metroZoneKey(dest.id),
                    x: dest.x,
                    y: dest.y,
                },
                update: { zoneKey: metroZoneKey(dest.id), x: dest.x, y: dest.y },
            });
            await prisma.nriMetroRide.update({
                where: { id: ride.id },
                data: { completedAt: new Date() },
            });
            const edges = await prisma.nriMetroEdge.findMany({ where: { sessionId: session.id } });
            const neighbors = neighborStationIds(dest.id, edges);
            const neighborStations = await prisma.nriMetroStation.findMany({
                where: { id: { in: neighbors }, sessionId: session.id },
            });
            res.json({
                ok: true,
                station: serializeStation(dest),
                neighbors: neighborStations.map(serializeStation),
                zoneKey: metroZoneKey(dest.id),
            });
        }
        catch (error) {
            console.error('nri/metro ride complete:', error);
            return sendApiError(res, 500, 'NRI_METRO_RIDE_COMPLETE_FAILED', 'Не удалось завершить поездку.');
        }
    });
    app.get('/neon_v1/services/nri/:code/map/metro/ride/active', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const ride = await prisma.nriMetroRide.findFirst({
                where: { sessionId: session.id, userId: me.id, completedAt: null },
                orderBy: { startedAt: 'desc' },
            });
            if (!ride)
                return res.json({ ride: null });
            res.json({
                ride: {
                    id: ride.id,
                    fromStationId: ride.fromStationId,
                    toStationId: ride.toStationId,
                    totalSeconds: ride.totalSeconds,
                    startedAt: ride.startedAt.getTime(),
                    arriveAt: ride.arriveAt.getTime(),
                    remainingMs: Math.max(0, ride.arriveAt.getTime() - Date.now()),
                },
            });
        }
        catch (error) {
            console.error('nri/metro ride active:', error);
            return sendApiError(res, 500, 'NRI_METRO_RIDE_ACTIVE_FAILED', 'Не удалось проверить поездку.');
        }
    });
    // —— Shops ——
    app.post('/neon_v1/services/nri/:code/map/metro/shops', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { stationId, label, catalogIds } = req.body;
        if (typeof stationId !== 'string' || !stationId.trim()) {
            return sendApiError(res, 400, 'NRI_METRO_SHOP_STATION', 'Укажите станцию.');
        }
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Лавки ставит только мастер.');
            }
            const station = await prisma.nriMetroStation.findFirst({
                where: { id: stationId.trim(), sessionId: session.id },
            });
            if (!station)
                return sendApiError(res, 404, 'NRI_METRO_STATION_NOT_FOUND', 'Станция не найдена.');
            const ids = Array.isArray(catalogIds) && catalogIds.length
                ? catalogIds.filter((id) => typeof id === 'string').slice(0, 20)
                : [...DEFAULT_METRO_SHOP_CATALOG];
            const shop = await prisma.nriMetroShop.create({
                data: {
                    sessionId: session.id,
                    stationId: station.id,
                    label: typeof label === 'string' && label.trim() ? label.trim().slice(0, 80) : 'Лавка у станции',
                    catalogIds: ids,
                },
            });
            res.status(201).json({
                shop: {
                    id: shop.id,
                    stationId: shop.stationId,
                    label: shop.label,
                    catalogIds: asStringArray(shop.catalogIds),
                },
            });
        }
        catch (error) {
            console.error('nri/metro shop post:', error);
            return sendApiError(res, 500, 'NRI_METRO_SHOP_FAILED', 'Не удалось создать лавку.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/metro/shops/:shopId/buy', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const shopId = req.params.shopId;
        const { catalogId } = req.body;
        if (typeof catalogId !== 'string' || !catalogId.trim()) {
            return sendApiError(res, 400, 'NRI_METRO_BUY', 'Укажите товар.');
        }
        try {
            await ensureNriMapSchema(prisma);
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const access = await assertUnderhiveAccess(ctx, session, me);
            if (access !== true) {
                return sendApiError(res, 403, 'NRI_UNDERHIVE_LOCKED', access);
            }
            const shop = await prisma.nriMetroShop.findFirst({
                where: { id: shopId, sessionId: session.id },
            });
            if (!shop)
                return sendApiError(res, 404, 'NRI_METRO_SHOP_NOT_FOUND', 'Лавка не найдена.');
            const ids = asStringArray(shop.catalogIds);
            if (!ids.includes(catalogId.trim())) {
                return sendApiError(res, 400, 'NRI_METRO_BUY_ITEM', 'Этого товара нет в лавке.');
            }
            const pos = await prisma.nriPlayerPosition.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
            });
            const at = parseMetroStationId(pos?.zoneKey);
            if (at !== shop.stationId) {
                return sendApiError(res, 400, 'NRI_METRO_BUY_PLACE', 'Нужно быть на станции этой лавки.');
            }
            const cat = getServerCatalogItem(catalogId.trim());
            if (!cat)
                return sendApiError(res, 404, 'NRI_ITEM_NOT_FOUND', 'Предмет не найден в каталоге.');
            const item = catalogToServerInventoryItem(catalogId.trim());
            if (!item)
                return sendApiError(res, 500, 'NRI_ITEM_BUILD', 'Не удалось создать предмет.');
            const price = typeof cat.priceWonlongs === 'number' ? Math.max(0, cat.priceWonlongs) : 10;
            const player = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
            });
            if (!player)
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
            const funds = readWonlongs(player.sheet);
            if (funds < price) {
                return sendApiError(res, 400, 'NRI_METRO_BUY_FUNDS', `Нужно ${price} вонлонгов.`);
            }
            const inv = Array.isArray(player.inventory) ? player.inventory : [];
            const nextInv = mergeInventoryItem(inv, item);
            const nextSheet = writeWonlongs(player.sheet, funds - price);
            await prisma.nriPlayer.update({
                where: { id: player.id },
                data: {
                    inventory: nextInv,
                    sheet: nextSheet,
                },
            });
            res.json({ ok: true, item, price, wonlongs: funds - price });
        }
        catch (error) {
            console.error('nri/metro shop buy:', error);
            return sendApiError(res, 500, 'NRI_METRO_BUY_FAILED', 'Не удалось купить товар.');
        }
    });
}
//# sourceMappingURL=nriUnderhiveMetroRoutes.js.map
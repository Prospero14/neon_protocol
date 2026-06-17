/** Карта стола — zones, markers */
import { isNriMember } from './nriMemberDb.js';
import { listMapZones, ensureMapZonesSeeded, patchMapZone } from './nriMapZones.js';
import { ensureSessionLorePlacesFromMap, syncLorePlacesFromZonePatch, } from './nriLoreTravel.js';
export function mountNriMapRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
    function serializeMapMarker(m, ctx) {
        const isHostMarker = m.kind === 'host' || m.kind === 'pin' || m.ownerUserId === ctx.hostUserId;
        return {
            id: m.id,
            label: m.label,
            blurb: m.blurb,
            x: m.x,
            y: m.y,
            kind: isHostMarker ? 'host' : 'player',
            ownerUserId: m.ownerUserId ?? (isHostMarker ? ctx.hostUserId : null),
            ownerName: ctx.ownerName,
            createdAt: m.createdAt.getTime(),
        };
    }
    async function mapMarkerOwnerNames(sessionId, hostUserId) {
        const [players, members, host] = await Promise.all([
            prisma.nriPlayer.findMany({
                where: { sessionId },
                select: { userId: true, displayName: true },
            }),
            prisma.nriSessionMember.findMany({
                where: { sessionId },
                select: { userId: true, username: true },
            }),
            prisma.user.findUnique({ where: { id: hostUserId }, select: { username: true } }),
        ]);
        const byUser = new Map();
        for (const m of members)
            byUser.set(m.userId, m.username);
        for (const p of players)
            byUser.set(p.userId, p.displayName);
        const hostLabel = byUser.get(hostUserId) ?? host?.username ?? 'Мастер';
        byUser.set(hostUserId, hostLabel);
        return byUser;
    }
    async function canAccessMap(session, userId) {
        if (session.hostUserId === userId)
            return true;
        if (await isNriMember(prisma, session.id, userId))
            return true;
        const player = await prisma.nriPlayer.findUnique({
            where: { sessionId_userId: { sessionId: session.id, userId } },
        });
        return !!player;
    }
    app.get('/neon_v1/services/nri/:code/map/zones', async (req, res) => {
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
            const wasMember = await isNriMember(prisma, session.id, me.id);
            const allowed = session.status === 'open'
                ? await canAccessMap(session, me.id)
                : session.hostUserId === me.id || wasMember;
            if (!allowed) {
                return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Нет доступа к карте стола.');
            }
            const zones = await listMapZones(prisma);
            if (session.hostUserId === me.id) {
                await ensureSessionLorePlacesFromMap(prisma, session.id);
            }
            res.json({ zones, view: { w: 240, h: 165 } });
        }
        catch (error) {
            console.error('nri/map zones get:', error);
            return sendApiError(res, 500, 'NRI_MAP_ZONES_FAILED', 'Не удалось загрузить карту.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/map/zones/:zoneKey', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const zoneKey = req.params.zoneKey;
        const { name, corpName, pois, megaDistrict, color } = req.body;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Редактирует только мастер.');
            }
            await ensureMapZonesSeeded(prisma);
            const zone = await patchMapZone(prisma, zoneKey, { name, corpName, pois, megaDistrict, color });
            if (!zone)
                return sendApiError(res, 404, 'NRI_ZONE_NOT_FOUND', 'Район не найден.');
            await syncLorePlacesFromZonePatch(prisma, session.id, zone);
            res.json({ zone });
        }
        catch (error) {
            console.error('nri/map zone patch:', error);
            return sendApiError(res, 500, 'NRI_ZONE_PATCH_FAILED', 'Не удалось обновить район.');
        }
    });
    app.get('/neon_v1/services/nri/:code/map/markers', async (req, res) => {
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
            const wasMember = await isNriMember(prisma, session.id, me.id);
            const allowed = session.status === 'open'
                ? await canAccessMap(session, me.id)
                : session.hostUserId === me.id || wasMember;
            if (!allowed) {
                return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Нет доступа к карте стола.');
            }
            const markers = await prisma.nriMapMarker.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'asc' },
            });
            const ownerNames = await mapMarkerOwnerNames(session.id, session.hostUserId);
            res.json({
                markers: markers.map((m) => serializeMapMarker(m, {
                    hostUserId: session.hostUserId,
                    ownerName: m.ownerUserId
                        ? (ownerNames.get(m.ownerUserId) ?? null)
                        : ownerNames.get(session.hostUserId) ?? null,
                })),
            });
        }
        catch (error) {
            console.error('nri/map markers get:', error);
            return sendApiError(res, 500, 'NRI_MAP_GET_FAILED', 'Не удалось загрузить метки.');
        }
    });
    app.post('/neon_v1/services/nri/:code/map/markers', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { label, blurb, x, y, kind } = req.body;
        if (typeof label !== 'string' || !label.trim()) {
            return sendApiError(res, 400, 'NRI_MAP_LABEL', 'Укажите подпись метки.');
        }
        if (typeof x !== 'number' || typeof y !== 'number') {
            return sendApiError(res, 400, 'NRI_MAP_XY', 'Укажите координаты метки.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            if (!(await canAccessMap(session, me.id))) {
                return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Метки ставят только участники стола.');
            }
            const isHost = session.hostUserId === me.id;
            const markerKind = isHost ? 'host' : 'player';
            const marker = await prisma.nriMapMarker.create({
                data: {
                    sessionId: session.id,
                    ownerUserId: me.id,
                    label: label.trim().slice(0, 80),
                    blurb: typeof blurb === 'string' && blurb.trim() ? blurb.trim().slice(0, 500) : null,
                    x: Math.max(0, Math.min(100, x)),
                    y: Math.max(0, Math.min(100, y)),
                    kind: markerKind,
                },
            });
            const ownerNames = await mapMarkerOwnerNames(session.id, session.hostUserId);
            res.status(201).json({
                marker: serializeMapMarker(marker, {
                    hostUserId: session.hostUserId,
                    ownerName: ownerNames.get(me.id) ?? me.username,
                }),
            });
        }
        catch (error) {
            console.error('nri/map markers post:', error);
            return sendApiError(res, 500, 'NRI_MAP_CREATE_FAILED', 'Не удалось создать метку.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/map/markers/:markerId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const markerId = req.params.markerId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
            const existing = await prisma.nriMapMarker.findFirst({
                where: { id: markerId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_MAP_NOT_FOUND', 'Метка не найдена.');
            const isHost = await requireHost(session, auth, me);
            const ownsMarker = existing.ownerUserId === me.id;
            if (!isHost && !ownsMarker) {
                return sendApiError(res, 403, 'NRI_MAP_DELETE_FORBIDDEN', 'Удалить можно только свою метку.');
            }
            await prisma.nriMapMarker.delete({ where: { id: markerId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/map markers delete:', error);
            return sendApiError(res, 500, 'NRI_MAP_DELETE_FAILED', 'Не удалось удалить метку.');
        }
    });
}
//# sourceMappingURL=nriMapRoutes.js.map
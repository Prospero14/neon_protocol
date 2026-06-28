/** Карта стола — zones, markers */

import type { Express } from 'express';
import { isNriMember } from './nriMemberDb.js';
import { listMapZones, ensureMapZonesSeeded, patchMapZone, createMapSubZone, deleteMapSubZone } from './nriMapZones.js';
import {
  ensureSessionLorePlacesFromMap,
  syncLorePlacesFromZonePatch,
  ensureSessionFactionsFromCorpZones,
} from './nriLoreTravel.js';
import { ensureNriMapSchema, apiErrorHint } from './nriSchemaBootstrap.js';

const mapLoreSyncAt = new Map<string, number>();
const MAP_LORE_SYNC_COOLDOWN_MS = 5 * 60 * 1000;
let mapLoreSyncRunning = false;

function scheduleMapLoreSync(prisma: import('@prisma/client').PrismaClient, sessionId: string): void {
  const last = mapLoreSyncAt.get(sessionId) ?? 0;
  if (Date.now() - last < MAP_LORE_SYNC_COOLDOWN_MS || mapLoreSyncRunning) return;
  mapLoreSyncAt.set(sessionId, Date.now());
  setImmediate(() => {
    void (async () => {
      if (mapLoreSyncRunning) return;
      mapLoreSyncRunning = true;
      try {
        await ensureSessionLorePlacesFromMap(prisma, sessionId);
        await ensureSessionFactionsFromCorpZones(prisma, sessionId);
      } catch (syncErr) {
        console.error('nri/map lore sync:', syncErr);
      } finally {
        mapLoreSyncRunning = false;
      }
    })();
  });
}

export type NriRouteContext = {
  prisma: import('@prisma/client').PrismaClient;
  jwtAuth: (req: import('express').Request) => import('./auth.js').JwtAuth | null;
  sendApiError: import('./auth.js').ApiErrorSender;
  resolveUser: (auth: import('./auth.js').JwtAuth) => Promise<{ id: string; username: string } | null>;
  resolveSession: (code: string) => Promise<{
    id: string;
    hostUserId: string;
    chatRoomId: string;
    status: string;
    spamBotEnabled: boolean;
    spamPausedUntil: Date | null;
    inviteCode: string;
    host: { username: string };
  } | null>;
  requireHost: (
    session: { hostUserId: string },
    auth: import('./auth.js').JwtAuth,
    me: { username: string } | null,
  ) => Promise<boolean>;
};

export function mountNriMapRoutes(app: Express, ctx: NriRouteContext): void {
  const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;

  function serializeMapMarker(
    m: {
      id: string;
      label: string;
      blurb: string | null;
      x: number;
      y: number;
      kind: string;
      ownerUserId: string | null;
      createdAt: Date;
    },
    ctx: { hostUserId: string; ownerName: string | null }
  ) {
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

  async function mapMarkerOwnerNames(sessionId: string, hostUserId: string) {
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
    const byUser = new Map<string, string>();
    for (const m of members) byUser.set(m.userId, m.username);
    for (const p of players) byUser.set(p.userId, p.displayName);
    const hostLabel = byUser.get(hostUserId) ?? host?.username ?? 'Мастер';
    byUser.set(hostUserId, hostLabel);
    return byUser;
  }

  async function canAccessMap(
    session: { id: string; hostUserId: string; status: string },
    userId: string
  ): Promise<boolean> {
    if (session.hostUserId === userId) return true;
    if (await isNriMember(prisma, session.id, userId)) return true;
    const player = await prisma.nriPlayer.findUnique({
      where: { sessionId_userId: { sessionId: session.id, userId } },
    });
    return !!player;
  }

  app.get('/neon_v1/services/nri/:code/map/zones', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
      const wasMember = await isNriMember(prisma, session.id, me.id);
      const allowed =
        session.status === 'open'
          ? await canAccessMap(session, me.id)
          : session.hostUserId === me.id || wasMember;
      if (!allowed) {
        return sendApiError(res, 403, 'NRI_MAP_FORBIDDEN', 'Нет доступа к карте стола.');
      }
      await ensureNriMapSchema(prisma);
      const parentKey = String(req.query.parent ?? '').trim();
      const zones = await listMapZones(prisma, parentKey ? { parentZoneKey: parentKey } : undefined);
      res.json({ zones, view: { w: 240, h: 165 } });
      if (session.hostUserId === me.id && !parentKey) {
        scheduleMapLoreSync(prisma, session.id);
      }
    } catch (error) {
      console.error('nri/map zones get:', error);
      const hint = apiErrorHint(error);
      return sendApiError(res, 500, 'NRI_MAP_ZONES_FAILED', hint || 'Не удалось загрузить карту.');
    }
  });

  app.patch('/neon_v1/services/nri/:code/map/zones/:zoneKey', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const zoneKey = req.params.zoneKey;
    const { name, corpName, pois, megaDistrict, color, iconId, placeType, districtStyle, populationBand, densityLabel, trafficLevel, nightlifeLevel } = req.body as {
      name?: string;
      corpName?: string | null;
      megaDistrict?: string;
      pois?: string[];
      color?: string | null;
      iconId?: string | null;
      placeType?: string;
      districtStyle?: string | null;
      populationBand?: string | null;
      densityLabel?: string | null;
      trafficLevel?: number | null;
      nightlifeLevel?: number | null;
    };
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Редактирует только мастер.');
      }
      await ensureNriMapSchema(prisma);
      const zone = await patchMapZone(prisma, zoneKey, {
        name,
        corpName,
        pois,
        megaDistrict,
        color,
        iconId,
        placeType,
        districtStyle,
        populationBand,
        densityLabel,
        trafficLevel,
        nightlifeLevel,
      });
      if (!zone) return sendApiError(res, 404, 'NRI_ZONE_NOT_FOUND', 'Район не найден.');
      res.json({ zone });
      setImmediate(() => {
        void syncLorePlacesFromZonePatch(prisma, session.id, zone).catch((syncErr) => {
          console.error('nri/map zone lore sync:', syncErr);
        });
      });
    } catch (error) {
      console.error('nri/map zone patch:', error);
      return sendApiError(res, 500, 'NRI_ZONE_PATCH_FAILED', 'Не удалось обновить район.');
    }
  });

  app.post('/neon_v1/services/nri/:code/map/zones', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { parentZoneKey, name, zoneType, slug } = req.body as {
      parentZoneKey?: string;
      name?: string;
      zoneType?: string;
      slug?: string;
    };
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Создаёт только мастер.');
      }
      if (typeof parentZoneKey !== 'string' || !parentZoneKey.trim()) {
        return sendApiError(res, 400, 'NRI_ZONE_PARENT', 'Укажите parentZoneKey.');
      }
      if (typeof name !== 'string' || !name.trim()) {
        return sendApiError(res, 400, 'NRI_ZONE_NAME', 'Укажите название сабзоны.');
      }
      await ensureMapZonesSeeded(prisma);
      const result = await createMapSubZone(prisma, {
        parentZoneKey: parentZoneKey.trim(),
        name: name.trim(),
        zoneType,
        slug,
      });
      if ('error' in result) {
        const msg =
          result.error === 'PARENT_NOT_FOUND'
            ? 'Родительский район не найден.'
            : result.error === 'PARENT_NOT_DRILLABLE'
              ? 'В эту зону нельзя добавлять сабзоны.'
              : result.error === 'ZONE_EXISTS'
                ? 'Сабзона с таким ключом уже есть.'
                : 'Не удалось создать сабзону.';
        return sendApiError(res, 400, String(result.error), msg);
      }
      res.status(201).json({ zone: result.zone });
    } catch (error) {
      console.error('nri/map zone post:', error);
      return sendApiError(res, 500, 'NRI_ZONE_CREATE_FAILED', 'Не удалось создать сабзону.');
    }
  });

  app.delete('/neon_v1/services/nri/:code/map/zones/:zoneKey', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const zoneKey = String(req.params.zoneKey ?? '').trim();
    if (!zoneKey) {
      return sendApiError(res, 400, 'NRI_ZONE_KEY', 'Укажите zoneKey.');
    }
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Удаляет только мастер.');
      }
      const result = await deleteMapSubZone(prisma, zoneKey);
      if ('error' in result) {
        const msg =
          result.error === 'NOT_SUBZONE'
            ? 'Можно удалять только сабзоны.'
            : 'Не удалось удалить.';
        return sendApiError(res, 404, String(result.error), msg);
      }
      res.json({ ok: true, reset: result.reset, zone: result.zone ?? undefined });
    } catch (error) {
      console.error('nri/map zone delete:', error);
      return sendApiError(res, 500, 'NRI_ZONE_DELETE_FAILED', 'Не удалось удалить сабзону.');
    }
  });

  app.get('/neon_v1/services/nri/:code/map/markers', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
      const wasMember = await isNriMember(prisma, session.id, me.id);
      const allowed =
        session.status === 'open'
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
        markers: markers.map((m) =>
          serializeMapMarker(m, {
            hostUserId: session.hostUserId,
            ownerName: m.ownerUserId
              ? (ownerNames.get(m.ownerUserId) ?? null)
              : ownerNames.get(session.hostUserId) ?? null,
          })
        ),
      });
    } catch (error) {
      console.error('nri/map markers get:', error);
      return sendApiError(res, 500, 'NRI_MAP_GET_FAILED', 'Не удалось загрузить метки.');
    }
  });

  app.post('/neon_v1/services/nri/:code/map/markers', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { label, blurb, x, y, kind } = req.body as {
      label?: string;
      blurb?: string;
      x?: number;
      y?: number;
      kind?: string;
    };
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
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
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
    } catch (error) {
      console.error('nri/map markers post:', error);
      return sendApiError(res, 500, 'NRI_MAP_CREATE_FAILED', 'Не удалось создать метку.');
    }
  });

  app.delete('/neon_v1/services/nri/:code/map/markers/:markerId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const markerId = req.params.markerId;
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
      const existing = await prisma.nriMapMarker.findFirst({
        where: { id: markerId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_MAP_NOT_FOUND', 'Метка не найдена.');
      const isHost = await requireHost(session, auth, me);
      const ownsMarker = existing.ownerUserId === me.id;
      if (!isHost && !ownsMarker) {
        return sendApiError(res, 403, 'NRI_MAP_DELETE_FORBIDDEN', 'Удалить можно только свою метку.');
      }
      await prisma.nriMapMarker.delete({ where: { id: markerId } });
      res.json({ ok: true });
    } catch (error) {
      console.error('nri/map markers delete:', error);
      return sendApiError(res, 500, 'NRI_MAP_DELETE_FAILED', 'Не удалось удалить метку.');
    }
  });
}

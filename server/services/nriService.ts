import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { ApiErrorSender, JwtAuth } from './auth.js';
import { isAdminUsername } from './auth.js';
import { isNriMember, listNriMembers, purgeNriSessionData, touchNriMember } from './nriMemberDb.js';
import { startNriSpamBot, stopNriSpamBot } from './nriSpamBot.js';
import { isSpamPaused } from './nriWallet.js';
import { mountNriLoreTravelRoutes, propagatePlaceUpdate } from './nriLoreTravel.js';
import { mountNriItemTransferRoutes } from './nriItemTransfer.js';
import { mountNriCombatantRoutes } from './nriCombatantRoutes.js';
import { mountNriIceWalletRoutes } from './nriIceWalletRoutes.js';
import { mountNriPlayerRoutes } from './nriPlayerRoutes.js';
import { mountNriPresetRoutes } from './nriPresetRoutes.js';
import { mountNriMapRoutes } from './nriMapRoutes.js';
import { mountNriVaultRoutes } from './nriVaultRoutes.js';
import { mountNriNpcRoutes } from './nriNpcRoutes.js';
import { mountNriCyberRoutes } from './nriCyberRoutes.js';
import { parseNriJsonField, requireNriHost, resolveNriSession } from './nriSessionHelpers.js';
import { parseRequestBody } from '../../shared/api-schemas/parseBody.js';
import { nriCreateSessionSchema, nriJoinSchema } from '../../shared/api-schemas/nri.js';

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genInviteCode(): string {
  let tail = '';
  for (let i = 0; i < 4; i++) {
    tail += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return `NRI-${tail}`;
}


export type NriServiceDeps = {
  prisma: PrismaClient;
  jwtAuth: (req: import('express').Request) => JwtAuth | null;
  sendApiError: ApiErrorSender;
};

/** Микросервис столов НРИ: создание, вход по коду, лобби. */
export function mountNriService(app: Express, deps: NriServiceDeps) {
  const { prisma, jwtAuth, sendApiError } = deps;

  async function resolveUser(auth: JwtAuth) {
    return prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, username: true },
    });
  }

  const resolveSession = (code: string) => resolveNriSession(prisma, code);
  const requireHost = requireNriHost;
  const parseJsonField = parseNriJsonField;

  const nriCtx = {
    prisma,
    jwtAuth,
    sendApiError,
    resolveUser,
    resolveSession: (code: string) => resolveNriSession(prisma, code),
    requireHost: requireNriHost,
  };
  mountNriIceWalletRoutes(app, nriCtx);
  mountNriPlayerRoutes(app, nriCtx);
  mountNriPresetRoutes(app, nriCtx);
  mountNriMapRoutes(app, nriCtx);
  mountNriVaultRoutes(app, nriCtx);
  mountNriNpcRoutes(app, nriCtx);
  mountNriCyberRoutes(app, nriCtx);


  app.get('/neon_v1/services/nri/:code/info', async (req, res) => {
    const code = String(req.params.code ?? '').trim().toUpperCase();
    if (!code) return sendApiError(res, 400, 'NRI_CODE_REQUIRED', 'Укажите код стола.');
    try {
      const session = await prisma.nriSession.findUnique({
        where: { inviteCode: code },
        include: { host: { select: { username: true } } },
      });
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или уже закрыт.');
      }
      res.json({
        inviteCode: session.inviteCode,
        title: session.title,
        hostUsername: session.host.username,
        status: session.status,
      });
    } catch (error) {
      console.error('nri/info:', error);
      return sendApiError(res, 500, 'NRI_INFO_FAILED', 'Не удалось загрузить стол.');
    }
  });

  app.post('/neon_v1/services/nri/create', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const parsed = parseRequestBody(nriCreateSessionSchema, req.body);
    if (!parsed.ok) return sendApiError(res, 400, 'NRI_CREATE_INVALID', parsed.message);
    const sessionTitle = parsed.data.title?.trim() ? parsed.data.title.trim().slice(0, 80) : 'НРИ-сессия';
    try {
      const me = await resolveUser(auth);
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');

      let inviteCode = genInviteCode();
      for (let attempt = 0; attempt < 8; attempt++) {
        const exists = await prisma.nriSession.findUnique({ where: { inviteCode } });
        if (!exists) break;
        inviteCode = genInviteCode();
      }

      const room = await prisma.chatRoom.create({
        data: { kind: 'nri', slug: inviteCode },
      });
      const session = await prisma.nriSession.create({
        data: {
          inviteCode,
          hostUserId: me.id,
          title: sessionTitle,
          chatRoomId: room.id,
        },
        include: { host: { select: { username: true } } },
      });

      await touchNriMember(prisma, session.id, me.id, me.username, true);

      res.status(201).json({
        session: {
          id: session.id,
          inviteCode: session.inviteCode,
          title: session.title,
          hostUsername: session.host.username,
          chatRoomId: session.chatRoomId,
          status: session.status,
          spamBotEnabled: session.spamBotEnabled,
        },
      });
    } catch (error) {
      console.error('nri/create:', error);
      return sendApiError(res, 500, 'NRI_CREATE_FAILED', 'Не удалось создать стол.');
    }
  });

  app.post('/neon_v1/services/nri/:code/join', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const bodyParsed = parseRequestBody(nriJoinSchema, req.body);
    if (!bodyParsed.ok) return sendApiError(res, 400, 'NRI_JOIN_INVALID', bodyParsed.message);
    const code = String(req.params.code ?? '').trim().toUpperCase();
    if (!code) return sendApiError(res, 400, 'NRI_CODE_REQUIRED', 'Укажите код стола.');
    try {
      const me = await resolveUser(auth);
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
      const session = await prisma.nriSession.findUnique({
        where: { inviteCode: code },
        include: { host: { select: { username: true } } },
      });
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или уже закрыт.');
      }
      const isHost = session.hostUserId === me.id;
      await touchNriMember(prisma, session.id, me.id, me.username, isHost);
      const members = await listNriMembers(prisma, session.id);
      res.json({
        session: {
          id: session.id,
          inviteCode: session.inviteCode,
          title: session.title,
          hostUsername: session.host.username,
          chatRoomId: session.chatRoomId,
          status: session.status,
          isHost,
          isAdmin: isAdminUsername(me.username),
          ...sessionExtras(session),
        },
        members,
      });
    } catch (error) {
      console.error('nri/join:', error);
      return sendApiError(res, 500, 'NRI_JOIN_FAILED', 'Не удалось войти за стол.');
    }
  });

  app.get('/neon_v1/services/nri/:code/state', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    if (!code) return sendApiError(res, 400, 'NRI_CODE_REQUIRED', 'Укажите код стола.');
    try {
      const me = await resolveUser(auth);
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
      const session = await prisma.nriSession.findUnique({
        where: { inviteCode: code },
        include: { host: { select: { username: true } } },
      });
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const isHost = session.hostUserId === me.id;
      const wasMember = await isNriMember(prisma, session.id, me.id);
      if (session.status === 'open' || isHost || wasMember) {
        await touchNriMember(prisma, session.id, me.id, me.username, isHost);
      }
      const members = await listNriMembers(prisma, session.id);
      res.json({
        session: {
          id: session.id,
          inviteCode: session.inviteCode,
          title: session.title,
          hostUsername: session.host.username,
          chatRoomId: session.chatRoomId,
          status: session.status,
          isHost,
          isAdmin: isAdminUsername(me.username),
          ...sessionExtras(session),
        },
        members,
      });
    } catch (error) {
      console.error('nri/state:', error);
      return sendApiError(res, 500, 'NRI_STATE_FAILED', 'Не удалось обновить лобби.');
    }
  });

  app.post('/neon_v1/services/nri/:code/close', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await prisma.nriSession.findUnique({ where: { inviteCode: code } });
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      const platformAdmin = me ? isAdminUsername(me.username) : false;
      if (session.hostUserId !== auth.userId && !platformAdmin) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Закрыть стол может только мастер.');
      }
      await prisma.nriSession.update({
        where: { id: session.id },
        data: { status: 'closed', spamBotEnabled: false },
      });
      stopNriSpamBot(code);
      await purgeNriSessionData(prisma, session);
      res.json({ ok: true });
    } catch (error) {
      console.error('nri/close:', error);
      return sendApiError(res, 500, 'NRI_CLOSE_FAILED', 'Не удалось закрыть стол.');
    }
  });


  function sessionExtras(session: { spamBotEnabled: boolean; spamPausedUntil?: Date | null }) {
    const pausedUntil = session.spamPausedUntil?.getTime() ?? null;
    return {
      spamBotEnabled: session.spamBotEnabled,
      spamPausedUntil: pausedUntil,
      spamPausedActive: isSpamPaused(session.spamPausedUntil),
    };
  }

  app.post('/neon_v1/services/nri/:code/spam-bot', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { enabled } = req.body as { enabled?: boolean };
    if (typeof enabled !== 'boolean') {
      return sendApiError(res, 400, 'NRI_SPAM_FLAG_REQUIRED', 'Укажите enabled: true|false.');
    }
    try {
      const session = await prisma.nriSession.findUnique({ where: { inviteCode: code } });
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      if (session.status !== 'open') {
        return sendApiError(res, 400, 'NRI_TABLE_CLOSED', 'Стол уже закрыт.');
      }
      const me = await resolveUser(auth);
      const platformAdmin = me ? isAdminUsername(me.username) : false;
      if (session.hostUserId !== auth.userId && !platformAdmin) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'SPAM-бота включает только мастер стола.');
      }
      const updated = await prisma.nriSession.update({
        where: { id: session.id },
        data: { spamBotEnabled: enabled },
      });
      if (enabled) {
        await startNriSpamBot(prisma, code, session.chatRoomId);
      } else {
        stopNriSpamBot(code);
      }
      res.json({ ok: true, spamBotEnabled: updated.spamBotEnabled });
    } catch (error) {
      console.error('nri/spam-bot:', error);
      return sendApiError(res, 500, 'NRI_SPAM_BOT_FAILED', 'Не удалось переключить SPAM-бота.');
    }
  });


  app.get('/neon_v1/services/nri/:code/vehicles', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const rows = await prisma.nriSessionVehicle.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
      });
      const players = await prisma.nriPlayer.findMany({
        where: { sessionId: session.id },
        select: { userId: true, displayName: true, classId: true, sheet: true },
      });
      const playerByUser = new Map(players.map((p) => [p.userId, p]));
      res.json({
        vehicles: rows.map((v) => {
          const owner = v.assignedUserId ? playerByUser.get(v.assignedUserId) : null;
          return {
            id: v.id,
            catalogId: v.catalogId,
            label: v.label,
            assignedUserId: v.assignedUserId,
            assignedDisplayName: owner?.displayName ?? null,
            ownerClassId: owner?.classId ?? null,
            ownerSheet: owner?.sheet ?? null,
            notes: v.notes,
            createdAt: v.createdAt.getTime(),
          };
        }),
      });
    } catch (error) {
      console.error('nri/vehicles get:', error);
      return sendApiError(res, 500, 'NRI_VEHICLES_GET_FAILED', 'Не удалось загрузить транспорт.');
    }
  });

  app.post('/neon_v1/services/nri/:code/vehicles', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { catalogId, label, notes, assignedUserId } = req.body as {
      catalogId?: string;
      label?: string;
      notes?: string;
      assignedUserId?: string | null;
    };
    if (typeof catalogId !== 'string' || !catalogId.trim()) {
      return sendApiError(res, 400, 'NRI_VEHICLE_CATALOG', 'Укажите тип транспорта.');
    }
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Транспорт добавляет только мастер.');
      }
      const vehicle = await prisma.nriSessionVehicle.create({
        data: {
          sessionId: session.id,
          catalogId: catalogId.trim(),
          label: typeof label === 'string' && label.trim() ? label.trim().slice(0, 60) : null,
          notes: typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 200) : null,
          assignedUserId:
            typeof assignedUserId === 'string' && assignedUserId.trim() ? assignedUserId.trim() : null,
        },
      });
      res.status(201).json({
        vehicle: {
          id: vehicle.id,
          catalogId: vehicle.catalogId,
          label: vehicle.label,
          assignedUserId: vehicle.assignedUserId,
          notes: vehicle.notes,
          createdAt: vehicle.createdAt.getTime(),
        },
      });
    } catch (error) {
      console.error('nri/vehicles post:', error);
      return sendApiError(res, 500, 'NRI_VEHICLE_CREATE_FAILED', 'Не удалось добавить транспорт.');
    }
  });

  app.patch('/neon_v1/services/nri/:code/vehicles/:vehicleId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const vehicleId = req.params.vehicleId;
    const { label, notes, assignedUserId } = req.body as {
      label?: string | null;
      notes?: string | null;
      assignedUserId?: string | null;
    };
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Транспорт редактирует только мастер.');
      }
      const existing = await prisma.nriSessionVehicle.findFirst({
        where: { id: vehicleId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_VEHICLE_NOT_FOUND', 'Транспорт не найден.');
      const vehicle = await prisma.nriSessionVehicle.update({
        where: { id: vehicleId },
        data: {
          ...(label !== undefined ? { label: label && String(label).trim() ? String(label).trim().slice(0, 60) : null } : {}),
          ...(notes !== undefined ? { notes: notes && String(notes).trim() ? String(notes).trim().slice(0, 200) : null } : {}),
          ...(assignedUserId !== undefined
            ? {
                assignedUserId:
                  assignedUserId && String(assignedUserId).trim() ? String(assignedUserId).trim() : null,
              }
            : {}),
        },
      });
      res.json({
        vehicle: {
          id: vehicle.id,
          catalogId: vehicle.catalogId,
          label: vehicle.label,
          assignedUserId: vehicle.assignedUserId,
          notes: vehicle.notes,
          createdAt: vehicle.createdAt.getTime(),
        },
      });
    } catch (error) {
      console.error('nri/vehicles patch:', error);
      return sendApiError(res, 500, 'NRI_VEHICLE_UPDATE_FAILED', 'Не удалось обновить транспорт.');
    }
  });

  app.delete('/neon_v1/services/nri/:code/vehicles/:vehicleId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const vehicleId = req.params.vehicleId;
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Транспорт удаляет только мастер.');
      }
      const existing = await prisma.nriSessionVehicle.findFirst({
        where: { id: vehicleId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_VEHICLE_NOT_FOUND', 'Транспорт не найден.');
      await prisma.nriSessionVehicle.delete({ where: { id: vehicleId } });
      res.json({ ok: true });
    } catch (error) {
      console.error('nri/vehicles delete:', error);
      return sendApiError(res, 500, 'NRI_VEHICLE_DELETE_FAILED', 'Не удалось удалить транспорт.');
    }
  });

  app.get('/neon_v1/services/nri/:code/scenario', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
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
      const zoneKeys = positions.map((p) => p.zoneKey).filter(Boolean) as string[];
      const completedIds = Array.isArray(progress?.completedNodeIds)
        ? (progress!.completedNodeIds as unknown[]).filter((x): x is string => typeof x === 'string')
        : [];
      res.json({
        nodes: nodes.map((n) => {
          const base = serializeScenarioNode(n);
          const links = (base.links ?? {}) as Record<string, unknown>;
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
    } catch (error) {
      console.error('nri/scenario get:', error);
      return sendApiError(res, 500, 'NRI_SCENARIO_GET_FAILED', 'Не удалось загрузить сценарий.');
    }
  });

  app.post('/neon_v1/services/nri/:code/scenario', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { parentId, title, body, links, sortOrder } = req.body as {
      parentId?: string | null;
      title?: string;
      body?: string;
      links?: unknown;
      sortOrder?: number;
    };
    if (typeof title !== 'string' || !title.trim()) {
      return sendApiError(res, 400, 'NRI_SCENARIO_TITLE', 'Укажите название узла.');
    }
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Сценарий редактирует только мастер.');
      }
      const pid = typeof parentId === 'string' && parentId.trim() ? parentId.trim() : null;
      if (pid) {
        const parent = await prisma.nriScenarioNode.findFirst({
          where: { id: pid, sessionId: session.id },
        });
        if (!parent) return sendApiError(res, 404, 'NRI_SCENARIO_PARENT', 'Родительский узел не найден.');
      } else {
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
          title: title.trim().slice(0, 120),
          body: typeof body === 'string' ? body.slice(0, 20000) : '',
          sortOrder: typeof sortOrder === 'number' && Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0,
          links: links && typeof links === 'object' ? (links as object) : {},
        },
      });
      res.status(201).json({ node: serializeScenarioNode(node) });
    } catch (error) {
      console.error('nri/scenario post:', error);
      return sendApiError(res, 500, 'NRI_SCENARIO_CREATE_FAILED', 'Не удалось создать узел.');
    }
  });

  app.patch('/neon_v1/services/nri/:code/scenario/:nodeId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const nodeId = req.params.nodeId;
    const { title, body, links, sortOrder, parentId } = req.body as {
      title?: string;
      body?: string;
      links?: unknown;
      sortOrder?: number;
      parentId?: string | null;
    };
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Сценарий редактирует только мастер.');
      }
      const existing = await prisma.nriScenarioNode.findFirst({
        where: { id: nodeId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_SCENARIO_NOT_FOUND', 'Узел не найден.');
      let nextParentId: string | null | undefined = undefined;
      if (parentId !== undefined) {
        if (parentId === null) {
          const otherRoot = await prisma.nriScenarioNode.findFirst({
            where: { sessionId: session.id, parentId: null, NOT: { id: nodeId } },
          });
          if (otherRoot) {
            return sendApiError(res, 400, 'NRI_SCENARIO_ROOT', 'Основной сценарий уже существует.');
          }
          nextParentId = null;
        } else if (typeof parentId === 'string' && parentId.trim()) {
          if (parentId.trim() === nodeId) {
            return sendApiError(res, 400, 'NRI_SCENARIO_CYCLE', 'Узел не может быть родителем сам себе.');
          }
          const parent = await prisma.nriScenarioNode.findFirst({
            where: { id: parentId.trim(), sessionId: session.id },
          });
          if (!parent) return sendApiError(res, 404, 'NRI_SCENARIO_PARENT', 'Родитель не найден.');
          nextParentId = parent.id;
        }
      }
      let mergedLinks =
        links !== undefined && typeof links === 'object' ? ({ ...(links as object) } as Record<string, unknown>) : null;
      if (mergedLinks?.syncToLore === true) {
        const placeTitle =
          (typeof mergedLinks.placeTitle === 'string' && mergedLinks.placeTitle.trim()) ||
          (typeof title === 'string' && title.trim()) ||
          existing.title;
        const lorePlaceId =
          typeof mergedLinks.lorePlaceId === 'string' ? mergedLinks.lorePlaceId : null;
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
        } else {
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
          ...(typeof title === 'string' && title.trim() ? { title: title.trim().slice(0, 120) } : {}),
          ...(typeof body === 'string' ? { body: body.slice(0, 20000) } : {}),
          ...(mergedLinks ? { links: mergedLinks as object } : links !== undefined && typeof links === 'object' ? { links: links as object } : {}),
          ...(typeof sortOrder === 'number' && Number.isFinite(sortOrder)
            ? { sortOrder: Math.floor(sortOrder) }
            : {}),
          ...(nextParentId !== undefined ? { parentId: nextParentId } : {}),
        },
      });
      res.json({ node: serializeScenarioNode(updated) });
    } catch (error) {
      console.error('nri/scenario patch:', error);
      return sendApiError(res, 500, 'NRI_SCENARIO_PATCH_FAILED', 'Не удалось обновить узел.');
    }
  });

  app.delete('/neon_v1/services/nri/:code/scenario/:nodeId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const nodeId = req.params.nodeId;
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Сценарий редактирует только мастер.');
      }
      const existing = await prisma.nriScenarioNode.findFirst({
        where: { id: nodeId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_SCENARIO_NOT_FOUND', 'Узел не найден.');
      await prisma.nriScenarioNode.delete({ where: { id: nodeId } });
      res.json({ ok: true });
    } catch (error) {
      console.error('nri/scenario delete:', error);
      return sendApiError(res, 500, 'NRI_SCENARIO_DELETE_FAILED', 'Не удалось удалить узел.');
    }
  });





  function serializeScenarioNode(n: {
    id: string;
    parentId: string | null;
    title: string;
    body: string;
    sortOrder: number;
    links: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: n.id,
      parentId: n.parentId,
      title: n.title,
      body: n.body,
      sortOrder: n.sortOrder,
      links: n.links ?? {},
      createdAt: n.createdAt.getTime(),
      updatedAt: n.updatedAt.getTime(),
    };
  }










  mountNriCombatantRoutes(app, {
    prisma,
    jwtAuth,
    sendApiError,
    resolveSession,
    resolveUser,
    requireHost,
    parseJsonField,
  });






  mountNriLoreTravelRoutes(app, {
    prisma,
    jwtAuth,
    sendApiError,
    resolveSession,
    resolveUser,
    requireHost,
  });

  mountNriItemTransferRoutes(app, {
    prisma,
    jwtAuth,
    sendApiError,
    resolveSession,
    resolveUser,
  });
}

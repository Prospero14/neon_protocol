import type { Express } from 'express';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import type { ApiErrorSender, JwtAuth } from './auth.js';
import { isAdminUsername } from './auth.js';
import { isNriMember, listNriMembers, purgeNriSessionData, touchNriMember } from './nriMemberDb.js';
import { startNriSpamBot, stopNriSpamBot } from './nriSpamBot.js';
import { tryInstallCyberItem } from './nriCyberInstall.js';
import { mergeInventoryItem, takeOneCatalogItem, type InvItem } from './nriItemGrant.js';
import { catalogToServerInventoryItem } from './nriItemCatalogServer.js';
import { isSpamPaused, readWonlongs, writeWonlongs } from './nriWallet.js';
import { maybeAutoClearIceBan } from './nriIceBan.js';
import { listMapZones, ensureMapZonesSeeded, patchMapZone } from './nriMapZones.js';
import { mountNriLoreTravelRoutes, propagatePlaceUpdate } from './nriLoreTravel.js';
import { mountNriItemTransferRoutes } from './nriItemTransfer.js';
import { mountNriCombatantRoutes } from './nriCombatantRoutes.js';
import { mountNriIceWalletRoutes } from './nriIceWalletRoutes.js';
import { mountNriPlayerRoutes } from './nriPlayerRoutes.js';
import { mountNriPresetRoutes } from './nriPresetRoutes.js';
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



  function serializeVaultFile(f: {
    id: string;
    title: string;
    body: string;
    protected: boolean;
    passwordHash?: string | null;
    iceRewardCode?: string | null;
    gameId: string | null;
    difficulty: string | null;
    createdAt: Date;
  }) {
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

  function vaultIsDualReward(file: { passwordHash: string | null; gameId: string | null; iceRewardCode?: string | null }) {
    return !!file.passwordHash && !!file.gameId && !!file.iceRewardCode;
  }

  async function vaultBypassUnlock(
    file: { id: string; sessionId: string | null; createdById: string },
    userId: string
  ): Promise<boolean> {
    if (file.createdById === userId) return true;
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    if (me && isAdminUsername(me.username)) return true;
    if (!file.sessionId) return false;
    const session = await prisma.nriSession.findUnique({
      where: { id: file.sessionId },
      select: { hostUserId: true },
    });
    return session?.hostUserId === userId;
  }

  type VaultCreateInput = {
    title?: string;
    body?: string;
    protected?: boolean;
    isProtected?: boolean;
    password?: string;
    gameId?: string;
    difficulty?: string;
    usePassword?: boolean;
    useIce?: boolean;
  };

  async function parseVaultCreatePayload(body: VaultCreateInput) {
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
          passwordHash: null as string | null,
          iceRewardCode: null as string | null,
          gameId: null as string | null,
          difficulty: null as string | null,
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


  function serializeNpc(n: {
    id: string;
    name: string;
    classId: string | null;
    imageUrl: string | null;
    inventory: unknown;
    sheet: unknown;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
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
      const zones = await listMapZones(prisma);
      res.json({ zones, view: { w: 240, h: 165 } });
    } catch (error) {
      console.error('nri/map zones get:', error);
      return sendApiError(res, 500, 'NRI_MAP_ZONES_FAILED', 'Не удалось загрузить карту.');
    }
  });

  app.patch('/neon_v1/services/nri/:code/map/zones/:zoneKey', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const zoneKey = req.params.zoneKey;
    const { name, corpName, pois, megaDistrict, color } = req.body as {
      name?: string;
      corpName?: string | null;
      megaDistrict?: string;
      pois?: string[];
      color?: string | null;
    };
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Редактирует только мастер.');
      }
      await ensureMapZonesSeeded(prisma);
      const zone = await patchMapZone(prisma, zoneKey, { name, corpName, pois, megaDistrict, color });
      if (!zone) return sendApiError(res, 404, 'NRI_ZONE_NOT_FOUND', 'Район не найден.');
      res.json({ zone });
    } catch (error) {
      console.error('nri/map zone patch:', error);
      return sendApiError(res, 500, 'NRI_ZONE_PATCH_FAILED', 'Не удалось обновить район.');
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

  app.get('/neon_v1/services/nri/:code/vault', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
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
    } catch (error) {
      console.error('nri/vault get:', error);
      return sendApiError(res, 500, 'NRI_VAULT_GET_FAILED', 'Не удалось загрузить файлы.');
    }
  });

  app.post('/neon_v1/services/nri/:code/vault', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { title, body, protected: protectedAlias, isProtected, gameId, difficulty, password, usePassword, useIce } = req.body as VaultCreateInput;
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
    } catch (error) {
      console.error('nri/vault post:', error);
      return sendApiError(res, 500, 'NRI_VAULT_CREATE_FAILED', 'Не удалось создать файл.');
    }
  });


  app.get('/neon_v1/services/nri/:code/npcs', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'НПС доступны только мастеру.');
      }
      const npcs = await prisma.nriNpc.findMany({
        where: { sessionId: session.id },
        orderBy: { name: 'asc' },
      });
      res.json({ npcs: npcs.map(serializeNpc) });
    } catch (error) {
      console.error('nri/npcs get:', error);
      return sendApiError(res, 500, 'NRI_NPCS_GET_FAILED', 'Не удалось загрузить НПС.');
    }
  });

  app.post('/neon_v1/services/nri/:code/npcs', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { name, classId, imageUrl, inventory, sheet, notes } = req.body as {
      name?: string;
      classId?: string;
      imageUrl?: string;
      inventory?: unknown;
      sheet?: unknown;
      notes?: string;
    };
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
          sheet: parseJsonField(sheet) ?? undefined,
          notes: typeof notes === 'string' ? notes.slice(0, 2000) : null,
        },
      });
      res.status(201).json({ npc: serializeNpc(npc) });
    } catch (error) {
      console.error('nri/npcs post:', error);
      return sendApiError(res, 500, 'NRI_NPC_CREATE_FAILED', 'Не удалось создать НПС.');
    }
  });

  app.patch('/neon_v1/services/nri/:code/npcs/:npcId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const npcId = req.params.npcId;
    const { name, classId, imageUrl, inventory, sheet, notes } = req.body as {
      name?: string;
      classId?: string | null;
      imageUrl?: string | null;
      inventory?: unknown;
      sheet?: unknown;
      notes?: string | null;
    };
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Редактирует только мастер.');
      }
      const existing = await prisma.nriNpc.findFirst({ where: { id: npcId, sessionId: session.id } });
      if (!existing) return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
      const npc = await prisma.nriNpc.update({
        where: { id: npcId },
        data: {
          ...(typeof name === 'string' && name.trim() ? { name: name.trim().slice(0, 60) } : {}),
          ...(classId !== undefined
            ? { classId: typeof classId === 'string' && classId.trim() ? classId.trim() : null }
            : {}),
          ...(imageUrl !== undefined
            ? {
                imageUrl:
                  typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim().slice(0, 2000) : null,
              }
            : {}),
          ...(inventory !== undefined ? { inventory: Array.isArray(inventory) ? inventory : [] } : {}),
          ...(sheet !== undefined ? { sheet: parseJsonField(sheet) ?? undefined } : {}),
          ...(notes !== undefined ? { notes: typeof notes === 'string' ? notes.slice(0, 2000) : null } : {}),
        },
      });
      res.json({ npc: serializeNpc(npc) });
    } catch (error) {
      console.error('nri/npcs patch:', error);
      return sendApiError(res, 500, 'NRI_NPC_UPDATE_FAILED', 'Не удалось обновить НПС.');
    }
  });

  app.delete('/neon_v1/services/nri/:code/npcs/:npcId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const npcId = req.params.npcId;
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Удаляет только мастер.');
      }
      const existing = await prisma.nriNpc.findFirst({ where: { id: npcId, sessionId: session.id } });
      if (!existing) return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
      await prisma.nriNpc.delete({ where: { id: npcId } });
      res.json({ ok: true });
    } catch (error) {
      console.error('nri/npcs delete:', error);
      return sendApiError(res, 500, 'NRI_NPC_DELETE_FAILED', 'Не удалось удалить НПС.');
    }
  });

  mountNriCombatantRoutes(app, {
    prisma,
    jwtAuth,
    sendApiError,
    resolveSession,
    resolveUser,
    requireHost,
    parseJsonField,
  });

  function serializeCyberProduct(row: {
    id: string;
    name: string;
    slot: string;
    blueprint: unknown;
    build: unknown;
    priceWonlongs: number;
    inShop: boolean;
    vendorNpcId: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      name: row.name,
      slot: row.slot,
      blueprint: row.blueprint ?? null,
      build: row.build ?? null,
      priceWonlongs: row.priceWonlongs,
      inShop: row.inShop,
      vendorNpcId: row.vendorNpcId,
      createdAt: row.createdAt.getTime(),
    };
  }

  app.get('/neon_v1/services/nri/:code/cyber', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Киберимпланты доступны мастеру.');
      }
      const products = await prisma.nriCyberProduct.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ products: products.map(serializeCyberProduct) });
    } catch (error) {
      console.error('nri/cyber get:', error);
      return sendApiError(res, 500, 'NRI_CYBER_GET_FAILED', 'Не удалось загрузить киберимпланты.');
    }
  });

  app.post('/neon_v1/services/nri/:code/cyber', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { name, slot, blueprint, build, priceWonlongs, inShop } = req.body as {
      name?: string;
      slot?: string;
      blueprint?: unknown;
      build?: unknown;
      priceWonlongs?: number;
      inShop?: boolean;
    };
    if (typeof name !== 'string' || !name.trim()) {
      return sendApiError(res, 400, 'NRI_CYBER_NAME', 'Укажите название импланта.');
    }
    if (typeof slot !== 'string' || !slot.trim()) {
      return sendApiError(res, 400, 'NRI_CYBER_SLOT', 'Укажите слот.');
    }
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Создаёт только мастер.');
      }
      const product = await prisma.nriCyberProduct.create({
        data: {
          sessionId: session.id,
          name: name.trim().slice(0, 80),
          slot: slot.trim(),
          blueprint: parseJsonField(blueprint) ?? {},
          build: parseJsonField(build) ?? {},
          priceWonlongs: typeof priceWonlongs === 'number' ? Math.max(0, Math.round(priceWonlongs)) : 0,
          inShop: inShop === true,
        },
      });
      res.status(201).json({ product: serializeCyberProduct(product) });
    } catch (error) {
      console.error('nri/cyber post:', error);
      return sendApiError(res, 500, 'NRI_CYBER_CREATE_FAILED', 'Не удалось сохранить имплант.');
    }
  });

  app.patch('/neon_v1/services/nri/:code/cyber/:productId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const productId = req.params.productId;
    const { inShop, priceWonlongs, name } = req.body as {
      inShop?: boolean;
      priceWonlongs?: number;
      name?: string;
    };
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Редактирует только мастер.');
      }
      const existing = await prisma.nriCyberProduct.findFirst({
        where: { id: productId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_CYBER_NOT_FOUND', 'Имплант не найден.');
      const product = await prisma.nriCyberProduct.update({
        where: { id: productId },
        data: {
          ...(typeof inShop === 'boolean' ? { inShop } : {}),
          ...(typeof priceWonlongs === 'number' ? { priceWonlongs: Math.max(0, Math.round(priceWonlongs)) } : {}),
          ...(typeof name === 'string' && name.trim() ? { name: name.trim().slice(0, 80) } : {}),
        },
      });
      res.json({ product: serializeCyberProduct(product) });
    } catch (error) {
      console.error('nri/cyber patch:', error);
      return sendApiError(res, 500, 'NRI_CYBER_PATCH_FAILED', 'Не удалось обновить имплант.');
    }
  });

  app.delete('/neon_v1/services/nri/:code/cyber/:productId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const productId = req.params.productId;
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Удаляет только мастер.');
      }
      const existing = await prisma.nriCyberProduct.findFirst({
        where: { id: productId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_CYBER_NOT_FOUND', 'Имплант не найден.');
      await prisma.nriCyberProduct.delete({ where: { id: productId } });
      res.json({ ok: true });
    } catch (error) {
      console.error('nri/cyber delete:', error);
      return sendApiError(res, 500, 'NRI_CYBER_DELETE_FAILED', 'Не удалось удалить имплант.');
    }
  });

  app.post('/neon_v1/services/nri/:code/cyber/:productId/grant', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const productId = req.params.productId;
    const { targetUserId, install } = req.body as { targetUserId?: string; install?: boolean };
    if (typeof targetUserId !== 'string' || !targetUserId.trim()) {
      return sendApiError(res, 400, 'NRI_GRANT_TARGET', 'Укажите targetUserId игрока.');
    }
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Выдаёт только мастер.');
      }
      const product = await prisma.nriCyberProduct.findFirst({
        where: { id: productId, sessionId: session.id },
      });
      if (!product) return sendApiError(res, 404, 'NRI_CYBER_NOT_FOUND', 'Имплант не найден.');
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: targetUserId.trim() } },
      });
      if (!player) return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден на столе.');
      const build = (product.build && typeof product.build === 'object' ? product.build : {}) as Record<
        string,
        unknown
      >;
      const item = {
        id: `cyber_${product.id}_${Date.now()}`,
        name: product.name,
        kind: 'cyberware',
        blurb: `${product.slot} · BT ${build.bloodTox ?? '?'} · ₩${product.priceWonlongs}`,
        qty: 1,
        c2185Mods: build.c2185Mods ?? {},
        cyber: {
          slot: product.slot,
          blueprint: product.blueprint,
          bloodTox: build.bloodTox,
          powerDrawW: build.powerDrawW,
          powerWh: build.powerWh,
          cpuMhz: build.cpuMhz,
          ramGb: build.ramGb,
          features: build.features,
        },
        priceWonlongs: product.priceWonlongs,
      };
      const inv = Array.isArray(player.inventory) ? [...(player.inventory as unknown[])] : [];
      inv.push(item);
      let nextSheet = player.sheet;
      let nextInv: unknown[] = inv;
      let installed = false;

      if (install === true) {
        const result = tryInstallCyberItem(player.sheet, inv, item.id);
        if (!result.ok) {
          return sendApiError(res, 400, 'NRI_CYBER_INSTALL_FAILED', result.reason);
        }
        nextSheet = result.sheet as object;
        nextInv = result.inventory;
        installed = true;
      }

      await prisma.nriPlayer.update({
        where: { id: player.id },
        data: {
          inventory: nextInv as object[],
          sheet: nextSheet ?? undefined,
        },
      });
      res.json({ ok: true, item, installed });
    } catch (error) {
      console.error('nri/cyber grant:', error);
      return sendApiError(res, 500, 'NRI_CYBER_GRANT_FAILED', 'Не удалось выдать имплант.');
    }
  });

  app.post('/neon_v1/services/nri/:code/cyber/:productId/grant-npc', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const productId = req.params.productId;
    const { npcId, install } = req.body as { npcId?: string; install?: boolean };
    if (typeof npcId !== 'string' || !npcId.trim()) {
      return sendApiError(res, 400, 'NRI_GRANT_NPC', 'Укажите npcId.');
    }
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Выдаёт только мастер.');
      }
      const product = await prisma.nriCyberProduct.findFirst({
        where: { id: productId, sessionId: session.id },
      });
      if (!product) return sendApiError(res, 404, 'NRI_CYBER_NOT_FOUND', 'Имплант не найден.');
      const npc = await prisma.nriNpc.findFirst({
        where: { id: npcId.trim(), sessionId: session.id },
      });
      if (!npc) return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
      const build = (product.build && typeof product.build === 'object' ? product.build : {}) as Record<
        string,
        unknown
      >;
      const item = {
        id: `cyber_${product.id}_${Date.now()}`,
        name: product.name,
        kind: 'cyberware',
        blurb: `${product.slot} · BT ${build.bloodTox ?? '?'} · ₩${product.priceWonlongs}`,
        qty: 1,
        c2185Mods: build.c2185Mods ?? {},
        cyber: {
          slot: product.slot,
          blueprint: product.blueprint,
          bloodTox: build.bloodTox,
          powerDrawW: build.powerDrawW,
          powerWh: build.powerWh,
          cpuMhz: build.cpuMhz,
          ramGb: build.ramGb,
          features: build.features,
        },
        priceWonlongs: product.priceWonlongs,
      };
      const inv = Array.isArray(npc.inventory) ? [...(npc.inventory as unknown[])] : [];
      inv.push(item);
      let nextSheet = npc.sheet;
      let nextInv: unknown[] = inv;
      let installed = false;

      if (install === true) {
        const result = tryInstallCyberItem(npc.sheet, inv, item.id);
        if (!result.ok) {
          return sendApiError(res, 400, 'NRI_CYBER_INSTALL_FAILED', result.reason);
        }
        nextSheet = result.sheet as object;
        nextInv = result.inventory;
        installed = true;
      }

      await prisma.nriNpc.update({
        where: { id: npc.id },
        data: {
          inventory: nextInv as object[],
          sheet: nextSheet ?? undefined,
        },
      });
      res.json({ ok: true, item, installed });
    } catch (error) {
      console.error('nri/cyber grant-npc:', error);
      return sendApiError(res, 500, 'NRI_CYBER_GRANT_FAILED', 'Не удалось выдать имплант НПС.');
    }
  });

  app.post('/neon_v1/services/nri/:code/players/:userId/cyber/install', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const targetUserId = req.params.userId;
    const { itemId } = req.body as { itemId?: string };
    if (typeof itemId !== 'string' || !itemId.trim()) {
      return sendApiError(res, 400, 'NRI_ITEM_ID', 'Укажите itemId из инвентаря.');
    }
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const me = await resolveUser(auth);
      const isHost = session.hostUserId === auth.userId;
      const platformAdmin = me ? isAdminUsername(me.username) : false;
      const isSelf = auth.userId === targetUserId;
      if (!isHost && !platformAdmin && !isSelf) {
        return sendApiError(res, 403, 'NRI_CYBER_INSTALL_FORBIDDEN', 'Установку делает мастер или владелец предмета.');
      }
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: targetUserId } },
      });
      if (!player) return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
      const result = tryInstallCyberItem(player.sheet, player.inventory, itemId.trim());
      if (!result.ok) {
        return sendApiError(res, 400, 'NRI_CYBER_INSTALL_FAILED', result.reason);
      }
      let sheet = result.sheet as object;
      const cleared = maybeAutoClearIceBan(sheet, result.inventory);
      if (cleared) sheet = cleared as object;
      await prisma.nriPlayer.update({
        where: { id: player.id },
        data: { sheet, inventory: result.inventory as object[] },
      });
      res.json({ ok: true, installed: true });
    } catch (error) {
      console.error('nri/cyber install:', error);
      return sendApiError(res, 500, 'NRI_CYBER_INSTALL_ERR', 'Не удалось установить имплант.');
    }
  });


  app.post('/neon_v1/services/nri/:code/npcs/:npcId/items/grant', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const npcId = req.params.npcId;
    const { catalogId, qty } = req.body as { catalogId?: string; qty?: number };
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
      if (!npc) return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
      const item = catalogToServerInventoryItem(catalogId.trim());
      if (!item) return sendApiError(res, 400, 'NRI_CATALOG_UNKNOWN', 'Неизвестный предмет каталога.');
      if (typeof qty === 'number' && qty > 1) item.qty = qty;
      const inv: InvItem[] = Array.isArray(npc.inventory) ? [...(npc.inventory as InvItem[])] : [];
      const next = mergeInventoryItem(inv, item);
      await prisma.nriNpc.update({
        where: { id: npc.id },
        data: { inventory: next as object[] },
      });
      res.json({ ok: true, inventory: next });
    } catch (error) {
      console.error('nri/grant npc item:', error);
      return sendApiError(res, 500, 'NRI_GRANT_ERR', 'Не удалось выдать предмет НПС.');
    }
  });

  app.get('/neon_v1/services/vault/global', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
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
    } catch (error) {
      console.error('vault/global get:', error);
      return sendApiError(res, 500, 'VAULT_GLOBAL_GET_FAILED', 'Не удалось загрузить файлы.');
    }
  });

  app.post('/neon_v1/services/vault/global', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const { title, body, protected: protectedAlias, isProtected, gameId, difficulty, password, usePassword, useIce } = req.body as VaultCreateInput;
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
    } catch (error) {
      console.error('vault/global post:', error);
      return sendApiError(res, 500, 'VAULT_GLOBAL_CREATE_FAILED', 'Не удалось создать файл.');
    }
  });

  app.get('/neon_v1/services/vault/files/:fileId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const fileId = req.params.fileId;
    try {
      const file = await prisma.nriVaultFile.findUnique({ where: { id: fileId } });
      if (!file) return sendApiError(res, 404, 'VAULT_FILE_NOT_FOUND', 'Файл не найден.');
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
        rewardPassword:
          icePassed && !unlocked && dualReward ? file.iceRewardCode ?? undefined : undefined,
      });
    } catch (error) {
      console.error('vault/file get:', error);
      return sendApiError(res, 500, 'VAULT_FILE_GET_FAILED', 'Не удалось открыть файл.');
    }
  });

  app.post('/neon_v1/services/vault/files/:fileId/unlock', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const fileId = req.params.fileId;
    const { password, viaIce } = req.body as { password?: string; viaIce?: boolean };
    try {
      const file = await prisma.nriVaultFile.findUnique({ where: { id: fileId } });
      if (!file) return sendApiError(res, 404, 'VAULT_FILE_NOT_FOUND', 'Файл не найден.');
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
    } catch (error) {
      console.error('vault/unlock:', error);
      return sendApiError(res, 500, 'VAULT_UNLOCK_FAILED', 'Не удалось разблокировать файл.');
    }
  });

  app.delete('/neon_v1/services/vault/files/:fileId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const fileId = req.params.fileId;
    try {
      const file = await prisma.nriVaultFile.findUnique({ where: { id: fileId } });
      if (!file) return sendApiError(res, 404, 'VAULT_FILE_NOT_FOUND', 'Файл не найден.');
      const me = await resolveUser(auth);
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');
      if (file.sessionId) {
        const session = await prisma.nriSession.findUnique({ where: { id: file.sessionId } });
        if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
        const isHost = session.hostUserId === auth.userId;
        const platformAdmin = isAdminUsername(me.username);
        if (!isHost && !platformAdmin) {
          return sendApiError(res, 403, 'NRI_VAULT_FORBIDDEN', 'Удалять файлы стола может только мастер.');
        }
      } else if (!isAdminUsername(me.username)) {
        return sendApiError(res, 403, 'VAULT_GLOBAL_FORBIDDEN', 'Глобальные файлы удаляет только админ.');
      }
      await prisma.nriVaultFile.delete({ where: { id: fileId } });
      res.json({ ok: true });
    } catch (error) {
      console.error('vault/delete:', error);
      return sendApiError(res, 500, 'VAULT_DELETE_FAILED', 'Не удалось удалить файл.');
    }
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

/** Сценарий стола — nodes, progress */

import type { Express } from 'express';
import { propagatePlaceUpdate } from './nriLoreTravel.js';

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

export function mountNriScenarioRoutes(app: Express, ctx: NriRouteContext): void {
  const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;

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
}

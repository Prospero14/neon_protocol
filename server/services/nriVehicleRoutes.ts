/** Транспорт стола */

import type { Express } from 'express';


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

export function mountNriVehicleRoutes(app: Express, ctx: NriRouteContext): void {
  const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;

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
}

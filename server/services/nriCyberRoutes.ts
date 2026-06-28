/** Киберимпланты — catalog, grant, install */

import type { Express } from 'express';
import { isAdminUsername } from './auth.js';
import { tryInstallCyberItem } from './nriCyberInstall.js';
import { maybeAutoClearIceBan } from './nriIceBan.js';
import { parseNriJsonField } from './nriSessionHelpers.js';

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

function cyberGrantItem(product: {
  id: string;
  name: string;
  slot: string;
  blueprint: unknown;
  build: unknown;
  priceWonlongs: number;
}) {
  const build = (product.build && typeof product.build === 'object' ? product.build : {}) as Record<
    string,
    unknown
  >;
  return {
    id: `cyber_${product.id}_${Date.now()}`,
    name: product.name,
    kind: 'cyberware' as const,
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
      effects: build.effects,
    },
    priceWonlongs: product.priceWonlongs,
  };
}

export function mountNriCyberRoutes(app: Express, ctx: NriRouteContext): void {
  const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;

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
          blueprint: parseNriJsonField(blueprint) ?? {},
          build: parseNriJsonField(build) ?? {},
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
      const item = cyberGrantItem(product);
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
      const needsHoloTattooPick =
        nextSheet &&
        typeof nextSheet === 'object' &&
        (nextSheet as { pendingHoloTattoo?: boolean }).pendingHoloTattoo === true;
      res.json({ ok: true, item, installed, needsHoloTattooPick: installed ? needsHoloTattooPick : false });
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
      const item = cyberGrantItem(product);
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
      const needsHoloTattooPick =
        sheet &&
        typeof sheet === 'object' &&
        (sheet as { pendingHoloTattoo?: boolean }).pendingHoloTattoo === true;
      res.json({ ok: true, installed: true, needsHoloTattooPick });
    } catch (error) {
      console.error('nri/cyber install:', error);
      return sendApiError(res, 500, 'NRI_CYBER_INSTALL_ERR', 'Не удалось установить имплант.');
    }
  });
}

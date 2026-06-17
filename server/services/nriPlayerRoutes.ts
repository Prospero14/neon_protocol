/** Персонажи и предметы игрока */

import type { Express } from 'express';
import { isAdminUsername } from './auth.js';
import {
  mergePlayerSheetFromPreset,
  parseNriJsonField,
  serializeNriPlayer,
} from './nriSessionHelpers.js';
import { rejectIfInvalidSheetConditions } from './sheetConditionGate.js';
import { mergeInventoryItem, takeOneCatalogItem, toggleEquipServer, type InvItem } from './nriItemGrant.js';
import { tryUseItemServer } from './nriItemConsumeServer.js';
import { catalogToServerInventoryItem } from './nriItemCatalogServer.js';
import { touchNriMember } from './nriMemberDb.js';
import { parseRequestBody } from '../../shared/api-schemas/parseBody.js';
import {
  nriItemGrantSchema,
  nriPlayerNotesSchema,
  nriPlayerPatchSchema,
  nriPlayerSaveSchema,
} from '../../shared/api-schemas/nri.js';
import {
  applyHoloTattooPick,
  buildHoloTattooOptions,
  type FactionRef,
} from '../../shared/nri-domain/tattoos.js';

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

export function mountNriPlayerRoutes(app: Express, ctx: NriRouteContext): void {
  const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;

  app.patch('/neon_v1/services/nri/:code/player/notes', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const parsed = parseRequestBody(nriPlayerNotesSchema, req.body);
    if (!parsed.ok) return sendApiError(res, 400, 'NRI_NOTES_REQUIRED', parsed.message);
    const { notes } = parsed.data;
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
      const updated = await prisma.nriPlayer.update({
        where: { id: player.id },
        data: { privateNotes: notes.slice(0, 50000) },
      });
      res.json({ ok: true, privateNotes: updated.privateNotes });
    } catch (error) {
      console.error('nri/player notes:', error);
      return sendApiError(res, 500, 'NRI_NOTES_SAVE_FAILED', 'Не удалось сохранить заметки.');
    }
  });

  app.get('/neon_v1/services/nri/:code/player', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
      });
      res.json({ player: player ? serializeNriPlayer(player) : null });
    } catch (error) {
      console.error('nri/player get:', error);
      return sendApiError(res, 500, 'NRI_PLAYER_GET_FAILED', 'Не удалось загрузить профиль.');
    }
  });

  app.get('/neon_v1/services/nri/:code/players', async (req, res) => {
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
        return sendApiError(res, 403, 'NRI_ROSTER_FORBIDDEN', 'Чарники доступны только мастеру.');
      }
      const players = await prisma.nriPlayer.findMany({
        where: { sessionId: session.id },
        include: { user: { select: { username: true } } },
        orderBy: { displayName: 'asc' },
      });
      res.json({
        players: players.map((p) => ({
          userId: p.userId,
          username: p.user.username,
          displayName: p.displayName,
          classId: p.classId,
          inventory: Array.isArray(p.inventory) ? p.inventory : [],
          sheet: p.sheet ?? null,
          portraitUrl: p.portraitUrl ?? null,
          presetId: p.presetId ?? null,
        })),
      });
    } catch (error) {
      console.error('nri/players get:', error);
      return sendApiError(res, 500, 'NRI_ROSTER_GET_FAILED', 'Не удалось загрузить чарников.');
    }
  });

  app.post('/neon_v1/services/nri/:code/player', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const parsed = parseRequestBody(nriPlayerSaveSchema, req.body);
    if (!parsed.ok) return sendApiError(res, 400, 'NRI_NAME_REQUIRED', parsed.message);
    const { displayName, classId, presetId, sheet, inventory } = parsed.data;
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const me = await resolveUser(auth);
      if (!me) return sendApiError(res, 401, 'NRI_USER_NOT_FOUND', 'Пользователь не найден.');

      let player;
      if (typeof presetId === 'string' && presetId.trim()) {
        const preset = await prisma.nriPresetCharacter.findFirst({
          where: {
            id: presetId.trim(),
            sessionId: session.id,
            claimedByUserId: null,
            publishedToPlayers: true,
          },
        });
        if (!preset) {
          return sendApiError(res, 409, 'NRI_PRESET_TAKEN', 'Этот персонаж недоступен, уже занят или не опубликован.');
        }
        const mergedSheet = mergePlayerSheetFromPreset(preset.sheet, displayName.trim(), sheet);
        if (mergedSheet && rejectIfInvalidSheetConditions(res, mergedSheet, sendApiError)) return;
        player = await prisma.$transaction(async (tx) => {
          await tx.nriPresetCharacter.update({
            where: { id: preset.id },
            data: { claimedByUserId: auth.userId },
          });
          return tx.nriPlayer.upsert({
            where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
            create: {
              sessionId: session.id,
              userId: auth.userId,
              displayName: displayName.trim().slice(0, 40),
              classId: preset.classId,
              inventory: preset.inventory ?? [],
              sheet: (mergedSheet ?? undefined) as object | undefined,
              portraitUrl: preset.portraitUrl,
              presetId: preset.id,
            },
            update: {
              displayName: displayName.trim().slice(0, 40),
              classId: preset.classId,
              inventory: preset.inventory ?? [],
              sheet: (mergedSheet ?? undefined) as object | undefined,
              portraitUrl: preset.portraitUrl,
              presetId: preset.id,
            },
          });
        });
      } else {
        const presetCount = await prisma.nriPresetCharacter.count({
          where: { sessionId: session.id, publishedToPlayers: true },
        });
        if (presetCount > 0) {
          return sendApiError(
            res,
            400,
            'NRI_PRESET_REQUIRED',
            'Мастер подготовил персонажей — выберите одного из списка.'
          );
        }
        if (typeof classId !== 'string' || !classId.trim()) {
          return sendApiError(res, 400, 'NRI_CLASS_REQUIRED', 'Выберите класс.');
        }
        const sheetPayload =
          sheet && typeof sheet === 'object' && (sheet as { abilities?: { STR?: number } }).abilities?.STR != null
            ? sheet
            : undefined;
        if (sheetPayload && rejectIfInvalidSheetConditions(res, sheetPayload, sendApiError)) return;
        const inventoryPayload = Array.isArray(inventory) ? inventory : [];
        player = await prisma.nriPlayer.upsert({
          where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
          create: {
            sessionId: session.id,
            userId: auth.userId,
            displayName: displayName.trim().slice(0, 40),
            classId: classId.trim(),
            sheet: sheetPayload ?? undefined,
            inventory: inventoryPayload,
          },
          update: {
            displayName: displayName.trim().slice(0, 40),
            classId: classId.trim(),
            ...(sheetPayload ? { sheet: sheetPayload } : {}),
            inventory: inventoryPayload,
          },
        });
      }

      await touchNriMember(
        prisma,
        session.id,
        auth.userId,
        me.username,
        session.hostUserId === auth.userId
      );
      res.json({ player: serializeNriPlayer(player) });
    } catch (error) {
      console.error('nri/player post:', error);
      return sendApiError(res, 500, 'NRI_PLAYER_SAVE_FAILED', 'Не удалось сохранить профиль.');
    }
  });

  app.patch('/neon_v1/services/nri/:code/players/:userId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const targetUserId = req.params.userId;
    const parsed = parseRequestBody(nriPlayerPatchSchema, req.body);
    if (!parsed.ok) return sendApiError(res, 400, 'NRI_PLAYER_PATCH_INVALID', parsed.message);
    const { displayName, sheet } = parsed.data;
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Редактирует только мастер.');
      }
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: targetUserId } },
      });
      if (!player) return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
      const prevSheet =
        player.sheet && typeof player.sheet === 'object' ? ({ ...(player.sheet as object) } as Record<string, unknown>) : {};
      const nextSheet =
        sheet !== undefined && sheet && typeof sheet === 'object'
          ? { ...prevSheet, ...(sheet as object) }
          : prevSheet;
      if (rejectIfInvalidSheetConditions(res, nextSheet, sendApiError)) return;
      const updated = await prisma.nriPlayer.update({
        where: { id: player.id },
        data: {
          ...(typeof displayName === 'string' && displayName.trim()
            ? { displayName: displayName.trim().slice(0, 40) }
            : {}),
          ...(sheet !== undefined ? { sheet: nextSheet as object } : {}),
        },
      });
      res.json({ player: serializeNriPlayer(updated) });
    } catch (error) {
      console.error('nri/player patch:', error);
      return sendApiError(res, 500, 'NRI_PLAYER_PATCH_FAILED', 'Не удалось обновить персонажа.');
    }
  });

  app.post('/neon_v1/services/nri/:code/player/items/:itemId/toggle-equip', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const itemId = String(req.params.itemId ?? '').trim();
    if (!itemId) return sendApiError(res, 400, 'NRI_ITEM_ID', 'Укажите предмет.');
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
      });
      if (!player) return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Персонаж не найден.');
      const inv = Array.isArray(player.inventory) ? ([...(player.inventory as InvItem[])] ) : [];
      const next = toggleEquipServer(inv, itemId);
      if (!next) return sendApiError(res, 400, 'NRI_EQUIP_FAILED', 'Предмет нельзя экипировать.');
      await prisma.nriPlayer.update({
        where: { id: player.id },
        data: { inventory: next as object[] },
      });
      res.json({ ok: true, inventory: next });
    } catch (error) {
      console.error('nri/toggle-equip:', error);
      return sendApiError(res, 500, 'NRI_EQUIP_ERR', 'Не удалось сменить экипировку.');
    }
  });

  app.post('/neon_v1/services/nri/:code/player/items/:itemId/use', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const itemId = String(req.params.itemId ?? '').trim();
    if (!itemId) return sendApiError(res, 400, 'NRI_ITEM_ID', 'Укажите предмет.');
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
      });
      if (!player) return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Персонаж не найден.');
      const inv = Array.isArray(player.inventory) ? ([...(player.inventory as InvItem[])] ) : [];
      const result = tryUseItemServer(player.sheet, inv, itemId);
      if (!result.ok) {
        return sendApiError(res, 400, 'NRI_USE_FAILED', result.reason);
      }
      await prisma.nriPlayer.update({
        where: { id: player.id },
        data: { sheet: result.sheet as object, inventory: result.inventory as object[] },
      });
      res.json({ ok: true, inventory: result.inventory, sheet: result.sheet, applied: result.applied });
    } catch (error) {
      console.error('nri/use-item:', error);
      return sendApiError(res, 500, 'NRI_USE_ERR', 'Не удалось использовать предмет.');
    }
  });

  app.post('/neon_v1/services/nri/:code/players/:userId/items/grant', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const targetUserId = req.params.userId;
    const parsed = parseRequestBody(nriItemGrantSchema, req.body);
    if (!parsed.ok) return sendApiError(res, 400, 'NRI_CATALOG_ID', parsed.message);
    const { catalogId, qty, fromNpcId } = parsed.data;
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const me = await resolveUser(auth);
      const isHost = session.hostUserId === auth.userId;
      const platformAdmin = me ? isAdminUsername(me.username) : false;
      if (!isHost && !platformAdmin) {
        return sendApiError(res, 403, 'NRI_GRANT_FORBIDDEN', 'Выдавать предметы может только мастер.');
      }
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: targetUserId } },
      });
      if (!player) return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Игрок не найден.');
      const item = catalogToServerInventoryItem(catalogId.trim());
      if (!item) return sendApiError(res, 400, 'NRI_CATALOG_UNKNOWN', 'Неизвестный предмет каталога.');
      if (typeof qty === 'number' && qty > 1) item.qty = qty;
      let npcName: string | null = null;
      if (typeof fromNpcId === 'string' && fromNpcId.trim()) {
        const npc = await prisma.nriNpc.findFirst({
          where: { id: fromNpcId.trim(), sessionId: session.id },
        });
        if (!npc) return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
        npcName = npc.name;
        const npcInv: InvItem[] = Array.isArray(npc.inventory) ? [...(npc.inventory as InvItem[])] : [];
        const taken = takeOneCatalogItem(npcInv, catalogId.trim());
        if (taken.taken) {
          await prisma.nriNpc.update({
            where: { id: npc.id },
            data: { inventory: taken.inventory as object[] },
          });
        }
      }
      const inv: InvItem[] = Array.isArray(player.inventory) ? [...(player.inventory as InvItem[])] : [];
      const next = mergeInventoryItem(inv, item);
      await prisma.nriPlayer.update({
        where: { id: player.id },
        data: { inventory: next as object[] },
      });
      res.json({ ok: true, inventory: next });
    } catch (error) {
      console.error('nri/grant item:', error);
      return sendApiError(res, 500, 'NRI_GRANT_ERR', 'Не удалось выдать предмет.');
    }
  });

  app.get('/neon_v1/services/nri/:code/player/holo-tattoo/options', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
      });
      if (!player) return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Персонаж не найден.');
      const sheet =
        player.sheet && typeof player.sheet === 'object' ? ({ ...(player.sheet as object) } as Record<string, unknown>) : {};
      if (!sheet.pendingHoloTattoo) {
        return res.json({ pending: false, options: [] });
      }
      const factions = await prisma.nriFaction.findMany({ where: { sessionId: session.id } });
      const factionRefs: FactionRef[] = factions.map((f) => ({
        id: f.id,
        kind: f.kind,
        name: f.name,
      }));
      const options = buildHoloTattooOptions(
        { originId: typeof sheet.originId === 'string' ? sheet.originId : undefined },
        factionRefs
      );
      res.json({ pending: true, options });
    } catch (error) {
      console.error('nri/holo-tattoo options:', error);
      return sendApiError(res, 500, 'NRI_HOLO_TATTOO_OPTIONS', 'Не удалось загрузить варианты тату.');
    }
  });

  app.post('/neon_v1/services/nri/:code/player/holo-tattoo', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { optionId } = req.body as { optionId?: string };
    if (typeof optionId !== 'string' || !optionId.trim()) {
      return sendApiError(res, 400, 'NRI_HOLO_TATTOO_OPTION', 'Укажите optionId.');
    }
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const player = await prisma.nriPlayer.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
      });
      if (!player) return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Персонаж не найден.');
      const sheet =
        player.sheet && typeof player.sheet === 'object' ? ({ ...(player.sheet as object) } as Record<string, unknown>) : {};
      const factions = await prisma.nriFaction.findMany({ where: { sessionId: session.id } });
      const factionRefs: FactionRef[] = factions.map((f) => ({
        id: f.id,
        kind: f.kind,
        name: f.name,
      }));
      const options = buildHoloTattooOptions(
        { originId: typeof sheet.originId === 'string' ? sheet.originId : undefined },
        factionRefs
      );
      const result = applyHoloTattooPick(sheet, optionId.trim(), factionRefs, options);
      if (!result.ok) return sendApiError(res, 400, 'NRI_HOLO_TATTOO_FAILED', result.reason);
      if (rejectIfInvalidSheetConditions(res, result.sheet, sendApiError)) return;
      const updated = await prisma.nriPlayer.update({
        where: { id: player.id },
        data: { sheet: result.sheet as object },
      });
      res.json({ ok: true, player: serializeNriPlayer(updated) });
    } catch (error) {
      console.error('nri/holo-tattoo post:', error);
      return sendApiError(res, 500, 'NRI_HOLO_TATTOO_ERR', 'Не удалось применить татуировку.');
    }
  });
}

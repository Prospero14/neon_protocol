import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { ApiErrorSender, JwtAuth } from './auth.js';
import { isAdminUsername } from './auth.js';
import { isNriMember, listNriMembers, purgeNriSessionData, touchNriMember } from './nriMemberDb.js';
import { startNriSpamBot, stopNriSpamBot } from './nriSpamBot.js';
import { tryInstallCyberItem } from './nriCyberInstall.js';

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
    const { title } = req.body as { title?: string };
    const sessionTitle =
      typeof title === 'string' && title.trim() ? title.trim().slice(0, 80) : 'НРИ-сессия';
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
          spamBotEnabled: session.spamBotEnabled,
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
          spamBotEnabled: session.spamBotEnabled,
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

  function serializeVaultFile(f: {
    id: string;
    title: string;
    body: string;
    protected: boolean;
    gameId: string | null;
    difficulty: string | null;
    createdAt: Date;
  }) {
    return {
      id: f.id,
      title: f.title,
      body: f.body,
      protected: f.protected,
      gameId: f.gameId,
      difficulty: f.difficulty,
      createdAt: f.createdAt.getTime(),
    };
  }

  async function resolveSession(code: string) {
    return prisma.nriSession.findUnique({
      where: { inviteCode: code },
      include: { host: { select: { username: true } } },
    });
  }

  function serializePlayer(p: {
    displayName: string;
    classId: string;
    inventory: unknown;
    sheet?: unknown;
    portraitUrl?: string | null;
    presetId?: string | null;
  }) {
    return {
      displayName: p.displayName,
      classId: p.classId,
      inventory: Array.isArray(p.inventory) ? p.inventory : [],
      sheet: p.sheet ?? null,
      portraitUrl: p.portraitUrl ?? null,
      presetId: p.presetId ?? null,
    };
  }

  function serializePreset(p: {
    id: string;
    label: string;
    classId: string;
    inventory: unknown;
    sheet: unknown;
    portraitUrl: string | null;
    sortOrder: number;
    claimedByUserId: string | null;
    createdAt: Date;
  }) {
    return {
      id: p.id,
      label: p.label,
      classId: p.classId,
      inventory: Array.isArray(p.inventory) ? p.inventory : [],
      sheet: p.sheet ?? null,
      portraitUrl: p.portraitUrl,
      sortOrder: p.sortOrder,
      claimed: !!p.claimedByUserId,
      claimedByUserId: p.claimedByUserId,
      createdAt: p.createdAt.getTime(),
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

  function parseJsonField(raw: unknown): unknown | null {
    if (raw === null || raw === undefined) return null;
    return raw;
  }

  async function requireHost(session: { hostUserId: string }, auth: JwtAuth, me: { username: string } | null) {
    const platformAdmin = me ? isAdminUsername(me.username) : false;
    if (session.hostUserId !== auth.userId && !platformAdmin) {
      return false;
    }
    return true;
  }

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
      res.json({ player: player ? serializePlayer(player) : null });
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
    const { displayName, classId, presetId } = req.body as {
      displayName?: string;
      classId?: string;
      presetId?: string;
    };
    if (typeof displayName !== 'string' || !displayName.trim()) {
      return sendApiError(res, 400, 'NRI_NAME_REQUIRED', 'Укажите имя персонажа.');
    }
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
          where: { id: presetId.trim(), sessionId: session.id, claimedByUserId: null },
        });
        if (!preset) {
          return sendApiError(res, 409, 'NRI_PRESET_TAKEN', 'Этот персонаж уже занят или не найден.');
        }
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
              sheet: preset.sheet ?? undefined,
              portraitUrl: preset.portraitUrl,
              presetId: preset.id,
            },
            update: {
              displayName: displayName.trim().slice(0, 40),
              classId: preset.classId,
              inventory: preset.inventory ?? [],
              sheet: preset.sheet ?? undefined,
              portraitUrl: preset.portraitUrl,
              presetId: preset.id,
            },
          });
        });
      } else {
        const presetCount = await prisma.nriPresetCharacter.count({ where: { sessionId: session.id } });
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
        player = await prisma.nriPlayer.upsert({
          where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
          create: {
            sessionId: session.id,
            userId: auth.userId,
            displayName: displayName.trim().slice(0, 40),
            classId: classId.trim(),
          },
          update: {
            displayName: displayName.trim().slice(0, 40),
            classId: classId.trim(),
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
      res.json({ player: serializePlayer(player) });
    } catch (error) {
      console.error('nri/player post:', error);
      return sendApiError(res, 500, 'NRI_PLAYER_SAVE_FAILED', 'Не удалось сохранить профиль.');
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
    const { title, body, protected: protectedAlias, isProtected, gameId, difficulty } = req.body as {
      title?: string;
      body?: string;
      protected?: boolean;
      isProtected?: boolean;
      gameId?: string;
      difficulty?: string;
    };
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
      const protectedFlag = isProtected === true || protectedAlias === true;
      const file = await prisma.nriVaultFile.create({
        data: {
          sessionId: session.id,
          title: title.trim().slice(0, 80),
          body: fileBody.slice(0, 8000),
          protected: protectedFlag,
          gameId: protectedFlag && typeof gameId === 'string' ? gameId : null,
          difficulty: protectedFlag && typeof difficulty === 'string' ? difficulty : null,
          createdById: auth.userId,
        },
      });
      res.status(201).json({ file: serializeVaultFile(file) });
    } catch (error) {
      console.error('nri/vault post:', error);
      return sendApiError(res, 500, 'NRI_VAULT_CREATE_FAILED', 'Не удалось создать файл.');
    }
  });

  app.get('/neon_v1/services/nri/:code/presets', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      const isHost = session.hostUserId === auth.userId;
      const platformAdmin = me ? isAdminUsername(me.username) : false;
      const presets = await prisma.nriPresetCharacter.findMany({
        where: {
          sessionId: session.id,
          ...(isHost || platformAdmin ? {} : { claimedByUserId: null }),
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      res.json({ presets: presets.map(serializePreset) });
    } catch (error) {
      console.error('nri/presets get:', error);
      return sendApiError(res, 500, 'NRI_PRESETS_GET_FAILED', 'Не удалось загрузить персонажей.');
    }
  });

  app.post('/neon_v1/services/nri/:code/presets', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const { label, classId, inventory, sheet, portraitUrl, sortOrder } = req.body as {
      label?: string;
      classId?: string;
      inventory?: unknown;
      sheet?: unknown;
      portraitUrl?: string;
      sortOrder?: number;
    };
    if (typeof label !== 'string' || !label.trim()) {
      return sendApiError(res, 400, 'NRI_PRESET_LABEL', 'Укажите название пресета.');
    }
    if (typeof classId !== 'string' || !classId.trim()) {
      return sendApiError(res, 400, 'NRI_CLASS_REQUIRED', 'Выберите класс.');
    }
    try {
      const session = await resolveSession(code);
      if (!session || session.status !== 'open') {
        return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
      }
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Персонажей создаёт только мастер.');
      }
      const preset = await prisma.nriPresetCharacter.create({
        data: {
          sessionId: session.id,
          label: label.trim().slice(0, 60),
          classId: classId.trim(),
          inventory: Array.isArray(inventory) ? inventory : [],
          sheet: parseJsonField(sheet) ?? undefined,
          portraitUrl: typeof portraitUrl === 'string' && portraitUrl.trim() ? portraitUrl.trim().slice(0, 2000) : null,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        },
      });
      res.status(201).json({ preset: serializePreset(preset) });
    } catch (error) {
      console.error('nri/presets post:', error);
      return sendApiError(res, 500, 'NRI_PRESET_CREATE_FAILED', 'Не удалось создать персонажа.');
    }
  });

  app.patch('/neon_v1/services/nri/:code/presets/:presetId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const presetId = req.params.presetId;
    const { label, classId, inventory, sheet, portraitUrl, sortOrder } = req.body as {
      label?: string;
      classId?: string;
      inventory?: unknown;
      sheet?: unknown;
      portraitUrl?: string | null;
      sortOrder?: number;
    };
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Редактирует только мастер.');
      }
      const existing = await prisma.nriPresetCharacter.findFirst({
        where: { id: presetId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_PRESET_NOT_FOUND', 'Персонаж не найден.');
      if (existing.claimedByUserId) {
        return sendApiError(res, 409, 'NRI_PRESET_CLAIMED', 'Персонаж уже закреплён игроком.');
      }
      const preset = await prisma.nriPresetCharacter.update({
        where: { id: presetId },
        data: {
          ...(typeof label === 'string' && label.trim() ? { label: label.trim().slice(0, 60) } : {}),
          ...(typeof classId === 'string' && classId.trim() ? { classId: classId.trim() } : {}),
          ...(inventory !== undefined ? { inventory: Array.isArray(inventory) ? inventory : [] } : {}),
          ...(sheet !== undefined ? { sheet: parseJsonField(sheet) ?? undefined } : {}),
          ...(portraitUrl !== undefined
            ? {
                portraitUrl:
                  typeof portraitUrl === 'string' && portraitUrl.trim()
                    ? portraitUrl.trim().slice(0, 2000)
                    : null,
              }
            : {}),
          ...(typeof sortOrder === 'number' ? { sortOrder } : {}),
        },
      });
      res.json({ preset: serializePreset(preset) });
    } catch (error) {
      console.error('nri/presets patch:', error);
      return sendApiError(res, 500, 'NRI_PRESET_UPDATE_FAILED', 'Не удалось обновить персонажа.');
    }
  });

  app.delete('/neon_v1/services/nri/:code/presets/:presetId', async (req, res) => {
    const auth = jwtAuth(req);
    if (!auth) return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const presetId = req.params.presetId;
    try {
      const session = await resolveSession(code);
      if (!session) return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
      const me = await resolveUser(auth);
      if (!me || !(await requireHost(session, auth, me))) {
        return sendApiError(res, 403, 'NRI_NOT_HOST', 'Удаляет только мастер.');
      }
      const existing = await prisma.nriPresetCharacter.findFirst({
        where: { id: presetId, sessionId: session.id },
      });
      if (!existing) return sendApiError(res, 404, 'NRI_PRESET_NOT_FOUND', 'Персонаж не найден.');
      if (existing.claimedByUserId) {
        return sendApiError(res, 409, 'NRI_PRESET_CLAIMED', 'Нельзя удалить закреплённого персонажа.');
      }
      await prisma.nriPresetCharacter.delete({ where: { id: presetId } });
      res.json({ ok: true });
    } catch (error) {
      console.error('nri/presets delete:', error);
      return sendApiError(res, 500, 'NRI_PRESET_DELETE_FAILED', 'Не удалось удалить персонажа.');
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
      await prisma.nriPlayer.update({
        where: { id: player.id },
        data: { sheet: result.sheet as object, inventory: result.inventory as object[] },
      });
      res.json({ ok: true, installed: true });
    } catch (error) {
      console.error('nri/cyber install:', error);
      return sendApiError(res, 500, 'NRI_CYBER_INSTALL_ERR', 'Не удалось установить имплант.');
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
    const { title, body, protected: protectedAlias, isProtected, gameId, difficulty } = req.body as {
      title?: string;
      body?: string;
      protected?: boolean;
      isProtected?: boolean;
      gameId?: string;
      difficulty?: string;
    };
    if (typeof title !== 'string' || !title.trim()) {
      return sendApiError(res, 400, 'NRI_FILE_TITLE_REQUIRED', 'Укажите название файла.');
    }
    const fileBody = typeof body === 'string' ? body : '';
    try {
      const me = await resolveUser(auth);
      if (!me || !isAdminUsername(me.username)) {
        return sendApiError(res, 403, 'VAULT_ADMIN_ONLY', 'Создавать файлы может только админ.');
      }
      const protectedFlag = isProtected === true || protectedAlias === true;
      const file = await prisma.nriVaultFile.create({
        data: {
          sessionId: null,
          title: title.trim().slice(0, 80),
          body: fileBody.slice(0, 8000),
          protected: protectedFlag,
          gameId: protectedFlag && typeof gameId === 'string' ? gameId : null,
          difficulty: protectedFlag && typeof difficulty === 'string' ? difficulty : null,
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
      const unlocked = !file.protected || !!unlock;
      res.json({
        file: serializeVaultFile(file),
        unlocked,
        canReadBody: unlocked,
        body: unlocked ? file.body : undefined,
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
    try {
      const file = await prisma.nriVaultFile.findUnique({ where: { id: fileId } });
      if (!file) return sendApiError(res, 404, 'VAULT_FILE_NOT_FOUND', 'Файл не найден.');
      if (!file.protected) {
        return res.json({ ok: true, unlocked: true, body: file.body });
      }
      await prisma.nriFileUnlock.upsert({
        where: { fileId_userId: { fileId, userId: auth.userId } },
        create: { fileId, userId: auth.userId },
        update: {},
      });
      res.json({ ok: true, unlocked: true, body: file.body });
    } catch (error) {
      console.error('vault/unlock:', error);
      return sendApiError(res, 500, 'VAULT_UNLOCK_FAILED', 'Не удалось разблокировать файл.');
    }
  });
}

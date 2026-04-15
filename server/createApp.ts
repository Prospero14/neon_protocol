import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

/** Склеивает строку GameState из БД с clientSnapshot (расширенный прогресс клиента). */
function publicGameState(gs: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!gs) return null;
  const snap = gs.clientSnapshot;
  const fromSnap = typeof snap === 'object' && snap !== null && !Array.isArray(snap) ? { ...(snap as object) } : {};
  const { clientSnapshot: _drop, ...row } = gs;
  return {
    ...fromSnap,
    ...row,
    stress: gs.stress,
    maxStress: gs.maxStress,
    bits: gs.bits,
    ramPool: gs.ramPool,
    xp: gs.xp,
    level: gs.level,
    activeDeck: gs.activeDeck,
    inventory: gs.inventory,
    artifacts: gs.artifacts,
    completedQuests: gs.completedQuests,
    reputation: gs.reputation ?? (fromSnap as { reputation?: unknown }).reputation,
    intel: gs.intel ?? (fromSnap as { intel?: unknown }).intel,
  };
}

/** SQLite: `no such column`. Prisma 7 + driver adapter: `P2022`, «does not exist», `ColumnNotFound`. */
function hasMissingColumn(error: unknown, columnName?: string): boolean {
  const err = error as { code?: string; message?: unknown; meta?: { column_name?: unknown } };
  const msg = String(err.message ?? error ?? '');
  const metaCol = String(err.meta?.column_name ?? '');
  const haystack = `${msg}\n${metaCol}`;

  const sqlite = msg.includes('no such column');
  const prismaMissing =
    err.code === 'P2022' || msg.includes('does not exist') || msg.includes('ColumnNotFound');

  if (!sqlite && !prismaMissing) return false;
  if (!columnName) return true;
  return haystack.includes(columnName);
}

/** Единый JSON для ошибок neon_v1: текст для человека + стабильный `code` для клиента/логов. */
function sendApiError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: message, code });
}

export type CreateAppOptions = {
  prisma: PrismaClient;
  jwtSecret: string;
  getIsDbReady: () => boolean;
  port: number;
  databaseUrl: string | undefined;
  isAmvera: boolean;
};

/**
 * HTTP API (auth, sync, coop lobby) + SPA static. Лобби — in-memory на инстанс приложения.
 */
export function createApp(opts: CreateAppOptions) {
  const { prisma, jwtSecret, getIsDbReady, port, databaseUrl, isAmvera } = opts;
  const app = express();
  app.use(cors());
  app.use(express.json());

  const LOBBY_TTL_MS = 50_000;
  const MAX_PARTY = 4;
  const MAX_CHAT = 120;

  type LobbyEntry = {
    userId: string;
    clientUsername: string;
    displayName: string;
    coopRole: string;
    lastSeen: number;
    partyId: string | null;
  };

  const lobbyByUser = new Map<string, LobbyEntry>();
  const parties = new Map<string, { id: string; hostId: string; memberIds: string[] }>();
  const chatLog: Array<{
    id: string;
    userId: string;
    displayName: string;
    coopRole: string;
    text: string;
    ts: number;
  }> = [];
  type CoopMatchSharedState = {
    stress: number;
    infraReliability: number;
    infraResources: number;
    deadlineTicks: number;
    bugPressure: number;
    projectProgress: number;
    turn: number;
    activeRole: string;
    roleStress: Record<string, number>;
    roleTaskProgress: Record<string, number>;
  };
  type CoopMatchEvent = {
    seq: number;
    ts: number;
    type: string;
    actorUserId: string | null;
    payload: Record<string, unknown>;
  };
  type CoopMatch = {
    id: string;
    partyId: string;
    hostId: string;
    status: 'pending' | 'active' | 'finished';
    createdAt: number;
    updatedAt: number;
    memberIds: string[];
    roleByUserId: Record<string, string>;
    shared: CoopMatchSharedState;
    events: CoopMatchEvent[];
    seq: number;
  };
  const matches = new Map<string, CoopMatch>();
  const matchByPartyId = new Map<string, string>();
  const matchSseByMatchId = new Map<string, Set<Response>>();

  function pushMatchEvent(
    match: CoopMatch,
    type: string,
    actorUserId: string | null,
    payload: Record<string, unknown>,
  ) {
    match.seq += 1;
    const evt: CoopMatchEvent = {
      seq: match.seq,
      ts: Date.now(),
      type,
      actorUserId,
      payload,
    };
    match.events.push(evt);
    if (match.events.length > 200) match.events.splice(0, match.events.length - 200);
    match.updatedAt = evt.ts;
    const listeners = matchSseByMatchId.get(match.id);
    if (listeners && listeners.size > 0) {
      const frame = `event: match_update\ndata: ${JSON.stringify({ matchId: match.id, event: evt })}\n\n`;
      for (const res of listeners) {
        try {
          res.write(frame);
        } catch {
          // ignore broken stream
        }
      }
    }
  }

  function compactMatchView(match: CoopMatch) {
    return {
      id: match.id,
      partyId: match.partyId,
      hostId: match.hostId,
      status: match.status,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      memberIds: match.memberIds,
      roleByUserId: match.roleByUserId,
      shared: match.shared,
      seq: match.seq,
      recentEvents: match.events.slice(-30),
    };
  }

  function lobbyAuth(req: Request): { userId: string } | null {
    try {
      const authHeader = req.headers.authorization;
      const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
      const bodyToken =
        req.body && typeof req.body === 'object' && typeof (req.body as Record<string, unknown>).token === 'string'
          ? ((req.body as Record<string, unknown>).token as string)
          : null;
      const token =
        (authHeader && authHeader.split(' ')[1]) ||
        queryToken ||
        bodyToken;
      if (!token) return null;
      return jwt.verify(token, jwtSecret) as { userId: string };
    } catch {
      return null;
    }
  }

  function pruneLobbyUsers() {
    const now = Date.now();
    for (const [uid, u] of lobbyByUser) {
      if (now - u.lastSeen > LOBBY_TTL_MS) {
        lobbyByUser.delete(uid);
        const p = u.partyId ? parties.get(u.partyId) : null;
        if (p) {
          p.memberIds = p.memberIds.filter((id) => id !== uid);
          if (p.memberIds.length === 0) parties.delete(p.id);
          else if (p.hostId === uid) {
            p.hostId = p.memberIds[0];
          }
        }
      }
    }
  }

  function serializeParty(partyId: string | null, selfId: string) {
    if (!partyId) return null;
    const p = parties.get(partyId);
    if (!p) return null;
    return {
      id: p.id,
      hostId: p.hostId,
      isHost: p.hostId === selfId,
      members: p.memberIds.map((mid) => {
        const u = lobbyByUser.get(mid);
        return {
          userId: mid,
          displayName: u?.displayName ?? mid,
          coopRole: u?.coopRole ?? '?',
          clientUsername: u?.clientUsername ?? '',
        };
      }),
    };
  }

  app.get('/neon_v1/health', (_req, res) => {
    res.json({
      status: getIsDbReady() ? 'active' : 'initializing',
      port,
      dbPath: databaseUrl,
      isAmvera,
    });
  });

  app.post('/neon_v1/auth/register', async (req, res) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!username || !password) {
        return sendApiError(res, 400, 'REGISTER_INVALID_INPUT', 'Укажите логин и пароль.');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const starterDeck = [
        { id: 'script_ping', count: 1 },
        { id: 'script_grep', count: 1 },
        { id: 'script_wash_logs', count: 1 },
        { id: 'soft_coffee', count: 1 },
      ];
      await prisma.user.create({
        data: {
          username,
          passwordHash: hashedPassword,
          gameState: {
            create: {
              bits: 150,
              ramPool: 1.0,
              stress: 0,
              maxStress: 100,
              activeDeck: starterDeck,
              inventory: starterDeck,
              artifacts: [],
              completedQuests: [],
              reputation: {},
              intel: [],
            },
          },
        },
      });
      res.status(201).json({ message: 'User created' });
    } catch (error: any) {
      console.error('Registration Error:', error);
      if (error.code === 'P2002') {
        return sendApiError(
          res,
          400,
          'REGISTER_DUPLICATE',
          'Такой логин уже есть. Войдите или выберите другой логин.',
        );
      }
      return sendApiError(res, 400, 'REGISTER_FAILED', 'Не удалось создать аккаунт (ошибка сервера).');
    }
  });

  app.post('/neon_v1/auth/login', async (req, res) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!username || !password)
        return sendApiError(res, 401, 'LOGIN_REJECTED', 'Неверный логин или пароль.');
      let user: any;
      try {
        user = await prisma.user.findUnique({ where: { username }, include: { gameState: true } });
      } catch (e) {
        if (!hasMissingColumn(e)) throw e;
        // Legacy /data DB on host can miss part of new GameState columns.
        user = await prisma.user.findUnique({
          where: { username },
          include: {
            gameState: {
              select: {
                id: true,
                userId: true,
                bits: true,
                xp: true,
                level: true,
                ramPool: true,
                stress: true,
                maxStress: true,
                activeDeck: true,
                inventory: true,
                artifacts: true,
                completedQuests: true,
              },
            },
          },
        });
      }
      if (!user || !(await bcrypt.compare(password, user.passwordHash)))
        return sendApiError(res, 401, 'LOGIN_REJECTED', 'Неверный логин или пароль.');
      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '24h' });
      const rawGs = user.gameState as Record<string, unknown> | null;
      res.json({
        token,
        user: { id: user.id, username: user.username, gameState: publicGameState(rawGs) },
      });
    } catch (error) {
      console.error('Login Error:', error);
      sendApiError(res, 500, 'LOGIN_SERVER', 'Ошибка входа. Попробуйте позже.');
    }
  });

  app.post('/neon_v1/game/sync', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return sendApiError(res, 401, 'SYNC_NO_TOKEN', 'Нет токена авторизации.');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      const body = req.body as Record<string, unknown>;
      const { stress, maxStress, bits, xp, level, activeDeck, inventory, artifacts, completedQuests } = body;
      let updatedState: unknown;
      try {
        updatedState = await prisma.gameState.update({
          where: { userId: decoded.userId },
          data: {
            stress,
            maxStress,
            bits,
            xp,
            level,
            activeDeck,
            inventory,
            artifacts,
            completedQuests,
            clientSnapshot: body as object,
          } as any,
        });
      } catch (e) {
        if (!hasMissingColumn(e, 'clientSnapshot')) throw e;
        updatedState = await prisma.gameState.update({
          where: { userId: decoded.userId },
          data: {
            stress,
            maxStress,
            bits,
            xp,
            level,
            activeDeck,
            inventory,
            artifacts,
            completedQuests,
          } as any,
        });
      }
      res.json(publicGameState(updatedState as unknown as Record<string, unknown>));
    } catch (error) {
      console.error('Sync Error:', error);
      const name = (error as { name?: string })?.name ?? '';
      if (name === 'JsonWebTokenError' || name === 'TokenExpiredError' || name === 'NotBeforeError') {
        return sendApiError(res, 401, 'SYNC_INVALID_TOKEN', 'Токен недействителен или истёк.');
      }
      return sendApiError(res, 500, 'SYNC_FAILED', 'Не удалось сохранить прогресс.');
    }
  });

  app.post('/neon_v1/coop/heartbeat', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    const { displayName, coopRole, clientUsername } = req.body as Record<string, unknown>;
    if (typeof displayName !== 'string' || !displayName.trim()) {
      return sendApiError(res, 400, 'COOP_DISPLAY_NAME_REQUIRED', 'Укажите displayName.');
    }
    const role = typeof coopRole === 'string' ? coopRole : 'developer';
    const cname = typeof clientUsername === 'string' ? clientUsername : '';
    pruneLobbyUsers();
    const prev = lobbyByUser.get(auth.userId);
    lobbyByUser.set(auth.userId, {
      userId: auth.userId,
      clientUsername: cname,
      displayName: displayName.trim().slice(0, 48),
      coopRole: role,
      lastSeen: Date.now(),
      partyId: prev?.partyId ?? null,
    });
    const online = [...lobbyByUser.entries()]
      .filter(([id]) => id !== auth.userId)
      .map(([id, u]) => ({
        userId: id,
        displayName: u.displayName,
        coopRole: u.coopRole,
        clientUsername: u.clientUsername,
      }));
    res.json({
      ok: true,
      online,
      party: serializeParty(lobbyByUser.get(auth.userId)?.partyId ?? null, auth.userId),
      activeMatchId: (() => {
        const pid = lobbyByUser.get(auth.userId)?.partyId;
        if (!pid) return null;
        return matchByPartyId.get(pid) ?? null;
      })(),
      chat: chatLog.slice(-40),
    });
  });

  app.get('/neon_v1/coop/state', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    pruneLobbyUsers();
    const me = lobbyByUser.get(auth.userId);
    const online = [...lobbyByUser.entries()]
      .filter(([id]) => id !== auth.userId)
      .map(([id, u]) => ({
        userId: id,
        displayName: u.displayName,
        coopRole: u.coopRole,
        clientUsername: u.clientUsername,
      }));
    res.json({
      online,
      party: serializeParty(me?.partyId ?? null, auth.userId),
      activeMatchId: me?.partyId ? (matchByPartyId.get(me.partyId) ?? null) : null,
      chat: chatLog.slice(-40),
    });
  });

  app.post('/neon_v1/coop/chat', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    const { text } = req.body as { text?: string };
    if (typeof text !== 'string' || !text.trim())
      return sendApiError(res, 400, 'COOP_CHAT_TEXT_REQUIRED', 'Укажите текст сообщения.');
    const me = lobbyByUser.get(auth.userId);
    if (!me) return sendApiError(res, 400, 'COOP_HEARTBEAT_FIRST', 'Сначала отправьте heartbeat.');
    const entry = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: auth.userId,
      displayName: me.displayName,
      coopRole: me.coopRole,
      text: text.trim().slice(0, 500),
      ts: Date.now(),
    };
    chatLog.push(entry);
    while (chatLog.length > MAX_CHAT) chatLog.shift();
    res.json({ ok: true, message: entry });
  });

  app.post('/neon_v1/coop/invite', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    const { targetDisplayName } = req.body as { targetDisplayName?: string };
    if (typeof targetDisplayName !== 'string' || !targetDisplayName.trim()) {
      return sendApiError(res, 400, 'COOP_TARGET_DISPLAY_NAME_REQUIRED', 'Укажите targetDisplayName.');
    }
    pruneLobbyUsers();
    const me = lobbyByUser.get(auth.userId);
    if (!me) return sendApiError(res, 400, 'COOP_HEARTBEAT_FIRST', 'Сначала отправьте heartbeat.');
    const needle = targetDisplayName.trim().toLowerCase();
    let targetId: string | null = null;
    for (const [id, u] of lobbyByUser) {
      if (id === auth.userId) continue;
      if (u.displayName.toLowerCase() === needle) {
        targetId = id;
        break;
      }
    }
    if (!targetId) return sendApiError(res, 404, 'COOP_PLAYER_NOT_ONLINE', 'Игрок не в сети.');
    const target = lobbyByUser.get(targetId);
    if (!target) return sendApiError(res, 404, 'COOP_TARGET_GONE', 'Игрок уже недоступен.');
    if (target.partyId && target.partyId !== me.partyId) {
      return sendApiError(res, 400, 'COOP_TARGET_IN_PARTY', 'Игрок уже в другой группе.');
    }

    let partyId = me.partyId;
    if (!partyId) {
      partyId = `party_${auth.userId}_${Date.now()}`;
      parties.set(partyId, { id: partyId, hostId: auth.userId, memberIds: [auth.userId] });
      me.partyId = partyId;
    }
    const party = parties.get(partyId);
    if (!party) return sendApiError(res, 500, 'COOP_PARTY_INTERNAL', 'Ошибка группы.');
    if (party.memberIds.length >= MAX_PARTY)
      return sendApiError(res, 400, 'COOP_PARTY_FULL', 'Группа заполнена.');
    if (!party.memberIds.includes(targetId)) {
      if (target.partyId && target.partyId !== partyId) {
        return sendApiError(res, 400, 'COOP_TARGET_IN_PARTY', 'Игрок уже в другой группе.');
      }
      party.memberIds.push(targetId);
      target.partyId = partyId;
    }
    res.json({ ok: true, party: serializeParty(partyId, auth.userId) });
  });

  app.post('/neon_v1/coop/party/leave', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    pruneLobbyUsers();
    const me = lobbyByUser.get(auth.userId);
    if (!me?.partyId) return res.json({ ok: true, party: null });
    const p = parties.get(me.partyId);
    if (p) {
      p.memberIds = p.memberIds.filter((id) => id !== auth.userId);
      if (p.memberIds.length === 0) {
        parties.delete(p.id);
      } else if (p.hostId === auth.userId) {
        p.hostId = p.memberIds[0];
      }
    }
    me.partyId = null;
    res.json({ ok: true, party: null });
  });

  app.post('/neon_v1/coop/match/create', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    pruneLobbyUsers();
    const me = lobbyByUser.get(auth.userId);
    if (!me?.partyId) return sendApiError(res, 400, 'COOP_PARTY_REQUIRED', 'Сначала соберите группу.');
    const party = parties.get(me.partyId);
    if (!party) return sendApiError(res, 400, 'COOP_PARTY_REQUIRED', 'Группа не найдена.');
    if (party.hostId !== auth.userId) {
      return sendApiError(res, 403, 'COOP_HOST_ONLY', 'Только хост может запускать общий бой.');
    }
    const existingId = matchByPartyId.get(party.id);
    if (existingId) {
      const existing = matches.get(existingId);
      if (existing && existing.status !== 'finished') {
        return res.json({ ok: true, match: compactMatchView(existing), reused: true });
      }
    }
    const roleByUserId: Record<string, string> = {};
    for (const uid of party.memberIds) {
      roleByUserId[uid] = lobbyByUser.get(uid)?.coopRole ?? 'developer';
    }
    const match: CoopMatch = {
      id: `match_${party.id}_${Date.now().toString(36)}`,
      partyId: party.id,
      hostId: auth.userId,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      memberIds: [...party.memberIds],
      roleByUserId,
      shared: {
        stress: 0,
        infraReliability: 60,
        infraResources: 50,
        deadlineTicks: 20,
        bugPressure: 0,
        projectProgress: 0,
        turn: 1,
        activeRole: 'admin',
        roleStress: {
          admin: 0,
          developer: 0,
          qa: 0,
          pm: 0,
        },
        roleTaskProgress: {
          admin: 0,
          developer: 0,
          qa: 0,
          pm: 0,
        },
      },
      events: [],
      seq: 0,
    };
    matches.set(match.id, match);
    matchByPartyId.set(party.id, match.id);
    pushMatchEvent(match, 'match_created', auth.userId, { memberIds: match.memberIds });
    res.json({ ok: true, match: compactMatchView(match), reused: false });
  });

  app.post('/neon_v1/coop/match/join', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const matchId = typeof body.matchId === 'string' ? body.matchId : '';
    if (!matchId) return sendApiError(res, 400, 'COOP_MATCH_ID_REQUIRED', 'Укажите matchId.');
    const match = matches.get(matchId);
    if (!match) return sendApiError(res, 404, 'COOP_MATCH_NOT_FOUND', 'Матч не найден.');
    if (!match.memberIds.includes(auth.userId)) {
      return sendApiError(res, 403, 'COOP_MATCH_MEMBER_REQUIRED', 'Вы не входите в состав этого матча.');
    }
    if (match.status === 'pending') {
      const allSeen = match.memberIds.every((uid) => lobbyByUser.has(uid));
      if (allSeen) {
        match.status = 'active';
        pushMatchEvent(match, 'match_activated', auth.userId, { readyMembers: match.memberIds.length });
      }
    }
    res.json({ ok: true, match: compactMatchView(match) });
  });

  app.get('/neon_v1/coop/match/state', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    const matchId = typeof req.query.matchId === 'string' ? req.query.matchId : '';
    if (!matchId) return sendApiError(res, 400, 'COOP_MATCH_ID_REQUIRED', 'Укажите matchId.');
    const match = matches.get(matchId);
    if (!match) return sendApiError(res, 404, 'COOP_MATCH_NOT_FOUND', 'Матч не найден.');
    if (!match.memberIds.includes(auth.userId)) {
      return sendApiError(res, 403, 'COOP_MATCH_MEMBER_REQUIRED', 'Вы не входите в состав этого матча.');
    }
    res.json({ ok: true, match: compactMatchView(match) });
  });

  app.get('/neon_v1/coop/match/events', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    const matchId = typeof req.query.matchId === 'string' ? req.query.matchId : '';
    if (!matchId) return sendApiError(res, 400, 'COOP_MATCH_ID_REQUIRED', 'Укажите matchId.');
    const match = matches.get(matchId);
    if (!match) return sendApiError(res, 404, 'COOP_MATCH_NOT_FOUND', 'Матч не найден.');
    if (!match.memberIds.includes(auth.userId)) {
      return sendApiError(res, 403, 'COOP_MATCH_MEMBER_REQUIRED', 'Вы не входите в состав этого матча.');
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const listeners = matchSseByMatchId.get(matchId) ?? new Set<Response>();
    listeners.add(res);
    matchSseByMatchId.set(matchId, listeners);
    res.write(`event: hello\ndata: ${JSON.stringify({ matchId, seq: match.seq })}\n\n`);
    const hb = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      } catch {
        // ignore
      }
    }, 15_000);
    req.on('close', () => {
      clearInterval(hb);
      const bucket = matchSseByMatchId.get(matchId);
      if (!bucket) return;
      bucket.delete(res);
      if (bucket.size === 0) matchSseByMatchId.delete(matchId);
    });
  });

  app.post('/neon_v1/coop/match/action', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const matchId = typeof body.matchId === 'string' ? body.matchId : '';
    const action = typeof body.action === 'string' ? body.action : '';
    const payload =
      typeof body.payload === 'object' && body.payload !== null && !Array.isArray(body.payload)
        ? (body.payload as Record<string, unknown>)
        : {};
    const expectedSeq =
      typeof body.expectedSeq === 'number' && Number.isFinite(body.expectedSeq)
        ? Math.max(0, Math.floor(body.expectedSeq))
        : null;
    if (!matchId) return sendApiError(res, 400, 'COOP_MATCH_ID_REQUIRED', 'Укажите matchId.');
    if (!action) return sendApiError(res, 400, 'COOP_ACTION_REQUIRED', 'Укажите action.');
    const match = matches.get(matchId);
    if (!match) return sendApiError(res, 404, 'COOP_MATCH_NOT_FOUND', 'Матч не найден.');
    if (match.status === 'finished') return sendApiError(res, 409, 'COOP_MATCH_FINISHED', 'Матч уже завершён.');
    if (!match.memberIds.includes(auth.userId)) {
      return sendApiError(res, 403, 'COOP_MATCH_MEMBER_REQUIRED', 'Вы не входите в состав этого матча.');
    }
    if (expectedSeq != null && expectedSeq !== match.seq) {
      return sendApiError(
        res,
        409,
        'COOP_MATCH_SEQ_MISMATCH',
        `Состояние уже обновлено другим действием (server_seq=${match.seq}, client_seq=${expectedSeq}).`,
      );
    }
    const role = match.roleByUserId[auth.userId] ?? 'developer';
    if (match.shared.activeRole !== role && action !== 'apply_pm_support') {
      return sendApiError(
        res,
        409,
        'COOP_ROLE_TURN_DENIED',
        `Сейчас ход роли ${match.shared.activeRole}; ваш класс ${role}.`,
      );
    }
    if (action === 'end_turn') {
      const order = ['admin', 'developer', 'qa', 'pm'];
      const curr = order.indexOf(match.shared.activeRole);
      const next = order[(curr + 1 + order.length) % order.length];
      match.shared.activeRole = next;
      match.shared.turn += 1;
      match.shared.deadlineTicks = Math.max(0, match.shared.deadlineTicks - 1);
      pushMatchEvent(match, action, auth.userId, { fromRole: role, nextRole: next });
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    if (action === 'apply_admin_infra') {
      const reliabilityUp = Math.max(0, Math.min(20, Number(payload.reliabilityUp ?? 0)));
      const resourcesDown = Math.max(0, Math.min(20, Number(payload.resourcesDown ?? 0)));
      const stressUp = Math.max(0, Math.min(15, Number(payload.stressUp ?? 2)));
      match.shared.infraReliability = Math.min(100, match.shared.infraReliability + reliabilityUp);
      match.shared.infraResources = Math.max(0, match.shared.infraResources - resourcesDown);
      match.shared.roleTaskProgress.admin = Math.min(100, match.shared.roleTaskProgress.admin + reliabilityUp);
      match.shared.roleStress.admin = Math.min(100, match.shared.roleStress.admin + stressUp);
      match.shared.stress = Math.min(
        100,
        Math.round(
          (match.shared.roleStress.admin +
            match.shared.roleStress.developer +
            match.shared.roleStress.qa +
            match.shared.roleStress.pm) / 4
        )
      );
      pushMatchEvent(match, action, auth.userId, { reliabilityUp, resourcesDown, stressUp });
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    if (action === 'apply_dev_progress') {
      const progressUp = Math.max(0, Math.min(25, Number(payload.progressUp ?? 0)));
      const stressUp = Math.max(0, Math.min(15, Number(payload.stressUp ?? 0)));
      match.shared.projectProgress = Math.min(100, match.shared.projectProgress + progressUp);
      match.shared.roleTaskProgress.developer = Math.min(100, match.shared.roleTaskProgress.developer + progressUp);
      match.shared.roleStress.developer = Math.min(100, match.shared.roleStress.developer + stressUp);
      match.shared.stress = Math.min(
        100,
        Math.round(
          (match.shared.roleStress.admin +
            match.shared.roleStress.developer +
            match.shared.roleStress.qa +
            match.shared.roleStress.pm) / 4
        )
      );
      pushMatchEvent(match, action, auth.userId, { progressUp, stressUp });
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    if (action === 'apply_qa_defense') {
      const bugsDown = Math.max(0, Math.min(20, Number(payload.bugsDown ?? 0)));
      const relUp = Math.max(0, Math.min(10, Number(payload.reliabilityUp ?? 0)));
      const stressDown = Math.max(0, Math.min(15, Number(payload.stressDown ?? 3)));
      match.shared.bugPressure = Math.max(0, match.shared.bugPressure - bugsDown);
      match.shared.infraReliability = Math.min(100, match.shared.infraReliability + relUp);
      match.shared.roleTaskProgress.qa = Math.min(100, match.shared.roleTaskProgress.qa + bugsDown);
      match.shared.roleStress.qa = Math.max(0, match.shared.roleStress.qa - stressDown);
      match.shared.stress = Math.min(
        100,
        Math.round(
          (match.shared.roleStress.admin +
            match.shared.roleStress.developer +
            match.shared.roleStress.qa +
            match.shared.roleStress.pm) / 4
        )
      );
      pushMatchEvent(match, action, auth.userId, { bugsDown, reliabilityUp: relUp, stressDown });
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    if (action === 'apply_pm_support') {
      const stressDown = Math.max(0, Math.min(20, Number(payload.stressDown ?? 0)));
      const deadlineUp = Math.max(0, Math.min(3, Number(payload.deadlineUp ?? 0)));
      const targetRole =
        typeof payload.targetRole === 'string' &&
        ['admin', 'developer', 'qa', 'pm'].includes(payload.targetRole)
          ? payload.targetRole
          : 'developer';
      match.shared.roleTaskProgress.pm = Math.min(100, match.shared.roleTaskProgress.pm + deadlineUp * 10);
      match.shared.roleStress.pm = Math.max(0, match.shared.roleStress.pm - Math.max(1, Math.floor(stressDown / 2)));
      match.shared.roleStress[targetRole] = Math.max(0, match.shared.roleStress[targetRole] - stressDown);
      match.shared.stress = Math.min(
        100,
        Math.round(
          (match.shared.roleStress.admin +
            match.shared.roleStress.developer +
            match.shared.roleStress.qa +
            match.shared.roleStress.pm) / 4
        )
      );
      match.shared.deadlineTicks = Math.min(40, match.shared.deadlineTicks + deadlineUp);
      pushMatchEvent(match, action, auth.userId, { stressDown, deadlineUp, targetRole });
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    if (action === 'finish_match') {
      if (auth.userId !== match.hostId) {
        return sendApiError(res, 403, 'COOP_HOST_ONLY', 'Только хост может закрыть матч.');
      }
      match.status = 'finished';
      pushMatchEvent(match, action, auth.userId, {});
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    return sendApiError(res, 400, 'COOP_ACTION_UNKNOWN', `Неизвестное действие: ${action}.`);
  });

  const DIST = path.join(process.cwd(), 'dist');
  const sendHtmlNoCache = (res: Response, file: string) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.sendFile(file);
  };

  app.use(
    '/assets',
    express.static(path.join(DIST, 'assets'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );
  app.use(
    express.static(DIST, {
      setHeaders: (_res, filePath) => {
        if (filePath.endsWith('.html')) {
          _res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
        }
      },
    }),
  );

  const indexPath = fs.existsSync(path.join(DIST, 'index.html'))
    ? path.join(DIST, 'index.html')
    : path.join(DIST, 'src/index.html');

  app.get('/', (_req, res) => {
    if (fs.existsSync(indexPath)) {
      sendHtmlNoCache(res, indexPath);
    } else {
      res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
    }
  });

  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/neon_v1')) return sendApiError(res, 404, 'API_NOT_FOUND', 'Маршрут не найден.');
    if (fs.existsSync(indexPath)) {
      sendHtmlNoCache(res, indexPath);
    } else {
      res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
    }
  });

  return app;
}

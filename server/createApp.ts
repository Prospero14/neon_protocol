import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { mergeStartupRankings } from './coopStartupPregen.js';
import {
  loadActiveCoopMatches,
  partyIdForUser,
  persistCoopMatch,
  type CoopMatch,
  type CoopMatchEvent,
  type CoopMatchIntent,
  type CoopMatchSharedState,
} from './coop/coopMatchStore.js';
import { registerNeonServices } from './services/registerServices.js';

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
 * HTTP API (auth, sync, coop lobby) + SPA static.
 * Coop live-матчи — SQLite (CoopLiveMatch); presence-лобби — in-memory TTL.
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
  const matches = new Map<string, CoopMatch>();
  const matchByPartyId = new Map<string, string>();
  const matchSseByMatchId = new Map<string, Set<Response>>();

  void loadActiveCoopMatches(prisma).then((loaded) => {
    for (const m of loaded) {
      matches.set(m.id, m);
      matchByPartyId.set(m.partyId, m.id);
      parties.set(m.partyId, { id: m.partyId, hostId: m.hostId, memberIds: [...m.memberIds] });
    }
    if (loaded.length > 0) {
      console.log(`[coop] restored ${loaded.length} active match(es) from DB`);
    }
  });

  function schedulePersistMatch(match: CoopMatch) {
    void persistCoopMatch(prisma, match);
  }

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
    schedulePersistMatch(match);
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
      linkedObjectiveAwardedIds: match.linkedObjectiveAwardedIds ?? [],
      recentEvents: match.events.slice(-30),
    };
  }

  function recomputeTeamStress(match: CoopMatch) {
    match.shared.stress = Math.min(
      100,
      Math.round(
        (match.shared.roleStress.admin +
          match.shared.roleStress.developer +
          match.shared.roleStress.qa +
          match.shared.roleStress.pm) / 4
      )
    );
  }

  function normalizeTargetRole(payload: Record<string, unknown>): 'admin' | 'developer' | 'qa' | 'pm' | null {
    if (typeof payload.targetRole === 'string' && ['admin', 'developer', 'qa', 'pm'].includes(payload.targetRole)) {
      return payload.targetRole as 'admin' | 'developer' | 'qa' | 'pm';
    }
    return null;
  }

  function applyMatchIntent(match: CoopMatch, intent: CoopMatchIntent): { ok: boolean; reason?: string } {
    const payload = intent.payload ?? {};
    const role = intent.role;
    const targetRole = normalizeTargetRole(payload);

    if (intent.action === 'apply_admin_infra') {
      if (role !== 'admin') return { ok: false, reason: 'ROLE_DENIED' };
      if ((match.shared.supportCooldownByRole.admin ?? 0) > 0) return { ok: false, reason: 'COOLDOWN' };
      const reliabilityUp = Math.max(0, Math.min(20, Number(payload.reliabilityUp ?? 8)));
      const resourcesDown = Math.max(0, Math.min(20, Number(payload.resourcesDown ?? 4)));
      const stressUp = Math.max(0, Math.min(15, Number(payload.stressUp ?? 2)));
      match.shared.infraReliability = Math.min(100, match.shared.infraReliability + reliabilityUp);
      match.shared.infraResources = Math.max(0, match.shared.infraResources - resourcesDown);
      match.shared.roleTaskProgress.admin = Math.min(100, match.shared.roleTaskProgress.admin + reliabilityUp);
      if (targetRole && targetRole !== 'admin') {
        match.shared.roleTaskProgress[targetRole] = Math.min(
          100,
          (match.shared.roleTaskProgress[targetRole] ?? 0) + Math.max(2, Math.floor(reliabilityUp / 2))
        );
        match.shared.roleStress[targetRole] = Math.max(0, (match.shared.roleStress[targetRole] ?? 0) - 2);
      }
      match.shared.roleStress.admin = Math.min(100, match.shared.roleStress.admin + stressUp);
      match.shared.supportCooldownByRole.admin = 1;
      recomputeTeamStress(match);
      pushMatchEvent(match, intent.action, intent.userId, { reliabilityUp, resourcesDown, stressUp, targetRole });
      return { ok: true };
    }

    if (intent.action === 'apply_qa_defense') {
      if (role !== 'qa') return { ok: false, reason: 'ROLE_DENIED' };
      if ((match.shared.supportCooldownByRole.qa ?? 0) > 0) return { ok: false, reason: 'COOLDOWN' };
      const bugsDown = Math.max(0, Math.min(20, Number(payload.bugsDown ?? 7)));
      const relUp = Math.max(0, Math.min(10, Number(payload.reliabilityUp ?? 3)));
      const stressDown = Math.max(0, Math.min(15, Number(payload.stressDown ?? 4)));
      match.shared.bugPressure = Math.max(0, match.shared.bugPressure - bugsDown);
      match.shared.infraReliability = Math.min(100, match.shared.infraReliability + relUp);
      match.shared.roleTaskProgress.qa = Math.min(100, match.shared.roleTaskProgress.qa + bugsDown);
      if (targetRole && targetRole !== 'qa') {
        match.shared.roleTaskProgress[targetRole] = Math.min(
          100,
          (match.shared.roleTaskProgress[targetRole] ?? 0) + Math.max(2, Math.floor(bugsDown / 3))
        );
      }
      match.shared.roleStress.qa = Math.max(0, match.shared.roleStress.qa - stressDown);
      match.shared.supportCooldownByRole.qa = 1;
      recomputeTeamStress(match);
      pushMatchEvent(match, intent.action, intent.userId, { bugsDown, reliabilityUp: relUp, stressDown, targetRole });
      return { ok: true };
    }

    if (intent.action === 'apply_pm_support') {
      if (role !== 'pm') return { ok: false, reason: 'ROLE_DENIED' };
      if ((match.shared.supportCooldownByRole.pm ?? 0) > 0) return { ok: false, reason: 'COOLDOWN' };
      const stressDown = Math.max(0, Math.min(20, Number(payload.stressDown ?? 9)));
      const deadlineUp = Math.max(0, Math.min(3, Number(payload.deadlineUp ?? 1)));
      const pmTargetRole = targetRole ?? 'developer';
      match.shared.roleTaskProgress.pm = Math.min(100, match.shared.roleTaskProgress.pm + deadlineUp * 10);
      match.shared.roleStress.pm = Math.max(0, match.shared.roleStress.pm - Math.max(1, Math.floor(stressDown / 2)));
      match.shared.roleStress[pmTargetRole] = Math.max(0, match.shared.roleStress[pmTargetRole] - stressDown);
      match.shared.deadlineTicks = Math.min(40, match.shared.deadlineTicks + deadlineUp);
      match.shared.supportCooldownByRole.pm = 1;
      recomputeTeamStress(match);
      pushMatchEvent(match, intent.action, intent.userId, { stressDown, deadlineUp, targetRole: pmTargetRole });
      return { ok: true };
    }

    if (intent.action === 'apply_dev_progress') {
      if (role !== 'developer') return { ok: false, reason: 'ROLE_DENIED' };
      const progressUp = Math.max(0, Math.min(25, Number(payload.progressUp ?? 10)));
      const stressUp = Math.max(0, Math.min(15, Number(payload.stressUp ?? 4)));
      match.shared.projectProgress = Math.min(100, match.shared.projectProgress + progressUp);
      match.shared.roleTaskProgress.developer = Math.min(100, match.shared.roleTaskProgress.developer + progressUp);
      match.shared.roleStress.developer = Math.min(100, match.shared.roleStress.developer + stressUp);
      recomputeTeamStress(match);
      pushMatchEvent(match, intent.action, intent.userId, { progressUp, stressUp });
      return { ok: true };
    }

    return { ok: false, reason: 'UNKNOWN_ACTION' };
  }

  function resolveParallelWindow(match: CoopMatch, byUserId: string) {
    // deterministic: FIFO by arrival timestamp, one intent per role per window
    const acceptedRoles = new Set<string>();
    const intents = [...match.intentQueue].sort((a, b) => a.ts - b.ts);
    let applied = 0;
    for (const intent of intents) {
      if (acceptedRoles.has(intent.role)) continue;
      const r = applyMatchIntent(match, intent);
      if (r.ok) {
        acceptedRoles.add(intent.role);
        applied += 1;
      }
    }
    match.intentQueue = [];
    match.shared.queuedIntents = 0;
    const intensity = Math.max(1, Math.min(4, Math.floor(match.shared.missionIntensityTier || 1)));
    const missionSteps = Math.max(1, Math.floor(match.shared.missionStepTarget || 8));
    const longRunFactor = Math.max(1, Math.floor((missionSteps - 8) / 2));
    const bugPulse = Math.max(0, intensity + Math.floor(longRunFactor / 3));
    const stressPulse = Math.max(0, Math.floor(intensity / 2) + Math.floor(longRunFactor / 4));
    const infraPulse = Math.max(0, Math.floor((intensity - 1) / 2) + Math.floor(longRunFactor / 5));
    match.shared.bugPressure = Math.min(100, match.shared.bugPressure + bugPulse);
    match.shared.infraReliability = Math.max(0, match.shared.infraReliability - infraPulse);
    match.shared.roleStress.qa = Math.min(100, match.shared.roleStress.qa + stressPulse);
    match.shared.roleStress.admin = Math.min(100, match.shared.roleStress.admin + stressPulse);
    match.shared.roleStress.pm = Math.min(100, match.shared.roleStress.pm + stressPulse);
    match.shared.pressurePulse = { bug: bugPulse, stress: stressPulse, infra: infraPulse };
    recomputeTeamStress(match);
    const order = ['admin', 'developer', 'qa', 'pm'];
    for (const r of order) {
      const prev = match.shared.supportCooldownByRole[r] ?? 0;
      if (prev > 0) match.shared.supportCooldownByRole[r] = prev - 1;
    }
    match.shared.turn += 1;
    match.shared.deadlineTicks = Math.max(0, match.shared.deadlineTicks - 1);
    match.shared.activeRole = 'parallel';
    match.shared.parallelWindowEndsAt = Date.now() + match.shared.parallelWindowMs;
    pushMatchEvent(match, 'parallel_window_resolved', byUserId, {
      applied,
      intents: intents.length,
      pressurePulse: match.shared.pressurePulse,
      missionIntensityTier: match.shared.missionIntensityTier,
      missionStepTarget: match.shared.missionStepTarget,
    });
  }

  function checkReleaseResult(match: CoopMatch): { ok: boolean; note: string } {
    const progressOk = match.shared.projectProgress >= 85;
    const bugsOk = match.shared.bugPressure <= 10;
    const stressOk = match.shared.stress <= 70;
    const infraOk = match.shared.infraReliability >= 55;
    const deadlineOk = match.shared.deadlineTicks > 0;
    const ok = progressOk && bugsOk && stressOk && infraOk && deadlineOk;
    const note = ok
      ? 'RELEASE_OK: команда закрыла окно качества и срока.'
      : `RELEASE_FAIL: ${progressOk ? '' : 'progress<85 '} ${bugsOk ? '' : 'bugs>10 '} ${stressOk ? '' : 'stress>70 '} ${
          infraOk ? '' : 'infra<55 '
        }${deadlineOk ? '' : 'deadline=0 '}`.trim();
    return { ok, note };
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
      const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
      const bodyToken =
        req.body && typeof req.body === 'object' && typeof (req.body as Record<string, unknown>).token === 'string'
          ? ((req.body as Record<string, unknown>).token as string)
          : null;
      const token =
        (authHeader && authHeader.split(' ')[1]) ||
        queryToken ||
        bodyToken;
      if (!token) return sendApiError(res, 401, 'SYNC_NO_TOKEN', 'Нет токена авторизации.');
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
      const name = (error as { name?: string })?.name ?? '';
      if (name === 'JsonWebTokenError' || name === 'TokenExpiredError' || name === 'NotBeforeError') {
        console.warn('[sync] JWT rejected:', name);
        return sendApiError(res, 401, 'SYNC_INVALID_TOKEN', 'Токен недействителен или истёк.');
      }
      console.error('Sync Error:', error);
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
    const restoredPartyId = prev?.partyId ?? partyIdForUser(parties, matches, auth.userId);
    lobbyByUser.set(auth.userId, {
      userId: auth.userId,
      clientUsername: cname,
      displayName: displayName.trim().slice(0, 48),
      coopRole: role,
      lastSeen: Date.now(),
      partyId: restoredPartyId,
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
        supportCooldownByRole: {
          admin: 0,
          developer: 0,
          qa: 0,
          pm: 0,
        },
        mode: 'parallel_window',
        parallelWindowMs: 15000,
        parallelWindowEndsAt: Date.now() + 15000,
        queuedIntents: 0,
        missionStepTarget: 8,
        missionIntensityTier: 1,
        pressurePulse: { bug: 0, stress: 0, infra: 0 },
        lastReleaseCheck: null,
      },
      events: [],
      intentQueue: [],
      seq: 0,
      linkedObjectiveAwardedIds: [],
    };
    matches.set(match.id, match);
    matchByPartyId.set(party.id, match.id);
    schedulePersistMatch(match);
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
    if (
      match.shared.mode === 'parallel_window' &&
      match.status === 'active' &&
      Date.now() >= match.shared.parallelWindowEndsAt
    ) {
      resolveParallelWindow(match, auth.userId);
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
    if (
      match.shared.mode === 'parallel_window' &&
      match.status === 'active' &&
      Date.now() >= match.shared.parallelWindowEndsAt
    ) {
      resolveParallelWindow(match, auth.userId);
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
    const targetRole =
      typeof payload.targetRole === 'string' &&
      ['admin', 'developer', 'qa', 'pm'].includes(payload.targetRole)
        ? payload.targetRole
        : null;

    /** Немедленный вклад non-dev по связанным целям (не очередь parallel_window). */
    if (action === 'apply_linked_sprint_progress') {
      if (!['qa', 'admin', 'pm'].includes(role)) {
        return sendApiError(res, 403, 'COOP_LINKED_ROLE', 'Вклад по связанным целям доступен только QA, Admin или PM.');
      }
      const rawIds = payload.objectiveIds;
      const objectiveIds = Array.isArray(rawIds)
        ? rawIds
            .filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length < 200)
            .slice(0, 4)
        : [];
      const awarded = match.linkedObjectiveAwardedIds ?? (match.linkedObjectiveAwardedIds = []);
      const newIds = objectiveIds.filter((id) => !awarded.includes(id));
      let progressUp = Math.floor(Number(payload.progressUp ?? 0));
      progressUp = Math.max(0, Math.min(25, progressUp));
      const maxByNew = newIds.length > 0 ? Math.min(18, 9 * newIds.length) : 0;
      progressUp = Math.min(progressUp, maxByNew);
      if (progressUp > 0 && newIds.length > 0) {
        for (const id of newIds) awarded.push(id);
        match.shared.projectProgress = Math.min(100, match.shared.projectProgress + progressUp);
        const rk = role as 'qa' | 'admin' | 'pm';
        match.shared.roleTaskProgress[rk] = Math.min(100, match.shared.roleTaskProgress[rk] + progressUp);
        recomputeTeamStress(match);
        pushMatchEvent(match, action, auth.userId, { progressUp, objectiveIds: newIds, role });
      } else {
        pushMatchEvent(match, action, auth.userId, { duplicate: true, objectiveIds, role });
      }
      return res.json({ ok: true, match: compactMatchView(match) });
    }

    if (match.shared.mode === 'sequential' && match.shared.activeRole !== role && action !== 'apply_pm_support') {
      return sendApiError(
        res,
        409,
        'COOP_ROLE_TURN_DENIED',
        `Сейчас ход роли ${match.shared.activeRole}; ваш класс ${role}.`,
      );
    }
    if (match.shared.mode === 'parallel_window') {
      if (action === 'release_check') {
        if (role !== 'pm') return sendApiError(res, 403, 'COOP_PM_ONLY', 'Release-check доступен только PM.');
        const roleSet = new Set(match.memberIds.map((uid) => match.roleByUserId[uid]).filter(Boolean));
        const queuedSet = new Set(match.intentQueue.map((q) => q.role));
        for (const r of roleSet) {
          if (!queuedSet.has(r)) {
            return sendApiError(
              res,
              409,
              'COOP_RELEASE_NOT_READY',
              `Окно не готово: роль ${r} ещё не отправила действие.`,
            );
          }
        }
        resolveParallelWindow(match, auth.userId);
        const rr = checkReleaseResult(match);
        match.shared.lastReleaseCheck = { ok: rr.ok, ts: Date.now(), note: rr.note };
        pushMatchEvent(match, 'release_checked', auth.userId, { ok: rr.ok, note: rr.note });
        return res.json({ ok: true, match: compactMatchView(match) });
      }
      if (action === 'resolve_window') {
        if (auth.userId !== match.hostId && Date.now() < match.shared.parallelWindowEndsAt) {
          return sendApiError(res, 403, 'COOP_HOST_ONLY', 'Только хост может досрочно завершить окно.');
        }
        resolveParallelWindow(match, auth.userId);
        return res.json({ ok: true, match: compactMatchView(match) });
      }
      if (
        action === 'apply_admin_infra' ||
        action === 'apply_qa_defense' ||
        action === 'apply_pm_support' ||
        action === 'apply_dev_progress'
      ) {
        if (Date.now() >= match.shared.parallelWindowEndsAt) {
          resolveParallelWindow(match, auth.userId);
          return res.json({ ok: true, match: compactMatchView(match) });
        }
        const clientActionId =
          typeof body.clientActionId === 'string' && body.clientActionId.trim()
            ? body.clientActionId.trim()
            : `${auth.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        if (match.intentQueue.some((q) => q.clientActionId === clientActionId)) {
          return sendApiError(res, 409, 'COOP_DUPLICATE_ACTION', 'Действие уже принято.');
        }
        const missionStepTarget = Math.max(1, Math.floor(Number(payload.missionStepTarget ?? match.shared.missionStepTarget ?? 8)));
        const missionIntensityTier = Math.max(
          1,
          Math.min(4, Math.floor(Number(payload.missionIntensityTier ?? match.shared.missionIntensityTier ?? 1))),
        );
        match.shared.missionStepTarget = missionStepTarget;
        match.shared.missionIntensityTier = missionIntensityTier;
        match.intentQueue.push({
          clientActionId,
          ts: Date.now(),
          userId: auth.userId,
          role,
          action,
          payload,
        });
        match.shared.queuedIntents = match.intentQueue.length;
        pushMatchEvent(match, 'intent_queued', auth.userId, {
          action,
          clientActionId,
          role,
          missionStepTarget,
          missionIntensityTier,
        });
        return res.json({ ok: true, match: compactMatchView(match) });
      }
    }
    if (action === 'end_turn') {
      const order = ['admin', 'developer', 'qa', 'pm'];
      const curr = order.indexOf(match.shared.activeRole);
      const next = order[(curr + 1 + order.length) % order.length];
      match.shared.activeRole = next;
      match.shared.turn += 1;
      match.shared.deadlineTicks = Math.max(0, match.shared.deadlineTicks - 1);
      for (const r of order) {
        const prev = match.shared.supportCooldownByRole[r] ?? 0;
        if (prev > 0) match.shared.supportCooldownByRole[r] = prev - 1;
      }
      pushMatchEvent(match, action, auth.userId, { fromRole: role, nextRole: next });
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    if (action === 'apply_admin_infra') {
      if ((match.shared.supportCooldownByRole.admin ?? 0) > 0) {
        return sendApiError(res, 409, 'COOP_SUPPORT_COOLDOWN', 'ADMIN support еще на перезарядке.');
      }
      const reliabilityUp = Math.max(0, Math.min(20, Number(payload.reliabilityUp ?? 0)));
      const resourcesDown = Math.max(0, Math.min(20, Number(payload.resourcesDown ?? 0)));
      const stressUp = Math.max(0, Math.min(15, Number(payload.stressUp ?? 2)));
      match.shared.infraReliability = Math.min(100, match.shared.infraReliability + reliabilityUp);
      match.shared.infraResources = Math.max(0, match.shared.infraResources - resourcesDown);
      match.shared.roleTaskProgress.admin = Math.min(100, match.shared.roleTaskProgress.admin + reliabilityUp);
      if (targetRole && targetRole !== 'admin') {
        match.shared.roleTaskProgress[targetRole] = Math.min(
          100,
          (match.shared.roleTaskProgress[targetRole] ?? 0) + Math.max(2, Math.floor(reliabilityUp / 2))
        );
        match.shared.roleStress[targetRole] = Math.max(
          0,
          (match.shared.roleStress[targetRole] ?? 0) - 2
        );
      }
      match.shared.roleStress.admin = Math.min(100, match.shared.roleStress.admin + stressUp);
      match.shared.supportCooldownByRole.admin = 1;
      match.shared.stress = Math.min(
        100,
        Math.round(
          (match.shared.roleStress.admin +
            match.shared.roleStress.developer +
            match.shared.roleStress.qa +
            match.shared.roleStress.pm) / 4
        )
      );
      pushMatchEvent(match, action, auth.userId, { reliabilityUp, resourcesDown, stressUp, targetRole });
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
      if ((match.shared.supportCooldownByRole.qa ?? 0) > 0) {
        return sendApiError(res, 409, 'COOP_SUPPORT_COOLDOWN', 'QA support еще на перезарядке.');
      }
      const bugsDown = Math.max(0, Math.min(20, Number(payload.bugsDown ?? 0)));
      const relUp = Math.max(0, Math.min(10, Number(payload.reliabilityUp ?? 0)));
      const stressDown = Math.max(0, Math.min(15, Number(payload.stressDown ?? 3)));
      match.shared.bugPressure = Math.max(0, match.shared.bugPressure - bugsDown);
      match.shared.infraReliability = Math.min(100, match.shared.infraReliability + relUp);
      match.shared.roleTaskProgress.qa = Math.min(100, match.shared.roleTaskProgress.qa + bugsDown);
      if (targetRole && targetRole !== 'qa') {
        match.shared.roleTaskProgress[targetRole] = Math.min(
          100,
          (match.shared.roleTaskProgress[targetRole] ?? 0) + Math.max(2, Math.floor(bugsDown / 3))
        );
      }
      match.shared.roleStress.qa = Math.max(0, match.shared.roleStress.qa - stressDown);
      match.shared.supportCooldownByRole.qa = 1;
      match.shared.stress = Math.min(
        100,
        Math.round(
          (match.shared.roleStress.admin +
            match.shared.roleStress.developer +
            match.shared.roleStress.qa +
            match.shared.roleStress.pm) / 4
        )
      );
      pushMatchEvent(match, action, auth.userId, { bugsDown, reliabilityUp: relUp, stressDown, targetRole });
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    if (action === 'apply_pm_support') {
      if ((match.shared.supportCooldownByRole.pm ?? 0) > 0) {
        return sendApiError(res, 409, 'COOP_SUPPORT_COOLDOWN', 'PM support еще на перезарядке.');
      }
      const stressDown = Math.max(0, Math.min(20, Number(payload.stressDown ?? 0)));
      const deadlineUp = Math.max(0, Math.min(3, Number(payload.deadlineUp ?? 0)));
      const pmTargetRole = targetRole ?? 'developer';
      match.shared.roleTaskProgress.pm = Math.min(100, match.shared.roleTaskProgress.pm + deadlineUp * 10);
      match.shared.roleStress.pm = Math.max(0, match.shared.roleStress.pm - Math.max(1, Math.floor(stressDown / 2)));
      match.shared.roleStress[pmTargetRole] = Math.max(0, match.shared.roleStress[pmTargetRole] - stressDown);
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
      match.shared.supportCooldownByRole.pm = 1;
      pushMatchEvent(match, action, auth.userId, { stressDown, deadlineUp, targetRole: pmTargetRole });
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

  /** Публичный топ: 10 NPC + до ~200 записей из БД, топ-20. */
  app.get('/neon_v1/coop/startup-rankings', async (_req, res) => {
    try {
      const dbRows = await prisma.coopStartupScore.findMany({
        orderBy: { score: 'desc' },
        take: 200,
        select: { userId: true, startupName: true, score: true },
      });
      res.json({ rows: mergeStartupRankings(dbRows) });
    } catch (error) {
      console.error('startup-rankings GET:', error);
      res.json({ rows: mergeStartupRankings([]) });
    }
  });

  /** Сохранить лучший результат игрока (только если score выше сохранённого). */
  app.post('/neon_v1/coop/startup-rankings/submit', async (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const startupName =
      typeof body.startupName === 'string' ? body.startupName.trim().slice(0, 64) : '';
    const score = Math.max(0, Math.min(9_999_999, Math.floor(Number(body.score ?? 0))));
    const tierRank = typeof body.tierRank === 'string' ? body.tierRank.slice(0, 24) : 'junior';
    const missionsCleared = Math.max(0, Math.floor(Number(body.missionsCleared ?? 0)));
    const bits = Math.max(0, Math.floor(Number(body.bits ?? 0)));
    if (!startupName) {
      return sendApiError(res, 400, 'STARTUP_NAME_REQUIRED', 'Укажите startupName.');
    }
    try {
      const prev = await prisma.coopStartupScore.findUnique({ where: { userId: auth.userId } });
      if (prev && score <= prev.score) {
        return res.json({
          ok: true,
          updated: false,
          entry: {
            userId: prev.userId,
            startupName: prev.startupName,
            score: prev.score,
            tierRank: prev.tierRank,
            missionsCleared: prev.missionsCleared,
            bits: prev.bits,
          },
        });
      }
      const entry = await prisma.coopStartupScore.upsert({
        where: { userId: auth.userId },
        create: {
          userId: auth.userId,
          startupName,
          score,
          tierRank,
          missionsCleared,
          bits,
        },
        update: { startupName, score, tierRank, missionsCleared, bits },
      });
      res.json({
        ok: true,
        updated: true,
        entry: {
          userId: entry.userId,
          startupName: entry.startupName,
          score: entry.score,
          tierRank: entry.tierRank,
          missionsCleared: entry.missionsCleared,
          bits: entry.bits,
        },
      });
    } catch (error) {
      console.error('startup-rankings submit:', error);
      return sendApiError(res, 500, 'STARTUP_RANK_SUBMIT_FAILED', 'Не удалось сохранить рейтинг.');
    }
  });

  registerNeonServices(app, { prisma, jwtSecret, sendApiError });

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

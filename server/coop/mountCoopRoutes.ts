/** Coop lobby, live match, startup rankings — /neon_v1/coop/* */

import type { Express, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import { mergeStartupRankings } from '../coopStartupPregen.js';
import {
  loadActiveCoopMatches,
  loadCoopMatchByPartyId,
  partyIdForUser,
  persistCoopMatch,
  type CoopMatch,
  type CoopMatchEvent,
} from './coopMatchStore.js';
import {
  applyMatchIntent,
  checkReleaseResult,
  compactMatchView,
  recomputeTeamStress,
  resolveParallelWindow,
} from './coopMatchEngine.js';

export type MountCoopRoutesDeps = {
  prisma: PrismaClient;
  jwtSecret: string;
  sendApiError: (res: Response, status: number, code: string, message: string) => void;
};

export function mountCoopRoutes(app: Express, deps: MountCoopRoutesDeps): void {
  const { prisma, jwtSecret, sendApiError } = deps;

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

  function evictFinishedMatch(match: CoopMatch) {
    matches.delete(match.id);
    if (matchByPartyId.get(match.partyId) === match.id) {
      matchByPartyId.delete(match.partyId);
    }
    matchSseByMatchId.delete(match.id);
  }

  function pruneFinishedMatches() {
    for (const match of matches.values()) {
      if (match.status === 'finished') evictFinishedMatch(match);
    }
  }

  function broadcastMatchFrame(matchId: string, frame: string) {
    const listeners = matchSseByMatchId.get(matchId);
    if (!listeners?.size) return;
    for (const res of [...listeners]) {
      try {
        res.write(frame);
      } catch {
        listeners.delete(res);
      }
    }
    if (listeners.size === 0) matchSseByMatchId.delete(matchId);
  }


  async function ensurePartyMatch(partyId: string): Promise<CoopMatch | null> {
    const cachedId = matchByPartyId.get(partyId);
    if (cachedId) {
      const hit = matches.get(cachedId);
      if (hit && hit.status !== 'finished') return hit;
    }
    for (const m of matches.values()) {
      if (m.partyId === partyId && m.status !== 'finished') return m;
    }
    const fromDb = await loadCoopMatchByPartyId(prisma, partyId);
    if (!fromDb || fromDb.status === 'finished') return null;
    matches.set(fromDb.id, fromDb);
    matchByPartyId.set(partyId, fromDb.id);
    return fromDb;
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
    broadcastMatchFrame(match.id, `event: match_update\ndata: ${JSON.stringify({ matchId: match.id, event: evt })}\n\n`);
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
    pruneFinishedMatches();
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

  app.post('/neon_v1/coop/match/create', async (req, res) => {
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
    const resumed = await ensurePartyMatch(party.id);
    if (resumed) {
      return res.json({ ok: true, match: compactMatchView(resumed), reused: true });
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

  app.post('/neon_v1/coop/match/resume', async (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth) return sendApiError(res, 401, 'COOP_NO_TOKEN', 'Нет токена авторизации.');
    pruneLobbyUsers();
    const me = lobbyByUser.get(auth.userId);
    if (!me?.partyId) return sendApiError(res, 400, 'COOP_PARTY_REQUIRED', 'Сначала соберите группу.');
    const party = parties.get(me.partyId);
    if (!party) return sendApiError(res, 400, 'COOP_PARTY_REQUIRED', 'Группа не найдена.');
    if (party.hostId !== auth.userId) {
      return sendApiError(res, 403, 'COOP_HOST_ONLY', 'Только хост может возобновить матч.');
    }
    const fromDb = await loadCoopMatchByPartyId(prisma, party.id);
    if (!fromDb) {
      return sendApiError(res, 404, 'COOP_MATCH_NOT_FOUND', 'Сохранённый матч не найден.');
    }
    fromDb.status = fromDb.status === 'finished' ? 'active' : fromDb.status;
    fromDb.updatedAt = Date.now();
    matches.set(fromDb.id, fromDb);
    matchByPartyId.set(party.id, fromDb.id);
    schedulePersistMatch(fromDb);
    pushMatchEvent(fromDb, 'match_resumed', auth.userId, {});
    res.json({ ok: true, match: compactMatchView(fromDb) });
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
      resolveParallelWindow(match, auth.userId, pushMatchEvent);
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
      resolveParallelWindow(match, auth.userId, pushMatchEvent);
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
        resolveParallelWindow(match, auth.userId, pushMatchEvent);
        const rr = checkReleaseResult(match);
        match.shared.lastReleaseCheck = { ok: rr.ok, ts: Date.now(), note: rr.note };
        pushMatchEvent(match, 'release_checked', auth.userId, { ok: rr.ok, note: rr.note });
        return res.json({ ok: true, match: compactMatchView(match) });
      }
      if (action === 'resolve_window') {
        if (auth.userId !== match.hostId && Date.now() < match.shared.parallelWindowEndsAt) {
          return sendApiError(res, 403, 'COOP_HOST_ONLY', 'Только хост может досрочно завершить окно.');
        }
        resolveParallelWindow(match, auth.userId, pushMatchEvent);
        return res.json({ ok: true, match: compactMatchView(match) });
      }
      if (
        action === 'apply_admin_infra' ||
        action === 'apply_qa_defense' ||
        action === 'apply_pm_support' ||
        action === 'apply_dev_progress'
      ) {
        if (Date.now() >= match.shared.parallelWindowEndsAt) {
          resolveParallelWindow(match, auth.userId, pushMatchEvent);
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
      schedulePersistMatch(match);
      evictFinishedMatch(match);
      return res.json({ ok: true, match: compactMatchView(match) });
    }
    if (action === 'pause_match') {
      if (auth.userId !== match.hostId) {
        return sendApiError(res, 403, 'COOP_HOST_ONLY', 'Только хост может поставить матч на паузу.');
      }
      match.status = 'active';
      pushMatchEvent(match, action, auth.userId, {});
      schedulePersistMatch(match);
      return res.json({ ok: true, match: compactMatchView(match), paused: true });
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
}

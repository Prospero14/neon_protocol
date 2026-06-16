import type { PrismaClient } from '@prisma/client';

export type CoopMatchSharedState = {
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
  supportCooldownByRole: Record<string, number>;
  mode: 'sequential' | 'parallel_window';
  parallelWindowMs: number;
  parallelWindowEndsAt: number;
  queuedIntents: number;
  missionStepTarget: number;
  missionIntensityTier: number;
  pressurePulse: {
    bug: number;
    stress: number;
    infra: number;
  };
  lastReleaseCheck: {
    ok: boolean;
    ts: number;
    note: string;
  } | null;
};

export type CoopMatchIntent = {
  clientActionId: string;
  ts: number;
  userId: string;
  role: string;
  action: string;
  payload: Record<string, unknown>;
};

export type CoopMatchEvent = {
  seq: number;
  ts: number;
  type: string;
  actorUserId: string | null;
  payload: Record<string, unknown>;
};

export type CoopMatch = {
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
  intentQueue: CoopMatchIntent[];
  seq: number;
  linkedObjectiveAwardedIds?: string[];
};

export type CoopParty = {
  id: string;
  hostId: string;
  memberIds: string[];
};

function rowToMatch(row: {
  id: string;
  partyId: string;
  hostId: string;
  status: string;
  memberIds: unknown;
  roleByUserId: unknown;
  shared: unknown;
  events: unknown;
  intentQueue: unknown;
  seq: number;
  linkedObjectiveAwardedIds: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CoopMatch {
  return {
    id: row.id,
    partyId: row.partyId,
    hostId: row.hostId,
    status: row.status as CoopMatch['status'],
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    memberIds: Array.isArray(row.memberIds) ? (row.memberIds as string[]) : [],
    roleByUserId:
      row.roleByUserId && typeof row.roleByUserId === 'object' && !Array.isArray(row.roleByUserId)
        ? (row.roleByUserId as Record<string, string>)
        : {},
    shared: row.shared as CoopMatchSharedState,
    events: Array.isArray(row.events) ? (row.events as CoopMatchEvent[]) : [],
    intentQueue: Array.isArray(row.intentQueue) ? (row.intentQueue as CoopMatchIntent[]) : [],
    seq: row.seq,
    linkedObjectiveAwardedIds: Array.isArray(row.linkedObjectiveAwardedIds)
      ? (row.linkedObjectiveAwardedIds as string[])
      : [],
  };
}

export async function loadActiveCoopMatches(prisma: PrismaClient): Promise<CoopMatch[]> {
  try {
    const rows = await prisma.coopLiveMatch.findMany({
      where: { status: { not: 'finished' } },
    });
    return rows.map(rowToMatch);
  } catch (e) {
    console.warn('[coopMatchStore] load skipped:', (e as Error)?.message ?? e);
    return [];
  }
}

export async function persistCoopMatch(prisma: PrismaClient, match: CoopMatch): Promise<void> {
  try {
    await prisma.coopLiveMatch.upsert({
      where: { id: match.id },
      create: {
        id: match.id,
        partyId: match.partyId,
        hostId: match.hostId,
        status: match.status,
        memberIds: match.memberIds,
        roleByUserId: match.roleByUserId,
        shared: match.shared as object,
        events: match.events as object,
        intentQueue: match.intentQueue as object,
        seq: match.seq,
        linkedObjectiveAwardedIds: match.linkedObjectiveAwardedIds ?? [],
        createdAt: new Date(match.createdAt),
        updatedAt: new Date(match.updatedAt),
      },
      update: {
        hostId: match.hostId,
        status: match.status,
        memberIds: match.memberIds,
        roleByUserId: match.roleByUserId,
        shared: match.shared as object,
        events: match.events as object,
        intentQueue: match.intentQueue as object,
        seq: match.seq,
        linkedObjectiveAwardedIds: match.linkedObjectiveAwardedIds ?? [],
        updatedAt: new Date(match.updatedAt),
      },
    });
  } catch (e) {
    console.error('[coopMatchStore] persist failed:', e);
  }
}

export async function deleteCoopMatch(prisma: PrismaClient, matchId: string): Promise<void> {
  try {
    await prisma.coopLiveMatch.delete({ where: { id: matchId } });
  } catch {
    // already gone
  }
}

/** Восстановить party из активных матчей после рестарта. */
export function partiesFromMatches(matches: Iterable<CoopMatch>): Map<string, CoopParty> {
  const parties = new Map<string, CoopParty>();
  for (const match of matches) {
    if (match.status === 'finished') continue;
    parties.set(match.partyId, {
      id: match.partyId,
      hostId: match.hostId,
      memberIds: [...match.memberIds],
    });
  }
  return parties;
}

export function findMatchForUser(
  matches: Map<string, CoopMatch>,
  matchByPartyId: Map<string, string>,
  userId: string,
): string | null {
  for (const match of matches.values()) {
    if (match.status !== 'finished' && match.memberIds.includes(userId)) {
      return match.id;
    }
  }
  for (const [partyId, matchId] of matchByPartyId) {
    const m = matches.get(matchId);
    if (m && m.memberIds.includes(userId)) return matchId;
    void partyId;
  }
  return null;
}

export function partyIdForUser(
  parties: Map<string, CoopParty>,
  matches: Map<string, CoopMatch>,
  userId: string,
): string | null {
  for (const p of parties.values()) {
    if (p.memberIds.includes(userId)) return p.id;
  }
  for (const m of matches.values()) {
    if (m.status !== 'finished' && m.memberIds.includes(userId)) return m.partyId;
  }
  return null;
}

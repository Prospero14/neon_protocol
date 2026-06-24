/** Общие хелперы NRI-сессии (serialize, resolve, host check). */

import type { PrismaClient } from '@prisma/client';
import type { JwtAuth } from './auth.js';
import { isAdminUsername } from './auth.js';
import { dossierFromSheet } from '../../shared/nri-domain/achievements.js';
import { serializeAchievementState } from './nriAchievementService.js';

export function mergePlayerSheetFromPreset(
  presetSheet: unknown,
  displayName: string,
  clientSheet?: unknown,
): Record<string, unknown> | undefined {
  if (!presetSheet || typeof presetSheet !== 'object') return undefined;
  const base = { ...(presetSheet as Record<string, unknown>) };
  const trimmed = displayName.trim().slice(0, 40);
  let characterName = trimmed;
  if (clientSheet && typeof clientSheet === 'object') {
    const cn = (clientSheet as { characterName?: unknown }).characterName;
    if (typeof cn === 'string' && cn.trim()) characterName = cn.trim().slice(0, 40);
  }
  return { ...base, characterName };
}

export async function resolveNriSession(prisma: PrismaClient, code: string) {
  return prisma.nriSession.findUnique({
    where: { inviteCode: code },
    include: { host: { select: { username: true } } },
  });
}

export function parseNriJsonField(raw: unknown): unknown | null {
  if (raw === null || raw === undefined) return null;
  return raw;
}

export async function requireNriHost(
  session: { hostUserId: string },
  auth: JwtAuth,
  me: { username: string } | null,
) {
  const platformAdmin = me ? isAdminUsername(me.username) : false;
  if (session.hostUserId !== auth.userId && !platformAdmin) return false;
  return true;
}

export function serializeNriPlayer(p: {
  displayName: string;
  classId: string;
  inventory: unknown;
  sheet?: unknown;
  portraitUrl?: string | null;
  presetId?: string | null;
  privateNotes?: string;
  achievementState?: unknown;
}) {
  return {
    displayName: p.displayName,
    classId: p.classId,
    inventory: Array.isArray(p.inventory) ? p.inventory : [],
    sheet: p.sheet ?? null,
    portraitUrl: p.portraitUrl ?? null,
    presetId: p.presetId ?? null,
    privateNotes: p.privateNotes ?? '',
    achievements: serializeAchievementState(p.achievementState),
    dossier: dossierFromSheet(p.sheet),
  };
}

export function serializeNriPreset(p: {
  id: string;
  label: string;
  classId: string;
  inventory: unknown;
  sheet: unknown;
  portraitUrl: string | null;
  publishedToPlayers: boolean;
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
    publishedToPlayers: p.publishedToPlayers,
    sortOrder: p.sortOrder,
    claimed: !!p.claimedByUserId,
    claimedByUserId: p.claimedByUserId,
    createdAt: p.createdAt.getTime(),
  };
}

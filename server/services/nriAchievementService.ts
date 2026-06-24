/** Сохранение и проверка ачивок игрока NRI. */

import type { PrismaClient } from '@prisma/client';
import {
  applyAchievementEvent,
  type AchievementEvent,
  type NriAchievementDef,
  type NriAchievementId,
  NRI_ACHIEVEMENT_BY_ID,
  parseAchievementState,
} from '../../shared/nri-domain/achievements.js';
import { buildAllIceLeaderboards } from '../../shared/nri-domain/iceLeaderboard.js';
import { readWonlongs } from './nriWallet.js';
import { getServerCatalogItem } from './nriItemCatalogServer.js';
import type { InvItem } from './nriItemGrant.js';

export type AchievementUnlockPayload = {
  id: NriAchievementId;
  title: string;
  blurb: string;
  icon: string;
  at: number;
};

function toPayload(id: NriAchievementId, at: number): AchievementUnlockPayload {
  const def = NRI_ACHIEVEMENT_BY_ID[id];
  return { id, title: def.title, blurb: def.blurb, icon: def.icon, at };
}

function sheetHp(sheet: unknown): { hp?: number; hpMax?: number } {
  const o = sheet && typeof sheet === 'object' ? (sheet as Record<string, unknown>) : {};
  return {
    hp: typeof o.hp === 'number' ? o.hp : undefined,
    hpMax: typeof o.hpMax === 'number' ? o.hpMax : undefined,
  };
}

export function inventoryHasEquippedWeapon(inventory: unknown): boolean {
  if (!Array.isArray(inventory)) return false;
  return (inventory as InvItem[]).some((i) => i.equipped === true && i.slot === 'weapon');
}

async function isCybersportsmanLeader(
  prisma: PrismaClient,
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const rows = await prisma.nriIceScore.findMany({
    where: { sessionId, won: true },
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    take: 2000,
  });
  const boards = buildAllIceLeaderboards(rows);
  const ids = Object.keys(boards);
  if (!ids.length) return false;
  for (const entries of Object.values(boards)) {
    if (!entries.length) return false;
    if (entries[0]?.userId !== userId) return false;
  }
  return true;
}

export async function processPlayerAchievements(
  prisma: PrismaClient,
  playerId: string,
  events: AchievementEvent[],
  opts?: { checkCybersportsman?: boolean },
): Promise<AchievementUnlockPayload[]> {
  const player = await prisma.nriPlayer.findUnique({ where: { id: playerId } });
  if (!player) return [];
  if (!events.length && !opts?.checkCybersportsman) return [];

  let state = parseAchievementState(player.achievementState);
  const allNew: NriAchievementId[] = [];
  const at = Date.now();
  const achOpts = { classId: player.classId, at };

  for (const event of events) {
    const { state: next, newlyUnlocked } = applyAchievementEvent(state, event, achOpts);
    state = next;
    allNew.push(...newlyUnlocked);
  }

  if (opts?.checkCybersportsman) {
    const cybersportsman = await isCybersportsmanLeader(prisma, player.sessionId, player.userId);
    const cy = applyAchievementEvent(
      state,
      { type: 'cybersportsman_check', isLeaderAllGames: cybersportsman },
      achOpts,
    );
    state = cy.state;
    allNew.push(...cy.newlyUnlocked);
  }

  const prevParsed = parseAchievementState(player.achievementState);
  if (
    allNew.length === 0 &&
    JSON.stringify(state.unlocked) === JSON.stringify(prevParsed.unlocked) &&
    JSON.stringify(state.progress) === JSON.stringify(prevParsed.progress)
  ) {
    return [];
  }

  await prisma.nriPlayer.update({
    where: { id: playerId },
    data: { achievementState: state as object },
  });

  return allNew.map((id) => toPayload(id, state.unlockedAt[id] ?? at));
}

function hpHealEvents(prevSheet: unknown, nextSheet: unknown): AchievementEvent[] {
  const events: AchievementEvent[] = [];
  const prev = sheetHp(prevSheet);
  const next = sheetHp(nextSheet);
  if (
    prev.hp != null &&
    next.hp != null &&
    next.hpMax != null &&
    next.hp >= next.hpMax &&
    prev.hp < next.hpMax
  ) {
    events.push({ type: 'hp_healed_to_max' });
  }
  if (next.hp != null && next.hpMax != null && next.hp > 0 && next.hp / next.hpMax <= 0.25) {
    events.push({ type: 'hp_low_survived', hp: next.hp, hpMax: next.hpMax });
  }
  return events;
}

export function achievementEventsFromSheetChange(
  prevSheet: unknown,
  nextSheet: unknown,
): AchievementEvent[] {
  const events: AchievementEvent[] = [];
  const prev = prevSheet && typeof prevSheet === 'object' ? (prevSheet as Record<string, unknown>) : {};
  const next = nextSheet && typeof nextSheet === 'object' ? (nextSheet as Record<string, unknown>) : {};

  const prevHp = typeof prev.hp === 'number' ? prev.hp : undefined;
  const nextHp = typeof next.hp === 'number' ? next.hp : undefined;
  if (nextHp === 1 && prevHp !== 1) {
    events.push({
      type: 'hp_updated',
      hp: nextHp,
      hpMax: typeof next.hpMax === 'number' ? next.hpMax : undefined,
    });
  }

  const prevTox = typeof prev.bloodToxCurrent === 'number' ? prev.bloodToxCurrent : 0;
  const nextTox = typeof next.bloodToxCurrent === 'number' ? next.bloodToxCurrent : 0;
  if (nextTox >= 8 && prevTox < 8) {
    events.push({ type: 'blood_tox', value: nextTox });
  }

  const wonlongs = readWonlongs(nextSheet);
  if (wonlongs >= 5000) {
    events.push({ type: 'wonlongs_balance', amount: wonlongs });
  }

  events.push(...hpHealEvents(prevSheet, nextSheet));
  return events;
}

export function achievementEventsFromItemUse(
  catalogId: string | undefined,
  prevSheet: unknown,
  nextSheet: unknown,
): AchievementEvent[] {
  const events: AchievementEvent[] = [];
  if (catalogId) {
    const item = getServerCatalogItem(catalogId);
    events.push({
      type: 'item_used',
      catalogId,
      category: item?.category,
    });
  }
  const o = nextSheet && typeof nextSheet === 'object' ? (nextSheet as Record<string, unknown>) : {};
  const hp = typeof o.hp === 'number' ? o.hp : undefined;
  if (hp === 1) {
    events.push({ type: 'hp_updated', hp, hpMax: typeof o.hpMax === 'number' ? o.hpMax : undefined });
  }
  const tox = typeof o.bloodToxCurrent === 'number' ? o.bloodToxCurrent : 0;
  if (tox >= 8) events.push({ type: 'blood_tox', value: tox });
  const wonlongs = readWonlongs(nextSheet);
  if (wonlongs >= 5000) events.push({ type: 'wonlongs_balance', amount: wonlongs });
  events.push(...hpHealEvents(prevSheet, nextSheet));
  return events;
}

export function achievementEventsFromEquip(
  inventory: InvItem[],
  itemId: string,
): AchievementEvent[] {
  const item = inventory.find((i) => i.id === itemId);
  if (!item?.slot) return [];
  const catalog = item.catalogId ? getServerCatalogItem(item.catalogId) : undefined;
  return [
    {
      type: 'item_equipped',
      catalogId: item.catalogId,
      slot: item.slot,
      category: catalog?.category,
      equipped: !!item.equipped,
    },
  ];
}

export function serializeAchievementState(raw: unknown): {
  unlocked: NriAchievementDef[];
  progress: {
    drugsUsed: string[];
    zonesVisited: string[];
    medConsumablesUsed: string[];
    mercWeaponZones: string[];
  };
} {
  const state = parseAchievementState(raw);
  return {
    unlocked: state.unlocked.map((id) => NRI_ACHIEVEMENT_BY_ID[id]),
    progress: {
      drugsUsed: state.progress.drugsUsed ?? [],
      zonesVisited: state.progress.zonesVisited ?? [],
      medConsumablesUsed: state.progress.medConsumablesUsed ?? [],
      mercWeaponZones: state.progress.mercWeaponZones ?? [],
    },
  };
}

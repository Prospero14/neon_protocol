/**
 * Выбор ТЗ на полигоне coop_yard: ноды → срез миссий тира; босс после 25 побед.
 */

import type { TechnicalTask } from './combatTasks';
import {
  COOP_NODE_MISSION_SLICES,
  COOP_JUNIOR_MISSIONS_FOR_BOSS,
  COOP_YARD_JUNIOR_INTRO_MISSIONS,
  COOP_YARD_MISSIONS_PER_TIER,
} from './coopYardMissions';
import type { SkillMode } from './skillMode';

const TIER_ORDER: SkillMode[] = ['script-kiddie', 'junior', 'mid', 'senior'];

export function tierRankToMissionPrefix(rank: SkillMode): string {
  switch (rank) {
    case 'script-kiddie':
      return 'sk';
    case 'junior':
      return 'ju';
    case 'mid':
      return 'mi';
    case 'senior':
      return 'se';
    default:
      return 'ju';
  }
}

export function bossTaskIdForTier(rank: SkillMode): string {
  return `coop_yard_boss_${tierRankToMissionPrefix(rank)}`;
}

/** Сколько обычных миссий тира уже закрыто (по id). */
export function countCoopTierMissionsCleared(completedIds: string[], tierRank: SkillMode): number {
  const p = tierRankToMissionPrefix(tierRank);
  const re = new RegExp(`^coop_yard_${p}_\\d{3}$`);
  return completedIds.filter((id) => re.test(id)).length;
}

export function coopMissionsRequiredForBoss(tierRank: SkillMode): number {
  if (tierRank === 'junior') return COOP_JUNIOR_MISSIONS_FOR_BOSS;
  return COOP_YARD_MISSIONS_PER_TIER;
}

export function isCoopBossUnlocked(completedIds: string[], tierRank: SkillMode): boolean {
  const need = coopMissionsRequiredForBoss(tierRank);
  return countCoopTierMissionsCleared(completedIds, tierRank) >= need;
}

export function isCoopCodewarsStageUnlocked(completedIds: string[], tierRank: SkillMode): boolean {
  if (tierRank !== 'junior') return true;
  return countCoopTierMissionsCleared(completedIds, tierRank) >= COOP_YARD_JUNIOR_INTRO_MISSIONS;
}

export function nextCoopTierRank(rank: SkillMode): SkillMode | null {
  const i = TIER_ORDER.indexOf(rank);
  if (i < 0 || i >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[i + 1];
}

/**
 * Индекс ТЗ в уже отфильтрованной библиотеке (safeLibrary), либо 0.
 */
export function resolveCoopYardTaskIndexInLibrary(
  safeLibrary: TechnicalTask[],
  barNode: string | null,
  completedIds: string[],
  tierRank: SkillMode
): number {
  if (!barNode) return 0;

  if (barNode === 'coop_cp_boss') {
    const bid = bossTaskIdForTier(tierRank);
    const bi = safeLibrary.findIndex((t) => t.id === bid);
    return bi >= 0 ? bi : 0;
  }

  const slice = COOP_NODE_MISSION_SLICES[barNode];
  if (!slice) {
    const byNode = safeLibrary.findIndex((t) => t.id === barNode);
    return byNode >= 0 ? byNode : 0;
  }

  const tierMissions = safeLibrary
    .filter((t) => !t.id.includes('_boss_'))
    .sort((a, b) => a.id.localeCompare(b.id));
  const [from, to] = slice;
  const subset = tierMissions.slice(from, Math.min(to, tierMissions.length));
  const next = subset.find((t) => !completedIds.includes(t.id)) ?? subset[0];
  if (!next) return 0;
  const idx = safeLibrary.findIndex((t) => t.id === next.id);
  return idx >= 0 ? idx : 0;
}

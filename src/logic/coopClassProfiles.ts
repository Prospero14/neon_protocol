/**
 * Отдельное состояние коопа на каждый класс: колода, инвентарь, прогресс полигона, открытые карты, стек dev.
 */

import type { CombatCard } from './combatCards';
import { getCardById } from './combatCards';
import type { SkillMode } from './skillMode';
import type { CoopRole, DevLanguageStack } from './sessionMode';
import { COOP_ROLES, buildStarterDeckForSession } from './sessionMode';

export type CoopClassSave = {
  deckIds: string[];
  inventoryIds: string[];
  coopTierRank: SkillMode;
  coopYardCompletedMissionIds: string[];
  discoveredCardIds: string[];
  devLanguageStack: DevLanguageStack | null;
  coopSprintConsecutiveLosses: number;
};

export function defaultCoopClassSave(
  role: CoopRole,
  devStack: DevLanguageStack | null
): CoopClassSave {
  const deck = buildStarterDeckForSession(
    'coop',
    role,
    role === 'developer' ? devStack ?? 'java' : null
  );
  const ids = deck.map((c) => c.id);
  const invUnique = [...new Set(ids)];
  return {
    deckIds: ids,
    inventoryIds: invUnique,
    coopTierRank: 'junior',
    coopYardCompletedMissionIds: [],
    discoveredCardIds: [...invUnique],
    devLanguageStack: role === 'developer' ? devStack ?? 'java' : null,
    coopSprintConsecutiveLosses: 0,
  };
}

export function serializeCoopClassSave(params: {
  activeDeck: CombatCard[];
  inventoryUnique: CombatCard[];
  coopTierRank: SkillMode;
  coopYardCompletedMissionIds: string[];
  discoveredCardIds: Set<string>;
  devLanguageStack: DevLanguageStack | null;
  coopSprintConsecutiveLosses: number;
}): CoopClassSave {
  return {
    deckIds: params.activeDeck.map((c) => c.id),
    inventoryIds: params.inventoryUnique.map((c) => c.id),
    coopTierRank: params.coopTierRank,
    coopYardCompletedMissionIds: [...params.coopYardCompletedMissionIds],
    discoveredCardIds: [...params.discoveredCardIds].sort(),
    devLanguageStack: params.devLanguageStack,
    coopSprintConsecutiveLosses: params.coopSprintConsecutiveLosses,
  };
}

export function hydrateDeckFromIds(ids: string[]): CombatCard[] {
  return ids.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
}

export function hydrateInventoryFromIds(ids: string[]): CombatCard[] {
  const seen = new Set<string>();
  const out: CombatCard[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const c = getCardById(id);
    if (c) out.push(c);
  }
  return out;
}

/** Применить сохранённый профиль к рантайму (колода с дубликатами по id, как в бою). */
export function applyCoopClassSave(save: CoopClassSave): {
  activeDeck: CombatCard[];
  inventory: CombatCard[];
  coopTierRank: SkillMode;
  coopYardCompletedMissionIds: string[];
  discoveredCardIds: Set<string>;
  devLanguageStack: DevLanguageStack | null;
  coopSprintConsecutiveLosses: number;
} {
  const activeDeck = hydrateDeckFromIds(save.deckIds);
  const inventory = hydrateInventoryFromIds(save.inventoryIds);
  return {
    activeDeck,
    inventory,
    coopTierRank: save.coopTierRank,
    coopYardCompletedMissionIds: [...save.coopYardCompletedMissionIds],
    discoveredCardIds: new Set(save.discoveredCardIds),
    devLanguageStack: save.devLanguageStack,
    coopSprintConsecutiveLosses: save.coopSprintConsecutiveLosses,
  };
}

export function migrateLegacyCoopToProfiles(gs: {
  coopRole?: string | null;
  activeDeck?: { id: string }[];
  inventory?: { id: string }[];
  coopTierRank?: SkillMode;
  coopYardCompletedMissionIds?: string[];
  discoveredCardIds?: string[];
  devLanguageStack?: string | null;
  coopSprintConsecutiveLosses?: number;
}): Partial<Record<CoopRole, CoopClassSave>> | null {
  const role = gs.coopRole as CoopRole | undefined;
  if (!role || !COOP_ROLES.includes(role)) return null;
  const deckIds = (gs.activeDeck ?? []).map((c) => c.id).filter(Boolean);
  const inventoryIds = (gs.inventory ?? []).map((c) => c.id).filter(Boolean);
  if (deckIds.length === 0 && inventoryIds.length === 0) return null;
  return {
    [role]: {
      deckIds,
      inventoryIds: inventoryIds.length ? [...new Set(inventoryIds)] : [...new Set(deckIds)],
      coopTierRank:
        gs.coopTierRank === 'script-kiddie' ||
        gs.coopTierRank === 'junior' ||
        gs.coopTierRank === 'mid' ||
        gs.coopTierRank === 'senior'
          ? gs.coopTierRank
          : 'junior',
      coopYardCompletedMissionIds: Array.isArray(gs.coopYardCompletedMissionIds)
        ? [...gs.coopYardCompletedMissionIds]
        : [],
      discoveredCardIds: Array.isArray(gs.discoveredCardIds) ? [...gs.discoveredCardIds].sort() : [...new Set(deckIds)],
      devLanguageStack:
        role === 'developer' &&
        (gs.devLanguageStack === 'java' ||
          gs.devLanguageStack === 'kotlin' ||
          gs.devLanguageStack === 'python' ||
          gs.devLanguageStack === 'go')
          ? gs.devLanguageStack
          : null,
      coopSprintConsecutiveLosses: typeof gs.coopSprintConsecutiveLosses === 'number' ? gs.coopSprintConsecutiveLosses : 0,
    },
  };
}

export const COOP_PROFILES_STORAGE_KEY = (userId: string) => `neon_v1_coop_class_profiles_${userId}`;

import { getConditionDef } from './conditionDefs.js';
import type { AbilityMods, ConditionId, SheetCondition } from './types.js';

export function conditionFromDef(
  id: ConditionId,
  opts?: { source?: string; rounds?: number; minutes?: number }
): SheetCondition {
  const def = getConditionDef(id)!;
  const now = Date.now();
  const rounds = opts?.rounds ?? def.defaultRounds;
  const minutes = opts?.minutes ?? def.defaultMinutes;
  return {
    id,
    label: def.label,
    source: opts?.source,
    appliedAt: now,
    expiresAt: minutes ? now + minutes * 60_000 : undefined,
    roundsLeft: rounds,
    abilityMods: def.abilityMods ? { ...def.abilityMods } : undefined,
    acMod: def.acMod,
    notes: def.blurb,
  };
}

export function pruneExpiredConditions(conditions: SheetCondition[], now = Date.now()): SheetCondition[] {
  return conditions.filter((c) => !c.expiresAt || c.expiresAt > now);
}

export function applyConditionStack(existing: SheetCondition[], incoming: SheetCondition): SheetCondition[] {
  const def = getConditionDef(incoming.id);
  const same = existing.find((c) => c.id === incoming.id);
  if (same && def?.escalateTo) {
    const next = conditionFromDef(def.escalateTo, {
      source: incoming.source,
      rounds: incoming.roundsLeft,
    });
    return [...existing.filter((c) => c.id !== incoming.id && c.id !== def.escalateTo), next];
  }
  return [...existing.filter((c) => c.id !== incoming.id), incoming];
}

export function mergeConditionMods(conditions: SheetCondition[]): AbilityMods {
  const out: AbilityMods = {};
  for (const c of conditions) {
    if (!c.abilityMods) continue;
    for (const [k, v] of Object.entries(c.abilityMods)) {
      const key = k as keyof AbilityMods;
      if (typeof v === 'number') out[key] = (out[key] ?? 0) + v;
    }
  }
  return out;
}

export function mergeConditionAcMod(conditions: SheetCondition[]): number {
  return conditions.reduce((s, c) => s + (c.acMod ?? 0), 0);
}

export function tickConditionRoundsList(conditions: SheetCondition[], delta = 1): SheetCondition[] {
  return pruneExpiredConditions(
    conditions
      .map((c) => {
        if (c.roundsLeft == null) return c;
        return { ...c, roundsLeft: c.roundsLeft - delta };
      })
      .filter((c) => c.roundsLeft == null || c.roundsLeft > 0)
  );
}

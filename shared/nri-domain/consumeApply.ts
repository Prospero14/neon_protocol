import { CONDITION_LABELS } from './conditionDefs.js';
import { applyConditionStack, conditionFromDef, pruneExpiredConditions } from './conditionLogic.js';
import type { ConditionId, ConsumableSheet, ConsumeEffectSpec } from './types.js';

export function applyConsumeEffects(
  sheet: ConsumableSheet,
  spec: ConsumeEffectSpec,
  sourceName: string
): { sheet: ConsumableSheet; applied: string[] } {
  const applied: string[] = [];
  const next: ConsumableSheet = { ...sheet };
  let conditions = pruneExpiredConditions([...(sheet.activeConditions ?? [])]);

  for (const id of spec.conditions ?? []) {
    const cond = conditionFromDef(id as ConditionId, {
      source: sourceName,
      rounds: spec.conditionRounds,
    });
    conditions = applyConditionStack(conditions, cond);
    applied.push(CONDITION_LABELS[id] ?? cond.label);
  }

  if (spec.hpHeal) {
    const hpMax = next.hpMax;
    next.hp = Math.min(hpMax, (next.hp ?? hpMax) + spec.hpHeal);
    applied.push(`+${spec.hpHeal} HP`);
  }
  if (spec.hpDamage) {
    next.hp = Math.max(0, (next.hp ?? next.hpMax) - spec.hpDamage);
    applied.push(`−${spec.hpDamage} HP`);
  }
  if (spec.bloodToxDelta) {
    next.bloodToxCurrent = (next.bloodToxCurrent ?? 0) + spec.bloodToxDelta;
    applied.push(`Blood Tox +${spec.bloodToxDelta}`);
  }

  next.activeConditions = conditions;
  return { sheet: next, applied };
}

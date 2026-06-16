/** catalogId → эффект при «использовать». */

import consumeJson from '../../shared/nri-consume-effects.json';
import type { ConditionId } from './nriConditions';

export type ConsumeEffectSpec = {
  conditions?: ConditionId[];
  conditionRounds?: number;
  hpHeal?: number;
  hpDamage?: number;
  bloodToxDelta?: number;
};

export const CONSUME_EFFECTS = consumeJson as Record<string, ConsumeEffectSpec>;

export function getConsumeEffect(catalogId: string | undefined): ConsumeEffectSpec | undefined {
  if (!catalogId) return undefined;
  return CONSUME_EFFECTS[catalogId];
}

export function isConsumableCategory(category: string | undefined, slot: string | undefined): boolean {
  if (category === 'consumable' || category === 'drug') return true;
  return slot === 'quick';
}

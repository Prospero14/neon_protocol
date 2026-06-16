/** Общие типы NRI domain (клиент + сервер). */

export type ConditionId =
  | 'intoxicated_mild'
  | 'intoxicated'
  | 'intoxicated_severe'
  | 'poisoned'
  | 'stunned'
  | 'frightened'
  | 'exhausted_1'
  | 'exhausted_2'
  | 'boosted'
  | 'sedated'
  | 'bleeding'
  | 'prone'
  | 'blinded'
  | 'high';

export type AbilityMods = Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>>;

export type SheetCondition = {
  id: ConditionId;
  label: string;
  source?: string;
  appliedAt: number;
  expiresAt?: number;
  roundsLeft?: number;
  abilityMods?: AbilityMods;
  acMod?: number;
  notes?: string;
};

export type ConditionDef = {
  id: ConditionId;
  label: string;
  blurb: string;
  abilityMods?: AbilityMods;
  acMod?: number;
  defaultRounds?: number;
  defaultMinutes?: number;
  escalateTo?: ConditionId;
};

export type ConsumeEffectSpec = {
  conditions?: ConditionId[];
  conditionRounds?: number;
  hpHeal?: number;
  hpDamage?: number;
  bloodToxDelta?: number;
};

/** Минимальный срез листа для применения расходника. */
export type ConsumableSheet = {
  abilities: Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>;
  hp?: number;
  hpMax: number;
  bloodToxCurrent?: number;
  activeConditions?: SheetCondition[];
};

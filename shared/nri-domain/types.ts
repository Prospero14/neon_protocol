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
  | 'high'
  | 'pain'
  | 'analgesia'
  | 'lukolite_buffer';

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
  /** Вклад в метрику киберпсихоза, пока статус активен. */
  psychosisStress?: number;
};

export type ConsumeEffectSpec = {
  conditions?: ConditionId[];
  /** Снять статусы (боль/яд/кровотечение) — PS падает сам. */
  removeConditions?: ConditionId[];
  conditionRounds?: number;
  /** Wall-clock duration; overrides ConditionDef.defaultMinutes when set. */
  conditionMinutes?: number;
  hpHeal?: number;
  hpDamage?: number;
  /** Может быть отрицательным (Lukolite / клиника). */
  bloodToxDelta?: number;
};

/** Минимальный срез листа для применения расходника. */
export type ConsumableSheet = {
  abilities: Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>;
  hp?: number;
  hpMax: number;
  bloodToxCurrent?: number;
  bloodToxLimit?: number;
  activeConditions?: SheetCondition[];
  psychosisScarLevel?: number;
  psychosisPending?: boolean;
  psychosisHistory?: Array<{
    id: string;
    at: number;
    stressAtTrigger: number;
    scarAfter: number;
    notes?: string;
  }>;
  psychosisEncounter?: { active: boolean; startedAt: number; peerUserId?: string } | null;
};

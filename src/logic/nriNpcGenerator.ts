/** Генерация НПС по Carbon 2185 (2d6+5 × 6, HP по классу). */

import { rollCharacterName } from './nriNames';
import type { NriClassId } from './nriClasses';
import { getC2185ClassTemplate } from './nriCarbon2185';
import type { InstalledAugmentation } from './nriCyberInstall';
import { enrichSheetCombat } from './nriSheetCombat';

export type NriSheetData = {
  abilities: Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>;
  level: number;
  proficiencyBonus: number;
  hpMax: number;
  hp: number;
  ac: number;
  origin?: string;
  activity?: string;
  vice?: string;
  notes?: string;
  characterName?: string;
  age?: string;
  career?: string;
  yearsServed?: string;
  streetInfluence?: string;
  corporateInfluence?: string;
  backstory?: string;
  clothing?: string;
  npcArchetype?: string;
  xp?: number;
  wonlongs?: number;
  skillProficiencies?: string[];
  /** Черты класса (signature + traits) — копия при генерации. */
  classFeatures?: string[];
  attacks?: { name: string; atkBonus: number; damage: string }[];
  height?: string;
  weight?: string;
  skin?: string;
  hair?: string;
  eyes?: string;
  culture?: string;
  dr?: string;
  deathSaveSuccesses?: number;
  deathSaveFailures?: number;
  bloodToxCurrent?: number;
  bloodToxLimit?: number;
  augmentations?: InstalledAugmentation[];
  encumberedLb?: string;
  heavilyEncumberedLb?: string;
  maxCarryLb?: string;
  /** Кличка / позывной. */
  nickname?: string;
  originId?: string;
  activityId?: string;
  /** Активные состояния (дебафы/бафы). */
  activeConditions?: import('./nriConditions').SheetCondition[];
};

export function abilityModifier(score: number): number {
  if (score <= 7) return -2;
  if (score <= 9) return -1;
  if (score <= 11) return 0;
  if (score <= 13) return 1;
  if (score <= 15) return 2;
  if (score <= 17) return 3;
  if (score <= 19) return 4;
  return 5;
}

export function rollAbilityScores(): Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number> {
  const roll = () => {
    const d6 = () => Math.floor(Math.random() * 6) + 1;
    return d6() + d6() + 5;
  };
  return {
    STR: roll(),
    DEX: roll(),
    CON: roll(),
    INT: roll(),
    TEC: roll(),
    PEO: roll(),
  };
}

const HIT_DIE_AVG: Record<string, number> = {
  d12: 7,
  d10: 6,
  d8: 5,
};

export function buildSheetForClass(classId: NriClassId, abilities = rollAbilityScores()): NriSheetData {
  const tpl = getC2185ClassTemplate(classId);
  const conMod = abilityModifier(abilities.CON);
  const dexMod = abilityModifier(abilities.DEX);
  const hitDie = tpl?.hitDie ?? 'd8';
  const hpMax = (HIT_DIE_AVG[hitDie] ?? 5) + conMod + (hitDie === 'd12' ? 5 : hitDie === 'd10' ? 4 : 3);
  return enrichSheetCombat(
    {
      abilities,
      level: 1,
      proficiencyBonus: 2,
      hpMax: Math.max(1, hpMax),
      hp: Math.max(1, hpMax),
      ac: 10 + dexMod,
      wonlongs: 50 + Math.floor(Math.random() * 6) * 50,
    },
    classId
  );
}

export function parseNriSheet(raw: unknown): NriSheetData | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as NriSheetData;
  if (!o.abilities || typeof o.abilities !== 'object') return null;
  return o;
}

/** Случайное имя в духе Carbon 2185 (таблицы random NPC). */
export function rollNpcName(originId?: Parameters<typeof rollCharacterName>[0]): string {
  return rollCharacterName(originId ?? 'neo_tokyo');
}

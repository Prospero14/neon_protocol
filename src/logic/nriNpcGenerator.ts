/** Генерация НПС по Carbon 2185 (2d6+5 × 6, HP по классу). */

import type { NriClassId } from './nriClasses';
import { getC2185ClassTemplate } from './nriCarbon2185';

export type NriSheetData = {
  abilities: Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>;
  level: number;
  proficiencyBonus: number;
  hpMax: number;
  hp: number;
  ac: number;
  origin?: string;
  vice?: string;
  notes?: string;
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
  return {
    abilities,
    level: 1,
    proficiencyBonus: 2,
    hpMax: Math.max(1, hpMax),
    hp: Math.max(1, hpMax),
    ac: 10 + dexMod,
  };
}

export function parseNriSheet(raw: unknown): NriSheetData | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as NriSheetData;
  if (!o.abilities || typeof o.abilities !== 'object') return null;
  return o;
}

const NPC_FIRST = [
  'Jackie', 'Raven', 'Mako', 'Yuki', 'Dex', 'Nova', 'Kai', 'Lena', 'Rook', 'Sable',
  'Viktor', 'Mei', 'Juno', 'Cyrus', 'Zara', 'Hiro', 'Nix', 'Tess', 'Wolf', 'Iris',
] as const;

const NPC_LAST = [
  'Chow', 'Vega', 'Sato', 'Kane', 'Cross', 'Hayashi', 'Reed', 'Voss', 'Tanaka', 'Mercer',
  'Okada', 'Stone', 'Lin', 'Wright', 'Park', 'Ashford', 'Nguyen', 'Blake', 'Chen', 'Ross',
] as const;

/** Случайное имя в духе Carbon 2185 (таблицы random NPC). */
export function rollNpcName(): string {
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!;
  return `${pick(NPC_FIRST)} ${pick(NPC_LAST)}`;
}

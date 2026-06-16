import { describe, it, expect } from 'vitest';
import {
  applyConditionStack,
  conditionFromDef,
  applyConditionsToSheet,
  mergeConditionMods,
  pruneExpiredConditions,
} from './nriConditions';
import type { NriSheetData } from './nriNpcGenerator';

function baseSheet(): NriSheetData {
  return {
    abilities: { STR: 10, DEX: 14, CON: 12, INT: 10, TEC: 10, PEO: 10 },
    level: 1,
    proficiencyBonus: 2,
    hpMax: 20,
    hp: 20,
    ac: 12,
  };
}

describe('nriConditions', () => {
  it('applies DEX debuff from mild intoxication', () => {
    const sheet = applyConditionsToSheet({
      ...baseSheet(),
      activeConditions: [conditionFromDef('intoxicated_mild', { rounds: 10 })],
    });
    expect(sheet.abilities.DEX).toBe(13); // 14 - 1
  });

  it('escalates intoxication on stack', () => {
    const first = conditionFromDef('intoxicated_mild', { source: 'пиво' });
    const stacked = applyConditionStack([], first);
    const second = conditionFromDef('intoxicated_mild', { source: 'ещё пиво' });
    const result = applyConditionStack(stacked, second);
    expect(result.some((c) => c.id === 'intoxicated')).toBe(true);
    expect(result.filter((c) => c.id === 'intoxicated_mild')).toHaveLength(0);
  });

  it('prunes expired by timestamp', () => {
    const past = Date.now() - 1000;
    const conditions = [
      { ...conditionFromDef('boosted'), expiresAt: past },
      conditionFromDef('sedated'),
    ];
    const pruned = pruneExpiredConditions(conditions);
    expect(pruned).toHaveLength(1);
    expect(pruned[0]!.id).toBe('sedated');
  });

  it('merges ability mods from multiple conditions', () => {
    const mods = mergeConditionMods([
      conditionFromDef('intoxicated_mild'),
      conditionFromDef('exhausted_2'),
    ]);
    expect(mods.DEX).toBe(-2); // mild -1 + exhausted_2 DEX -1
    expect(mods.STR).toBe(-1);
  });
});

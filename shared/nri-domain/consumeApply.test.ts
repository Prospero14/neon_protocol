import { describe, it, expect } from 'vitest';
import { applyConsumeEffects } from './consumeApply.js';
import { applyConditionStack, conditionFromDef } from './conditionLogic.js';

function sheet() {
  return {
    abilities: { STR: 10, DEX: 14, CON: 12, INT: 10, TEC: 10, PEO: 10 },
    hp: 20,
    hpMax: 20,
    activeConditions: [],
  };
}

describe('shared consumeApply', () => {
  it('applies mild intoxication', () => {
    const r = applyConsumeEffects(sheet(), { conditions: ['intoxicated_mild'], conditionRounds: 10 }, 'Синто-спирт');
    expect(r.sheet.activeConditions?.some((c) => c.id === 'intoxicated_mild')).toBe(true);
  });

  it('escalates intoxicated to severe', () => {
    const mild = conditionFromDef('intoxicated_mild', { source: 'a' });
    const stacked = applyConditionStack([], mild);
    const again = applyConditionStack(stacked, conditionFromDef('intoxicated_mild', { source: 'b' }));
    expect(again.some((c) => c.id === 'intoxicated')).toBe(true);
    const third = applyConditionStack(again, conditionFromDef('intoxicated', { source: 'c' }));
    expect(third.some((c) => c.id === 'intoxicated_severe')).toBe(true);
  });

  it('applies multi-condition spec', () => {
    const r = applyConsumeEffects(
      sheet(),
      { conditions: ['boosted', 'high'], conditionRounds: 8, bloodToxDelta: 1 },
      'Синтококаин'
    );
    expect(r.sheet.activeConditions?.length).toBe(2);
    expect(r.sheet.bloodToxCurrent).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { baseQuestBits, applyBitModifiers } from './economy';
import { coopAdjustAiDeltas, coopChainProgressBonus, coopOutplayExtras } from './coopCombatRole';
import { pickNextBugAction } from './combatEnemies';
import { BUGS } from './combatEnemies';

describe('economy', () => {
  it('baseQuestBits растёт с tier и difficulty', () => {
    expect(baseQuestBits(1, 'quick')).toBeLessThan(baseQuestBits(2, 'quick'));
    expect(baseQuestBits(1, 'quick')).toBeLessThan(baseQuestBits(1, 'standard'));
    expect(baseQuestBits(1, 'standard')).toBeLessThan(baseQuestBits(1, 'hard'));
  });

  it('applyBitModifiers: preClass снижает выплату', () => {
    const traits: { id: string }[] = [];
    const full = applyBitModifiers(100, traits as any, false);
    const pre = applyBitModifiers(100, traits as any, true);
    expect(pre).toBeLessThanOrEqual(full);
    expect(pre).toBeGreaterThanOrEqual(5);
  });
});

describe('coopCombatRole (синергия)', () => {
  it('coopAdjustAiDeltas различает роли при одинаковых входах', () => {
    const base = { t: 10, b: 10, s: 10 };
    const dev = coopAdjustAiDeltas('developer', base.t, base.b, base.s);
    const qa = coopAdjustAiDeltas('qa', base.t, base.b, base.s);
    expect(dev.threatDelta).toBeGreaterThanOrEqual(qa.threatDelta - 1);
    expect(qa.bugDelta).toBeLessThan(dev.bugDelta);
  });

  it('developer получает бонус к цепочкам', () => {
    expect(coopChainProgressBonus('developer', 10)).toBeGreaterThan(coopChainProgressBonus('pm', 10));
  });

  it('qa получает extras при outplay', () => {
    expect(coopOutplayExtras('qa', true).bugExtra).toBeGreaterThan(0);
    expect(coopOutplayExtras('pm', true).bugExtra).toBe(0);
  });
});

describe('combatEnemies.pickNextBugAction', () => {
  it('возвращает действие из списка врага', () => {
    const bug = BUGS.find((b) => b.actions.length > 1);
    expect(bug).toBeDefined();
    const a = pickNextBugAction(bug!, [], { phase: 'DEVELOPMENT', bugPressure: 0, playerProgress: 0 });
    expect(bug!.actions.some((x) => x.id === a.id)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { baseQuestBits, applyBitModifiers } from './economy';
import { coopAdjustAiDeltas, coopChainProgressBonus, coopOutplayExtras } from './coopCombatRole';
import { pickNextBugAction } from './combatEnemies';
import { BUGS } from './combatEnemies';
import { coopSegmentBitsBonus } from './coopLobbyRewards';
import { buildStarterDeckForSession } from './sessionMode';

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
  const ice = BUGS.find((b) => b.id === 'enemy_ice')!;

  it('возвращает действие из списка врага', () => {
    const bug = BUGS.find((b) => b.actions.length > 1);
    expect(bug).toBeDefined();
    const a = pickNextBugAction(bug!, [], { phase: 'DEVELOPMENT', bugPressure: 0, playerProgress: 0 });
    expect(bug!.actions.some((x) => x.id === a.id)).toBe(true);
  });

  it('random≈0 выбирает первое действие при равных весах (enemy_ice, пустая история)', () => {
    const a = pickNextBugAction(ice, [], {
      phase: 'DEVELOPMENT',
      bugPressure: 0,
      playerProgress: 0,
      random: () => 0,
    });
    expect(a.id).toBe('ice_shock');
  });

  it('random→1− выбирает последнее действие при двух равных базовых весах', () => {
    const a = pickNextBugAction(ice, [], {
      phase: 'DEVELOPMENT',
      bugPressure: 0,
      playerProgress: 0,
      random: () => 1 - Number.EPSILON,
    });
    expect(a.id).toBe('ice_lock');
  });

  it('после ice_shock штраф к id снижает долю повтора (random в «втором» интервале → ice_lock)', () => {
    const a = pickNextBugAction(ice, [{ id: 'ice_shock', problemType: 'LOGIC_GAP' }], {
      phase: 'DEVELOPMENT',
      bugPressure: 0,
      playerProgress: 0,
      random: () => 0.35,
    });
    expect(a.id).toBe('ice_lock');
  });
});

describe('coopLobbyRewards.coopSegmentBitsBonus', () => {
  it('растёт с сегментом и рангом (целые Bits)', () => {
    expect(coopSegmentBitsBonus('script-kiddie', 0)).toBe(38);
    expect(coopSegmentBitsBonus('script-kiddie', 1)).toBe(60);
    expect(coopSegmentBitsBonus('senior', 2)).toBe(Math.floor((38 + 44) * 1.45));
  });
});

describe('sessionMode.buildStarterDeckForSession (coop accents)', () => {
  it('кооп-роли: колода ≤14 карт и не пустая', () => {
    for (const role of ['qa', 'pm', 'admin', 'developer'] as const) {
      const deck = buildStarterDeckForSession('coop', role, role === 'developer' ? 'java' : null);
      expect(deck.length).toBeGreaterThan(0);
      expect(deck.length).toBeLessThanOrEqual(14);
    }
  });
});

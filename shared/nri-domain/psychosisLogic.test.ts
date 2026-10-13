import { describe, it, expect } from 'vitest';
import {
  computePsychosis,
  startPsychosisEncounter,
  resolvePsychosisEncounter,
  applyPsychosisScarMods,
  markPsychosisPendingIfNeeded,
  PSYCHOSIS_THRESHOLDS,
} from './psychosisLogic.js';
import { conditionFromDef } from './conditionLogic.js';
import { applyConsumeEffects } from './consumeApply.js';

describe('psychosisLogic', () => {
  it('builds chrome floor from BT and overage', () => {
    const snap = computePsychosis({
      bloodToxCurrent: 14,
      bloodToxLimit: 12,
      activeConditions: [],
    });
    expect(snap.fromChrome).toBe(Math.round(14 * 1.5));
    expect(snap.fromOverage).toBe(16);
    expect(snap.total).toBeGreaterThanOrEqual(PSYCHOSIS_THRESHOLDS.unstable);
  });

  it('adds alcohol/drug stress from conditions', () => {
    const base = computePsychosis({ bloodToxCurrent: 0, bloodToxLimit: 12, activeConditions: [] });
    const drunk = computePsychosis({
      bloodToxCurrent: 0,
      bloodToxLimit: 12,
      activeConditions: [conditionFromDef('intoxicated_mild'), conditionFromDef('high')],
    });
    expect(drunk.fromConditions).toBe(4 + 10);
    expect(drunk.total).toBe(base.total + 14);
  });

  it('pain medicine and analgesia lower stress; clearing pending when below episode', () => {
    const painful = {
      bloodToxCurrent: 4,
      bloodToxLimit: 12,
      activeConditions: [conditionFromDef('pain'), conditionFromDef('bleeding')],
      psychosisPending: true,
    };
    const before = computePsychosis(painful).total;
    const afterMed = applyConsumeEffects(
      { abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, TEC: 10, PEO: 10 }, hp: 10, hpMax: 10, ...painful },
      {
        removeConditions: ['pain', 'bleeding'],
        conditions: ['analgesia'],
        conditionRounds: 6,
      },
      'Бинты'
    );
    const after = computePsychosis(afterMed.sheet).total;
    expect(after).toBeLessThan(before);
    expect(afterMed.sheet.activeConditions?.some((c) => c.id === 'pain')).toBe(false);
    expect(afterMed.sheet.activeConditions?.some((c) => c.id === 'analgesia')).toBe(true);
    expect(afterMed.sheet.psychosisPending).toBe(false);
  });

  it('marks pending at episode threshold and resolves with scar', () => {
    let sheet = markPsychosisPendingIfNeeded({
      bloodToxCurrent: 20,
      bloodToxLimit: 10,
      activeConditions: [conditionFromDef('intoxicated_severe'), conditionFromDef('bleeding')],
      psychosisScarLevel: 0,
    });
    expect(sheet.psychosisPending).toBe(true);
    sheet = startPsychosisEncounter(sheet, { peerUserId: 'u1' });
    expect(sheet.psychosisEncounter?.active).toBe(true);
    const { sheet: done, event } = resolvePsychosisEncounter(sheet, { notes: 'галлюцинации ICE' });
    expect(done.psychosisScarLevel).toBe(1);
    expect(done.psychosisPending).toBe(false);
    expect(done.psychosisEncounter).toBeNull();
    expect(done.psychosisHistory).toHaveLength(1);
    expect(event.scarAfter).toBe(1);
    const withScar = applyPsychosisScarMods({
      abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, TEC: 10, PEO: 10 },
      psychosisScarLevel: done.psychosisScarLevel,
    });
    expect(withScar.abilities.PEO).toBe(9);
  });
});

import { describe, expect, it } from 'vitest';
import { isCoopBossUnlocked, coopMissionsRequiredForBoss } from './coopYardRuntime';
import { COOP_JUNIOR_MISSIONS_FOR_BOSS } from './coopYardMissions';

describe('coop boss unlock (junior → mid gate)', () => {
  it('junior requires 15 tier missions, not 25', () => {
    expect(coopMissionsRequiredForBoss('junior')).toBe(15);
    expect(COOP_JUNIOR_MISSIONS_FOR_BOSS).toBe(15);
  });

  it('unlocks boss after 15 junior mission ids', () => {
    const ids = Array.from({ length: 15 }, (_, i) => `coop_yard_ju_${String(i + 1).padStart(3, '0')}`);
    expect(isCoopBossUnlocked(ids, 'junior')).toBe(true);
  });

  it('does not unlock at 14', () => {
    const ids = Array.from({ length: 14 }, (_, i) => `coop_yard_ju_${String(i + 1).padStart(3, '0')}`);
    expect(isCoopBossUnlocked(ids, 'junior')).toBe(false);
  });
});

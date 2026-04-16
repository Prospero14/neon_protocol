import { describe, expect, it } from 'vitest';
import { TZ_LIBRARY } from './combatTasks';
import { validateCoopMissionCardCoverage } from './coopMissionCoverage';

function byId(id: string) {
  return TZ_LIBRARY.find((t) => t.id === id);
}

describe('coopYard missions generation', () => {
  it('junior first 10 missions are expanded to 10+ steps', () => {
    for (let i = 1; i <= 10; i++) {
      const id = `coop_yard_ju_${String(i).padStart(3, '0')}`;
      const task = byId(id);
      expect(task, id).toBeDefined();
      expect(task!.steps.length).toBeGreaterThanOrEqual(10);
      expect(task!.source).toBe('coop_yard');
    }
  });

  it('junior after first 10 switches to codewars source', () => {
    const task = byId('coop_yard_ju_011');
    expect(task).toBeDefined();
    expect(task!.source).toBe('codewars');
  });

  it('all ranks have long-run target length and intensity metadata', () => {
    const ids = ['coop_yard_sk_001', 'coop_yard_ju_025', 'coop_yard_mi_010', 'coop_yard_se_010'];
    for (const id of ids) {
      const task = byId(id);
      expect(task, id).toBeDefined();
      expect(task!.isExecutionChain).toBe(true);
      expect(task!.steps.length).toBeGreaterThanOrEqual(10);
      expect(task!.intensityTier).toBeGreaterThanOrEqual(1);
      expect(task!.intensityTier).toBeLessThanOrEqual(4);
    }
  });
});

describe('coopYard card coverage', () => {
  it('all coop_yard steps are covered by role catalogs', () => {
    const issues = validateCoopMissionCardCoverage(TZ_LIBRARY);
    expect(issues).toEqual([]);
  });
});


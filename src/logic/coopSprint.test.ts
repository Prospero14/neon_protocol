import { describe, it, expect } from 'vitest';
import {
  COOP_SPRINT_MAX_ATTEMPTS,
  buildCoopSprintReport,
  getCoopBriefTz,
  scorePlayerRole,
  shouldLiquidateStartup,
  type CoopSprintMetrics,
} from './coopSprint';
import type { CoopRole, DevLanguageStack } from './sessionMode';

const ROLES: CoopRole[] = ['developer', 'qa', 'admin', 'pm'];
const STACKS: DevLanguageStack[] = ['java', 'kotlin', 'python', 'go'];

function metricsVariant(seed: number, won: boolean): CoopSprintMetrics {
  return {
    won,
    stressEnd: (seed * 7) % 101,
    bugPointsEnd: (seed * 3) % 8,
    playerProgressEnd: won ? 100 : (seed * 11) % 100,
    aiProgressEnd: (seed * 5) % 100,
    aiDeadlineEnd: (seed % 8) + 1,
    chainLength: (seed % 12) + 1,
    deploymentOk: seed % 2 === 0,
  };
}

describe('coopSprint', () => {
  it('shouldLiquidateStartup после трёх поражений подряд', () => {
    expect(shouldLiquidateStartup(0)).toBe(false);
    expect(shouldLiquidateStartup(2)).toBe(false);
    expect(shouldLiquidateStartup(3)).toBe(true);
    expect(shouldLiquidateStartup(5)).toBe(true);
  });

  it('getCoopBriefTz содержит имя стартапа и лимит попыток', () => {
    const t = getCoopBriefTz('NeonLab', 'TASK_X');
    expect(t).toContain('NeonLab');
    expect(t).toContain('TASK_X');
    expect(t).toContain(String(COOP_SPRINT_MAX_ATTEMPTS));
  });

  it.each(ROLES)('scorePlayerRole возвращает 0–100 для роли %s', (role) => {
    for (let i = 0; i < 10; i++) {
      const m = metricsVariant(i + 1, i % 2 === 0);
      const s = scorePlayerRole(role, m);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it.each(ROLES.flatMap((role) => STACKS.map((stack) => [role, stack] as const)))(
    'buildCoopSprintReport стабилен для %s + %s (10 вариантов метрик)',
    (role, stack) => {
    for (let seed = 0; seed < 10; seed++) {
      const m = metricsVariant(seed + 1, seed % 3 !== 0);
      const r = buildCoopSprintReport(role, stack, m);
      expect(r.overall).toBeGreaterThanOrEqual(0);
      expect(r.overall).toBeLessThanOrEqual(100);
      expect(r.playerCriteria.length).toBeGreaterThan(0);
      expect(r.squad.length).toBe(4);
      expect(r.squad.some((x) => x.role === role)).toBe(true);
    }
    }
  );
});

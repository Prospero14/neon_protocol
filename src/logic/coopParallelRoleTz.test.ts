import { describe, it, expect } from 'vitest';
import { coopParallelTzForRole } from './coopParallelRoleTz';
import type { TechnicalTask } from './combatTasks';

const stub: TechnicalTask = {
  id: 't1',
  name: 'DEV_MISSION',
  description: 'dev desc',
  rank: 'junior',
  steps: [
    { id: '1', name: 'STEP_A', requiredCardIds: ['script_ping'] },
    { id: '2', name: 'STEP_B', requiredCardIds: ['script_ssh'] },
  ],
};

describe('coopParallelTzForRole', () => {
  it('returns same object for developer or solo', () => {
    expect(coopParallelTzForRole(stub, 'coop', 'developer')).toBe(stub);
    expect(coopParallelTzForRole(stub, 'solo', 'qa')).toBe(stub);
  });

  it('keeps step card ids for qa but rewrites labels', () => {
    const v = coopParallelTzForRole(stub, 'coop', 'qa');
    expect(v).not.toBe(stub);
    expect(v.name).toContain('QA');
    expect(v.steps[0].requiredCardIds).toEqual(['script_ping']);
    expect(v.steps[0].name).toContain('QA');
    expect(v.steps[1].name).toContain('STEP_B');
  });

  it('does not embed full dev mission description for admin', () => {
    const v = coopParallelTzForRole(stub, 'coop', 'admin');
    expect(v.description).not.toContain('dev desc');
    expect(v.description).toContain('DEV-чеклист');
  });
});

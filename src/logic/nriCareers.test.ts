import { describe, expect, it } from 'vitest';
import { rollCareer, careersForClass } from './nriCareers';

describe('nriCareers', () => {
  it('exposes large per-class pool', () => {
    expect(careersForClass('detective').length).toBeGreaterThanOrEqual(20);
    expect(careersForClass('merc').length).toBeGreaterThanOrEqual(18);
  });

  it('rolls detective careers with corp bias for corp activity', () => {
    const samples = Array.from({ length: 40 }, () =>
      rollCareer({ classId: 'detective', activityId: 'corp', archetypeId: 'corp_exec' })
    );
    const corpish = samples.filter((s) => /корпоратив|комплаенс|Arasaka|внутренн/i.test(s));
    expect(corpish.length).toBeGreaterThan(10);
  });

  it('rolls state-leaning careers for cop archetype', () => {
    const samples = Array.from({ length: 40 }, () =>
      rollCareer({ classId: 'detective', activityId: 'military', archetypeId: 'cop' })
    );
    const stateish = samples.filter((s) => /NCPD|прокуратур|мэрии|таможен/i.test(s));
    expect(stateish.length).toBeGreaterThan(8);
  });
});

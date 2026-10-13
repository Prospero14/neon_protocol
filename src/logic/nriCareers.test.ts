import { describe, expect, it } from 'vitest';
import {
  careerEligible,
  careerRequirements,
  careersForClass,
  factionSectorBias,
  rollCareer,
} from './nriCareers';

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

describe('nriCareers rank gates', () => {
  const base = {
    classId: 'daimyo' as const,
    activityId: 'criminal' as const,
    archetypeId: 'gang' as const,
    originId: 'moscow' as const,
  };

  it('requires years+influence for captain titles', () => {
    const req = careerRequirements('Капитан клана', ['underground']);
    expect(req.minYears).toBeGreaterThanOrEqual(6);
    expect(req.minStreet).toBeGreaterThanOrEqual(5);
  });

  it('blocks clan captain for 1 year / street 1', () => {
    expect(
      careerEligible('Капитан клана', ['underground'], {
        yearsServed: 1,
        streetInfluence: 1,
        corporateInfluence: 0,
      })
    ).toBe(false);
  });

  it('never rolls clan captain with 1 year and street 1', () => {
    const samples = Array.from({ length: 50 }, () =>
      rollCareer({
        ...base,
        yearsServed: 1,
        streetInfluence: 1,
        corporateInfluence: 0,
        factionKind: 'gang',
        factionName: 'Клан Ворон',
      })
    );
    expect(samples.some((s) => /капитан клана|глава уличной|смотрящ|военачальник/i.test(s))).toBe(false);
  });

  it('can roll captain when years and street are high', () => {
    const samples = Array.from({ length: 60 }, () =>
      rollCareer({
        ...base,
        yearsServed: 10,
        streetInfluence: 8,
        corporateInfluence: 2,
        factionKind: 'gang',
        factionName: 'Клан Ворон',
      })
    );
    expect(samples.some((s) => /капитан|глава|смотрящ|старший/i.test(s))).toBe(true);
  });

  it('biases faction kind gang toward underground', () => {
    const bias = factionSectorBias('gang', 'Якудза Востока');
    expect(bias.underground ?? 0).toBeGreaterThan(bias.corp ?? 0);
  });
});

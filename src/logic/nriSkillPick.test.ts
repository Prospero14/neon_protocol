import { describe, it, expect } from 'vitest';
import { C2185_SKILLS } from './nriCarbon2185';
import { NRI_CLASSES } from './nriClasses';
import {
  classSkillPool,
  defaultSkillsForClass,
  parseClassSkillPool,
  validateSkillPick,
} from './nriSkillPick';

describe('nriSkillPick', () => {
  it('defines global C2185 skill list (27+)', () => {
    expect(C2185_SKILLS.length).toBeGreaterThanOrEqual(27);
  });

  it('each class has pick-2-from-pool', () => {
    for (const cls of NRI_CLASSES) {
      const { pickCount, options } = classSkillPool(cls.id);
      expect(pickCount).toBe(2);
      expect(options.length).toBeGreaterThanOrEqual(6);
      expect(options.length).toBeLessThanOrEqual(7);
    }
  });

  it('parses Russian skillsPick string', () => {
    const { pickCount, options } = parseClassSkillPool(
      '2 из Athletics, Stealth, Streetwise, Vehicles (Land)'
    );
    expect(pickCount).toBe(2);
    expect(options).toContain('Vehicles (Land)');
  });

  it('validates correct pick', () => {
    const picked = defaultSkillsForClass('merc');
    expect(validateSkillPick('merc', picked)).toBeNull();
  });

  it('rejects wrong count', () => {
    expect(validateSkillPick('merc', ['Athletics'])).toMatch(/ровно 2/);
  });

  it('rejects skill outside pool', () => {
    expect(validateSkillPick('hacker', ['Athletics', 'Hacking'])).toMatch(/не входит/);
  });
});

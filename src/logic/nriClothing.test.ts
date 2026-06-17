import { describe, expect, it } from 'vitest';
import { generateRichClothing } from './nriClothing';

describe('nriClothing', () => {
  it('generates non-empty cyberpunk outfit', () => {
    const text = generateRichClothing({
      originId: 'moscow',
      activityId: 'military',
      archetypeId: 'mercenary',
      classId: 'merc',
    });
    expect(text.length).toBeGreaterThan(40);
  });

  it('varies by origin and activity', () => {
    const a = generateRichClothing({
      originId: 'neo_tokyo',
      activityId: 'tech',
      archetypeId: 'netrunner',
      classId: 'hacker',
    });
    const b = generateRichClothing({
      originId: 'offworld',
      activityId: 'nomad',
      archetypeId: 'civilian',
      classId: 'fixer',
    });
    expect(a).not.toBe(b);
  });
});

import { describe, it, expect } from 'vitest';
import { PORTRAIT_CLASS_ACCENT } from './nriPortraitCyberpunk';

describe('nriPortraitCyberpunk', () => {
  it('has accents for all playable classes', () => {
    for (const id of ['daimyo', 'doc', 'merc', 'hacker', 'detective', 'fixer']) {
      expect(PORTRAIT_CLASS_ACCENT[id]).toMatch(/^#/);
    }
  });
});

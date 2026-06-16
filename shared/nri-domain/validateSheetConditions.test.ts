import { describe, expect, it } from 'vitest';
import { validateSheetActiveConditions } from './validateSheetConditions.js';

describe('validateSheetActiveConditions', () => {
  it('accepts empty or missing activeConditions', () => {
    expect(validateSheetActiveConditions(null).ok).toBe(true);
    expect(validateSheetActiveConditions({ abilities: {} }).ok).toBe(true);
    expect(validateSheetActiveConditions({ activeConditions: [] }).ok).toBe(true);
  });

  it('accepts known condition ids', () => {
    const r = validateSheetActiveConditions({
      activeConditions: [{ id: 'intoxicated_mild', label: 'x', appliedAt: 1 }],
    });
    expect(r.ok).toBe(true);
  });

  it('rejects unknown condition ids', () => {
    const r = validateSheetActiveConditions({
      activeConditions: [{ id: 'god_mode', label: 'cheat', appliedAt: 1 }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('INVALID_CONDITION_ID');
      expect(r.invalidIds).toContain('god_mode');
    }
  });

  it('rejects non-array activeConditions', () => {
    const r = validateSheetActiveConditions({ activeConditions: 'bad' });
    expect(r.ok).toBe(false);
  });
});

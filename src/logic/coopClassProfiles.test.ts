import { describe, expect, it } from 'vitest';
import { applyCoopClassSave, normalizeCoopClassProfiles } from './coopClassProfiles';

describe('coopClassProfiles hardening', () => {
  it('applyCoopClassSave tolerates missing array fields', () => {
    const applied = applyCoopClassSave({
      deckIds: ['syntax_main_method'],
      inventoryIds: ['syntax_main_method'],
      coopTierRank: 'junior',
      coopYardCompletedMissionIds: null as unknown as string[],
      discoveredCardIds: undefined as unknown as string[],
      devLanguageStack: null,
      coopSprintConsecutiveLosses: 0,
    });
    expect(applied.coopYardCompletedMissionIds).toEqual([]);
    expect([...applied.discoveredCardIds]).toEqual([]);
  });

  it('normalizeCoopClassProfiles drops malformed entries', () => {
    const normalized = normalizeCoopClassProfiles({
      developer: {
        deckIds: ['syntax_main_method'],
        inventoryIds: 'bad' as unknown as string[],
        coopYardCompletedMissionIds: 'bad' as unknown as string[],
        discoveredCardIds: null,
      },
      qa: { deckIds: [] },
    });
    expect(normalized.developer?.coopYardCompletedMissionIds).toEqual([]);
    expect(normalized.qa).toBeUndefined();
  });
});

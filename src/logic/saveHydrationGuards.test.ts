import { describe, expect, it } from 'vitest';
import {
  asImplantList,
  asNumberRecord,
  asQuestStates,
  asStringArray,
  hydrateDeckEntries,
  parseSolvedChainsStorage,
  sanitizeClientGameState,
} from './saveHydrationGuards';

describe('saveHydrationGuards', () => {
  it('asStringArray rejects non-arrays', () => {
    expect(asStringArray(null)).toEqual([]);
    expect(asStringArray(['a', 1, 'b'])).toEqual(['a', 'b']);
  });

  it('asNumberRecord merges valid numeric fields', () => {
    expect(asNumberRecord({ junior: 2, bad: 'x' }, { junior: 0 })).toEqual({ junior: 2 });
  });

  it('asQuestStates filters invalid entries', () => {
    expect(asQuestStates([{ questId: 'q1', status: 'active', tracked: true }, { questId: 1 }])).toEqual([
      { questId: 'q1', status: 'active', tracked: true },
    ]);
  });

  it('parseSolvedChainsStorage tolerates broken chain', () => {
    expect(parseSolvedChainsStorage([{ taskId: 't1', name: 'n', chain: 'bad' }])).toEqual([
      { taskId: 't1', name: 'n', chain: [] },
    ]);
  });

  it('hydrateDeckEntries skips malformed cards', () => {
    expect(hydrateDeckEntries([{ id: 'c1' }, {}, { id: 2 }])).toEqual([{ id: 'c1' }]);
  });

  it('asImplantList skips invalid implants', () => {
    expect(asImplantList([{ id: 'i1', battlesLeft: 3 }, { id: '' }])).toEqual([{ id: 'i1', battlesLeft: 3 }]);
  });

  it('sanitizeClientGameState repairs broken arrays', () => {
    const out = sanitizeClientGameState({
      sessionMode: 'coop',
      coopYardCompletedMissionIds: 'bad',
      traits: 'bad',
      activeDeck: { id: 'x' },
    });
    expect(out?.coopYardCompletedMissionIds).toEqual([]);
    expect(out?.traits).toEqual([]);
    expect(out?.activeDeck).toEqual([]);
  });
});

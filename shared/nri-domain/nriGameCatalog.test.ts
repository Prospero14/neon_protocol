import { describe, expect, it } from 'vitest';
import { assertUniqueIceCatalog, NRI_GAME_CATALOG } from '../../src/logic/nriGameCatalog.js';
import { NRI_ICE_GAME_IDS } from './iceLeaderboard.js';

describe('NRI_GAME_CATALOG', () => {
  it('has unique ids and engines (no duplicate minigames)', () => {
    expect(() => assertUniqueIceCatalog()).not.toThrow();
    const ids = NRI_GAME_CATALOG.map((g) => g.id);
    const engines = NRI_GAME_CATALOG.map((g) => g.engine);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(engines).size).toBe(engines.length);
  });

  it('stays in sync with NRI_ICE_GAME_IDS', () => {
    const catalogIds = NRI_GAME_CATALOG.map((g) => g.id).sort();
    expect([...NRI_ICE_GAME_IDS].sort()).toEqual(catalogIds);
  });

  it('does not include removed zero_day_chain', () => {
    expect(NRI_GAME_CATALOG.some((g) => g.id === 'zero_day_chain')).toBe(false);
    expect(NRI_ICE_GAME_IDS.includes('zero_day_chain' as never)).toBe(false);
  });

  it('assertUniqueIceCatalog throws on duplicate id', () => {
    const dup = [
      ...NRI_GAME_CATALOG,
      { ...NRI_GAME_CATALOG[0], engine: 'breach' as const },
    ];
    expect(() => assertUniqueIceCatalog(dup)).toThrow(/Duplicate ICE game ids/);
  });

  it('assertUniqueIceCatalog throws on duplicate engine', () => {
    const dup = NRI_GAME_CATALOG.map((g, i) =>
      i === 1 ? { ...g, id: 'fake_dup_engine', engine: NRI_GAME_CATALOG[0].engine } : g,
    );
    expect(() => assertUniqueIceCatalog(dup)).toThrow(/Duplicate ICE game engines/);
  });

  it('every game has three difficulty tiers with params', () => {
    for (const g of NRI_GAME_CATALOG) {
      for (const d of ['easy', 'medium', 'hard'] as const) {
        expect(g.difficulties[d]?.params).toBeDefined();
        expect(g.difficulties[d]?.label.length).toBeGreaterThan(0);
      }
    }
  });
});

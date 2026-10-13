import { describe, expect, it } from 'vitest';
import { buildRollPool, executeRoll, formatRollChatText, resolveAbilityForRoll } from './c2185RollPool.js';

const sheet = {
  abilities: { STR: 10, DEX: 16, CON: 12, INT: 14, TEC: 14, PEO: 10 },
  proficiencyBonus: 2,
  skillProficiencies: ['Hacking', 'Mechanics', 'Stealth'],
  saveProficiencies: ['Reflex'],
  activeConditions: [{ id: 'boosted', label: 'Стим', abilityMods: { DEX: 1 } }],
};

describe('c2185RollPool', () => {
  it('skill Hacking: TEC + prof + deck', () => {
    const pool = buildRollPool({
      kind: 'skill',
      skillName: 'Hacking',
      sheet,
      inventory: [{ catalogId: 'g_cyberdeck' }],
    });
    expect(pool.modifierTotal).toBe(2 + 2 + 1); // TEC14=+2, prof+2, deck+1
    expect(pool.terms.some((t) => t.label === 'deck')).toBe(true);
  });

  it('lockpick adds +2 with g_lockpick', () => {
    const pool = buildRollPool({
      kind: 'lockpick',
      sheet,
      inventory: [{ catalogId: 'g_lockpick' }],
    });
    expect(pool.terms.some((t) => t.label === 'lockpick' && t.value === 2)).toBe(true);
    expect(pool.modifierTotal).toBe(2 + 2 + 2); // TEC + prof Mechanics + lockpick
  });

  it('initiative folds condition into ability score (not flat +1 term)', () => {
    // DEX 16 + stim +1 score → 17 → still mod +3
    const pool = buildRollPool({ kind: 'initiative', sheet });
    expect(pool.terms.find((t) => t.label === 'DEX')?.value).toBe(3);
    expect(pool.modifierTotal).toBe(3);
    expect(pool.scoreNotes?.[0]).toMatch(/DEX/);
  });

  it('implant c2185Mods raise ability mod when score crosses threshold', () => {
    const withImplant = {
      ...sheet,
      activeConditions: [],
      augmentations: [{ name: 'Neural Lace', c2185Mods: { TEC: 2 } }],
    };
    // TEC 14+2=16 → mod +3 (was +2)
    const resolved = resolveAbilityForRoll(withImplant, 'TEC');
    expect(resolved.score).toBe(16);
    expect(resolved.mod).toBe(3);
    const pool = buildRollPool({ kind: 'skill', skillName: 'Hacking', sheet: withImplant });
    expect(pool.terms.find((t) => t.label === 'TEC')?.value).toBe(3);
    expect(pool.scoreNotes?.some((n) => n.includes('Neural Lace'))).toBe(true);
  });

  it('psychosis scar lowers PEO score for rolls', () => {
    const scarred = { ...sheet, activeConditions: [], psychosisScarLevel: 1 };
    const r = resolveAbilityForRoll(scarred, 'PEO');
    expect(r.score).toBe(9); // 10 - 1
    expect(r.mod).toBe(-1);
  });

  it('equipped gear c2185Mods count like implants', () => {
    const r = resolveAbilityForRoll(sheet, 'STR', [{ name: 'Power Glove', equipped: true, c2185Mods: { STR: 2 } }]);
    expect(r.score).toBe(12);
    expect(r.mod).toBe(1);
  });

  it('death has no mods', () => {
    const pool = buildRollPool({ kind: 'death', sheet });
    expect(pool.modifierTotal).toBe(0);
  });

  it('executeRoll sums kept die + mods and shows implant notes in chat', () => {
    const withImplant = {
      ...sheet,
      activeConditions: [],
      augmentations: [{ name: 'Lace', c2185Mods: { TEC: 2 } }],
    };
    const pool = buildRollPool({ kind: 'ability', ability: 'TEC', sheet: withImplant });
    const rng = () => 0.45;
    const r = executeRoll(pool, rng);
    expect(r.kept).toBe(10);
    expect(r.total).toBe(10 + pool.modifierTotal);
    expect(r.breakdown).toContain('d20(10)');
    expect(formatRollChatText(r, { secret: true })).toMatch(/secret/);
    expect(formatRollChatText(r)).toMatch(/Lace/);
  });
});

import { describe, it, expect } from 'vitest';
import { tryUseItemServer } from './nriItemConsumeServer.js';

describe('nriItemConsumeServer', () => {
  const sheet = {
    abilities: { STR: 10, DEX: 14, CON: 12, INT: 10, TEC: 10, PEO: 10 },
    hp: 20,
    hpMax: 20,
    activeConditions: [] as Record<string, unknown>[],
  };

  it('applies intoxication from synthohol', () => {
    const inv = [{ id: 'i1', catalogId: 'drug_synthohol', name: 'Синто-спирт', slot: 'quick' }];
    const r = tryUseItemServer(sheet, inv, 'i1');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const conds = r.sheet.activeConditions as { id: string }[];
    expect(conds.some((c) => c.id === 'intoxicated_mild')).toBe(true);
  });

  it('escalates to intoxicated on second drink', () => {
    const inv = [{ id: 'i1', catalogId: 'drug_synthohol', name: 'Синто-спирт', slot: 'quick', qty: 2 }];
    const r1 = tryUseItemServer(sheet, inv, 'i1');
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const inv2 = [{ id: 'i1', catalogId: 'drug_synthohol', name: 'Синто-спирт', slot: 'quick', qty: 1 }];
    const r2 = tryUseItemServer(r1.sheet, inv2, 'i1');
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    const conds = r2.sheet.activeConditions as { id: string }[];
    expect(conds.some((c) => c.id === 'intoxicated')).toBe(true);
  });
});

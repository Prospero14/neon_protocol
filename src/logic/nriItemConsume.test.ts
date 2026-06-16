import { describe, it, expect } from 'vitest';
import { tryUseInventoryItem } from './nriItemConsume';
import type { NriInventoryItem } from './nriInventory';

function sheet() {
  return {
    abilities: { STR: 10, DEX: 14, CON: 12, INT: 10, TEC: 10, PEO: 10 },
    level: 1,
    proficiencyBonus: 2,
    hpMax: 20,
    hp: 10,
    ac: 12,
    activeConditions: [],
  };
}

function synthohol(): NriInventoryItem {
  return {
    id: 'inv_1',
    catalogId: 'drug_synthohol',
    name: 'Синто-спирт',
    slot: 'quick',
    qty: 2,
  };
}

describe('nriItemConsume', () => {
  it('consumes one item and applies intoxication', () => {
    const result = tryUseInventoryItem(sheet(), [synthohol()], 'inv_1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory[0]?.qty).toBe(1);
    expect(result.sheet.activeConditions?.some((c) => c.id === 'intoxicated_mild')).toBe(true);
    expect(result.applied.some((a) => a.includes('опьянение') || a === 'Лёгкое опьянение')).toBe(true);
  });

  it('heals HP from medstim', () => {
    const item: NriInventoryItem = {
      id: 'm1',
      catalogId: 'cons_medstim',
      name: 'МедиСтим',
      slot: 'quick',
    };
    const result = tryUseInventoryItem(sheet(), [item], 'm1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sheet.hp).toBe(18);
    expect(result.inventory).toHaveLength(0);
  });

  it('rejects equip-only items', () => {
    const item: NriInventoryItem = {
      id: 'w1',
      catalogId: 'w_tactical_knife',
      name: 'Нож',
      slot: 'weapon',
    };
    const result = tryUseInventoryItem(sheet(), [item], 'w1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/экипировать/i);
  });

  it('escalates intoxication on second drink', () => {
    const s1 = tryUseInventoryItem(sheet(), [synthohol()], 'inv_1');
    expect(s1.ok).toBe(true);
    if (!s1.ok) return;
    const item2: NriInventoryItem = { ...synthohol(), id: 'inv_2', qty: 1 };
    const s2 = tryUseInventoryItem(s1.sheet, [item2], 'inv_2');
    expect(s2.ok).toBe(true);
    if (!s2.ok) return;
    expect(s2.sheet.activeConditions?.some((c) => c.id === 'intoxicated')).toBe(true);
  });
});

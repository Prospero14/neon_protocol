import { describe, it, expect } from 'vitest';
import { applyEquippedToSheet, toggleEquipInventory } from './nriItemEquip';
import type { NriInventoryItem } from './nriInventory';
import type { NriSheetData } from './nriNpcGenerator';

function sheet(): NriSheetData {
  return {
    abilities: { STR: 10, DEX: 12, CON: 10, INT: 10, TEC: 10, PEO: 10 },
    level: 1,
    proficiencyBonus: 2,
    hpMax: 10,
    hp: 10,
    ac: 12,
  };
}

const jacket: NriInventoryItem = {
  id: 'a1',
  catalogId: 'a_synthleather',
  name: 'Синт-куртка',
  slot: 'armor',
  acBonus: 2,
  c2185Mods: { DEX: 1 },
};

describe('nriItemEquip', () => {
  it('applies AC and ability mods only while equipped', () => {
    const inv = toggleEquipInventory([jacket], 'a1');
    expect(inv[0]?.equipped).toBe(true);
    const withGear = applyEquippedToSheet(sheet(), inv);
    expect(withGear.ac).toBe(14);
    expect(withGear.abilities.DEX).toBe(13);

    const off = toggleEquipInventory(inv, 'a1');
    expect(off[0]?.equipped).toBe(false);
    const bare = applyEquippedToSheet(sheet(), off);
    expect(bare.ac).toBe(12);
    expect(bare.abilities.DEX).toBe(12);
  });
});

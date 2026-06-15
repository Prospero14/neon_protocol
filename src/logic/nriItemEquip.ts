/** Экипировка предметов: бонусы только на equipped. */

import type { NriInventoryItem } from './nriInventory';
import type { NriSheetData } from './nriNpcGenerator';
import { abilityModifier } from './nriNpcGenerator';
import { formatSignedMod } from './nriSheetCombat';
import type { C2185SheetAttack } from './nriSheetCombat';

const EQUIPPABLE_SLOTS = new Set(['weapon', 'armor', 'accessory']);

export function canEquipItem(item: NriInventoryItem): boolean {
  return !!item.slot && EQUIPPABLE_SLOTS.has(item.slot);
}

export function toggleEquipInventory(items: NriInventoryItem[], itemId: string): NriInventoryItem[] {
  const target = items.find((i) => i.id === itemId);
  if (!target || !canEquipItem(target)) return items;
  const nextEquipped = !target.equipped;
  return items.map((i) => {
    if (i.id === itemId) return { ...i, equipped: nextEquipped };
    if (nextEquipped && i.slot === target.slot) return { ...i, equipped: false };
    return i;
  });
}

export function equippedItems(items: NriInventoryItem[]): NriInventoryItem[] {
  return items.filter((i) => i.equipped);
}

export function applyEquippedToSheet(sheet: NriSheetData, items: NriInventoryItem[]): NriSheetData {
  const eq = equippedItems(items);
  if (eq.length === 0) return sheet;
  const abilities = { ...sheet.abilities };
  let ac = sheet.ac ?? 10 + abilityModifier(sheet.abilities.DEX);
  for (const item of eq) {
    if (item.c2185Mods) {
      for (const key of Object.keys(item.c2185Mods) as (keyof typeof abilities)[]) {
        const delta = item.c2185Mods[key];
        if (typeof delta === 'number') abilities[key] = (abilities[key] ?? 10) + delta;
      }
    }
    if (typeof item.acBonus === 'number') ac += item.acBonus;
  }
  return { ...sheet, abilities, ac };
}

export function attacksFromEquippedGear(
  sheet: NriSheetData,
  items: NriInventoryItem[]
): C2185SheetAttack[] {
  const out: C2185SheetAttack[] = [];
  for (const item of equippedItems(items)) {
    if (!item.attack) continue;
    const abMod = abilityModifier(sheet.abilities[item.attack.ability]);
    const melee = item.attack.ability === 'STR';
    out.push({
      name: item.name,
      atkBonus: sheet.proficiencyBonus + abMod,
      damage: melee
        ? `${item.attack.damageDice}${formatSignedMod(abMod)} ${item.attack.damageType}`
        : `${item.attack.damageDice} ${item.attack.damageType}`,
    });
  }
  return out;
}

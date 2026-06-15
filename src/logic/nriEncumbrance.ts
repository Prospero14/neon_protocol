/** Переносимый вес: инвентарь + импланты vs лимит STR×15 lb. */

import type { InstalledAugmentation } from './nriCyberInstall';
import { getCatalogItem } from './nriItemCatalog';
import type { NriInventoryItem } from './nriInventory';
import type { NriSheetData } from './nriNpcGenerator';

const CATEGORY_LB: Record<string, number> = {
  weapon: 6,
  armor: 14,
  gear: 3,
  consumable: 1,
  drug: 0.5,
  ammo: 2,
};

export function itemWeightLb(item: NriInventoryItem): number {
  if (item.kind === 'cyberware') return 4;
  const cat = item.catalogId ? getCatalogItem(item.catalogId) : undefined;
  const base =
    cat && 'weightLb' in cat && typeof (cat as { weightLb?: number }).weightLb === 'number'
      ? (cat as { weightLb: number }).weightLb
      : CATEGORY_LB[cat?.category ?? 'gear'] ?? 3;
  const qty = item.qty && item.qty > 0 ? item.qty : 1;
  return Math.round(base * qty * 10) / 10;
}

export function augmentationWeightLb(aug: InstalledAugmentation): number {
  return 3 + (aug.bloodTox ?? 0);
}

export function inventoryCarriedLb(
  inventory: NriInventoryItem[],
  augmentations: InstalledAugmentation[] = []
): number {
  let sum = 0;
  for (const item of inventory) sum += itemWeightLb(item);
  for (const aug of augmentations) sum += augmentationWeightLb(aug);
  return Math.round(sum * 10) / 10;
}

export function maxCarryLbFromSheet(sheet: NriSheetData | null): number {
  if (!sheet) return 0;
  const parsed = parseInt(String(sheet.maxCarryLb ?? ''), 10);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  const str = sheet.abilities?.STR ?? 10;
  return str * 15;
}

export function encumbranceLabel(
  carriedLb: number,
  maxLb: number
): { text: string; status: 'ok' | 'encumbered' | 'heavy' | 'over' } {
  if (maxLb <= 0) return { text: '—', status: 'ok' };
  const enc = Math.floor(maxLb * 0.67);
  const heavy = Math.floor(maxLb * 0.83);
  const text = `${carriedLb} / ${maxLb} lb`;
  if (carriedLb > maxLb) return { text: `${text} · перегруз`, status: 'over' };
  if (carriedLb > heavy) return { text: `${text} · тяжёлая ноша`, status: 'heavy' };
  if (carriedLb > enc) return { text: `${text} · ноша`, status: 'encumbered' };
  return { text, status: 'ok' };
}

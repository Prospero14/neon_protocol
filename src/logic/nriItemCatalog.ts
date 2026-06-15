/**
 * База предметов Carbon 2185 / Cyberpunk RED / 2077-стиль.
 * Мастер выдаёт из каталога; игрок экипирует — бонусы только пока equipped.
 */

import type { NriC2185Mods, NriInventoryItem } from './nriInventory';
import catalogJson from '../../shared/nri-item-catalog.json';

export type ItemCategory = 'weapon' | 'armor' | 'gear' | 'consumable' | 'drug' | 'ammo';
export type ItemSlot = 'weapon' | 'armor' | 'accessory' | 'quick';

export type CatalogAttack = {
  damageDice: string;
  damageType: string;
  ability: 'STR' | 'DEX';
};

export type CatalogItem = {
  id: string;
  name: string;
  blurb: string;
  category: ItemCategory;
  slot: ItemSlot;
  c2185Mods?: NriC2185Mods;
  acBonus?: number;
  attack?: CatalogAttack;
  priceWonlongs?: number;
  tags?: string[];
};

export const NRI_ITEM_CATALOG = catalogJson as CatalogItem[];

export const ITEM_CATEGORY_ORDER: ItemCategory[] = ['weapon', 'armor', 'gear', 'consumable', 'drug', 'ammo'];

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon: 'Оружие',
  armor: 'Броня',
  gear: 'Снаряжение',
  consumable: 'Расходники',
  drug: 'Наркотики / стимы',
  ammo: 'Боеприпасы',
};

const BY_ID = new Map(NRI_ITEM_CATALOG.map((c) => [c.id, c]));

/** Проверка уникальности id при загрузке каталога. */
function assertUniqueCatalogIds() {
  const seen = new Set<string>();
  for (const item of NRI_ITEM_CATALOG) {
    if (seen.has(item.id)) {
      console.warn(`[nri-item-catalog] duplicate id: ${item.id}`);
    }
    seen.add(item.id);
  }
}
assertUniqueCatalogIds();

export function getCatalogItem(id: string): CatalogItem | undefined {
  return BY_ID.get(id);
}

export function catalogToInventoryItem(catalogId: string, instanceId?: string): NriInventoryItem | null {
  const c = getCatalogItem(catalogId);
  if (!c) return null;
  const id = instanceId ?? `${catalogId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    catalogId: c.id,
    name: c.name,
    blurb: c.blurb,
    kind: 'gear',
    slot: c.slot,
    equipped: false,
    c2185Mods: c.c2185Mods ? { ...c.c2185Mods } : undefined,
    acBonus: c.acBonus,
    attack: c.attack ? { ...c.attack } : undefined,
    priceWonlongs: c.priceWonlongs,
    qty: 1,
  };
}

export function searchCatalog(query: string, category?: ItemCategory | 'all'): CatalogItem[] {
  const q = query.trim().toLowerCase();
  let items = NRI_ITEM_CATALOG;
  if (category && category !== 'all') {
    items = items.filter((c) => c.category === category);
  }
  if (!q) return items;
  return items.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.blurb.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.includes(q))
  );
}

export function groupCatalogByCategory(items: CatalogItem[] = NRI_ITEM_CATALOG): Record<ItemCategory, CatalogItem[]> {
  const groups = Object.fromEntries(ITEM_CATEGORY_ORDER.map((c) => [c, [] as CatalogItem[]])) as Record<
    ItemCategory,
    CatalogItem[]
  >;
  for (const item of items) {
    groups[item.category]?.push(item);
  }
  return groups;
}

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

export const UNDERHIVE_PASSPORT_ID = 'g_underhive_passport';
export const VEHICLE_LICENSE_ID = 'g_vehicle_license';

/** Сюжетные выдачи только из вкладки «Инвентарь мастера». */
export function isMasterGrantOnly(item: Pick<CatalogItem, 'tags'> | undefined | null): boolean {
  return !!item?.tags?.includes('мастер');
}

export function isPersonalCatalogItem(item: Pick<CatalogItem, 'tags'> | undefined | null): boolean {
  return !!item?.tags?.includes('персональное');
}

export function isInscribableCatalogItem(item: Pick<CatalogItem, 'id' | 'tags'> | undefined | null): boolean {
  return !!item && (item.id === VEHICLE_LICENSE_ID || item.tags?.includes('вписать_имя') === true);
}

export function canTransferInventoryItem(item: Pick<NriInventoryItem, 'catalogId' | 'tags' | 'transferLocked'>): boolean {
  if (item.transferLocked) return false;
  if (item.tags?.includes('персональное')) return false;
  const catalog = item.catalogId ? getCatalogItem(item.catalogId) : undefined;
  return !isPersonalCatalogItem(catalog);
}

export function canInscribeInventoryItem(
  item: Pick<NriInventoryItem, 'catalogId' | 'tags' | 'inscribedName' | 'inscriptionLocked'>
): boolean {
  if (item.inscriptionLocked || item.inscribedName?.trim()) return false;
  if (item.tags?.includes('вписать_имя')) return true;
  const catalog = item.catalogId ? getCatalogItem(item.catalogId) : undefined;
  return isInscribableCatalogItem(catalog);
}

export function listMasterGrantCatalog(): CatalogItem[] {
  return NRI_ITEM_CATALOG.filter((c) => isMasterGrantOnly(c));
}

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
    baseName: c.name,
    blurb: c.blurb,
    kind: 'gear',
    slot: c.slot,
    equipped: false,
    c2185Mods: c.c2185Mods ? { ...c.c2185Mods } : undefined,
    acBonus: c.acBonus,
    attack: c.attack ? { ...c.attack } : undefined,
    priceWonlongs: c.priceWonlongs,
    tags: c.tags ? [...c.tags] : undefined,
    transferLocked: isPersonalCatalogItem(c),
    inscriptionLocked: false,
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

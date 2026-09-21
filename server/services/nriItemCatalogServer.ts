/** Сервер: каталог предметов из shared JSON. */

import { readFileSync } from 'fs';

import type { InvItem } from './nriItemGrant.js';
import { resolveSharedJsonPath } from '../sharedDataPath.js';

type CatalogItem = {
  id: string;
  name: string;
  blurb: string;
  slot: string;
  category?: string;
  c2185Mods?: Record<string, number>;
  acBonus?: number;
  attack?: { damageDice: string; damageType: string; ability: string };
  priceWonlongs?: number;
  tags?: string[];
};

let cache: CatalogItem[] | null = null;

function loadCatalog(): CatalogItem[] {
  if (!cache) {
    const p = resolveSharedJsonPath('nri-item-catalog.json');
    cache = JSON.parse(readFileSync(p, 'utf8')) as CatalogItem[];
  }
  return cache;
}

export function getServerCatalogItem(id: string): CatalogItem | undefined {
  return loadCatalog().find((c) => c.id === id);
}

export function isPersonalServerCatalogItem(item: Pick<CatalogItem, 'tags'> | undefined | null): boolean {
  return !!item?.tags?.includes('персональное');
}

export function canTransferServerItem(
  item:
    | (Partial<Pick<InvItem, 'catalogId' | 'tags' | 'transferLocked'>> & Pick<InvItem, 'id' | 'name'>)
    | undefined
    | null
): boolean {
  if (!item) return false;
  if (item.transferLocked === true) return false;
  if (Array.isArray(item.tags) && item.tags.includes('персональное')) return false;
  const catalog = typeof item.catalogId === 'string' ? getServerCatalogItem(item.catalogId) : undefined;
  return !isPersonalServerCatalogItem(catalog);
}

export function catalogToServerInventoryItem(catalogId: string): InvItem | null {
  const c = getServerCatalogItem(catalogId);
  if (!c) return null;
  const id = `${catalogId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    catalogId: c.id,
    name: c.name,
    baseName: c.name,
    blurb: c.blurb,
    kind: 'gear',
    slot: c.slot,
    equipped: false,
    c2185Mods: c.c2185Mods,
    acBonus: c.acBonus,
    attack: c.attack,
    priceWonlongs: c.priceWonlongs,
    tags: c.tags ? [...c.tags] : undefined,
    transferLocked: isPersonalServerCatalogItem(c),
    inscriptionLocked: false,
    qty: 1,
  };
}

/** Сервер: каталог предметов из shared JSON. */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import type { InvItem } from './nriItemGrant.js';

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
};

let cache: CatalogItem[] | null = null;

function loadCatalog(): CatalogItem[] {
  if (!cache) {
    const p = join(dirname(fileURLToPath(import.meta.url)), '../../shared/nri-item-catalog.json');
    cache = JSON.parse(readFileSync(p, 'utf8')) as CatalogItem[];
  }
  return cache;
}

export function getServerCatalogItem(id: string): CatalogItem | undefined {
  return loadCatalog().find((c) => c.id === id);
}

export function catalogToServerInventoryItem(catalogId: string): InvItem | null {
  const c = getServerCatalogItem(catalogId);
  if (!c) return null;
  const id = `${catalogId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    catalogId: c.id,
    name: c.name,
    blurb: c.blurb,
    kind: 'gear',
    slot: c.slot,
    equipped: false,
    c2185Mods: c.c2185Mods,
    acBonus: c.acBonus,
    attack: c.attack,
    priceWonlongs: c.priceWonlongs,
    qty: 1,
  };
}

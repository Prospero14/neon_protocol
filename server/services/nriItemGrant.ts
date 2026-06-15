/** Сервер: выдача предметов и экипировка (зеркало src/logic). */

export type InvItem = {
  id: string;
  name: string;
  slot?: string;
  equipped?: boolean;
  catalogId?: string;
  qty?: number;
  [key: string]: unknown;
};

const EQUIPPABLE = new Set(['weapon', 'armor', 'accessory']);

export function toggleEquipServer(items: InvItem[], itemId: string): InvItem[] | null {
  const target = items.find((i) => i.id === itemId);
  if (!target || !target.slot || !EQUIPPABLE.has(target.slot)) return null;
  const nextEquipped = !target.equipped;
  return items.map((i) => {
    if (i.id === itemId) return { ...i, equipped: nextEquipped };
    if (nextEquipped && i.slot === target.slot) return { ...i, equipped: false };
    return i;
  });
}

export function mergeInventoryItem(existing: InvItem[], newItem: InvItem): InvItem[] {
  const cat = newItem.catalogId;
  if (cat && newItem.slot === 'quick') {
    const idx = existing.findIndex((i) => i.catalogId === cat && i.slot === 'quick');
    if (idx >= 0) {
      const copy = [...existing];
      const cur = copy[idx]!;
      const qty = (typeof cur.qty === 'number' ? cur.qty : 1) + (typeof newItem.qty === 'number' ? newItem.qty : 1);
      copy[idx] = { ...cur, qty };
      return copy;
    }
  }
  return [...existing, newItem];
}

/** Снять один предмет по catalogId из инвентаря НПС (для передачи игроку). */
export function takeOneCatalogItem(existing: InvItem[], catalogId: string): { inventory: InvItem[]; taken: boolean } {
  const idx = existing.findIndex((i) => i.catalogId === catalogId);
  if (idx < 0) return { inventory: existing, taken: false };
  const copy = [...existing];
  const cur = copy[idx]!;
  const qty = typeof cur.qty === 'number' ? cur.qty : 1;
  if (qty > 1) {
    copy[idx] = { ...cur, qty: qty - 1 };
  } else {
    copy.splice(idx, 1);
  }
  return { inventory: copy, taken: true };
}

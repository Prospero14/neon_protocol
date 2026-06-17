/** Использование расходника: снять 1 шт., наложить эффекты на лист. */

import { applyConsumeEffects } from '../../shared/nri-domain/consumeApply';
import type { ConditionId } from '../../shared/nri-domain/types';
import { getCatalogItem } from './nriItemCatalog';
import { getConsumeEffect } from './nriConsumeEffects';
import {
  applyConditionStack,
  conditionFromDef,
  pruneExpiredConditions,
  tickConditionRounds as tickConditionRoundsOnSheet,
  type SheetCondition,
} from './nriConditions';
import type { NriInventoryItem } from './nriInventory';
import { parseNriSheet, type NriSheetData } from './nriNpcGenerator';

export type UseItemResult =
  | { ok: true; inventory: NriInventoryItem[]; sheet: NriSheetData; applied: string[] }
  | { ok: false; reason: string };

function takeOneItem(items: NriInventoryItem[], itemId: string): { inventory: NriInventoryItem[]; item: NriInventoryItem | null } {
  const list = Array.isArray(items) ? items : [];
  const idx = list.findIndex((i) => i.id === itemId);
  if (idx < 0) return { inventory: list, item: null };
  const copy = [...list];
  const cur = copy[idx]!;
  const qty = typeof cur.qty === 'number' ? cur.qty : 1;
  if (qty > 1) {
    copy[idx] = { ...cur, qty: qty - 1 };
    return { inventory: copy, item: { ...cur, qty: 1 } };
  }
  copy.splice(idx, 1);
  return { inventory: copy, item: { ...cur } };
}

export function tryUseInventoryItem(
  sheetRaw: unknown,
  inventoryRaw: unknown,
  itemId: string
): UseItemResult {
  const sheet = parseNriSheet(sheetRaw);
  if (!sheet) return { ok: false, reason: 'Лист персонажа не найден.' };

  const items = Array.isArray(inventoryRaw) ? (inventoryRaw as NriInventoryItem[]) : [];
  const { inventory, item } = takeOneItem(items, itemId);
  if (!item) return { ok: false, reason: 'Предмет не найден в инвентаре.' };

  const catalog = item.catalogId ? getCatalogItem(item.catalogId) : undefined;
  const spec = getConsumeEffect(item.catalogId);
  if (!spec) {
    const cat = catalog?.category;
    if (cat === 'consumable' || cat === 'drug' || item.slot === 'quick') {
      return { ok: false, reason: 'У предмета нет игрового эффекта — уточните у мастера.' };
    }
    return { ok: false, reason: 'Этот предмет нельзя использовать — только экипировать.' };
  }

  const { sheet: nextSheet, applied } = applyConsumeEffects(sheet, spec, item.name);
  return { ok: true, inventory, sheet: nextSheet as NriSheetData, applied };
}

export function applyMasterCondition(
  sheetRaw: unknown,
  conditionId: ConditionId,
  opts?: { source?: string; rounds?: number; minutes?: number }
): { sheet: NriSheetData; condition: SheetCondition } | null {
  const sheet = parseNriSheet(sheetRaw);
  if (!sheet) return null;
  const cond = conditionFromDef(conditionId, opts);
  const conditions = applyConditionStack(pruneExpiredConditions([...(sheet.activeConditions ?? [])]), cond);
  return { sheet: { ...sheet, activeConditions: conditions }, condition: cond };
}

export function removeMasterCondition(sheetRaw: unknown, conditionId: ConditionId): NriSheetData | null {
  const sheet = parseNriSheet(sheetRaw);
  if (!sheet) return null;
  const conditions = (sheet.activeConditions ?? []).filter((c) => c.id !== conditionId);
  return { ...sheet, activeConditions: conditions };
}

export function tickConditionRounds(sheetRaw: unknown, delta = 1): NriSheetData | null {
  const sheet = parseNriSheet(sheetRaw);
  if (!sheet) return null;
  return tickConditionRoundsOnSheet(sheet, delta);
}

/** Сервер: использование расходников (shared domain). */

import { readFileSync } from 'fs';

import { applyConsumeEffects } from '../../shared/nri-domain/consumeApply.js';
import type { ConsumableSheet, ConsumeEffectSpec } from '../../shared/nri-domain/types.js';
import type { InvItem } from './nriItemGrant.js';
import { takeOneInstanceItem } from './nriItemGrant.js';
import { getServerCatalogItem } from './nriItemCatalogServer.js';
import { resolveSharedJsonPath } from '../sharedDataPath.js';

type Sheet = Record<string, unknown> & {
  abilities?: Record<string, number>;
  hp?: number;
  hpMax?: number;
  bloodToxCurrent?: number;
  activeConditions?: unknown[];
};

let consumeCache: Record<string, ConsumeEffectSpec> | null = null;

function loadConsume(): Record<string, ConsumeEffectSpec> {
  if (!consumeCache) {
    const p = resolveSharedJsonPath('nri-consume-effects.json');
    consumeCache = JSON.parse(readFileSync(p, 'utf8')) as Record<string, ConsumeEffectSpec>;
  }
  return consumeCache;
}

export function tryUseItemServer(
  sheetRaw: unknown,
  inventory: InvItem[],
  itemId: string
): { ok: true; inventory: InvItem[]; sheet: Sheet; applied: string[] } | { ok: false; reason: string } {
  const sheet = (sheetRaw && typeof sheetRaw === 'object' ? { ...(sheetRaw as Sheet) } : null) as Sheet | null;
  if (!sheet?.abilities) return { ok: false, reason: 'Лист персонажа не найден.' };

  const taken = takeOneInstanceItem(inventory, itemId);
  if (!taken.item) return { ok: false, reason: 'Предмет не найден в инвентаре.' };

  const catalogId = taken.item.catalogId;
  const spec = catalogId ? loadConsume()[catalogId] : undefined;
  if (!spec) {
    const catalogItem = catalogId ? getServerCatalogItem(catalogId) : undefined;
    const category = catalogItem?.category;
    if (category === 'consumable' || category === 'drug' || taken.item.slot === 'quick') {
      return { ok: false, reason: 'У предмета нет игрового эффекта — уточните у мастера.' };
    }
    return { ok: false, reason: 'Этот предмет нельзя использовать — только экипировать.' };
  }

  const hpMax = typeof sheet.hpMax === 'number' ? sheet.hpMax : ((sheet.hp as number) ?? 20);
  const { sheet: next, applied } = applyConsumeEffects(
    {
      abilities: sheet.abilities as ConsumableSheet['abilities'],
      hp: sheet.hp,
      hpMax,
      bloodToxCurrent: sheet.bloodToxCurrent,
      activeConditions: sheet.activeConditions as ConsumableSheet['activeConditions'],
    },
    spec,
    taken.item.name
  );

  const merged: Sheet = { ...sheet, ...next, hpMax };
  return { ok: true, inventory: taken.inventory, sheet: merged, applied };
}

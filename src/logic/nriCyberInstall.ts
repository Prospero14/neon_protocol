/** Установка киберимплантов на лист персонажа (Augmentations + Blood Tox). */

import { markPendingHoloTattooAfterInstall } from '../../shared/nri-domain/tattoos';

import type { NriInventoryItem } from './nriInventory';
import { bloodToxLimitFromCon, type CyberSlot } from './nriCyberware';
import { parseNriSheet, type NriSheetData } from './nriNpcGenerator';

export type InstalledAugmentation = {
  itemId: string;
  name: string;
  slot: string;
  bloodTox: number;
  blurb?: string;
  c2185Mods?: NriInventoryItem['c2185Mods'];
  cyber?: NriInventoryItem['cyber'];
  installedAt: number;
};

export type AugmentedSheet = NriSheetData & {
  bloodToxCurrent?: number;
  bloodToxLimit?: number;
  augmentations?: InstalledAugmentation[];
};

const FUNCTIONAL_SLOTS: CyberSlot[] = ['arm', 'leg', 'head', 'torso', 'internal', 'neural', 'external', 'sensor'];

export function parseAugmentedSheet(raw: unknown): AugmentedSheet | null {
  const base = parseNriSheet(raw);
  if (!base) return null;
  const o = raw as AugmentedSheet;
  return {
    ...base,
    bloodToxCurrent: typeof o.bloodToxCurrent === 'number' ? o.bloodToxCurrent : undefined,
    bloodToxLimit: typeof o.bloodToxLimit === 'number' ? o.bloodToxLimit : undefined,
    augmentations: Array.isArray(o.augmentations) ? o.augmentations : [],
  };
}

export function getBloodToxLimit(sheet: AugmentedSheet | null): number {
  if (sheet?.bloodToxLimit != null) return sheet.bloodToxLimit;
  const con = sheet?.abilities?.CON ?? 10;
  return bloodToxLimitFromCon(con);
}

export function sumInstalledBloodTox(sheet: AugmentedSheet | null): number {
  return (sheet?.augmentations ?? []).reduce((s, a) => s + (a.bloodTox ?? 0), 0);
}

export function findInventoryCyberItem(inventory: unknown, itemId: string): NriInventoryItem | null {
  if (!Array.isArray(inventory)) return null;
  const item = inventory.find((x) => x && typeof x === 'object' && (x as NriInventoryItem).id === itemId) as
    | NriInventoryItem
    | undefined;
  if (!item || item.kind !== 'cyberware' || !item.cyber?.slot) return null;
  return item;
}

export type InstallCyberResult =
  | { ok: true; sheet: AugmentedSheet; inventory: NriInventoryItem[] }
  | { ok: false; reason: string };

export function applyAugmentationsToSheet(
  sheet: NriSheetData,
  augmentations: InstalledAugmentation[]
): NriSheetData {
  if (augmentations.length === 0) return sheet;
  const abilities = { ...sheet.abilities };
  for (const aug of augmentations) {
    if (!aug.c2185Mods) continue;
    for (const key of Object.keys(aug.c2185Mods) as (keyof typeof abilities)[]) {
      const delta = aug.c2185Mods[key];
      if (typeof delta === 'number') abilities[key] = (abilities[key] ?? 10) + delta;
    }
  }
  return { ...sheet, abilities };
}

export function tryInstallCyberItem(
  sheetRaw: unknown,
  inventoryRaw: unknown,
  itemId: string
): InstallCyberResult {
  const sheet = parseAugmentedSheet(sheetRaw) ?? {
    abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, TEC: 10, PEO: 10 },
    level: 1,
    proficiencyBonus: 2,
    hpMax: 10,
    hp: 10,
    ac: 10,
    augmentations: [],
  };
  const inventory = Array.isArray(inventoryRaw) ? ([...inventoryRaw] as NriInventoryItem[]) : [];
  const item = findInventoryCyberItem(inventory, itemId);
  if (!item) {
    return { ok: false, reason: 'Предмет не найден в инвентаре или это не киберимплант.' };
  }

  const slot = item.cyber!.slot as CyberSlot;
  const bloodTox = item.cyber?.bloodTox ?? 0;
  const installed = sheet.augmentations ?? [];

  if (FUNCTIONAL_SLOTS.includes(slot)) {
    const taken = installed.find((a) => a.slot === slot);
    if (taken) {
      return {
        ok: false,
        reason: `Слот «${slot}» уже занят: ${taken.name}. Снимите старый имплант.`,
      };
    }
  } else if (slot === 'cosmetic') {
    const cosmCount = installed.filter((a) => a.slot === 'cosmetic').length;
    if (cosmCount >= 4) {
      return { ok: false, reason: 'Не более 4 косметических имплантов на персонажа.' };
    }
  }

  const limit = getBloodToxLimit(sheet);
  const nextBt = sumInstalledBloodTox(sheet) + bloodTox;
  if (nextBt > limit) {
    return {
      ok: false,
      reason: `Blood Tox ${nextBt} превысит лимит персонажа (${limit}). Уберите импланты или повысьте ВЫН.`,
    };
  }

  const powerDraw = item.cyber?.powerDrawW ?? 0;
  const powerWh = item.cyber?.powerWh ?? 0;
  if (powerDraw > 0 && powerWh > 0 && powerDraw > powerWh) {
    return { ok: false, reason: 'Имплант с перегрузом питания нельзя установить — почините сборку.' };
  }

  const aug: InstalledAugmentation = {
    itemId: item.id,
    name: item.name,
    slot,
    bloodTox,
    blurb: item.blurb,
    c2185Mods: item.c2185Mods,
    cyber: item.cyber,
    installedAt: Date.now(),
  };

  const newInventory = inventory.filter((i) => i.id !== itemId);
  const installedSheet: AugmentedSheet = {
    ...sheet,
    augmentations: [...installed, aug],
    bloodToxCurrent: nextBt,
    bloodToxLimit: limit,
  };
  const newSheet = markPendingHoloTattooAfterInstall(installedSheet, item);

  return { ok: true, sheet: newSheet, inventory: newInventory };
}

export function tryUninstallCyberItem(sheetRaw: unknown, inventoryRaw: unknown, itemId: string): InstallCyberResult {
  const sheet = parseAugmentedSheet(sheetRaw);
  if (!sheet) return { ok: false, reason: 'Нет листа персонажа.' };
  const installed = sheet.augmentations ?? [];
  const aug = installed.find((a) => a.itemId === itemId);
  if (!aug) return { ok: false, reason: 'Имплант не установлен.' };

  const inventory = Array.isArray(inventoryRaw) ? ([...inventoryRaw] as NriInventoryItem[]) : [];
  inventory.push({
    id: aug.itemId,
    name: aug.name,
    kind: 'cyberware',
    blurb: aug.blurb,
    c2185Mods: aug.c2185Mods,
    cyber: aug.cyber,
    qty: 1,
  });

  const newAug = installed.filter((a) => a.itemId !== itemId);
  const newSheet: AugmentedSheet = {
    ...sheet,
    augmentations: newAug,
    bloodToxCurrent: newAug.reduce((s, a) => s + a.bloodTox, 0),
  };

  return { ok: true, sheet: newSheet, inventory };
}

export type CyberBudgetInfo = {
  btUsed: number;
  btLimit: number;
  btFree: number;
  occupiedSlots: string[];
};

export function getCyberBudget(sheetRaw: unknown): CyberBudgetInfo {
  const sheet = parseAugmentedSheet(sheetRaw);
  const btUsed = sumInstalledBloodTox(sheet);
  const btLimit = getBloodToxLimit(sheet);
  const occupiedSlots = (sheet?.augmentations ?? []).map((a) => a.slot);
  return {
    btUsed,
    btLimit,
    btFree: btLimit - btUsed,
    occupiedSlots,
  };
}

export function isCyberSlotFree(sheetRaw: unknown, slot: string): boolean {
  const { occupiedSlots } = getCyberBudget(sheetRaw);
  if (slot === 'cosmetic') {
    return occupiedSlots.filter((s) => s === 'cosmetic').length < 4;
  }
  return !occupiedSlots.includes(slot);
}

/** Проверка «можно ли установить» для превью в конструкторе (ещё не выданный предмет). */
export function previewInstallStatus(params: {
  buildBloodTox: number;
  buildSlot: string;
  buildOverload: boolean;
  buildBlocked: boolean;
  playerCon?: number;
  playerInstalledBt?: number;
  playerSlotTaken?: boolean;
}): { canInstall: boolean; hint: string } {
  if (params.buildBlocked) {
    return { canInstall: false, hint: 'Сборка с ошибками — исправьте перед установкой.' };
  }
  if (params.buildOverload) {
    return { canInstall: false, hint: 'Перегруз питания — установка запрещена до исправления.' };
  }
  const limit = bloodToxLimitFromCon(params.playerCon ?? 10);
  const total = (params.playerInstalledBt ?? 0) + params.buildBloodTox;
  if (total > limit) {
    return {
      canInstall: false,
      hint: `После установки BT будет ${total}, лимит персонажа ${limit}.`,
    };
  }
  if (params.playerSlotTaken) {
    return { canInstall: false, hint: 'У выбранного игрока этот слот тела уже занят.' };
  }
  return {
    canInstall: true,
    hint: 'Можно установить: Лавка → игрок → «Установить» (операция риппердока).',
  };
}

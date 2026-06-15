/** Серверная установка киберимплантов (зеркало src/logic/nriCyberInstall.ts). */

type InstalledAugmentation = {
  itemId: string;
  name: string;
  slot: string;
  bloodTox: number;
  blurb?: string;
  c2185Mods?: unknown;
  cyber?: unknown;
  installedAt: number;
};

type AugmentedSheet = Record<string, unknown> & {
  augmentations?: InstalledAugmentation[];
  bloodToxCurrent?: number;
  bloodToxLimit?: number;
  abilities?: { CON?: number };
};

const FUNCTIONAL_SLOTS = ['arm', 'leg', 'head', 'torso', 'internal', 'neural', 'external', 'sensor'];

function abilityMod(score: number): number {
  if (score <= 7) return -2;
  if (score <= 9) return -1;
  if (score <= 11) return 0;
  if (score <= 13) return 1;
  if (score <= 15) return 2;
  if (score <= 17) return 3;
  if (score <= 19) return 4;
  return 5;
}

function bloodToxLimit(sheet: AugmentedSheet | null): number {
  if (sheet && typeof sheet.bloodToxLimit === 'number') return sheet.bloodToxLimit;
  const con = sheet?.abilities?.CON ?? 10;
  return Math.max(4, 10 + abilityMod(con));
}

function parseSheet(raw: unknown): AugmentedSheet {
  if (!raw || typeof raw !== 'object') return { augmentations: [] };
  const o = raw as AugmentedSheet;
  return {
    ...o,
    augmentations: Array.isArray(o.augmentations) ? o.augmentations : [],
  };
}

function sumBt(sheet: AugmentedSheet): number {
  return (sheet.augmentations ?? []).reduce((s, a) => s + (a.bloodTox ?? 0), 0);
}

export type InstallResult =
  | { ok: true; sheet: AugmentedSheet; inventory: unknown[] }
  | { ok: false; reason: string };

export function tryInstallCyberItem(sheetRaw: unknown, inventoryRaw: unknown, itemId: string): InstallResult {
  const sheet = parseSheet(sheetRaw);
  const inventory = Array.isArray(inventoryRaw) ? [...inventoryRaw] : [];
  const idx = inventory.findIndex((x) => x && typeof x === 'object' && (x as { id?: string }).id === itemId);
  if (idx < 0) return { ok: false, reason: 'Предмет не найден в инвентаре.' };
  const item = inventory[idx] as {
    id: string;
    name: string;
    kind?: string;
    blurb?: string;
    c2185Mods?: unknown;
    cyber?: {
      slot?: string;
      bloodTox?: number;
      powerDrawW?: number;
      powerWh?: number;
    };
  };
  if (item.kind !== 'cyberware' || !item.cyber?.slot) {
    return { ok: false, reason: 'Это не киберимплант.' };
  }

  const slot = item.cyber.slot;
  const bloodTox = item.cyber.bloodTox ?? 0;
  const installed = sheet.augmentations ?? [];

  if (FUNCTIONAL_SLOTS.includes(slot)) {
    const taken = installed.find((a) => a.slot === slot);
    if (taken) {
      return { ok: false, reason: `Слот «${slot}» занят: ${taken.name}.` };
    }
  } else if (slot === 'cosmetic') {
    if (installed.filter((a) => a.slot === 'cosmetic').length >= 4) {
      return { ok: false, reason: 'Не более 4 косметических имплантов.' };
    }
  }

  const limit = bloodToxLimit(sheet);
  const nextBt = sumBt(sheet) + bloodTox;
  if (nextBt > limit) {
    return { ok: false, reason: `Blood Tox ${nextBt} > лимита ${limit}.` };
  }

  const draw = item.cyber.powerDrawW ?? 0;
  const wh = item.cyber.powerWh ?? 0;
  if (draw > 0 && wh > 0 && draw > wh) {
    return { ok: false, reason: 'Перегруз питания — установка невозможна.' };
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

  inventory.splice(idx, 1);
  const newSheet: AugmentedSheet = {
    ...sheet,
    augmentations: [...installed, aug],
    bloodToxCurrent: nextBt,
    bloodToxLimit: limit,
  };

  return { ok: true, sheet: newSheet, inventory };
}

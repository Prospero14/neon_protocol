/** ICE Run: серия провалов, hardware ban, снятие через нейролинк или кибер-деку. */

import type { InstalledAugmentation } from './nriCyberInstall';
import { parseAugmentedSheet } from './nriCyberInstall';
import {
  DECK_CATALOG_IDS,
  inventoryHasDeck,
} from '../../shared/nri-domain/iceCounterHack';

/** Синхрон с server / iceCounterHack threshold (5–7). */
export const ICE_FAIL_STREAK_LIMIT = 6;
export const ICE_LEFT_DECK_CATALOG_ID = 'g_left_deck';
export { DECK_CATALOG_IDS, inventoryHasDeck as inventoryHasCyberdeck };

export type IceBanRecord = {
  consecutiveFails: number;
  hardwareBanned: boolean;
  bannedAt?: number;
  neuralSigAtBan?: string | null;
};

export type IceClearanceVia = 'neural' | 'deck';

export type IcePlayStatus = {
  consecutiveFails: number;
  hardwareBanned: boolean;
  canPlay: boolean;
  clearanceVia?: IceClearanceVia;
  tableAllBanned: boolean;
  failsUntilBan: number;
  counterHackActive?: boolean;
};

function sheetObj(sheet: unknown): Record<string, unknown> {
  if (sheet && typeof sheet === 'object') return { ...(sheet as Record<string, unknown>) };
  return {};
}

export function neuralAugSignature(augmentations: InstalledAugmentation[] | undefined): string | null {
  const neural = (augmentations ?? []).find((a) => a.slot === 'neural');
  if (!neural) return null;
  return `${neural.itemId}|${neural.installedAt}`;
}

export function readIceBan(sheet: unknown): IceBanRecord {
  const o = sheetObj(sheet);
  const raw = o.iceBan;
  if (!raw || typeof raw !== 'object') {
    return { consecutiveFails: 0, hardwareBanned: false };
  }
  const b = raw as IceBanRecord;
  return {
    consecutiveFails:
      typeof b.consecutiveFails === 'number' && Number.isFinite(b.consecutiveFails)
        ? Math.max(0, Math.floor(b.consecutiveFails))
        : 0,
    hardwareBanned: !!b.hardwareBanned,
    bannedAt: typeof b.bannedAt === 'number' ? b.bannedAt : undefined,
    neuralSigAtBan: typeof b.neuralSigAtBan === 'string' || b.neuralSigAtBan === null ? b.neuralSigAtBan : undefined,
  };
}

export function writeIceBan(sheet: unknown, ban: IceBanRecord): Record<string, unknown> {
  const o = sheetObj(sheet);
  return { ...o, iceBan: ban };
}

export function hasLeftDeck(inventory: unknown): boolean {
  return inventoryHasDeck(inventory);
}

export function detectIceClearance(
  sheet: unknown,
  inventory: unknown
): { cleared: boolean; via?: IceClearanceVia } {
  const ban = readIceBan(sheet);
  if (!ban.hardwareBanned) return { cleared: true };

  if (hasLeftDeck(inventory)) return { cleared: true, via: 'deck' };

  const aug = parseAugmentedSheet(sheet);
  const sig = neuralAugSignature(aug?.augmentations);
  if (ban.bannedAt) {
    const neural = (aug?.augmentations ?? []).find((a) => a.slot === 'neural');
    if (neural && neural.installedAt > ban.bannedAt) {
      return { cleared: true, via: 'neural' };
    }
  }
  if (ban.neuralSigAtBan !== undefined && sig !== ban.neuralSigAtBan) {
    return { cleared: true, via: 'neural' };
  }
  return { cleared: false };
}

export function clearIceBan(sheet: unknown): Record<string, unknown> {
  return writeIceBan(sheet, { consecutiveFails: 0, hardwareBanned: false });
}

/** Клиентский зеркальный хелпер: бан железа — после проигрыша counter-hack (сервер). */
export function applyIceRunResult(sheet: unknown, won: boolean): { sheet: Record<string, unknown>; ban: IceBanRecord } {
  const prev = readIceBan(sheet);
  if (won) {
    const ban: IceBanRecord = {
      consecutiveFails: 0,
      hardwareBanned: prev.hardwareBanned,
      bannedAt: prev.bannedAt,
      neuralSigAtBan: prev.neuralSigAtBan,
    };
    return { sheet: writeIceBan(sheet, ban), ban };
  }
  const nextFails = prev.consecutiveFails + 1;
  const ban: IceBanRecord = { ...prev, consecutiveFails: nextFails, hardwareBanned: prev.hardwareBanned };
  return { sheet: writeIceBan(sheet, ban), ban };
}

export function buildIcePlayStatus(
  sheet: unknown,
  inventory: unknown,
  tableAllBanned: boolean
): IcePlayStatus {
  const ban = readIceBan(sheet);
  const clearance = detectIceClearance(sheet, inventory);
  const canPlay = !ban.hardwareBanned || clearance.cleared;
  return {
    consecutiveFails: ban.consecutiveFails,
    hardwareBanned: ban.hardwareBanned,
    canPlay,
    clearanceVia: clearance.via,
    tableAllBanned,
    failsUntilBan: ban.hardwareBanned
      ? 0
      : Math.max(0, ICE_FAIL_STREAK_LIMIT - ban.consecutiveFails),
  };
}

export function maybeAutoClearIceBan(sheet: unknown, inventory: unknown): Record<string, unknown> | null {
  const ban = readIceBan(sheet);
  if (!ban.hardwareBanned) return null;
  const clearance = detectIceClearance(sheet, inventory);
  if (!clearance.cleared) return null;
  return clearIceBan(sheet);
}

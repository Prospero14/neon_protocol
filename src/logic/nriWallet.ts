/** Wonlongs (₩) на листе персонажа / НПС. */

import type { NriSheetData } from './nriNpcGenerator';

export const DEFAULT_STARTING_WONLONGS = 200;

export function readWonlongs(sheet: unknown): number {
  if (!sheet || typeof sheet !== 'object') return 0;
  const w = (sheet as { wonlongs?: unknown }).wonlongs;
  if (typeof w !== 'number' || !Number.isFinite(w)) return 0;
  return Math.max(0, Math.floor(w));
}

export function writeWonlongs(sheet: unknown, amount: number): Record<string, unknown> {
  const next = Math.max(0, Math.floor(amount));
  if (sheet && typeof sheet === 'object') {
    return { ...(sheet as Record<string, unknown>), wonlongs: next };
  }
  return { wonlongs: next };
}

export function antispamPrice(tableWonlongsSum: number): number {
  return Math.max(1, Math.ceil((tableWonlongsSum * 2) / 4));
}

export function isSpamPaused(spamPausedUntil: number | null | undefined): boolean {
  return typeof spamPausedUntil === 'number' && spamPausedUntil > Date.now();
}

export function ensureSheetWonlongs(sheet: NriSheetData | null): NriSheetData {
  if (!sheet) return { wonlongs: DEFAULT_STARTING_WONLONGS } as NriSheetData;
  if (typeof sheet.wonlongs === 'number') return sheet;
  return { ...sheet, wonlongs: DEFAULT_STARTING_WONLONGS };
}

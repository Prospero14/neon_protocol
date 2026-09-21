/** Derived underhive frames + corp underground mirrors from city top zones. */

import { corpTileTheme, type CorpTileTheme } from './corpTileThemes.js';

export type UnderhiveDistrictFrame = {
  zoneKey: string;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string | null;
};

export type CorpUndergroundMirror = {
  sourceZoneKey: string;
  corpName: string | null;
  name: string;
  zoneType: 'corp_underground';
  x: number;
  y: number;
  w: number;
  h: number;
  theme: CorpTileTheme;
};

const SKIP_TYPES = new Set(['highway', 'overpass', 'tunnel']);

export function deriveUnderhiveDistrictFrames(
  zones: Array<{
    zoneKey: string;
    name: string;
    zoneType: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color?: string | null;
    parentZoneKey?: string | null;
  }>
): UnderhiveDistrictFrame[] {
  return zones
    .filter((z) => !z.parentZoneKey && !SKIP_TYPES.has(z.zoneType) && z.zoneType !== 'corp')
    .map((z) => ({
      zoneKey: z.zoneKey,
      name: z.name,
      zoneType: z.zoneType,
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h,
      color: z.color ?? null,
    }));
}

/** Corp HQ / campus tiles mirrored into underhive as corporate undergrounds. */
export function deriveCorpUndergrounds(
  zones: Array<{
    zoneKey: string;
    name: string;
    zoneType: string;
    corpName?: string | null;
    x: number;
    y: number;
    w: number;
    h: number;
    parentZoneKey?: string | null;
  }>
): CorpUndergroundMirror[] {
  return zones
    .filter((z) => !z.parentZoneKey && z.zoneType === 'corp')
    .map((z) => {
      const corpName = z.corpName?.trim() || null;
      const theme = corpTileTheme(corpName || z.name);
      return {
        sourceZoneKey: z.zoneKey,
        corpName,
        name: `${theme.label} · подземелья`,
        zoneType: 'corp_underground' as const,
        x: z.x,
        y: z.y,
        w: z.w,
        h: z.h,
        theme,
      };
    });
}

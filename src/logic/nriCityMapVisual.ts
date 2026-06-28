import { megaFromZoneKey, megaKeyFromZoneKey } from './nriNeonCityMap';

export type MegaBounds = {
  megaKey: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function zoneTexturePatternId(zoneType: string): string {
  return `nc-tex-${zoneType}`;
}

/** Стабильный вариант декора (0–2) по zoneKey — без рандома при ре-рендере. */
export function zoneDecorVariant(zoneKey: string): 0 | 1 | 2 {
  let h = 0;
  for (let i = 0; i < zoneKey.length; i++) h = (h * 31 + zoneKey.charCodeAt(i)) | 0;
  return (Math.abs(h) % 3) as 0 | 1 | 2;
}

export function computeMegaBounds(
  zones: { zoneKey: string; megaDistrict?: string | null; x: number; y: number; w: number; h: number }[]
): MegaBounds[] {
  const acc = new Map<string, { minX: number; minY: number; maxX: number; maxY: number; label: string }>();
  for (const z of zones) {
    const mk = megaKeyFromZoneKey(z.zoneKey);
    if (!mk) continue;
    const label = z.megaDistrict ?? megaFromZoneKey(z.zoneKey) ?? mk;
    const cur = acc.get(mk);
    if (!cur) {
      acc.set(mk, { minX: z.x, minY: z.y, maxX: z.x + z.w, maxY: z.y + z.h, label });
      continue;
    }
    cur.minX = Math.min(cur.minX, z.x);
    cur.minY = Math.min(cur.minY, z.y);
    cur.maxX = Math.max(cur.maxX, z.x + z.w);
    cur.maxY = Math.max(cur.maxY, z.y + z.h);
  }
  const pad = 1.8;
  return [...acc.entries()].map(([megaKey, b]) => ({
    megaKey,
    label: b.label,
    x: b.minX - pad,
    y: b.minY - pad,
    w: b.maxX - b.minX + pad * 2,
    h: b.maxY - b.minY + pad * 2,
  }));
}

export function zoneTypeUsesTexture(zoneType: string): boolean {
  return zoneType !== 'tunnel';
}

export type SkylineBlock = {
  x: number;
  y: number;
  w: number;
  h: number;
  tier: 0 | 1 | 2;
};

/** Псевдо-застройка внутри квартала — только визуал, без новых zoneKey. */
export function computeSkylineBlocks(
  zoneKey: string,
  zoneType: string,
  zx: number,
  zy: number,
  zw: number,
  zh: number
): SkylineBlock[] {
  if (['highway', 'overpass', 'tunnel', 'park'].includes(zoneType)) return [];
  if (zw < 10 || zh < 7) return [];
  if (zoneType === 'corp' && zw < 16) return [];

  let hash = 0;
  for (let i = 0; i < zoneKey.length; i++) hash = (hash * 31 + zoneKey.charCodeAt(i)) | 0;

  const cols = Math.max(2, Math.min(10, Math.floor(zw / 2.8)));
  const rows = Math.max(2, Math.min(5, Math.floor(zh / 4.8)));
  const cellW = zw / cols;
  const cellH = zh / rows;
  const blocks: SkylineBlock[] = [];
  const corpBoost = zoneType === 'corp' ? 1 : zoneType === 'slum' ? 0 : 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (hash + r * 17 + c * 41) | 0;
      const skipMod = zoneType === 'highway' || zoneType === 'overpass' ? 99 : 5;
      if (Math.abs(seed) % skipMod === 0) continue;
      const heightBias = zoneType === 'corp' ? 0.55 : zoneType === 'industrial' ? 0.35 : 0.42;
      const bw = cellW * (0.62 + (Math.abs(seed) % 22) / 100);
      const bh = cellH * (heightBias + (Math.abs(seed >> 3) % 45) / 100) + corpBoost;
      const tier = (Math.abs(seed >> 5) % 3) as 0 | 1 | 2;
      blocks.push({
        x: zx + c * cellW + cellW * 0.08,
        y: zy + zh - bh - 0.25 - r * 0.08,
        w: bw,
        h: bh,
        tier: zoneType === 'corp' && tier < 2 ? ((tier + 1) as 0 | 1 | 2) : tier,
      });
    }
  }
  return blocks;
}

/** Отступ «улицы» между крупными кварталами на обзорной карте. */
export const CITY_ZONE_GUTTER = 0.38;

/** Плиточные зоны (corp grid и т.п.) — без двойного gutter, иначе «дырки» в сетке. */
export const CITY_ZONE_GUTTER_TILE_MAX = 17;

export function zoneInnerRect(
  x: number,
  y: number,
  w: number,
  h: number,
  gutter = CITY_ZONE_GUTTER
): { x: number; y: number; w: number; h: number } {
  if (w <= gutter * 2.5 || h <= gutter * 2.5) {
    return { x, y, w, h };
  }
  return { x: x + gutter, y: y + gutter, w: w - gutter * 2, h: h - gutter * 2 };
}

export function zoneOverviewRect(
  x: number,
  y: number,
  w: number,
  h: number
): { x: number; y: number; w: number; h: number } {
  return { x, y, w, h };
}

export function megaWatermarkFontSize(w: number, h: number): number {
  return Math.max(5.5, Math.min(10, Math.min(w * 0.085, h * 0.12)));
}

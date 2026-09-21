/** Силуэт района на обзорной карте — несколько «пиков», без мелкой сетки. */

import { corpTileTheme } from './corpTileThemes.js';

export type DistrictPeak = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Оценка fontSize для SVG-подписи тайла (viewBox units).
 * Для corp — жёстче вписываем в ширину по длине самой длинной строки.
 */
export function overviewLabelFontSize(
  w: number,
  h: number,
  lines: string[],
  zoneType: string
): number {
  const base = Math.max(1.8, Math.min(3.1, w * 0.22, h * 0.2));
  if (zoneType !== 'corp' && w > 17) return base;
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const fit = (w * 0.88) / (longest * 0.62);
  return Math.max(1.35, Math.min(base, fit));
}

/** Подписи на обзорной карте — по словам, без рваного split по символам. */
export function overviewLabelLines(name: string, zoneType: string, corpName?: string | null): string[] {
  if (zoneType === 'corp') {
    const theme = corpTileTheme(corpName || name);
    // Узкие HQ-тайлы: abbrev, чтобы не склеивались с соседями.
    return [theme.abbrev || theme.label];
  }
  if (['park', 'mid', 'slum', 'industrial'].includes(zoneType)) {
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length <= 2) return [name];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  if (name.length > 14) {
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
  }
  return [name];
}

export function computeDistrictPeaks(
  zoneKey: string,
  zoneType: string,
  zx: number,
  zy: number,
  zw: number,
  zh: number
): DistrictPeak[] {
  if (['highway', 'overpass', 'tunnel'].includes(zoneType)) return [];
  if (zw < 6 || zh < 4) return [];

  const baseY = zy + zh * 0.92;
  const floor = zh * (zoneType === 'corp' ? 0.35 : zoneType === 'park' ? 0.2 : 0.28);

  if (zoneType === 'corp' || zw < 18) {
    const h = floor * 0.9;
    return [{ x: zx + zw * 0.05, y: baseY - h, w: zw * 0.9, h }];
  }

  let hash = 0;
  for (let i = 0; i < zoneKey.length; i++) hash = (hash * 31 + zoneKey.charCodeAt(i)) | 0;

  const count = zoneType === 'industrial' ? 3 : zoneType === 'park' ? 2 : 3;
  const peaks: DistrictPeak[] = [];

  for (let i = 0; i < count; i++) {
    const seed = (hash + i * 53) | 0;
    const slotW = zw / count;
    const w = slotW * (0.5 + (Math.abs(seed) % 28) / 100);
    const h = floor * (0.55 + (Math.abs(seed >> 4) % 45) / 100);
    peaks.push({
      x: zx + slotW * i + (slotW - w) / 2 + (slotW * 0.08 * (i % 2 === 0 ? 1 : -1)),
      y: baseY - h,
      w,
      h,
    });
  }
  return peaks;
}

/** Цвет неоновой обводки по типу района. */
export function districtNeonStroke(zoneType: string): string {
  switch (zoneType) {
    case 'corp':
      return 'rgba(220, 140, 255, 0.95)';
    case 'slum':
      return 'rgba(255, 110, 140, 0.9)';
    case 'industrial':
      return 'rgba(255, 190, 90, 0.88)';
    case 'park':
      return 'rgba(100, 240, 150, 0.85)';
    case 'highway':
      return 'rgba(255, 220, 110, 0.9)';
    case 'overpass':
      return 'rgba(190, 200, 230, 0.75)';
    case 'tunnel':
      return 'rgba(140, 160, 200, 0.7)';
    default:
      return 'rgba(120, 200, 255, 0.88)';
  }
}

export function districtPlateFill(zoneType: string): string {
  switch (zoneType) {
    case 'highway':
      return 'rgba(28, 24, 18, 0.82)';
    case 'overpass':
      return 'rgba(22, 22, 32, 0.8)';
    case 'tunnel':
      return 'rgba(16, 18, 28, 0.82)';
    case 'corp':
      return 'rgba(28, 12, 48, 0.78)';
    case 'slum':
      return 'rgba(42, 12, 22, 0.78)';
    case 'industrial':
      return 'rgba(36, 28, 12, 0.78)';
    case 'park':
      return 'rgba(10, 36, 22, 0.76)';
    default:
      return 'rgba(14, 28, 48, 0.78)';
  }
}

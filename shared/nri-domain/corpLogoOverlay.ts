/** Corp logo stamps on district grid — visual overlay only (artId logo:*). */

import type { PlazaMegaSpan } from './plazaMega.js';
import {
  shapeCellOffsets,
  type MegaShape,
} from './districtMegaMerge.js';

/** Logo footprint shapes (no corners/cross — clean marquees). */
export const CORP_LOGO_SHAPES = ['1x1', '2x1', '1x2', '2x2', '3x3', '6x6'] as const;
export type CorpLogoShape = (typeof CORP_LOGO_SHAPES)[number];

export type CorpLogoInfo = {
  role: 'anchor' | 'cover';
  themeId: string;
  shape: CorpLogoShape;
  anchorKey: string;
  span?: PlazaMegaSpan;
};

export function isCorpLogoShape(s: string): s is CorpLogoShape {
  return (CORP_LOGO_SHAPES as readonly string[]).includes(s);
}

export function encodeCorpLogoArtId(themeId: string, shape: CorpLogoShape): string {
  return `logo:${themeId}:${shape}`;
}

export function encodeCorpLogoCoverArtId(anchorZoneKey: string): string {
  return `logo_cover:${anchorZoneKey}`;
}

export function parseCorpLogoArtId(
  artId: string | null | undefined
):
  | { kind: 'anchor'; themeId: string; shape: CorpLogoShape }
  | { kind: 'cover'; anchorKey: string }
  | null {
  if (!artId) return null;
  if (artId.startsWith('logo_cover:')) {
    const anchorKey = artId.slice('logo_cover:'.length);
    return anchorKey ? { kind: 'cover', anchorKey } : null;
  }
  if (artId.startsWith('logo:')) {
    const parts = artId.split(':');
    if (parts.length !== 3) return null;
    const themeId = parts[1]!;
    const shapeRaw = parts[2]!;
    if (!themeId || !isCorpLogoShape(shapeRaw)) return null;
    return { kind: 'anchor', themeId, shape: shapeRaw };
  }
  return null;
}

export function corpLogoCellOffsets(
  shape: CorpLogoShape
): ReadonlyArray<readonly [number, number]> {
  if (shape === '1x1') return [[0, 0]];
  return shapeCellOffsets(shape as MegaShape);
}

function posKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function buildCorpLogoInfo(
  tiles: Array<{
    zoneKey: string;
    gridRow: number;
    gridCol: number;
    x: number;
    y: number;
    w: number;
    h: number;
    artId?: string | null;
  }>
): Map<string, CorpLogoInfo> {
  const byKey = new Map(tiles.map((t) => [t.zoneKey, t]));
  const byPos = new Map(tiles.map((t) => [posKey(t.gridRow, t.gridCol), t]));
  const out = new Map<string, CorpLogoInfo>();

  for (const t of tiles) {
    const parsed = parseCorpLogoArtId(t.artId);
    if (!parsed || parsed.kind !== 'anchor') continue;
    const offsets = corpLogoCellOffsets(parsed.shape);
    const originDr = offsets[0]![0];
    const originDc = offsets[0]![1];
    const originRow = t.gridRow - originDr;
    const originCol = t.gridCol - originDc;
    const cells = offsets
      .map(([dr, dc]) => byPos.get(posKey(originRow + dr, originCol + dc)))
      .filter(Boolean) as typeof tiles;
    if (cells.length === 0) continue;
    const x = Math.min(...cells.map((c) => c.x));
    const y = Math.min(...cells.map((c) => c.y));
    const x2 = Math.max(...cells.map((c) => c.x + c.w));
    const y2 = Math.max(...cells.map((c) => c.y + c.h));
    const span = { x, y, w: x2 - x, h: y2 - y };
    out.set(posKey(t.gridRow, t.gridCol), {
      role: 'anchor',
      themeId: parsed.themeId,
      shape: parsed.shape,
      anchorKey: t.zoneKey,
      span,
    });
    for (const c of cells) {
      if (c.zoneKey === t.zoneKey) continue;
      out.set(posKey(c.gridRow, c.gridCol), {
        role: 'cover',
        themeId: parsed.themeId,
        shape: parsed.shape,
        anchorKey: t.zoneKey,
      });
    }
  }

  for (const t of tiles) {
    const parsed = parseCorpLogoArtId(t.artId);
    if (!parsed || parsed.kind !== 'cover') continue;
    const k = posKey(t.gridRow, t.gridCol);
    if (out.has(k)) continue;
    const anchor = byKey.get(parsed.anchorKey);
    const ap = parseCorpLogoArtId(anchor?.artId);
    out.set(k, {
      role: 'cover',
      themeId: ap?.kind === 'anchor' ? ap.themeId : 'default',
      shape: ap?.kind === 'anchor' ? ap.shape : '1x1',
      anchorKey: parsed.anchorKey,
    });
  }

  return out;
}

/** Theme keys available for logo brushes (match corpTileThemes). */
export const CORP_LOGO_THEME_OPTIONS = [
  { id: 'arasaka', label: 'Алый синдикат' },
  { id: 'militech', label: 'Зелёный арсенал' },
  { id: 'kang_tao', label: 'Золотой гекс' },
  { id: 'biotechnica', label: 'Биоспираль' },
  { id: 'trauma_team', label: 'Красный щит' },
  { id: 'netwatch', label: 'Синий радар' },
  { id: 'zetatech', label: 'Фиолет. чип' },
  { id: 'orbital_air', label: 'Орбитальная дуга' },
  { id: 'sovoil', label: 'Янтарный ресурс' },
  { id: 'ebm', label: 'Волна E-band' },
  { id: 'default', label: 'Нейтральный печать' },
] as const;

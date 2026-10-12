/** Спрайты клеток квартала — top на карте, iso ¾ в попапе. */

import type { PlaceType } from './districtGrid';
import { resolveBuildingArt } from './districtBuildingArtGallery';

/** @deprecated nested SVG <image> — не использовать для mega */
export const DISTRICT_PLAZA_MEGA_SPRITE = '/map-tiles/district-plaza-2x2.svg';

export type BuildingArtView = 'top' | 'front' | 'back' | 'iso';

/** /map-tiles/district-house-top.png → stem …/district-house */
function artStem(href: string): { stem: string; ext: string } {
  const m = href.match(/^(.*?)(?:-(?:top|front|back|iso))?(\.[a-z0-9]+)$/i);
  if (!m) return { stem: href.replace(/\.[a-z0-9]+$/i, ''), ext: '.png' };
  return { stem: m[1]!, ext: m[2]! };
}

export function buildingArtViewHref(href: string, view: BuildingArtView): string {
  const { stem, ext } = artStem(href);
  if (ext.toLowerCase() === '.svg') return href;
  return `${stem}-${view}${ext}`;
}

/**
 * Карта: **top** (ортогональный план, крутится на 90°).
 * Попап: **iso** (¾ объём). front/back — запасные фасады.
 */
export function districtTileSprite(
  placeType: PlaceType,
  zoneKey?: string,
  artId?: string | null,
  opts?: { view?: BuildingArtView }
): string | null {
  const entry = resolveBuildingArt(artId, placeType, zoneKey);
  if (!entry?.href) return null;
  return buildingArtViewHref(entry.href, opts?.view ?? 'top');
}

/** Попап: ¾-изометрия. */
export function districtTileInspectSprite(
  placeType: PlaceType,
  zoneKey?: string,
  artId?: string | null,
  _rotation?: number
): string | null {
  return districtTileSprite(placeType, zoneKey, artId, { view: 'iso' });
}

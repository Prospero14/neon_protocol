import type { PlaceType } from './districtGrid';

/** PNG/WebP спрайты клеток (public/map-tiles). */
export const DISTRICT_TILE_SPRITE: Partial<Record<PlaceType, string>> = {
  house: '/map-tiles/district-house-residential.png',
};

export function districtTileSprite(placeType: PlaceType): string | null {
  return DISTRICT_TILE_SPRITE[placeType] ?? null;
}

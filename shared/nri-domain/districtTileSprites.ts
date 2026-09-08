import type { PlaceType } from './districtGrid';

/** PNG/SVG спрайты клеток (public/map-tiles). Base без запечённого мерцания — FX поверх в NriDistrictTile. */
export const DISTRICT_TILE_SPRITE: Partial<Record<PlaceType, string>> = {
  house: '/map-tiles/district-house.svg',
  restaurant: '/map-tiles/district-restaurant.svg',
  shop: '/map-tiles/district-shop.svg',
  secondhand: '/map-tiles/district-secondhand.svg',
  metro: '/map-tiles/district-metro.svg',
};

export function districtTileSprite(placeType: PlaceType): string | null {
  return DISTRICT_TILE_SPRITE[placeType] ?? null;
}

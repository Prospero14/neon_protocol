/** PNG/WebP спрайты клеток (public/map-tiles). */
export const DISTRICT_TILE_SPRITE = {
    house: '/map-tiles/district-house-residential.png',
};
export function districtTileSprite(placeType) {
    return DISTRICT_TILE_SPRITE[placeType] ?? null;
}
//# sourceMappingURL=districtTileSprites.js.map
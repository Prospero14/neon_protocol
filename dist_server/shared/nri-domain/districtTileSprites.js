/** Спрайты клеток квартала — через галерею построек. */
import { resolveBuildingArt } from './districtBuildingArtGallery';
/** @deprecated nested SVG <image> — не использовать для mega */
export const DISTRICT_PLAZA_MEGA_SPRITE = '/map-tiles/district-plaza-2x2.svg';
export function districtTileSprite(placeType, zoneKey, artId) {
    const entry = resolveBuildingArt(artId, placeType, zoneKey);
    return entry?.href ?? null;
}
//# sourceMappingURL=districtTileSprites.js.map
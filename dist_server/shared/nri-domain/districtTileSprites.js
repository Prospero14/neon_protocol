/** Спрайты клеток квартала — top на карте, iso ¾ в попапе. */
import { resolveBuildingArt } from './districtBuildingArtGallery';
/** @deprecated nested SVG <image> — не использовать для mega */
export const DISTRICT_PLAZA_MEGA_SPRITE = '/map-tiles/district-plaza-2x2.svg';
/** /map-tiles/district-house-top.png → stem …/district-house */
function artStem(href) {
    const m = href.match(/^(.*?)(?:-(?:top|front|back|iso))?(\.[a-z0-9]+)$/i);
    if (!m)
        return { stem: href.replace(/\.[a-z0-9]+$/i, ''), ext: '.png' };
    return { stem: m[1], ext: m[2] };
}
export function buildingArtViewHref(href, view) {
    const { stem, ext } = artStem(href);
    if (ext.toLowerCase() === '.svg')
        return href;
    return `${stem}-${view}${ext}`;
}
/**
 * Карта: **top** (ортогональный план, крутится на 90°).
 * Попап: **iso** (¾ объём). front/back — запасные фасады.
 */
export function districtTileSprite(placeType, zoneKey, artId, opts) {
    const entry = resolveBuildingArt(artId, placeType, zoneKey);
    if (!entry?.href)
        return null;
    return buildingArtViewHref(entry.href, opts?.view ?? 'top');
}
/** Попап: ¾-изометрия. */
export function districtTileInspectSprite(placeType, zoneKey, artId, _rotation) {
    return districtTileSprite(placeType, zoneKey, artId, { view: 'iso' });
}
//# sourceMappingURL=districtTileSprites.js.map
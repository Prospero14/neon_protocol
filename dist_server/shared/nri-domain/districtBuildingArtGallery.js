import galleryJson from '../nri-map-art/district-building-gallery.json';
const ENTRIES = galleryJson;
const BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));
function hashMod(s, mod) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % mod;
}
export function listBuildingArt() {
    return ENTRIES;
}
export function resolveBuildingArt(artId, placeType, zoneKey) {
    if (artId && BY_ID.has(artId))
        return BY_ID.get(artId);
    const candidates = ENTRIES.filter((e) => e.placeTypes.includes(placeType));
    if (candidates.length === 0)
        return null;
    if (candidates.length === 1)
        return candidates[0];
    const i = hashMod(zoneKey ?? placeType, candidates.length);
    return candidates[i];
}
//# sourceMappingURL=districtBuildingArtGallery.js.map
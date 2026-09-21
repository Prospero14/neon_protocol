import galleryJson from '../nri-map-art/city-zone-gallery.json';
const ENTRIES = galleryJson;
const BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));
const BY_TYPE = new Map();
for (const e of ENTRIES) {
    if (e.defaultZoneType && !BY_TYPE.has(e.defaultZoneType))
        BY_TYPE.set(e.defaultZoneType, e);
}
export function listCityZoneArt() {
    return ENTRIES;
}
export function resolveCityZoneArt(artId, zoneType) {
    if (artId && BY_ID.has(artId))
        return BY_ID.get(artId);
    if (zoneType && BY_TYPE.has(zoneType))
        return BY_TYPE.get(zoneType);
    return null;
}
//# sourceMappingURL=cityZoneArtGallery.js.map
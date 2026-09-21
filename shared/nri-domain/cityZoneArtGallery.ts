import galleryJson from '../nri-map-art/city-zone-gallery.json';

export type CityZoneArtEntry = {
  id: string;
  label: string;
  kind: string;
  href: string;
  defaultZoneType?: string;
  fill?: string;
};

const ENTRIES = galleryJson as CityZoneArtEntry[];
const BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));
const BY_TYPE = new Map<string, CityZoneArtEntry>();
for (const e of ENTRIES) {
  if (e.defaultZoneType && !BY_TYPE.has(e.defaultZoneType)) BY_TYPE.set(e.defaultZoneType, e);
}

export function listCityZoneArt(): CityZoneArtEntry[] {
  return ENTRIES;
}

export function resolveCityZoneArt(
  artId: string | null | undefined,
  zoneType?: string
): CityZoneArtEntry | null {
  if (artId && BY_ID.has(artId)) return BY_ID.get(artId)!;
  if (zoneType && BY_TYPE.has(zoneType)) return BY_TYPE.get(zoneType)!;
  return null;
}

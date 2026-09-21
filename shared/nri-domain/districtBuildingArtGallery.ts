import galleryJson from '../nri-map-art/district-building-gallery.json';
import type { PlaceType } from './districtGrid';

export type BuildingArtEntry = {
  id: string;
  label: string;
  placeTypes: string[];
  href: string;
};

const ENTRIES = galleryJson as BuildingArtEntry[];
const BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));

function hashMod(s: string, mod: number): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % mod;
}

export function listBuildingArt(): BuildingArtEntry[] {
  return ENTRIES;
}

export function resolveBuildingArt(
  artId: string | null | undefined,
  placeType: PlaceType,
  zoneKey?: string
): BuildingArtEntry | null {
  if (artId && BY_ID.has(artId)) return BY_ID.get(artId)!;
  const candidates = ENTRIES.filter((e) => e.placeTypes.includes(placeType));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;
  const i = hashMod(zoneKey ?? placeType, candidates.length);
  return candidates[i]!;
}

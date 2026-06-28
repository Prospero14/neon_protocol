/** Ключи районов и сабзон — общий контракт клиент / сервер / achievements. */

export const SUBZONE_DELIM = '__';

export function rootMapZoneKey(zoneKey: string): string {
  const i = zoneKey.indexOf(SUBZONE_DELIM);
  return i > 0 ? zoneKey.slice(0, i) : zoneKey;
}

export function isSubMapZoneKey(zoneKey: string): boolean {
  return zoneKey.includes(SUBZONE_DELIM);
}

export function subMapZoneKey(parentZoneKey: string, slug: string): string {
  const s = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return `${parentZoneKey}${SUBZONE_DELIM}${s || 'place'}`;
}

export function canDrillIntoDistrict(zone: { zoneType: string; parentZoneKey?: string | null }): boolean {
  if (zone.parentZoneKey) return false;
  return !['highway', 'overpass', 'tunnel', 'meta'].includes(zone.zoneType);
}

/** Файл seed-каталога `shared/nri-neon-city-zones/{key}.json`. */
export function megaSeedGroupKey(zone: { zoneKey: string; parentZoneKey?: string | null }): string {
  const anchorKey = zone.parentZoneKey ?? zone.zoneKey;
  if (anchorKey.startsWith('hw_') || zone.zoneKey.startsWith('hw_')) return 'highways';
  if (anchorKey.startsWith('corp_') || zone.zoneKey.startsWith('corp_')) return 'city_center';
  const m = anchorKey.match(/^(watson|westbrook|city_center|heywood|santo_domingo|pacifica)_/);
  return m?.[1] ?? 'city_center';
}

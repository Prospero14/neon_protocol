/** Типы и подписи районов карты Neon City. */
export type { MapZoneType, MapZoneSeed } from './nriNeonCityMapGen';
export {
  MAP_VIEW as NEON_CITY_VIEW,
  generateNeonCityZones,
  getMegaClusters,
  getMegaWatermarks,
  megaFromZoneKey,
  megaKeyFromZoneKey,
} from './nriNeonCityMapGen';
export type { MegaCluster } from './nriNeonCityMapGen';

export type NeonCityDistrictType = import('./nriNeonCityMapGen').MapZoneType;

export type NeonCityDistrict = {
  id: string;
  name: string;
  type: NeonCityDistrictType;
  x: number;
  y: number;
  w: number;
  h: number;
  corp?: string;
  locked?: boolean;
  pois?: string[];
};

export const ZONE_TYPE_DEFAULT_COLORS: Record<string, string> = {
  highway: '#ffb428',
  overpass: '#78788c',
  industrial: '#c8963c',
  slum: '#c82864',
  mid: '#5a9ee6',
  park: '#50dc78',
  corp: '#c864ff',
  tunnel: '#ff0080',
};

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function zoneDisplayColor(zone: { zoneType: string; color?: string | null }): string {
  if (zone.color?.trim()) return zone.color.trim();
  return ZONE_TYPE_DEFAULT_COLORS[zone.zoneType] ?? '#5a9ee6';
}

export function zoneRectPaint(
  color: string | null | undefined,
  zoneType: string
): { fill: string; stroke: string } {
  const hex = color?.trim() || ZONE_TYPE_DEFAULT_COLORS[zoneType] || '#5a9ee6';
  const fillAlpha = ['highway', 'overpass'].includes(zoneType) ? 0.72 : 0.28;
  return {
    fill: hexToRgba(hex, fillAlpha),
    stroke: hexToRgba(hex, 0.85),
  };
}

export const DISTRICT_TYPE_LABELS: Record<NeonCityDistrictType, string> = {
  corp: 'Корп-квартал',
  mid: 'Средний класс',
  slum: 'Трущобы',
  park: 'Общественная зона',
  industrial: 'Промзона',
  highway: 'Магистраль',
  tunnel: 'Корп-тоннель',
  overpass: 'Развязка',
};


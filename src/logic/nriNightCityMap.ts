/** Типы и подписи районов карты Night City. */
export type { MapZoneType, MapZoneSeed } from './nriNightCityMapGen';
export {
  MAP_VIEW as NIGHT_CITY_VIEW,
  generateNightCityZones,
  getMegaWatermarks,
  megaFromZoneKey,
  megaKeyFromZoneKey,
} from './nriNightCityMapGen';

export type NightCityDistrictType = import('./nriNightCityMapGen').MapZoneType;

export type NightCityDistrict = {
  id: string;
  name: string;
  type: NightCityDistrictType;
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
): { fill: string; stroke: string } | undefined {
  if (!color?.trim()) return undefined;
  const hex = color.trim();
  return {
    fill: hexToRgba(hex, 0.55),
    stroke: hexToRgba(hex, 0.85),
  };
}

export const DISTRICT_TYPE_LABELS: Record<NightCityDistrictType, string> = {
  corp: 'Корп-квартал',
  mid: 'Средний класс',
  slum: 'Трущобы',
  park: 'Общественная зона',
  industrial: 'Промзона',
  highway: 'Магистраль',
  tunnel: 'Корп-тоннель',
  overpass: 'Развязка',
};

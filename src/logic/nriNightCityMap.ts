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

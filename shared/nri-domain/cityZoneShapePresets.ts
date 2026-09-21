/** Пресеты форм топ-зон карты (AABB). */

export type CityShapeKind = 'district' | 'tunnel' | 'highway';

export type CityZoneShapePreset = {
  id: string;
  label: string;
  kind: CityShapeKind;
  w: number;
  h: number;
  defaultZoneType: string;
  defaultArtId?: string;
};

export const DISTRICT_SHAPE_PRESETS: CityZoneShapePreset[] = [
  { id: 'block_square', label: 'Квадрат', kind: 'district', w: 22, h: 22, defaultZoneType: 'mid', defaultArtId: 'city_mid' },
  { id: 'block_wide', label: 'Широкий', kind: 'district', w: 32, h: 16, defaultZoneType: 'mid', defaultArtId: 'city_mid' },
  { id: 'block_tall', label: 'Высокий', kind: 'district', w: 16, h: 32, defaultZoneType: 'slum', defaultArtId: 'city_slum' },
  { id: 'campus', label: 'Кампус', kind: 'district', w: 36, h: 28, defaultZoneType: 'corp', defaultArtId: 'city_corp' },
  { id: 'pocket', label: 'Карман', kind: 'district', w: 14, h: 14, defaultZoneType: 'park', defaultArtId: 'city_park' },
  { id: 'strip', label: 'Полоса', kind: 'district', w: 40, h: 12, defaultZoneType: 'industrial', defaultArtId: 'city_industrial' },
  { id: 'wedge', label: 'Клин', kind: 'district', w: 18, h: 26, defaultZoneType: 'industrial', defaultArtId: 'city_industrial' },
  { id: 'plaza', label: 'Площадь', kind: 'district', w: 24, h: 24, defaultZoneType: 'park', defaultArtId: 'city_park' },
];

export const TUNNEL_SHAPE_PRESETS: CityZoneShapePreset[] = [
  { id: 'tunnel_ns', label: 'Тоннель С–Ю', kind: 'tunnel', w: 8, h: 40, defaultZoneType: 'tunnel', defaultArtId: 'city_tunnel_ns' },
  { id: 'tunnel_ew', label: 'Тоннель З–В', kind: 'tunnel', w: 40, h: 8, defaultZoneType: 'tunnel', defaultArtId: 'city_tunnel_ew' },
  { id: 'tunnel_short', label: 'Короткий тоннель', kind: 'tunnel', w: 12, h: 8, defaultZoneType: 'tunnel', defaultArtId: 'city_tunnel_short' },
  { id: 'highway_ns', label: 'Трасса С–Ю', kind: 'highway', w: 10, h: 48, defaultZoneType: 'highway', defaultArtId: 'city_highway' },
  { id: 'highway_ew', label: 'Трасса З–В', kind: 'highway', w: 48, h: 10, defaultZoneType: 'highway', defaultArtId: 'city_highway' },
];

export const ALL_CITY_SHAPE_PRESETS: CityZoneShapePreset[] = [
  ...DISTRICT_SHAPE_PRESETS,
  ...TUNNEL_SHAPE_PRESETS,
];

export function cityShapePresetById(id: string): CityZoneShapePreset | null {
  return ALL_CITY_SHAPE_PRESETS.find((p) => p.id === id) ?? null;
}

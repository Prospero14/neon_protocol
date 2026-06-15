/**
 * Транспорт Carbon 2185 (упрощённо по правилам: Body, Speed, места, груз).
 * Управление: Vehicles (Land) или Vehicles (Aircraft).
 */

export type NriVehicleCatalogId =
  | 'thornton_galena'
  | 'yaiba_kusanagi'
  | 'mackinaw_pickup'
  | 'quadra_type66'
  | 'av4_aerodyne'
  | 'maverick_truck';

export type NriVehicleDef = {
  id: NriVehicleCatalogId;
  name: string;
  type: 'land' | 'air';
  body: number;
  speed: number;
  seats: number;
  cargoLb: number;
  ac: number;
  skill: 'Vehicles (Land)' | 'Vehicles (Aircraft)';
  blurb: string;
};

export const NRI_VEHICLE_CATALOG: NriVehicleDef[] = [
  {
    id: 'thornton_galena',
    name: 'Thorton Galena',
    type: 'land',
    body: 35,
    speed: 80,
    seats: 4,
    cargoLb: 200,
    ac: 11,
    skill: 'Vehicles (Land)',
    blurb: 'Массовый городской седан — незаметный, надёжный.',
  },
  {
    id: 'yaiba_kusanagi',
    name: 'Yaiba Kusanagi CT-3X',
    type: 'land',
    body: 20,
    speed: 120,
    seats: 2,
    cargoLb: 40,
    ac: 13,
    skill: 'Vehicles (Land)',
    blurb: 'Спортбайк — манёвренность, мало груза.',
  },
  {
    id: 'mackinaw_pickup',
    name: 'Thorton Mackinaw',
    type: 'land',
    body: 50,
    speed: 70,
    seats: 2,
    cargoLb: 800,
    ac: 12,
    skill: 'Vehicles (Land)',
    blurb: 'Пикап Badlands — груз и броня кузова.',
  },
  {
    id: 'quadra_type66',
    name: 'Quadra Type-66 «Avenger»',
    type: 'land',
    body: 40,
    speed: 110,
    seats: 2,
    cargoLb: 80,
    ac: 14,
    skill: 'Vehicles (Land)',
    blurb: 'Мускул-кар — скорость и угроза на шоссе.',
  },
  {
    id: 'maverick_truck',
    name: 'Maverick Armored Truck',
    type: 'land',
    body: 80,
    speed: 55,
    seats: 6,
    cargoLb: 1200,
    ac: 16,
    skill: 'Vehicles (Land)',
    blurb: 'Бронегрузовик корп-конвоя.',
  },
  {
    id: 'av4_aerodyne',
    name: 'AV-4 «Aerodyne»',
    type: 'air',
    body: 60,
    speed: 100,
    seats: 6,
    cargoLb: 400,
    ac: 15,
    skill: 'Vehicles (Aircraft)',
    blurb: 'Корпоративный аэродин — вертикальный взлёт, дорогой топливный аппетит.',
  },
];

const BY_ID = new Map(NRI_VEHICLE_CATALOG.map((v) => [v.id, v]));

export function getVehicleDef(id: string): NriVehicleDef | undefined {
  return BY_ID.get(id as NriVehicleCatalogId);
}

export type NriSessionVehicle = {
  id: string;
  catalogId: string;
  label: string | null;
  assignedUserId: string | null;
  assignedDisplayName: string | null;
  notes: string | null;
  createdAt: number;
};

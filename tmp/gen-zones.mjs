import { writeFileSync } from 'fs';
import { generateNightCityZones, validateZoneCoverage } from '../src/logic/nriNightCityMapGen.ts';

const zones = generateNightCityZones();
const check = validateZoneCoverage(zones);
console.log('zones:', zones.length);
console.log('coverage:', check);

writeFileSync('shared/nri-night-city-zones.json', JSON.stringify(zones, null, 2));
console.log('written shared/nri-night-city-zones.json');

if (!check.ok) {
  console.warn('LAYOUT WARN (border cells):', check);
}

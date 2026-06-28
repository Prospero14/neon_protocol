import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { generateNeonCityZones, validateZoneCoverage } from '../src/logic/nriNeonCityMapGen.ts';
import { generateAllSubZones } from '../src/logic/nriNeonCitySubzonesGen.ts';
import { megaSeedGroupKey } from '../shared/nri-domain/mapZones.ts';

const top = generateNeonCityZones();
const sub = generateAllSubZones(top);
const zones = [...top, ...sub];
const check = validateZoneCoverage(zones);
console.log('zones:', zones.length, '(top:', top.length, 'sub:', sub.length, ')');
console.log('coverage:', check);

const outDir = 'shared/nri-neon-city-zones';
mkdirSync(outDir, { recursive: true });

const groups = new Map();
for (const z of zones) {
  const key = megaSeedGroupKey(z);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(z);
}

for (const [key, list] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  list.sort((a, b) => a.sortOrder - b.sortOrder);
  writeFileSync(`${outDir}/${key}.json`, `${JSON.stringify(list, null, 2)}\n`);
  console.log('written', `${key}.json`, list.length);
}

try {
  rmSync('shared/nri-neon-city-zones.json');
  console.log('removed shared/nri-neon-city-zones.json');
} catch {
  /* already gone */
}

if (!check.ok) {
  console.warn('LAYOUT WARN (border cells):', check);
}

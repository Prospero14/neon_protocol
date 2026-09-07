/** Re-export shared district layout/generation for client code. */
export {
  DISTRICT_DRILL_CANVAS,
  computeDistrictGridLayout,
  relayoutDistrictGridTiles,
  generateDistrictGrid,
  type DistrictGridLayout,
  type DistrictParentSeed,
  type DistrictTileSeed,
} from '../../shared/nri-domain/districtLayout.js';
import { generateDistrictGrid, type DistrictParentSeed } from '../../shared/nri-domain/districtLayout.js';
import type { MapZoneSeed } from './nriNeonCityMapGen';

export function generateAllSubZones(parents: MapZoneSeed[]): MapZoneSeed[] {
  const top = parents.filter((z) => !z.parentZoneKey);
  const subs: MapZoneSeed[] = [];
  for (const p of top) {
    subs.push(...(generateDistrictGrid(p as DistrictParentSeed) as MapZoneSeed[]));
  }
  return subs;
}

/** Алиас для тестов и обратной совместимости. */
export function generateSubZonesForParent(parent: MapZoneSeed): MapZoneSeed[] {
  return generateDistrictGrid(parent as DistrictParentSeed) as MapZoneSeed[];
}

import { describe, expect, it } from 'vitest';
import { generateNeonCityZones } from './nriNeonCityMapGen';
import {
  computeDistrictGridLayout,
  DISTRICT_DRILL_CANVAS,
  generateAllSubZones,
  generateSubZonesForParent,
} from './nriNeonCitySubzonesGen';
import { isSubMapZoneKey, canDrillIntoDistrict } from '../../shared/nri-domain/mapZones';

describe('nriNeonCitySubzonesGen', () => {
  it('drill layout fills canonical canvas with dense grid', () => {
    const layout = computeDistrictGridLayout();
    expect(layout.canvasW).toBe(DISTRICT_DRILL_CANVAS.w);
    expect(layout.rows).toBeGreaterThanOrEqual(6);
    expect(layout.cols).toBeGreaterThanOrEqual(8);
    expect(layout.rows * layout.cols).toBeGreaterThanOrEqual(48);
  });

  it('generates grid subzones with placeType and grid coords', () => {
    const top = generateNeonCityZones();
    const parent = top.find((z) => canDrillIntoDistrict(z));
    expect(parent).toBeTruthy();
    const subs = generateSubZonesForParent(parent!);
    expect(subs.length).toBeGreaterThanOrEqual(48);
    for (const s of subs) {
      expect(s.parentZoneKey).toBe(parent!.zoneKey);
      expect(isSubMapZoneKey(s.zoneKey)).toBe(true);
      expect(s.placeType).toBeTruthy();
      expect(s.gridRow).toBeGreaterThanOrEqual(0);
      expect(s.gridCol).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeGreaterThanOrEqual(parent!.x);
      expect(s.y).toBeGreaterThanOrEqual(parent!.y);
      expect(s.x + s.w).toBeLessThanOrEqual(parent!.x + DISTRICT_DRILL_CANVAS.w + 0.01);
      expect(s.y + s.h).toBeLessThanOrEqual(parent!.y + DISTRICT_DRILL_CANVAS.h + 0.01);
    }
    expect(subs.some((s) => s.placeType === 'exit')).toBe(true);
  });

  it('generateAllSubZones skips highways', () => {
    const top = generateNeonCityZones();
    const all = generateAllSubZones(top);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((z) => z.parentZoneKey)).toBe(true);
    expect(all.some((z) => z.zoneKey.startsWith('highway'))).toBe(false);
  });
});
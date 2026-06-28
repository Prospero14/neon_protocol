import { describe, expect, it } from 'vitest';
import {
  canDrillIntoDistrict,
  isSubMapZoneKey,
  megaSeedGroupKey,
  rootMapZoneKey,
  subMapZoneKey,
  SUBZONE_DELIM,
} from './mapZones';

describe('mapZones', () => {
  it('rootMapZoneKey strips subzone suffix', () => {
    expect(rootMapZoneKey('watson_kabuki__bar')).toBe('watson_kabuki');
    expect(rootMapZoneKey('watson_kabuki')).toBe('watson_kabuki');
  });

  it('isSubMapZoneKey detects composite keys', () => {
    expect(isSubMapZoneKey(`watson_kabuki${SUBZONE_DELIM}bar`)).toBe(true);
    expect(isSubMapZoneKey('highway_north')).toBe(false);
  });

  it('subMapZoneKey slugifies label', () => {
    expect(subMapZoneKey('watson_kabuki', 'Neon Bar!')).toBe('watson_kabuki__neon_bar');
  });

  it('canDrillIntoDistrict blocks infra and nested zones', () => {
    expect(canDrillIntoDistrict({ zoneType: 'mid' })).toBe(true);
    expect(canDrillIntoDistrict({ zoneType: 'highway' })).toBe(false);
    expect(canDrillIntoDistrict({ zoneType: 'mid', parentZoneKey: 'watson_kabuki' })).toBe(false);
  });

  it('megaSeedGroupKey maps zones to seed file slug', () => {
    expect(megaSeedGroupKey({ zoneKey: 'hw_ns_n' })).toBe('highways');
    expect(megaSeedGroupKey({ zoneKey: 'watson_kabuki' })).toBe('watson');
    expect(megaSeedGroupKey({ zoneKey: 'watson_kabuki__0_1', parentZoneKey: 'watson_kabuki' })).toBe('watson');
    expect(megaSeedGroupKey({ zoneKey: 'corp_arasaka' })).toBe('city_center');
    expect(megaSeedGroupKey({ zoneKey: 'heywood_vista' })).toBe('heywood');
  });
});

import { describe, expect, it } from 'vitest';
import {
  defaultDistrictStyle,
  neighborsForTile,
  parseSubTileGrid,
  subTileZoneKey,
  tileCenterDecay,
  tileDecayAmount,
} from './districtGrid';
import {
  buildingBodyRect,
  districtFillPatternId,
  exitGapDirection,
  isRoadLike,
  resolveRoadCore,
  resolveTileVisual,
  roadLinksFor,
  streetFrontFor,
} from './districtTileVisual';

describe('districtGrid', () => {
  it('subTileZoneKey and parse round-trip', () => {
    const key = subTileZoneKey('watson_kabuki', 2, 3);
    expect(key).toBe('watson_kabuki__2_3');
    expect(parseSubTileGrid(key)).toEqual({ row: 2, col: 3 });
  });

  it('defaultDistrictStyle maps zone types', () => {
    expect(defaultDistrictStyle('corp')).toBe('corp_clean');
    expect(defaultDistrictStyle('slum')).toBe('slum');
    expect(defaultDistrictStyle('mid')).toBe('residential');
  });

  it('tileCenterDecay is 0 at center of odd grid', () => {
    expect(tileCenterDecay(1, 1, 3, 3)).toBe(0);
    expect(tileCenterDecay(0, 0, 3, 3)).toBeGreaterThan(0.5);
  });

  it('tileDecayAmount respects corp_clean and park', () => {
    expect(tileDecayAmount(1, 'corp_clean', 'alley')).toBeLessThan(0.2);
    expect(tileDecayAmount(1, 'slum', 'alley')).toBeGreaterThan(0.9);
    expect(tileDecayAmount(1, 'residential', 'park')).toBeLessThan(0.4);
  });

  it('neighborsForTile reads 4-neighborhood', () => {
    const byPos = new Map<string, string>([
      ['1,1', 'road'],
      ['0,1', 'house'],
      ['2,1', 'shop'],
      ['1,0', 'generic'],
      ['1,2', 'exit'],
    ]);
    expect(neighborsForTile(1, 1, byPos)).toEqual({
      n: 'house',
      s: 'shop',
      e: 'exit',
      w: 'generic',
    });
  });
});

describe('districtTileVisual', () => {
  it('emits CSS classes; house gets street front not road links', () => {
    const neighbors = { n: 'road' as const, s: 'generic' as const };
    const visual = resolveTileVisual({
      placeType: 'house',
      districtStyle: 'industrial',
      zoneKey: 'watson__1_1',
      gridRow: 1,
      gridCol: 1,
      gridRows: 3,
      gridCols: 3,
      neighbors,
    });
    expect(visual.patternClass).toContain('nri-district-tile--house');
    expect(visual.showBuilding).toBe(true);
    expect(visual.streetFront.n).toBe(true);
    expect(visual.roadLinks.n).toBe(false);
    expect(visual.facadeDir).toBe('n');
    expect(visual.fillPatternId).toBeNull();
  });

  it('road links only on road cells', () => {
    const links = roadLinksFor('road', { e: 'road', w: 'crossing', n: 'house' });
    expect(links.e).toBe(true);
    expect(links.w).toBe(true);
    expect(resolveRoadCore('road', links)).toBe('h');
    const houseLinks = roadLinksFor('house', { n: 'road' });
    expect(houseLinks.n).toBe(false);
    expect(streetFrontFor({ n: 'road' }).n).toBe(true);
  });

  it('building body shifts away from street', () => {
    const r = buildingBodyRect('n', 'house');
    expect(r.y).toBeGreaterThan(0.1);
  });

  it('exit gap faces perimeter', () => {
    expect(exitGapDirection(0, 2, 5, 5)).toBe('n');
    expect(exitGapDirection(4, 2, 5, 5)).toBe('s');
  });

  it('chinatown shop has lanterns and road texture id', () => {
    const visual = resolveTileVisual({
      placeType: 'shop',
      districtStyle: 'chinatown',
      zoneKey: 'x__1_1',
      gridRow: 1,
      gridCol: 1,
      gridRows: 3,
      gridCols: 3,
      neighbors: {},
    });
    expect(visual.styleAccents).toContain('chinatown_lantern');
    expect(districtFillPatternId('road', 'chinatown')).toBe('ndi-road-chinatown');
  });

  it('isRoadLike covers travel surfaces', () => {
    expect(isRoadLike('road')).toBe(true);
    expect(isRoadLike('exit')).toBe(true);
    expect(isRoadLike('house')).toBe(false);
  });
});

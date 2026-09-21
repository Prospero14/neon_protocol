import { describe, expect, it } from 'vitest';
import {
  defaultDistrictStyle,
  neighborsForTile,
  normalizePlaceType,
  parseSubTileGrid,
  subTileZoneKey,
  tileCenterDecay,
  tileDecayAmount,
  type PlaceType,
} from './districtGrid';
import {
  composeDistrictPlaceTypes,
  dumpQuotaForDistrict,
  generateDistrictGrid,
  isEdgeDistrictOnCityMap,
  normalizeRoadCrossings,
  placeDumpsForDistrict,
  placeTypeClusters,
  promoteSideAccessJunctions,
  placeDistrictLandmarks,
} from './districtLayout';
import {
  applyAlleyInsets,
  buildingBodyRect,
  buildingGutterFor,
  crosswalkEdgesFor,
  districtFillPatternId,
  exitGapDirection,
  innerAlleyEdgesFor,
  isPackedBuildingBlock,
  isRoadLike,
  resolveRoadCore,
  resolveTileVisual,
  roadCornerFromLinks,
  roadCurbFor,
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
    expect(tileDecayAmount(1, 'corp_clean', 'house')).toBeLessThan(0.2);
    expect(tileDecayAmount(1, 'slum', 'shack')).toBeGreaterThan(0.9);
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

  it('roadCornerFromLinks detects L junctions', () => {
    expect(roadCornerFromLinks({ n: false, s: true, e: true, w: false })).toBe('se');
    expect(roadCornerFromLinks({ n: false, s: true, e: false, w: true })).toBe('sw');
    expect(roadCornerFromLinks({ n: true, s: false, e: true, w: false })).toBe('ne');
    expect(roadCornerFromLinks({ n: true, s: false, e: false, w: true })).toBe('nw');
    expect(roadCornerFromLinks({ n: true, s: true, e: true, w: false })).toBeNull();
    expect(roadCornerFromLinks({ n: false, s: false, e: true, w: true })).toBeNull();
  });

  it('building body leaves gutter around sprite', () => {
    const r = buildingBodyRect('n', 'house');
    expect(r.x).toBeGreaterThanOrEqual(0.16);
    expect(r.y).toBeGreaterThan(0.16);
    expect(r.w + r.x).toBeLessThanOrEqual(0.84);
  });

  it('ghetto block: no road gutter between houses, curb on street side', () => {
    const gutter = buildingGutterFor('house', { e: 'house', w: 'road' });
    expect(gutter.e).toBe(false);
    expect(gutter.w).toBe(true);
    const curb = roadCurbFor('road', { e: 'shack' });
    expect(curb.e).toBe(true);
    expect(isPackedBuildingBlock({ n: 'shack', e: 'shack', s: 'road' })).toBe(true);
  });

  it('inner alley edges agree on both tiles of a shared seam', () => {
    const left = innerAlleyEdgesFor('house', { e: 'house' }, 'dist__2_3', 2, 3, 'residential');
    const right = innerAlleyEdgesFor('shop', { w: 'house' }, 'dist__2_4', 2, 4, 'residential');
    expect(left.e).toBe(right.w);
    const inset = applyAlleyInsets({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }, { n: false, s: false, e: true, w: false });
    expect(inset.w).toBeLessThan(0.8);
    expect(inset.x).toBe(0.1);
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
    expect(districtFillPatternId('road', 'chinatown')).toBeNull();
    expect(districtFillPatternId('park', 'chinatown')).toBe('ndi-park-chinatown');
  });

  it('isRoadLike covers travel surfaces', () => {
    expect(isRoadLike('road')).toBe(true);
    expect(isRoadLike('exit')).toBe(true);
    expect(isRoadLike('house')).toBe(false);
  });
});

describe('districtLayout compose', () => {
  it('composes exits, roads and buildings deterministically', () => {
    const a = composeDistrictPlaceTypes(8, 10, 'chinatown', 42);
    const b = composeDistrictPlaceTypes(8, 10, 'chinatown', 42);
    expect(a).toEqual(b);
    expect(a[0]![5]).toBe('exit');
    expect(a[7]![5]).toBe('exit');
    expect(a[4]![0]).toBe('exit');
    expect(a[4]![9]).toBe('exit');
    expect(a[4]![5]).toBe('crossing');
    const flat = a.flat();
    expect(flat.some((t) => t === 'road')).toBe(true);
    expect(flat.some((t) => t === 'restaurant' || t === 'shop')).toBe(true);
    expect(flat.every((t) => t !== 'generic')).toBe(true);
  });

  it('generateDistrictGrid names and styles vary by zoneType', () => {
    const parent = {
      zoneKey: 'watson_kabuki',
      sortOrder: 10,
      name: 'Kabuki',
      zoneType: 'slum',
      x: 0,
      y: 0,
      w: 40,
      h: 30,
    };
    const tiles = generateDistrictGrid(parent);
    expect(tiles.length).toBeGreaterThan(40);
    expect(tiles.every((t) => t.parentZoneKey === 'watson_kabuki')).toBe(true);
    expect(tiles.every((t) => t.districtStyle === 'slum')).toBe(true);
    expect(tiles.filter((t) => t.placeType === 'exit')).toHaveLength(4);
    expect(tiles.some((t) => t.placeType === 'secondhand' || t.placeType === 'shack')).toBe(true);
    expect(tiles.find((t) => t.placeType === 'exit')?.name).toBe('Выход');
  });

  it('same seed yields same grid for a parent', () => {
    const parent = {
      zoneKey: 'corp_arco_a',
      sortOrder: 1,
      name: 'Arasaka',
      zoneType: 'corp',
      x: 1,
      y: 2,
      w: 20,
      h: 15,
    };
    expect(generateDistrictGrid(parent).map((t) => t.placeType)).toEqual(
      generateDistrictGrid(parent).map((t) => t.placeType)
    );
  });

  it('slum gets shack ghetto and dump clusters; corp does not', () => {
    const slum = composeDistrictPlaceTypes(8, 10, 'slum', 99, { isEdgeDistrict: true });
    const flat = slum.flat();
    expect(flat.some((t) => t === 'shack')).toBe(true);
    const dumps = flat.filter((t) => t === 'dump').length;
    expect(dumps).toBeGreaterThanOrEqual(2);
    expect(dumps).toBeLessThanOrEqual(3);
    let adjacentShacks = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 10; c++) {
        if (slum[r]![c] !== 'shack') continue;
        if (slum[r]![c + 1] === 'shack' || slum[r + 1]?.[c] === 'shack') adjacentShacks = true;
      }
    }
    expect(adjacentShacks).toBe(true);
    expect(flat.some((t) => t === 'nightclub')).toBe(true);

    const corp = composeDistrictPlaceTypes(8, 10, 'corp_clean', 99, { isEdgeDistrict: true });
    expect(corp.flat().every((t) => t !== 'shack' && t !== 'dump')).toBe(true);

    const centerSlum = composeDistrictPlaceTypes(8, 10, 'slum', 99, { isEdgeDistrict: false });
    expect(centerSlum.flat().every((t) => t !== 'dump')).toBe(true);

    const edgeRes = composeDistrictPlaceTypes(8, 10, 'residential', 7, { isEdgeDistrict: true });
    expect(edgeRes.flat().filter((t) => t === 'dump')).toHaveLength(1);
  });

  it('isEdgeDistrictOnCityMap uses outer band', () => {
    expect(isEdgeDistrictOnCityMap({ x: 2, y: 2, w: 20, h: 15 })).toBe(true);
    expect(isEdgeDistrictOnCityMap({ x: 100, y: 70, w: 30, h: 25 })).toBe(false);
    expect(isEdgeDistrictOnCityMap({ x: 60, y: 70, w: 25, h: 20 })).toBe(false); // mid, outside outer 22%
    expect(dumpQuotaForDistrict('corp_clean', true, () => 0)).toBe(0);
    expect(dumpQuotaForDistrict('residential', true, () => 0)).toBe(1);
    expect(dumpQuotaForDistrict('slum', true, () => 0.9)).toBe(3);
    expect(dumpQuotaForDistrict('slum', false, () => 0.9)).toBe(0);
  });

  it('placeDumpsForDistrict respects edge + style', () => {
    const grid: PlaceType[][] = Array.from({ length: 6 }, () =>
      Array.from({ length: 6 }, () => 'house' as PlaceType)
    );
    expect(placeDumpsForDistrict(grid, 'residential', true, () => 0.2)).toBe(1);
    expect(grid.flat().filter((t) => t === 'dump')).toHaveLength(1);
    // dump на внешнем кольце, не на центральном кресте
    let dumpAt: [number, number] | null = null;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (grid[r]![c] === 'dump') dumpAt = [r, c];
      }
    }
    expect(dumpAt).not.toBeNull();
    const [dr, dc] = dumpAt!;
    expect(dr <= 1 || dr >= 4 || dc <= 1 || dc >= 4).toBe(true);
    expect(placeDumpsForDistrict(grid, 'corp_clean', true, () => 0.2)).toBe(0);
    expect(grid.flat().every((t) => t !== 'dump')).toBe(true);
  });

  it('parking opposite parking promotes bridge, not false crossing', () => {
    const grid: PlaceType[][] = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => 'house' as PlaceType)
    );
    grid[1]![0] = 'parking';
    grid[1]![1] = 'road';
    grid[1]![2] = 'parking';
    const n = promoteSideAccessJunctions(grid, () => 0.1);
    expect(n).toBe(1);
    expect(grid[1]![1]).toBe('bridge');
  });

  it('normalizeRoadCrossings demotes straight-run crossings to road', () => {
    const grid: PlaceType[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => 'house' as PlaceType)
    );
    // вертикальная дорога без горизонтали — ложный crossing
    for (let r = 0; r < 5; r++) grid[r]![2] = 'crossing';
    expect(normalizeRoadCrossings(grid)).toBe(5);
    expect(grid.every((row) => row[2] === 'road')).toBe(true);

    // настоящий крест
    for (let c = 0; c < 5; c++) grid[2]![c] = 'road';
    for (let r = 0; r < 5; r++) grid[r]![2] = 'road';
    grid[2]![2] = 'crossing';
    expect(normalizeRoadCrossings(grid)).toBe(0);
    expect(grid[2]![2]).toBe('crossing');
  });

  it('composed grids: every crossing has both axes of travel', () => {
    for (const style of ['residential', 'slum', 'corp_clean', 'chinatown'] as const) {
      const g = composeDistrictPlaceTypes(8, 10, style, 42 + style.length, { isEdgeDistrict: true });
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 10; c++) {
          if (g[r]![c] !== 'crossing') continue;
          const v = ['road', 'crossing', 'bridge', 'exit'].includes(g[r - 1]?.[c] ?? '') ||
            ['road', 'crossing', 'bridge', 'exit'].includes(g[r + 1]?.[c] ?? '');
          const h = ['road', 'crossing', 'bridge', 'exit'].includes(g[r]?.[c - 1] ?? '') ||
            ['road', 'crossing', 'bridge', 'exit'].includes(g[r]?.[c + 1] ?? '');
          expect(v && h).toBe(true);
        }
      }
    }
  });

  it('crosswalk: always toward crossing; sparse near pedestrian destinations', () => {
    expect(crosswalkEdgesFor('crossing', { n: 'road', s: 'road' }, 'x')).toEqual({
      n: false,
      s: false,
      e: false,
      w: false,
    });
    expect(crosswalkEdgesFor('road', { n: 'crossing' }, 'any').n).toBe(true);
    expect(crosswalkEdgesFor('road', { e: 'crossing', w: 'road' }, 'any')).toEqual({
      n: false,
      s: false,
      e: true,
      w: false,
    });
    const withHouse = crosswalkEdgesFor('road', { n: 'house', s: 'road' }, 'seed0');
    const edges = [withHouse.n, withHouse.s, withHouse.e, withHouse.w].filter(Boolean).length;
    expect(edges).toBeLessThanOrEqual(1);
  });

  it('placeDistrictLandmarks adds club and rare services', () => {
    const grid: PlaceType[][] = Array.from({ length: 8 }, () =>
      Array.from({ length: 10 }, () => 'house' as PlaceType)
    );
    for (let c = 0; c < 10; c++) grid[3]![c] = 'road';
    const n = placeDistrictLandmarks(grid, 'residential', () => 0.2);
    expect(n).toBeGreaterThan(0);
    const flat = grid.flat();
    expect(flat.some((t) => t === 'nightclub')).toBe(true);
    expect(flat.filter((t) => t === 'hospital').length).toBeGreaterThanOrEqual(1);
    expect(flat.filter((t) => t === 'police').length).toBeGreaterThanOrEqual(1);
    expect(flat.filter((t) => t === 'electronics').length).toBeGreaterThanOrEqual(1);
    expect(flat.filter((t) => t === 'hospital').length).toBeLessThanOrEqual(2);
  });

  it('legacy alley maps to house', () => {
    expect(normalizePlaceType('alley')).toBe('house');
  });

  it('park_mixed can include a pond', () => {
    const g = composeDistrictPlaceTypes(8, 10, 'park_mixed', 7);
    expect(g.flat().some((t) => t === 'pond' || t === 'park')).toBe(true);
    expect(g.flat().some((t) => t === 'pond')).toBe(true);
  });

  it('park_mixed places multi-tile park clusters', () => {
    const g = composeDistrictPlaceTypes(8, 10, 'park_mixed', 7);
    let parkPair = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 10; c++) {
        if (g[r]![c] !== 'park') continue;
        if (g[r]![c + 1] === 'park' || g[r + 1]?.[c] === 'park') parkPair = true;
      }
    }
    expect(parkPair).toBe(true);
  });

  it('placeTypeClusters stamps only generics', () => {
    const grid: PlaceType[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => 'generic' as PlaceType)
    );
    grid[2]![2] = 'road';
    const rng = () => 0.1;
    const n = placeTypeClusters(grid, 'dump', 2, [1, 3, 4], rng);
    expect(n).toBeGreaterThan(0);
    expect(grid[2]![2]).toBe('road');
  });
});

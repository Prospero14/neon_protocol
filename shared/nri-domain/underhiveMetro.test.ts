import { describe, expect, it } from 'vitest';
import { deriveCorpUndergrounds, deriveUnderhiveDistrictFrames } from './underhiveDerive';
import { findMetroPath, metroZoneKey, parseMetroStationId, defaultTravelSeconds } from './metroGraph';
import {
  encodeMegaArtId,
  parseMegaArtId,
  validateMegaSelection,
  buildExplicitMegaInfo,
} from './districtMegaMerge';

describe('underhiveDerive', () => {
  it('mirrors only corp zones', () => {
    const zones = [
      { zoneKey: 'd1', name: 'Downtown', zoneType: 'mid', x: 0, y: 0, w: 40, h: 30 },
      { zoneKey: 'corp_a', name: 'HQ', zoneType: 'corp', corpName: 'Arasaka', x: 10, y: 10, w: 14, h: 15 },
      { zoneKey: 'hw', name: 'Ring', zoneType: 'highway', x: 0, y: 50, w: 100, h: 4 },
    ];
    const frames = deriveUnderhiveDistrictFrames(zones);
    expect(frames.map((f) => f.zoneKey)).toEqual(['d1']);
    const corps = deriveCorpUndergrounds(zones);
    expect(corps).toHaveLength(1);
    expect(corps[0]!.sourceZoneKey).toBe('corp_a');
    expect(corps[0]!.theme.abbrev).toBe('ARA');
    expect(corps[0]!.name).toContain('подземелья');
    expect(corps[0]!.w).toBe(14);
  });
});

describe('metroGraph', () => {
  it('parses metro zone keys', () => {
    expect(metroZoneKey('abc')).toBe('metro:abc');
    expect(parseMetroStationId('metro:abc')).toBe('abc');
    expect(parseMetroStationId('corp_a')).toBeNull();
  });

  it('finds path and sums seconds', () => {
    const stations = [
      { id: 'a', name: 'A', x: 0, y: 0, lineIds: ['L'], districtZoneKey: null },
      { id: 'b', name: 'B', x: 20, y: 0, lineIds: ['L'], districtZoneKey: null },
      { id: 'c', name: 'C', x: 40, y: 0, lineIds: ['L'], districtZoneKey: null },
    ];
    const edges = [
      { id: 'e1', lineId: 'L', fromStationId: 'a', toStationId: 'b', travelSeconds: 10 },
      { id: 'e2', lineId: 'L', fromStationId: 'b', toStationId: 'c', travelSeconds: 15 },
    ];
    const path = findMetroPath('a', 'c', stations, edges);
    expect(path.ok).toBe(true);
    if (path.ok) {
      expect(path.hops).toHaveLength(2);
      expect(path.totalSeconds).toBe(25);
    }
    expect(defaultTravelSeconds({ x: 0, y: 0 }, { x: 0, y: 0 })).toBeGreaterThanOrEqual(8);
  });
});

describe('districtMegaMerge', () => {
  it('encodes and validates 2x2 park', () => {
    expect(encodeMegaArtId('park', '2x2')).toBe('mega:park:2x2');
    expect(parseMegaArtId('mega:park:2x2')).toEqual({
      kind: 'anchor',
      placeType: 'park',
      shape: '2x2',
    });
    const cells = [
      { gridRow: 1, gridCol: 1, placeType: 'park' },
      { gridRow: 1, gridCol: 2, placeType: 'park' },
      { gridRow: 2, gridCol: 1, placeType: 'park' },
      { gridRow: 2, gridCol: 2, placeType: 'park' },
    ];
    const v = validateMegaSelection(cells);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.shape).toBe('2x2');
      expect(v.placeType).toBe('park');
      expect(v.originRow).toBe(1);
      expect(v.originCol).toBe(1);
      expect(v.cells).toHaveLength(4);
    }
  });

  it('fills 3x3 from corners via pool and uses majority type', () => {
    const pool = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        pool.push({
          gridRow: r,
          gridCol: c,
          placeType: r === 0 && c === 0 ? 'house' : 'road',
          zoneKey: `z_${r}_${c}`,
        });
      }
    }
    const v = validateMegaSelection(
      [
        { gridRow: 0, gridCol: 0, placeType: 'house', zoneKey: 'z_0_0' },
        { gridRow: 2, gridCol: 2, placeType: 'road', zoneKey: 'z_2_2' },
      ],
      pool
    );
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.shape).toBe('3x3');
      expect(v.placeType).toBe('road');
      expect(v.cells).toHaveLength(9);
    }
  });

  it('forcePlaceType overrides majority (corp_hq brush)', () => {
    const pool = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        pool.push({
          gridRow: r,
          gridCol: c,
          placeType: 'corp_office',
          zoneKey: `z_${r}_${c}`,
        });
      }
    }
    const v = validateMegaSelection(pool, pool, { forcePlaceType: 'corp_hq' });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.shape).toBe('3x3');
      expect(v.placeType).toBe('corp_hq');
    }
  });

  it('validates corner and cross', () => {
    const corner = validateMegaSelection([
      { gridRow: 0, gridCol: 0, placeType: 'road' },
      { gridRow: 0, gridCol: 1, placeType: 'road' },
      { gridRow: 1, gridCol: 0, placeType: 'road' },
    ]);
    expect(corner.ok && corner.shape).toBe('corner_se');
    const cross = validateMegaSelection([
      { gridRow: 0, gridCol: 1, placeType: 'road' },
      { gridRow: 1, gridCol: 0, placeType: 'road' },
      { gridRow: 1, gridCol: 1, placeType: 'road' },
      { gridRow: 1, gridCol: 2, placeType: 'road' },
      { gridRow: 2, gridCol: 1, placeType: 'road' },
    ]);
    expect(cross.ok && cross.shape).toBe('cross');
  });

  it('builds explicit mega info from artId', () => {
    const tiles = [
      {
        zoneKey: 'p__1_1',
        gridRow: 1,
        gridCol: 1,
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        placeType: 'park',
        artId: 'mega:park:2x1',
      },
      {
        zoneKey: 'p__1_2',
        gridRow: 1,
        gridCol: 2,
        x: 10,
        y: 0,
        w: 10,
        h: 10,
        placeType: 'park',
        artId: 'mega_cover:p__1_1',
      },
    ];
    const m = buildExplicitMegaInfo(tiles);
    expect(m.get('1,1')?.role).toBe('anchor');
    expect(m.get('1,1')?.span?.w).toBe(20);
    expect(m.get('1,2')?.role).toBe('cover');
  });
});

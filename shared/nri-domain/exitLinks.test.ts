import { describe, expect, it } from 'vitest';
import {
  computeExitLink,
  exitEdgeForTile,
  findAdjacentDistrict,
  travelMinutesBetween,
} from './exitLinks';

describe('exitLinks', () => {
  const north = { zoneKey: 'north_dist', name: 'Север', zoneType: 'mid', x: 10, y: 0, w: 20, h: 10 };
  const south = { zoneKey: 'south_dist', name: 'Юг', zoneType: 'slum', x: 10, y: 10, w: 20, h: 10 };

  it('detects exit edge on grid', () => {
    expect(exitEdgeForTile(0, 2, { rows: 5, cols: 5 })).toBe('north');
    expect(exitEdgeForTile(4, 2, { rows: 5, cols: 5 })).toBe('south');
  });

  it('finds vertically adjacent districts', () => {
    const adj = findAdjacentDistrict(north, 'south', [north, south]);
    expect(adj?.zoneKey).toBe('south_dist');
  });

  it('computes travel minutes from distance', () => {
    const mins = travelMinutesBetween(north, south);
    expect(mins).toBeGreaterThanOrEqual(5);
    expect(mins).toBeLessThanOrEqual(180);
  });

  it('links south exit tile to neighbor district north exit', () => {
    const layout = { rows: 5, cols: 5 };
    const tile = {
      zoneKey: 'north_dist__4_2',
      name: 'Выход',
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      parentZoneKey: 'north_dist',
      placeType: 'exit',
      gridRow: 4,
      gridCol: 2,
    };
    const neighborTiles = [
      {
        zoneKey: 'south_dist__0_2',
        name: 'Выход',
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        parentZoneKey: 'south_dist',
        placeType: 'exit',
        gridRow: 0,
        gridCol: 2,
      },
    ];
    const link = computeExitLink(tile, north, layout, [north, south], neighborTiles);
    expect(link?.zoneKey).toBe('south_dist__0_2');
    expect(link?.label).toBe('Юг');
  });
});

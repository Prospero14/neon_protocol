import {
  assignPlazaMegaRoles,
  buildBlockMegaInfo,
  buildPlazaMegaInfo,
  ensureShackMegaBlocks,
  normalizeParkingQuota,
  normalizePlazaLayout,
} from './plazaMega';
import type { PlaceType } from './districtGrid';

function countShack2x2(grid: PlaceType[][]): number {
  let n = 0;
  const claimed = new Set<string>();
  for (let r = 0; r < grid.length - 1; r++) {
    for (let c = 0; c < (grid[0]?.length ?? 0) - 1; c++) {
      const keys = [`${r},${c}`, `${r},${c + 1}`, `${r + 1},${c}`, `${r + 1},${c + 1}`];
      if (keys.some((k) => claimed.has(k))) continue;
      if (
        grid[r]![c] === 'shack' &&
        grid[r]![c + 1] === 'shack' &&
        grid[r + 1]![c] === 'shack' &&
        grid[r + 1]![c + 1] === 'shack'
      ) {
        for (const k of keys) claimed.add(k);
        n++;
      }
    }
  }
  return n;
}

describe('plazaMega', () => {
  it('assigns one anchor + three covers for a 2×2 plaza block', () => {
    const byPos = new Map<string, PlaceType>([
      ['2,3', 'plaza'],
      ['2,4', 'plaza'],
      ['3,3', 'plaza'],
      ['3,4', 'plaza'],
      ['3,5', 'house'],
    ]);
    const roles = assignPlazaMegaRoles(byPos);
    expect(roles.get('2,3')).toBe('anchor');
    expect(roles.get('2,4')).toBe('cover');
    expect(roles.get('3,3')).toBe('cover');
    expect(roles.get('3,4')).toBe('cover');
    expect(roles.has('3,5')).toBe(false);
  });

  it('buildPlazaMegaInfo includes span covering all four cells', () => {
    const info = buildPlazaMegaInfo([
      { gridRow: 1, gridCol: 1, x: 10, y: 20, w: 5, h: 4, placeType: 'plaza' },
      { gridRow: 1, gridCol: 2, x: 15.5, y: 20, w: 5, h: 4, placeType: 'plaza' },
      { gridRow: 2, gridCol: 1, x: 10, y: 24.5, w: 5, h: 4, placeType: 'plaza' },
      { gridRow: 2, gridCol: 2, x: 15.5, y: 24.5, w: 5, h: 4, placeType: 'plaza' },
    ]);
    const a = info.get('1,1');
    expect(a?.role).toBe('anchor');
    expect(a?.span).toEqual({ x: 10, y: 20, w: 10.5, h: 8.5 });
    expect(info.get('2,2')?.role).toBe('cover');
  });

  it('buildBlockMegaInfo works for shack 2×2', () => {
    const info = buildBlockMegaInfo(
      [
        { gridRow: 0, gridCol: 0, x: 0, y: 0, w: 4, h: 4, placeType: 'shack' },
        { gridRow: 0, gridCol: 1, x: 4.2, y: 0, w: 4, h: 4, placeType: 'shack' },
        { gridRow: 1, gridCol: 0, x: 0, y: 4.2, w: 4, h: 4, placeType: 'shack' },
        { gridRow: 1, gridCol: 1, x: 4.2, y: 4.2, w: 4, h: 4, placeType: 'shack' },
      ],
      'shack',
      'shack'
    );
    expect(info.get('0,0')?.kind).toBe('shack');
    expect(info.get('0,0')?.role).toBe('anchor');
    expect(info.get('0,0')?.span).toEqual({ x: 0, y: 0, w: 8.2, h: 8.2 });
    expect(info.get('1,1')?.role).toBe('cover');
  });

  it('normalizePlazaLayout keeps 2×2 and removes adjacent singles', () => {
    const grid: PlaceType[][] = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => 'house' as PlaceType)
    );
    grid[0]![0] = 'plaza';
    grid[0]![1] = 'plaza';
    grid[1]![0] = 'plaza';
    grid[1]![1] = 'plaza';
    grid[2]![2] = 'plaza';
    grid[2]![3] = 'plaza';
    expect(normalizePlazaLayout(grid)).toBe(2);
    expect([grid[0]![0], grid[0]![1], grid[1]![0], grid[1]![1]].every((t) => t === 'plaza')).toBe(
      true
    );
    expect(grid[2]![2]).toBe('house');
    expect(grid[2]![3]).toBe('house');
  });

  it('normalizePlazaLayout keeps isolated single plaza', () => {
    const grid: PlaceType[][] = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => 'house' as PlaceType)
    );
    grid[1]![1] = 'plaza';
    expect(normalizePlazaLayout(grid)).toBe(0);
    expect(grid[1]![1]).toBe('plaza');
  });

  it('normalizeParkingQuota keeps at most 1 parking per 10 homes', () => {
    const grid: PlaceType[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => 'house' as PlaceType)
    );
    // 25 houses → max 2 parking
    grid[0]![0] = 'parking';
    grid[0]![1] = 'parking';
    grid[0]![2] = 'parking';
    grid[0]![3] = 'parking';
    grid[1]![0] = 'road';
    expect(normalizeParkingQuota(grid)).toBe(2);
    const parks = grid.flat().filter((t) => t === 'parking').length;
    expect(parks).toBe(2);
  });

  it('ensureShackMegaBlocks stamps 2×2 when only singles exist', () => {
    const grid: PlaceType[][] = Array.from({ length: 6 }, () =>
      Array.from({ length: 6 }, () => 'house' as PlaceType)
    );
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if ((r + c) % 2 === 0) grid[r]![c] = 'shack';
      }
    }
    expect(countShack2x2(grid)).toBe(0);
    const stamped = ensureShackMegaBlocks(grid, () => 0.1);
    expect(stamped).toBeGreaterThan(0);
    expect(countShack2x2(grid)).toBeGreaterThanOrEqual(1);
  });
});


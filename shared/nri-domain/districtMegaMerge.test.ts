import { describe, expect, it } from 'vitest';
import {
  shapeCellOffsets,
  shapeDims,
  validateMegaSelection,
  encodeMegaArtId,
  parseMegaArtId,
  assignShapeMegaRoles,
} from './districtMegaMerge';

describe('districtMegaMerge footprints', () => {
  it('3x2 occupies 6 cells (2 rows × 3 cols)', () => {
    expect(shapeDims('3x2')).toEqual({ rows: 2, cols: 3 });
    expect(shapeCellOffsets('3x2')).toHaveLength(6);
    expect(shapeCellOffsets('3x2')).toContainEqual([1, 2]);
  });

  it('1x3 and 2x3 occupy vertical strips', () => {
    expect(shapeDims('1x3')).toEqual({ rows: 3, cols: 1 });
    expect(shapeCellOffsets('1x3')).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
    expect(shapeDims('2x3')).toEqual({ rows: 3, cols: 2 });
    expect(shapeCellOffsets('2x3')).toHaveLength(6);
  });

  it('validateMegaSelection accepts 3×2 shack selection', () => {
    const cells = [];
    for (let r = 1; r <= 2; r++) {
      for (let c = 2; c <= 4; c++) {
        cells.push({ gridRow: r, gridCol: c, placeType: 'shack', zoneKey: `${r}_${c}` });
      }
    }
    const res = validateMegaSelection(cells, undefined, { forcePlaceType: 'shack' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.shape).toBe('3x2');
      expect(res.cells).toHaveLength(6);
    }
  });

  it('4×4 corp encode/parse and cover roles', () => {
    const art = encodeMegaArtId('corp_hq', '4x4');
    expect(parseMegaArtId(art)).toEqual({ kind: 'anchor', placeType: 'corp_hq', shape: '4x4' });
    const roles = assignShapeMegaRoles(0, 0, '4x4');
    expect(roles.get('0,0')).toBe('anchor');
    expect(roles.get('3,3')).toBe('cover');
    expect(roles.size).toBe(16);
  });
});

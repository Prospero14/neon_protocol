import { describe, expect, it } from 'vitest';
import {
  bitSweepCleared,
  bitSweepHitMine,
  cipherRingsSolved,
  deadSectorCleared,
  generateBitSweep,
  generateCipherRings,
  generateDeadSector,
  generateHandshake,
  generateKeyspaceSecret,
  generateNoiseTargets,
  generateOpcodeForge,
  keyspaceScore,
  noiseInLock,
  noiseSnr,
  opcodePickCorrect,
  revealBitCell,
  rotateCipherRing,
  toggleDeadSector,
} from './iceRewriteLogic';

describe('dead sector', () => {
  it('generates uncleared solvable-ish grid', () => {
    const g = generateDeadSector(4, 4, 42);
    expect(g).toHaveLength(16);
    expect(deadSectorCleared(g)).toBe(false);
  });

  it('toggle twice restores cell neighborhood pattern', () => {
    const base = Array(9).fill(false) as boolean[];
    const once = toggleDeadSector(base, 3, 4);
    const twice = toggleDeadSector(once, 3, 4);
    expect(twice).toEqual(base);
  });
});

describe('opcode forge', () => {
  it('pool contains full target', () => {
    const { target, pool } = generateOpcodeForge(4, 2, 7);
    expect(target).toHaveLength(4);
    for (const t of target) expect(pool).toContain(t);
  });

  it('pick order validates', () => {
    const target = ['PUSH', 'XOR', 'JMP'] as const;
    expect(opcodePickCorrect([...target], [], 'PUSH')).toBe(true);
    expect(opcodePickCorrect([...target], ['PUSH'], 'JMP')).toBe(false);
    expect(opcodePickCorrect([...target], ['PUSH'], 'XOR')).toBe(true);
  });
});

describe('keyspace prune', () => {
  it('secret length clamped', () => {
    expect(generateKeyspaceSecret(4, 1)).toHaveLength(4);
    expect(generateKeyspaceSecret(99, 1)).toHaveLength(6);
  });

  it('scores exact and present like mastermind', () => {
    expect(keyspaceScore('abcd', 'abcd')).toEqual({ exact: 4, present: 0 });
    expect(keyspaceScore('abcd', 'abxy')).toEqual({ exact: 2, present: 0 });
    expect(keyspaceScore('aabb', 'bbaa')).toEqual({ exact: 0, present: 4 });
    expect(keyspaceScore('1234', '4321').exact + keyspaceScore('1234', '4321').present).toBe(4);
  });
});

describe('handshake', () => {
  it('each step has exactly one correct option', () => {
    const steps = generateHandshake(5, 99);
    expect(steps).toHaveLength(5);
    for (const s of steps) {
      expect(s.options.filter((o) => o.correct)).toHaveLength(1);
      expect(s.options.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('noise floor', () => {
  it('snr peaks near targets', () => {
    const t = generateNoiseTargets(3);
    const peak = noiseSnr(t.gain, t.filter, t.gain, t.filter, 20);
    const far = noiseSnr(0, 0, t.gain, t.filter, 20);
    expect(peak).toBeGreaterThan(far);
    expect(noiseInLock(peak, 20)).toBe(true);
    expect(noiseInLock(10, 20)).toBe(false);
  });
});

describe('cipher rings', () => {
  it('starts unsolved and can be aligned by rotating to target', () => {
    const rings = generateCipherRings(3, 6, 11);
    expect(rings).toHaveLength(3);
    expect(cipherRingsSolved(rings)).toBe(false);
    const fixed = rings.map((r) => {
      let cur = r;
      let guard = 0;
      while (cur.rot !== cur.targetIdx && guard++ < 20) {
        cur = rotateCipherRing(cur, 1);
      }
      return cur;
    });
    expect(cipherRingsSolved(fixed)).toBe(true);
  });
});

describe('bit sweep', () => {
  it('generate places mines and reveal clears safe flood', () => {
    const cols = 5;
    const grid = generateBitSweep(cols, 5, 5, 42);
    expect(grid.filter((c) => c.mine)).toHaveLength(5);
    const safe = grid.findIndex((c) => !c.mine && c.adj === 0);
    expect(safe).toBeGreaterThanOrEqual(0);
    const next = revealBitCell(grid, cols, safe);
    expect(next.some((c) => c.revealed)).toBe(true);
    expect(bitSweepHitMine(grid, grid.findIndex((c) => c.mine))).toBe(true);
  });

  it('cleared when all non-mines revealed', () => {
    const cols = 4;
    let grid = generateBitSweep(cols, 4, 3, 7);
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]!.mine) grid = revealBitCell(grid, cols, i);
    }
    expect(bitSweepCleared(grid)).toBe(true);
  });
});

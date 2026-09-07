import { describe, expect, it } from 'vitest';
import {
  canCaptureNode,
  circuitPoweredIndices,
  circuitSolved,
  generateCaptureGraph,
  generateCircuitGrid,
  generateLikenessVault,
  likenessScore,
  likenessWordEliminated,
  pipeOpenings,
  rotatePipe,
} from './iceArcadeExtraLogic.js';

describe('Circuit Splice', () => {
  it('pipe openings I/L rotate correctly', () => {
    expect([...pipeOpenings('I', 0)].sort()).toEqual([0, 2]);
    expect([...pipeOpenings('I', 1)].sort()).toEqual([1, 3]);
    expect(pipeOpenings('L', 0).has(0)).toBe(true);
    expect(pipeOpenings('L', 0).has(1)).toBe(true);
  });

  it('rotatePipe cycles I by 2 and L by 4', () => {
    let c = { kind: 'I' as const, rot: 0 };
    c = rotatePipe(c);
    expect(c.rot).toBe(1);
    c = rotatePipe(c);
    expect(c.rot).toBe(0);
    let l = { kind: 'L' as const, rot: 3 };
    l = rotatePipe(l);
    expect(l.rot).toBe(0);
  });

  it('horizontal I-tunnel is solved', () => {
    const cols = 4;
    const rows = 3;
    const entryRow = 1;
    const grid = Array.from({ length: cols * rows }, () => ({ kind: 'I' as const, rot: 1 }));
    expect(circuitSolved(grid, cols, rows, entryRow, entryRow)).toBe(true);
    expect(circuitPoweredIndices(grid, cols, rows, entryRow).size).toBe(cols);
  });

  it('generateCircuitGrid returns full board', () => {
    const { grid, entryRow, coreRow } = generateCircuitGrid(5, 4, 77);
    expect(grid.length).toBe(20);
    expect(entryRow).toBe(coreRow);
  });

  it('powered indices empty if entry closed west', () => {
    const grid = Array.from({ length: 9 }, () => ({ kind: 'I' as const, rot: 0 }));
    // All vertical I — no west on entry (0,1) if entryRow=1 → idx 3
    const powered = circuitPoweredIndices(grid, 3, 3, 1);
    expect(powered.size).toBe(0);
  });
});

describe('Likeness Vault', () => {
  it('likeness counts positional matches only', () => {
    expect(likenessScore('root', 'riot')).toBe(2);
    expect(likenessScore('root', 'toor')).toBe(0);
    expect(likenessScore('proxy', 'proxy')).toBe(5);
  });

  it('eliminates words inconsistent with history', () => {
    expect(likenessWordEliminated('riot', [{ guess: 'root', likeness: 2 }])).toBe(false);
    expect(likenessWordEliminated('xxxx', [{ guess: 'root', likeness: 2 }])).toBe(true);
  });

  it('vault words share length and include secret', () => {
    const v = generateLikenessVault(5, 8, 123);
    expect(v.words.every((w) => w.length === 5)).toBe(true);
    expect(v.words).toContain(v.secret);
    expect(v.words.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Node Capture', () => {
  it('entry is free and core is reachable in graph', () => {
    const g = generateCaptureGraph(6, 8, 7);
    expect(g.nodes[g.entryId]!.isEntry).toBe(true);
    expect(g.nodes[g.coreId]!.isCore).toBe(true);
    expect(g.edges.length).toBeGreaterThan(g.nodes.length - 1);
  });

  it('can only capture adjacent unowned nodes with probes', () => {
    const g = generateCaptureGraph(6, 10, 99);
    const captured = new Set([g.entryId]);
    const far = g.nodes.find((n) => !n.isEntry && !canCaptureNode(g, captured, n.id, 99).ok);
    // At least entry-adjacent exists
    const reach = g.nodes.filter((n) => canCaptureNode(g, captured, n.id, 99).ok);
    expect(reach.length).toBeGreaterThan(0);
    if (far) {
      expect(canCaptureNode(g, captured, far.id, 99).ok).toBe(false);
    }
    expect(canCaptureNode(g, captured, g.entryId, 99).ok).toBe(false);
  });
});

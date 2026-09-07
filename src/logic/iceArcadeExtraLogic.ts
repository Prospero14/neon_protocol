/** Чистая логика новых ICE-аркад: Circuit Splice, Likeness Vault, Node Capture. */

import { seededShuffle } from './iceMiniGameLogic.js';

export type PipeDir = 0 | 1 | 2 | 3; // N E S W
export type PipeKind = 'I' | 'L' | 'T' | 'X';
export type PipeCell = { kind: PipeKind; rot: number };

const OPP: Record<PipeDir, PipeDir> = { 0: 2, 1: 3, 2: 0, 3: 1 };
const DELTA: Record<PipeDir, [number, number]> = {
  0: [0, -1],
  1: [1, 0],
  2: [0, 1],
  3: [-1, 0],
};

/** Открытые стороны плитки с учётом поворота. */
export function pipeOpenings(kind: PipeKind, rot: number): Set<PipeDir> {
  const r = ((rot % 4) + 4) % 4;
  const base: PipeDir[] =
    kind === 'I'
      ? [0, 2]
      : kind === 'L'
        ? [0, 1]
        : kind === 'T'
          ? [1, 2, 3]
          : [0, 1, 2, 3];
  return new Set(base.map((d) => ((d + r) % 4) as PipeDir));
}

export function rotatePipe(cell: PipeCell): PipeCell {
  if (cell.kind === 'X') return cell;
  const step = cell.kind === 'I' ? 1 : 1;
  return { kind: cell.kind, rot: (cell.rot + step) % (cell.kind === 'I' ? 2 : 4) };
}

function kindForDirs(a: PipeDir, b: PipeDir): { kind: PipeKind; rot: number } {
  const set = new Set([a, b]);
  for (let rot = 0; rot < 4; rot++) {
    for (const kind of ['I', 'L', 'T'] as PipeKind[]) {
      const open = pipeOpenings(kind, rot);
      if (open.size === set.size && [...set].every((d) => open.has(d))) {
        return { kind, rot: kind === 'I' ? rot % 2 : rot };
      }
    }
  }
  return { kind: 'L', rot: 0 };
}

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Собрать сетку с гарантированно решаемым путём ENTRY(left) → CORE(right). */
export function generateCircuitGrid(
  cols: number,
  rows: number,
  seed: number
): { grid: PipeCell[]; entryRow: number; coreRow: number } {
  const c = Math.max(3, Math.min(7, cols));
  const r = Math.max(3, Math.min(6, rows));
  const entryRow = Math.floor(r / 2);
  const coreRow = entryRow;
  let attemptSeed = seed;

  for (let attempt = 0; attempt < 24; attempt++) {
    const rand = rng(attemptSeed + attempt * 97);
    const path: { x: number; y: number }[] = [{ x: 0, y: entryRow }];
    let x = 0;
    let y = entryRow;
    let guard = 0;
    while (x < c - 1 && guard++ < c * r * 4) {
      const options: Array<'R' | 'U' | 'D'> = ['R', 'R', 'R'];
      if (y > 0) options.push('U');
      if (y < r - 1) options.push('D');
      const pick = options[Math.floor(rand() * options.length)]!;
      if (pick === 'R') x += 1;
      else if (pick === 'U') y -= 1;
      else y += 1;
      if (!path.some((p) => p.x === x && p.y === y)) path.push({ x, y });
      else if (pick !== 'R') {
        x = path[path.length - 1]!.x;
        y = path[path.length - 1]!.y;
        x = Math.min(c - 1, x + 1);
        if (!path.some((p) => p.x === x && p.y === y)) path.push({ x, y });
      }
    }
    while (y !== coreRow) {
      y += y < coreRow ? 1 : -1;
      path.push({ x: c - 1, y });
    }
    if (path[path.length - 1]!.x !== c - 1) {
      path.push({ x: c - 1, y: coreRow });
    }

    const grid: PipeCell[] = Array.from({ length: c * r }, () => {
      const kinds: PipeKind[] = ['I', 'L', 'T', 'X'];
      return { kind: kinds[Math.floor(rand() * kinds.length)]!, rot: Math.floor(rand() * 4) };
    });

    for (let i = 0; i < path.length; i++) {
      const cur = path[i]!;
      const prev = path[i - 1];
      const next = path[i + 1];
      const dirs: PipeDir[] = [];
      if (prev) {
        if (prev.x < cur.x) dirs.push(3);
        else if (prev.x > cur.x) dirs.push(1);
        else if (prev.y < cur.y) dirs.push(0);
        else dirs.push(2);
      } else {
        dirs.push(3);
      }
      if (next) {
        if (next.x > cur.x) dirs.push(1);
        else if (next.x < cur.x) dirs.push(3);
        else if (next.y > cur.y) dirs.push(2);
        else dirs.push(0);
      } else {
        dirs.push(1);
      }
      const unique = [...new Set(dirs)] as PipeDir[];
      let cell: PipeCell;
      if (unique.length <= 1) {
        const d = unique[0] ?? 1;
        cell = { kind: 'I', rot: d === 0 || d === 2 ? 0 : 1 };
      } else if (unique.length === 2) {
        cell = kindForDirs(unique[0]!, unique[1]!);
      } else if (unique.length === 3) {
        let found: PipeCell | null = null;
        for (let rot = 0; rot < 4; rot++) {
          const open = pipeOpenings('T', rot);
          if (unique.every((d) => open.has(d))) {
            found = { kind: 'T', rot };
            break;
          }
        }
        cell = found ?? { kind: 'X', rot: 0 };
      } else {
        cell = { kind: 'X', rot: 0 };
      }
      grid[cur.y * c + cur.x] = cell;
    }

    if (!circuitSolved(grid, c, r, entryRow, coreRow)) {
      continue;
    }

    // Скрембл: каждый тайл крутим, решение остаётся достижимым обратными поворотами.
    for (let i = 0; i < grid.length; i++) {
      const cell = grid[i]!;
      if (cell.kind === 'X') continue;
      const turns = 1 + Math.floor(rand() * (cell.kind === 'I' ? 1 : 3));
      let next = cell;
      for (let t = 0; t < turns; t++) next = rotatePipe(next);
      grid[i] = next;
    }

    return { grid, entryRow, coreRow };
  }

  // Fallback: простой горизонтальный тоннель.
  const grid: PipeCell[] = Array.from({ length: c * r }, () => ({ kind: 'I' as const, rot: 0 }));
  for (let x = 0; x < c; x++) {
    grid[entryRow * c + x] = { kind: 'I', rot: 1 };
  }
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]!.kind === 'I') {
      grid[i] = rotatePipe(grid[i]!);
    }
  }
  return { grid, entryRow, coreRow };
}

/** Индексы клеток, запитанных от ENTRY (западный вход). */
export function circuitPoweredIndices(
  grid: PipeCell[],
  cols: number,
  rows: number,
  entryRow: number
): Set<number> {
  const powered = new Set<number>();
  const start = entryRow * cols;
  const startCell = grid[start];
  if (!startCell || !pipeOpenings(startCell.kind, startCell.rot).has(3)) {
    return powered;
  }
  const q = [start];
  powered.add(start);
  while (q.length) {
    const idx = q.pop()!;
    const x = idx % cols;
    const y = Math.floor(idx / cols);
    const cell = grid[idx]!;
    const open = pipeOpenings(cell.kind, cell.rot);
    for (const d of open) {
      const [dx, dy] = DELTA[d];
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const nIdx = ny * cols + nx;
      if (powered.has(nIdx)) continue;
      const neighbor = grid[nIdx]!;
      const nOpen = pipeOpenings(neighbor.kind, neighbor.rot);
      if (!nOpen.has(OPP[d])) continue;
      powered.add(nIdx);
      q.push(nIdx);
    }
  }
  return powered;
}

export function circuitSolved(
  grid: PipeCell[],
  cols: number,
  rows: number,
  entryRow: number,
  coreRow: number
): boolean {
  const powered = circuitPoweredIndices(grid, cols, rows, entryRow);
  const coreIdx = coreRow * cols + (cols - 1);
  if (!powered.has(coreIdx)) return false;
  return pipeOpenings(grid[coreIdx]!.kind, grid[coreIdx]!.rot).has(1);
}

/** Likeness = число букв на тех же позициях (Fallout terminal). */
export function likenessScore(secret: string, guess: string): number {
  const a = secret.toLowerCase();
  const b = guess.toLowerCase();
  const n = Math.min(a.length, b.length);
  let hit = 0;
  for (let i = 0; i < n; i++) if (a[i] === b[i]) hit++;
  return hit;
}

/** Слово несовместимо с историей угадываний. */
export function likenessWordEliminated(
  word: string,
  history: Array<{ guess: string; likeness: number }>
): boolean {
  return history.some((h) => likenessScore(word, h.guess) !== h.likeness);
}

const LIKENESS_POOL: Record<number, string[]> = {
  4: [
    'root', 'deck', 'node', 'corp', 'data', 'link', 'port', 'hash', 'null',
    'kern', 'boot', 'dump', 'ping', 'rack', 'slot', 'wire', 'grid', 'byte', 'code', 'jail',
  ],
  5: [
    'proxy', 'trace', 'vault', 'cyber', 'ghost', 'spike', 'relay', 'token',
    'cache', 'stack', 'frame', 'patch', 'clone', 'optic', 'modem', 'swarm', 'glitch', 'nova',
  ],
  6: [
    'buffer', 'packet', 'kernel', 'cipher', 'router', 'socket', 'access', 'payload',
    'script', 'module', 'mirror', 'shadow', 'vector', 'system', 'binary', 'daemon', 'breach',
  ],
  7: [
    'netrunr', 'backdor', 'exploit', 'sandbox', 'runtime', 'compile',
    'synapse', 'overlay', 'segment', 'handler', 'gateway', 'payload',
  ],
};

export function generateLikenessVault(
  wordLength: number,
  listSize: number,
  seed: number
): { secret: string; words: string[] } {
  const len = Math.max(4, Math.min(7, wordLength));
  const pool = [...(LIKENESS_POOL[len] ?? LIKENESS_POOL[5]!)].filter((w) => w.length === len);
  const fallback = (LIKENESS_POOL[5] ?? []).map((w) => w.slice(0, len).padEnd(len, 'x'));
  const source = pool.length >= 4 ? pool : [...pool, ...fallback];
  const shuffled = seededShuffle(source, seed);
  const words = shuffled.slice(0, Math.min(listSize, shuffled.length));
  if (words.length === 0) {
    return { secret: 'ice', words: ['ice', 'net', 'run', 'cpu'] };
  }
  const secret = words[seed % words.length]!;
  return { secret, words: seededShuffle(words, seed + 17) };
}

export type CaptureNode = {
  id: number;
  label: string;
  x: number;
  y: number;
  cost: number;
  honeypot: boolean;
  isEntry: boolean;
  isCore: boolean;
};

export type CaptureGraph = {
  nodes: CaptureNode[];
  edges: Array<[number, number]>;
  entryId: number;
  coreId: number;
  probes: number;
};

/** Связный граф: ENTRY → … → CORE, с honeypot-ловушками. */
export function generateCaptureGraph(
  nodeCount: number,
  probeBudget: number,
  seed: number
): CaptureGraph {
  const n = Math.max(5, Math.min(9, nodeCount));
  const rand = rng(seed);
  const labels = ['ENTRY', 'DMZ', 'API', 'CACHE', 'AUTH', 'DB', 'CORE', 'HONEYPOT', 'RELAY', 'OPS'];
  const nodes: CaptureNode[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const isEntry = i === 0;
    const isCore = i === n - 1;
    const honeypot = !isEntry && !isCore && rand() < 0.22;
    nodes.push({
      id: i,
      label: isEntry ? 'ENTRY' : isCore ? 'CORE' : honeypot ? 'HONEYPOT' : labels[1 + (i % (labels.length - 2))]!,
      x: 50 + Math.cos(angle) * 38,
      y: 50 + Math.sin(angle) * 38,
      cost: isEntry ? 0 : honeypot ? 1 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * 3),
      honeypot,
      isEntry,
      isCore,
    });
  }

  const edges: Array<[number, number]> = [];
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (!edges.some(([x, y]) => x === lo && y === hi)) edges.push([lo, hi]);
  };

  // Кольцо + хорды для связности и выбора пути.
  for (let i = 0; i < n; i++) addEdge(i, (i + 1) % n);
  for (let k = 0; k < Math.floor(n / 2); k++) {
    const a = Math.floor(rand() * n);
    const b = Math.floor(rand() * n);
    addEdge(a, b);
  }
  addEdge(0, Math.floor(n / 2));
  addEdge(Math.floor(n / 3), n - 1);

  const minPathCost = (() => {
    // Грубая оценка: сумма минимальных non-honeypot costs вдоль кольца.
    let sum = 0;
    for (let i = 1; i < n; i++) sum += nodes[i]!.honeypot ? 0 : nodes[i]!.cost;
    return Math.max(4, Math.floor(sum * 0.45));
  })();

  return {
    nodes,
    edges,
    entryId: 0,
    coreId: n - 1,
    probes: Math.max(probeBudget, minPathCost + 2),
  };
}

export function captureNeighbors(graph: CaptureGraph, nodeId: number): number[] {
  const out: number[] = [];
  for (const [a, b] of graph.edges) {
    if (a === nodeId) out.push(b);
    else if (b === nodeId) out.push(a);
  }
  return out;
}

export function canCaptureNode(
  graph: CaptureGraph,
  captured: Set<number>,
  targetId: number,
  probesLeft: number
): { ok: true } | { ok: false; reason: 'not_adjacent' | 'already' | 'no_probes' | 'entry' } {
  if (captured.has(targetId)) return { ok: false, reason: 'already' };
  const node = graph.nodes.find((n) => n.id === targetId);
  if (!node) return { ok: false, reason: 'not_adjacent' };
  if (node.isEntry) return { ok: false, reason: 'entry' };
  const adj = captureNeighbors(graph, targetId).some((id) => captured.has(id));
  if (!adj) return { ok: false, reason: 'not_adjacent' };
  if (probesLeft < node.cost) return { ok: false, reason: 'no_probes' };
  return { ok: true };
}

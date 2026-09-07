/** Чистая логика ICE мини-игр (без React). */

export type LetterMark = 'exact' | 'present' | 'absent';

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function seqNoRepeat(len: number, poolSize: number, seed: number): number[] {
  const out: number[] = [];
  let s = seed;
  let prev = -1;
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    let pick = s % poolSize;
    let guard = 0;
    while (pick === prev && guard++ < 12) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      pick = s % poolSize;
    }
    out.push(pick);
    prev = pick;
  }
  return out;
}

/** Wordle-разметка для Auth Bypass. */
export function scoreGuess(secret: string, guess: string): LetterMark[] {
  const s = secret.toLowerCase();
  const g = guess.toLowerCase();
  const marks: LetterMark[] = Array(g.length).fill('absent');
  const used = Array(s.length).fill(false);
  for (let i = 0; i < g.length; i++) {
    if (g[i] === s[i]) {
      marks[i] = 'exact';
      used[i] = true;
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (marks[i] === 'exact') continue;
    const idx = s.split('').findIndex((ch, j) => !used[j] && ch === g[i]);
    if (idx >= 0) {
      marks[i] = 'present';
      used[idx] = true;
    }
  }
  return marks;
}

/** Генерация hex-секрета для Hash Crack. */
export function generateHexSecret(len: number, seed: number): string {
  const hex = '0123456789abcdef';
  let s = seed;
  let out = '';
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    out += hex[s % 16];
  }
  return out;
}

/** Выбор hex-кандидатов: 1 верный + 3 ложных. */
export function hashCrackChoices(secret: string, pos: number, seed: number): string[] {
  const hex = '0123456789abcdef'.split('');
  const correct = secret[pos];
  const others = seededShuffle(
    hex.filter((c) => c !== correct),
    seed + pos,
  ).slice(0, 3);
  return seededShuffle([correct, ...others], seed + pos * 13);
}

/** Проверка попадания в зону Buffer Flood / Signal Lock (%). */
export function inPctZone(value: number, zoneStart: number, zoneWidth: number): boolean {
  return value >= zoneStart && value <= zoneStart + zoneWidth;
}

/** Симуляция исхода Port Sweep: true = win path if all picks match seq. */
/** Режимы Port Sweep: эхо / реверс / шум (ложный блик). */
export type PortSweepMode = 'echo' | 'reverse' | 'noise';

export function pickPortSweepMode(round: number, seed: number): PortSweepMode {
  const s = (seed * 1103515245 + 12345 + round * 97) & 0x7fffffff;
  if (round === 0) return 'echo';
  const roll = s % 10;
  if (roll < 4) return 'echo';
  if (roll < 7) return 'reverse';
  return 'noise';
}

/** Индексы портов для раунда + опциональный decoy (индекс pool, не в seq). */
export function generatePortSweepRound(
  len: number,
  poolSize: number,
  seed: number,
  mode: PortSweepMode
): { indices: number[]; decoyIndex: number | null } {
  const indices = seqNoRepeat(len, poolSize, seed);
  if (mode !== 'noise' || poolSize < 2) {
    return { indices, decoyIndex: null };
  }
  let s = (seed * 1664525 + 1013904223) >>> 0;
  let decoy = s % poolSize;
  let guard = 0;
  while (indices.includes(decoy) && guard++ < 16) {
    s = (s * 1103515245 + 12345) >>> 0;
    decoy = s % poolSize;
  }
  if (indices.includes(decoy)) {
    decoy = (indices[0]! + 1) % poolSize;
  }
  return { indices, decoyIndex: decoy };
}

/** Цель ввода: для reverse — зеркало показанной последовательности. */
export function portSweepExpected(seq: number[], mode: PortSweepMode): number[] {
  return mode === 'reverse' ? [...seq].reverse() : seq;
}

export function portSequenceComplete(seq: number[], picks: number[]): boolean {
  if (picks.length !== seq.length) return false;
  return picks.every((p, i) => p === seq[i]);
}

export const BREACH_CODES = ['E9', 'BD', '1C', '55', '7A', 'FF', '0D', 'A3', 'C0', 'DE'] as const;

export type BreachPick = { row: number; col: number; code: string };

/** Матрица hex-кодов для Breach Protocol. */
export function generateBreachMatrix(rows: number, cols: number, seed: number): string[][] {
  const grid: string[][] = [];
  let s = seed;
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      row.push(BREACH_CODES[s % BREACH_CODES.length]!);
    }
    grid.push(row);
  }
  return grid;
}

/** Целевая последовательность + путь по матрице (alternating row/col). */
export function generateBreachRun(
  matrix: string[][],
  targetLen: number,
  seed: number
): { target: string[]; path: BreachPick[] } {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  let s = seed;
  const path: BreachPick[] = [];
  let row = 0;
  let col = s % cols;
  for (let i = 0; i < targetLen; i++) {
    path.push({ row, col, code: matrix[row]![col]! });
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    if (i % 2 === 0) {
      row = 1 + (s % Math.max(1, rows - 1));
    } else {
      col = s % cols;
    }
  }
  return { target: path.map((p) => p.code), path };
}

/** Можно ли выбрать ячейку на этом шаге (alternating axis). */
export function breachPickAllowed(
  row: number,
  col: number,
  step: number,
  last: BreachPick | null
): boolean {
  if (step === 0) return row === 0;
  if (!last) return false;
  return step % 2 === 1 ? col === last.col : row === last.row;
}

/** Daemon Upload — последовательности для загрузки. */
export function generateDaemonSequences(count: number, len: number, seed: number): string[][] {
  const hex = '0123456789ABCDEF'.split('');
  let s = seed;
  const out: string[][] = [];
  for (let d = 0; d < count; d++) {
    const seq: string[] = [];
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      seq.push(hex[s % 16]!);
    }
    out.push(seq);
  }
  return out;
}

/**
 * LIVE STREAM always includes the needed nibble — otherwise the round is soft-locked
 * until a lucky reshuffle (felt unbeatable under TRACE).
 */
export function daemonStreamWithNeed(
  need: string,
  streamSize: number,
  seed: number
): string[] {
  const hex = '0123456789ABCDEF'.split('');
  const size = Math.max(2, Math.min(streamSize, hex.length));
  const others = seededShuffle(
    hex.filter((c) => c !== need),
    seed
  ).slice(0, size - 1);
  return seededShuffle([need, ...others], seed + 17);
}

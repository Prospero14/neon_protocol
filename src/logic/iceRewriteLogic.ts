/** Чистая логика ICE rewrite: Dead Sector, Opcode Forge, Keyspace Prune, Handshake, Noise Floor. */

import { seededShuffle } from './iceMiniGameLogic.js';

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─── Dead Sector (Lights Out) ───────────────────────────────────────────────

/** Кликнули cell: toggle self + 4-neighbors. */
export function toggleDeadSector(grid: boolean[], cols: number, idx: number): boolean[] {
  const rows = Math.floor(grid.length / cols);
  const next = [...grid];
  const flip = (i: number) => {
    if (i >= 0 && i < next.length) next[i] = !next[i];
  };
  const x = idx % cols;
  const y = Math.floor(idx / cols);
  flip(idx);
  if (x > 0) flip(idx - 1);
  if (x < cols - 1) flip(idx + 1);
  if (y > 0) flip(idx - cols);
  if (y < rows - 1) flip(idx + cols);
  return next;
}

export function deadSectorCleared(grid: boolean[]): boolean {
  return grid.every((on) => !on);
}

/** Гарантированно решаемый паттерн: применяем случайные клики к пустой сетке. */
export function generateDeadSector(cols: number, rows: number, seed: number): boolean[] {
  const c = Math.max(3, Math.min(6, cols));
  const r = Math.max(3, Math.min(6, rows));
  const rand = rng(seed);
  let grid = Array(c * r).fill(false) as boolean[];
  const clicks = Math.max(3, Math.floor(c * r * 0.35));
  for (let i = 0; i < clicks; i++) {
    const idx = Math.floor(rand() * grid.length);
    grid = toggleDeadSector(grid, c, idx);
  }
  if (deadSectorCleared(grid)) {
    grid = toggleDeadSector(grid, c, 0);
  }
  return grid;
}

// ─── Opcode Forge ───────────────────────────────────────────────────────────

export const OPCODE_POOL = [
  'PUSH',
  'POP',
  'LOAD',
  'STORE',
  'XOR',
  'AND',
  'JMP',
  'CALL',
  'RET',
  'NOP',
  'SCAN',
  'MASK',
  'FORK',
  'KILL',
  'SYNC',
] as const;

export type OpcodeToken = (typeof OPCODE_POOL)[number];

export function generateOpcodeForge(
  length: number,
  decoys: number,
  seed: number,
): { target: OpcodeToken[]; pool: OpcodeToken[] } {
  const len = Math.max(3, Math.min(8, length));
  const decoyCount = Math.max(0, Math.min(6, decoys));
  const shuffled = seededShuffle([...OPCODE_POOL], seed);
  const target = shuffled.slice(0, len) as OpcodeToken[];
  const decoyPool = shuffled.slice(len) as OpcodeToken[];
  const decoyPick = decoyPool.slice(0, decoyCount);
  const pool = seededShuffle([...target, ...decoyPick], seed + 17);
  return { target, pool };
}

export function opcodeNextIndex(_target: OpcodeToken[], placed: OpcodeToken[]): number {
  return placed.length;
}

export function opcodePickCorrect(
  target: OpcodeToken[],
  placed: OpcodeToken[],
  pick: OpcodeToken,
): boolean {
  const i = placed.length;
  return target[i] === pick;
}

// ─── Keyspace Prune (Mastermind hex) ────────────────────────────────────────

const HEX = '0123456789abcdef';

export function generateKeyspaceSecret(len: number, seed: number): string {
  const n = Math.max(3, Math.min(6, len));
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) out += HEX[Math.floor(rand() * 16)]!;
  return out;
}

/** exact = позиции совпали; present = цифра есть, но не на месте (без double-count). */
export function keyspaceScore(
  secret: string,
  guess: string,
): { exact: number; present: number } {
  const s = secret.toLowerCase();
  const g = guess.toLowerCase().slice(0, s.length);
  if (g.length !== s.length) return { exact: 0, present: 0 };
  let exact = 0;
  const sLeft: string[] = [];
  const gLeft: string[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === g[i]) exact++;
    else {
      sLeft.push(s[i]!);
      gLeft.push(g[i]!);
    }
  }
  let present = 0;
  const used = new Array(sLeft.length).fill(false);
  for (const ch of gLeft) {
    const idx = sLeft.findIndex((c, j) => !used[j] && c === ch);
    if (idx >= 0) {
      used[idx] = true;
      present++;
    }
  }
  return { exact, present };
}

// ─── Handshake Drill ────────────────────────────────────────────────────────

export type HandshakeOption = { id: string; label: string; correct: boolean };

export type HandshakeStep = {
  prompt: string;
  hint: string;
  options: HandshakeOption[];
};

const HANDSHAKE_BANK: Array<{ prompt: string; hint: string; good: string; bads: string[] }> = [
  {
    prompt: 'PEER → SYN · ответь',
    hint: 'классика TCP: на SYN отвечают SYN-ACK',
    good: 'SYN-ACK',
    bads: ['RST', 'FIN', 'ACK-only', 'NULL'],
  },
  {
    prompt: 'PEER → SYN-ACK · заверши handshake',
    hint: 'третье рукопожатие — просто ACK',
    good: 'ACK',
    bads: ['SYN', 'RST', 'PSH', 'FIN'],
  },
  {
    prompt: 'TLS ClientHello · выбери cipher suite',
    hint: 'бери современный AEAD, не RC4/EXPORT',
    good: 'TLS_AES_128_GCM',
    bads: ['RC4_MD5', 'NULL_SHA', 'EXPORT_DES', 'SSL2_RSA'],
  },
  {
    prompt: 'ICE challenge · nonce reply',
    hint: 'nonce нельзя слать plain — нужна подпись/HMAC',
    good: 'HMAC(nonce, session)',
    bads: ['plaintext nonce', 'empty ACK', 'replay last frame', 'broadcast MAC'],
  },
  {
    prompt: 'Corp proxy · next hop',
    hint: 'прятать выход: onion / TOR, не corp IP',
    good: 'route via TOR egress',
    bads: ['direct corp IP', 'ICMP flood', 'DNS exfil raw', 'open relay'],
  },
  {
    prompt: 'Auth gate · MFA step',
    hint: 'железо + TOTP надёжнее SMS',
    good: 'TOTP + hardware token',
    bads: ['SMS only', 'skip MFA', 'shared password', 'email link'],
  },
  {
    prompt: 'Session resume · ticket',
    hint: 'валидный binder/PSK, без даунгрейда',
    good: 'PSK binder valid',
    bads: ['expired ticket', 'zero binder', 'steal peer ticket', 'downgrade TLS1.0'],
  },
  {
    prompt: 'ICE query · identity',
    hint: 'подделай corp-цепочку, не свети домашний IP',
    good: 'spoofed corp cert chain',
    bads: ['real home IP', 'unsigned blob', 'empty CN', 'self-signed junk'],
  },
];

export function generateHandshake(steps: number, seed: number): HandshakeStep[] {
  const n = Math.max(3, Math.min(8, steps));
  const bank = seededShuffle(HANDSHAKE_BANK, seed).slice(0, n);
  return bank.map((row, i) => {
    // Easy/medium feel: fewer decoys on short runs
    const decoyN = n <= 3 ? 2 : 3;
    const opts = seededShuffle(
      [
        { id: `g${i}`, label: row.good, correct: true },
        ...row.bads.slice(0, decoyN).map((label, j) => ({
          id: `b${i}_${j}`,
          label,
          correct: false,
        })),
      ],
      seed + i * 31,
    );
    return { prompt: row.prompt, hint: row.hint, options: opts };
  });
}

// ─── Noise Floor (dual slider SNR) ──────────────────────────────────────────

/**
 * SNR 0..100 от gain/filter (0..100).
 * Пик около targetGain/targetFilter; ширина зоны = zonePct.
 */
export function noiseSnr(
  gain: number,
  filter: number,
  targetGain: number,
  targetFilter: number,
  zonePct: number,
): number {
  const dg = Math.abs(gain - targetGain);
  const df = Math.abs(filter - targetFilter);
  const dist = Math.sqrt(dg * dg + df * df);
  const soft = Math.max(8, zonePct * 1.8);
  const raw = Math.max(0, 100 - (dist / soft) * 100);
  return Math.round(raw);
}

export function noiseInLock(snr: number, zonePct: number): boolean {
  const floor = Math.max(55, 100 - zonePct * 2.2);
  return snr >= floor;
}

export function generateNoiseTargets(seed: number): { gain: number; filter: number } {
  const rand = rng(seed);
  return {
    gain: 18 + Math.floor(rand() * 64),
    filter: 18 + Math.floor(rand() * 64),
  };
}

// ─── Cipher Rings (BLACKSUN-style ring alignment) ───────────────────────────

/** Похожие глифы — чтобы не кликать «очевидное». */
export const CIPHER_GLYPHS = [
  '⌬',
  '⎔',
  '⬡',
  '⬢',
  '◈',
  '◇',
  '◉',
  '◎',
  '○',
  '⟁',
  '⧉',
  '⬚',
  '▣',
  '▤',
  '▥',
  '▲',
  '△',
  '▼',
  '▽',
] as const;

export type CipherRing = {
  /** Glyphs around the ring (length = size). */
  glyphs: string[];
  /** Index that should sit at the marker (top). */
  targetIdx: number;
  /** Current rotation offset (0..size-1). */
  rot: number;
};

export function generateCipherRings(ringCount: number, size: number, seed: number): CipherRing[] {
  const n = Math.max(2, Math.min(5, ringCount));
  const s = Math.max(4, Math.min(10, size));
  const rand = rng(seed);
  const rings: CipherRing[] = [];
  for (let i = 0; i < n; i++) {
    const pool = seededShuffle([...CIPHER_GLYPHS], seed + i * 19).slice(0, s);
    const targetIdx = Math.floor(rand() * s);
    let rot = Math.floor(rand() * s);
    // Avoid already-solved start
    if (rot === targetIdx) rot = (rot + 1 + Math.floor(rand() * (s - 1))) % s;
    rings.push({ glyphs: pool, targetIdx, rot });
  }
  return rings;
}

export function rotateCipherRing(ring: CipherRing, delta: number): CipherRing {
  const s = ring.glyphs.length;
  const rot = (((ring.rot + delta) % s) + s) % s;
  return { ...ring, rot };
}

export function cipherRingAligned(ring: CipherRing): boolean {
  return ring.rot === ring.targetIdx;
}

export function cipherRingsSolved(rings: CipherRing[]): boolean {
  return rings.every(cipherRingAligned);
}

/** Следующее кольцо, которое можно LOCK (по порядку 0→n). */
export function cipherNextLockIndex(rings: CipherRing[], lockedCount: number): number {
  return Math.min(lockedCount, rings.length);
}

export function canLockCipherRing(rings: CipherRing[], lockedCount: number, ringIndex: number): boolean {
  return ringIndex === lockedCount && cipherRingAligned(rings[ringIndex]!);
}

export function cipherMarkerGlyph(ring: CipherRing): string {
  return ring.glyphs[ring.rot] ?? '?';
}

export function cipherTargetGlyph(ring: CipherRing): string {
  return ring.glyphs[ring.targetIdx] ?? '?';
}

// ─── Bit Sweep (minesweeper / ICE mines) ────────────────────────────────────

export type BitCell = {
  mine: boolean;
  adj: number;
  revealed: boolean;
  flagged: boolean;
};

export function generateBitSweep(
  cols: number,
  rows: number,
  mineCount: number,
  seed: number,
): BitCell[] {
  const c = Math.max(4, Math.min(8, cols));
  const r = Math.max(4, Math.min(8, rows));
  const total = c * r;
  const mines = Math.max(3, Math.min(total - 4, mineCount));
  const rand = rng(seed);
  const cells: BitCell[] = Array.from({ length: total }, () => ({
    mine: false,
    adj: 0,
    revealed: false,
    flagged: false,
  }));
  let placed = 0;
  while (placed < mines) {
    const idx = Math.floor(rand() * total);
    if (!cells[idx]!.mine) {
      cells[idx]!.mine = true;
      placed++;
    }
  }
  const neighbors = (idx: number): number[] => {
    const x = idx % c;
    const y = Math.floor(idx / c);
    const out: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < c && ny >= 0 && ny < r) out.push(ny * c + nx);
      }
    }
    return out;
  };
  for (let i = 0; i < total; i++) {
    if (cells[i]!.mine) continue;
    cells[i]!.adj = neighbors(i).filter((j) => cells[j]!.mine).length;
  }
  return cells;
}

/** Flood-reveal; returns next grid. Does not reveal mines. */
export function revealBitCell(grid: BitCell[], cols: number, idx: number): BitCell[] {
  if (idx < 0 || idx >= grid.length) return grid;
  const cell = grid[idx]!;
  if (cell.revealed || cell.flagged || cell.mine) return grid;
  const next = grid.map((c) => ({ ...c }));
  const stack = [idx];
  while (stack.length) {
    const i = stack.pop()!;
    const cur = next[i]!;
    if (cur.revealed || cur.flagged || cur.mine) continue;
    cur.revealed = true;
    if (cur.adj === 0) {
      const x = i % cols;
      const y = Math.floor(i / cols);
      const rows = Math.floor(grid.length / cols);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) stack.push(ny * cols + nx);
        }
      }
    }
  }
  return next;
}

export function toggleBitFlag(grid: BitCell[], idx: number): BitCell[] {
  if (idx < 0 || idx >= grid.length) return grid;
  const cell = grid[idx]!;
  if (cell.revealed) return grid;
  const next = grid.map((c) => ({ ...c }));
  next[idx] = { ...cell, flagged: !cell.flagged };
  return next;
}

/** Win: all non-mines revealed (flags optional). */
export function bitSweepCleared(grid: BitCell[]): boolean {
  return grid.every((c) => c.mine || c.revealed);
}

export function bitSweepHitMine(grid: BitCell[], idx: number): boolean {
  return !!grid[idx]?.mine && !grid[idx]?.flagged;
}

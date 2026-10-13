/** Id мини-игр ICE (синхрон с NRI_GAME_CATALOG). */

export const NRI_ICE_GAME_IDS = [
  'gibson_ice',
  'port_sweep',
  'vuln_scan',
  'trace_rush',
  'opcode_forge',
  'keyspace_prune',
  'handshake_drill',
  'auth_bypass',
  'log_wipe',
  'dead_sector',
  'proxy_dodge',
  'noise_floor',
  'circuit_splice',
  'likeness_vault',
  'node_capture',
  'cipher_rings',
  'bit_sweep',
] as const;

export type NriIceGameId = (typeof NRI_ICE_GAME_IDS)[number];

export const DEFAULT_ICE_GAME_ID: NriIceGameId = 'gibson_ice';

export function isNriIceGameId(id: string): id is NriIceGameId {
  return (NRI_ICE_GAME_IDS as readonly string[]).includes(id);
}

export type IceDifficulty = 'easy' | 'medium' | 'hard';

/**
 * База очков за победу по тиру.
 * Hard заметно дороже easy, чтобы фарм лёгкого не перекрывал рекорды.
 */
export const ICE_ARCADE_WIN_SCORE: Record<IceDifficulty, number> = {
  easy: 120,
  medium: 320,
  hard: 700,
};

export function arcadeIceWinScore(difficulty: IceDifficulty): number {
  return ICE_ARCADE_WIN_SCORE[difficulty];
}

/**
 * Очки аркады с учётом качества забега (реиграбельность рейтинга).
 * qualityPct 0..100 → score от base до ~2×base.
 * Поражение → 0.
 */
export function arcadeIceScore(
  difficulty: IceDifficulty,
  won: boolean,
  qualityPct = 55,
): number {
  if (!won) return 0;
  const base = ICE_ARCADE_WIN_SCORE[difficulty];
  const q = Math.max(0, Math.min(100, qualityPct));
  return Math.round(base + base * (q / 100));
}

export type IceLeaderboardEntry = {
  userId: string;
  displayName: string;
  score: number;
  exfilPct: number;
  tracePct: number;
  difficulty: IceDifficulty;
  at: number;
};

export type IceScoreRow = {
  userId: string;
  displayName: string;
  score: number;
  exfilPct: number;
  tracePct: number;
  gameId: string;
  difficulty: string;
  createdAt: Date;
};

/** Лучший результат каждого игрока по игре, по убыванию score. */
export function buildIceLeaderboardForGame(
  rows: IceScoreRow[],
  gameId: string,
): IceLeaderboardEntry[] {
  const filtered = rows.filter((r) => r.gameId === gameId);
  const bestByUser = new Map<string, IceScoreRow>();
  for (const row of filtered) {
    const prev = bestByUser.get(row.userId);
    if (!prev || row.score > prev.score) bestByUser.set(row.userId, row);
  }
  return [...bestByUser.values()]
    .sort((a, b) => b.score - a.score || a.createdAt.getTime() - b.createdAt.getTime())
    .map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      score: r.score,
      exfilPct: r.exfilPct,
      tracePct: r.tracePct,
      difficulty: (r.difficulty === 'easy' || r.difficulty === 'hard' ? r.difficulty : 'medium') as IceDifficulty,
      at: r.createdAt.getTime(),
    }));
}

export function buildAllIceLeaderboards(rows: IceScoreRow[]): Record<string, IceLeaderboardEntry[]> {
  const boards: Record<string, IceLeaderboardEntry[]> = {};
  for (const id of NRI_ICE_GAME_IDS) {
    boards[id] = buildIceLeaderboardForGame(rows, id);
  }
  return boards;
}

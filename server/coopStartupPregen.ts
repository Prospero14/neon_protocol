/** Совпадает с клиентским пулом NPC в `coopStartupLeaderboard.ts` — для слияния на сервере. */
export const COOP_STARTUP_PREGEN: { name: string; score: number; tag: string }[] = [
  { name: 'NULLCREDIT LAB', score: 2840, tag: 'NPC' },
  { name: 'OCTOBERLINE VENTURES', score: 2710, tag: 'NPC' },
  { name: 'GIGABANK // RIVAL', score: 2655, tag: 'NPC' },
  { name: 'NEON_LEDGER_CO', score: 2510, tag: 'NPC' },
  { name: 'SILICON_HEDGE FINTECH', score: 2390, tag: 'NPC' },
  { name: 'KRYLOVO PAY MESH', score: 2280, tag: 'NPC' },
  { name: 'TELECON DEFI CELL', score: 2140, tag: 'NPC' },
  { name: 'RUST_VALLEY CLEARING', score: 1990, tag: 'NPC' },
  { name: 'REDUNDANTS API HOUSE', score: 1860, tag: 'NPC' },
  { name: 'NET_DRIVERS SAAS', score: 1720, tag: 'NPC' },
];

export type StartupRankRow = {
  rank: number;
  name: string;
  score: number;
  tag: string;
  userId?: string;
};

export function mergeStartupRankings(
  dbRows: { userId: string; startupName: string; score: number }[],
): StartupRankRow[] {
  const pregen = COOP_STARTUP_PREGEN.map((p) => ({
    name: p.name,
    score: p.score,
    tag: p.tag,
    userId: undefined as string | undefined,
  }));
  const players = dbRows.map((r) => ({
    name: r.startupName,
    score: r.score,
    tag: 'USER',
    userId: r.userId,
  }));
  const all = [...pregen, ...players].sort((a, b) => b.score - a.score);
  return all.slice(0, 20).map((r, i) => ({
    rank: i + 1,
    name: r.name,
    score: r.score,
    tag: r.tag,
    userId: r.userId,
  }));
}

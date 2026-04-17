/**
 * Рейтинг стартапов коопа: 10 прегенерённых лоровых имён + место игрока по очкам.
 * Очки локальные (без бэкенда лидерборда): для ощущения прогресса и соревнования с «NPC».
 */

import type { SkillMode } from './skillMode';

export type StartupLeaderRow = {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
  tag?: string;
};

const PREGEN: { name: string; score: number; tag: string }[] = [
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

const TIER_SCORE: Record<SkillMode, number> = {
  'script-kiddie': 0,
  junior: 200,
  mid: 900,
  senior: 2200,
};

/**
 * Очки игрока: миссии тира + биты + бонус ранга.
 */
export function computeCoopStartupScore(params: {
  clearedTierMissions: number;
  bits: number;
  tierRank: SkillMode;
}): number {
  const b = Math.min(params.bits, 8000);
  return (
    params.clearedTierMissions * 130 +
    Math.floor(b / 8) +
    TIER_SCORE[params.tierRank] +
    (params.tierRank === 'senior' ? 400 : 0)
  );
}

export function buildMergedStartupLeaderboard(params: {
  startupName: string;
  clearedTierMissions: number;
  bits: number;
  tierRank: SkillMode;
}): StartupLeaderRow[] {
  const playerScore = computeCoopStartupScore({
    clearedTierMissions: params.clearedTierMissions,
    bits: params.bits,
    tierRank: params.tierRank,
  });
  const raw: { name: string; score: number; isPlayer: boolean; tag?: string }[] = [
    ...PREGEN.map((p) => ({ name: p.name, score: p.score, isPlayer: false, tag: p.tag })),
    {
      name: params.startupName.trim() || 'YOUR_STARTUP',
      score: playerScore,
      isPlayer: true,
      tag: 'YOU',
    },
  ];
  raw.sort((a, b) => b.score - a.score);
  return raw.slice(0, 16).map((r, i) => ({
    rank: i + 1,
    name: r.name,
    score: r.score,
    isPlayer: r.isPlayer,
    tag: r.tag,
  }));
}

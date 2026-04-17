import type { SkillMode } from './skillMode';
import { computeCoopStartupScore, type StartupLeaderRow } from './coopStartupLeaderboard';

export type ServerStartupRankRow = {
  rank: number;
  name: string;
  score: number;
  tag: string;
  userId?: string;
};

export function mapServerStartupRowsToLeaderboard(
  rows: ServerStartupRankRow[],
  currentUserId: string,
): StartupLeaderRow[] {
  return rows.map((r) => ({
    rank: r.rank,
    name: r.name,
    score: r.score,
    isPlayer: Boolean(r.userId && r.userId === currentUserId),
    tag: r.userId === currentUserId ? 'YOU' : r.tag,
  }));
}

/**
 * Отправляет лучший локальный счёт на сервер и возвращает объединённый топ (NPC + игроки).
 */
export async function refreshCoopStartupLeaderboardFromServer(params: {
  token: string;
  userId: string;
  startupName: string;
  clearedTierMissions: number;
  bits: number;
  tierRank: SkillMode;
}): Promise<StartupLeaderRow[] | null> {
  const score = computeCoopStartupScore({
    clearedTierMissions: params.clearedTierMissions,
    bits: params.bits,
    tierRank: params.tierRank,
  });
  try {
    await fetch('/neon_v1/coop/startup-rankings/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        startupName: params.startupName,
        score,
        tierRank: params.tierRank,
        missionsCleared: params.clearedTierMissions,
        bits: params.bits,
      }),
    });
  } catch {
    /* сеть — всё равно пробуем GET */
  }
  const res = await fetch('/neon_v1/coop/startup-rankings');
  if (!res.ok) return null;
  const data = (await res.json()) as { rows?: ServerStartupRankRow[] };
  const rows = Array.isArray(data.rows) ? data.rows : [];
  return mapServerStartupRowsToLeaderboard(rows, params.userId);
}

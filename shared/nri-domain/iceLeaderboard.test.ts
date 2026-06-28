import { describe, expect, it } from 'vitest';
import {
  arcadeIceWinScore,
  buildAllIceLeaderboards,
  buildIceLeaderboardForGame,
  isNriIceGameId,
  NRI_ICE_GAME_IDS,
} from './iceLeaderboard.js';

describe('isNriIceGameId — rejects garbage', () => {
  it('returns false for empty, unknown, partial ids', () => {
    expect(isNriIceGameId('')).toBe(false);
    expect(isNriIceGameId('GIBSON_ICE')).toBe(false);
    expect(isNriIceGameId('gibson_ice_extra')).toBe(false);
    expect(isNriIceGameId('undefined')).toBe(false);
  });
});

describe('buildIceLeaderboardForGame — edge cases', () => {
  it('returns empty array for empty input without throwing', () => {
    expect(buildIceLeaderboardForGame([], 'gibson_ice')).toEqual([]);
  });

  it('ignores rows from other games', () => {
    const rows = [
      {
        userId: 'u1',
        displayName: 'A',
        gameId: 'other_game',
        difficulty: 'easy',
        score: 9999,
        exfilPct: 100,
        tracePct: 0,
        createdAt: new Date(1000),
      },
    ];
    expect(buildIceLeaderboardForGame(rows, 'gibson_ice')).toEqual([]);
  });

  it('handles negative and zero scores without throwing', () => {
    const rows = [
      {
        userId: 'u1',
        displayName: 'A',
        gameId: 'port_sweep',
        difficulty: 'easy',
        score: -50,
        exfilPct: 0,
        tracePct: 100,
        createdAt: new Date(1000),
      },
      {
        userId: 'u2',
        displayName: 'B',
        gameId: 'port_sweep',
        difficulty: 'easy',
        score: 0,
        exfilPct: 0,
        tracePct: 100,
        createdAt: new Date(2000),
      },
    ];
    const lb = buildIceLeaderboardForGame(rows, 'port_sweep');
    expect(lb).toHaveLength(2);
    expect(lb[0]?.score).toBe(0);
    expect(lb[1]?.score).toBe(-50);
  });

  it('tie-breaks equal scores by earlier createdAt', () => {
    const rows = [
      {
        userId: 'late',
        displayName: 'Late',
        gameId: 'hash_crack',
        difficulty: 'medium',
        score: 100,
        exfilPct: 100,
        tracePct: 0,
        createdAt: new Date(5000),
      },
      {
        userId: 'early',
        displayName: 'Early',
        gameId: 'hash_crack',
        difficulty: 'medium',
        score: 100,
        exfilPct: 100,
        tracePct: 0,
        createdAt: new Date(1000),
      },
    ];
    const lb = buildIceLeaderboardForGame(rows, 'hash_crack');
    expect(lb[0]?.userId).toBe('early');
    expect(lb[1]?.userId).toBe('late');
  });

  it('keeps best score per user when multiple rows exist', () => {
    const rows = [
      {
        userId: 'u1',
        displayName: 'A',
        gameId: 'port_sweep',
        difficulty: 'easy',
        score: 100,
        exfilPct: 100,
        tracePct: 0,
        createdAt: new Date(1000),
      },
      {
        userId: 'u1',
        displayName: 'A',
        gameId: 'port_sweep',
        difficulty: 'hard',
        score: 500,
        exfilPct: 100,
        tracePct: 0,
        createdAt: new Date(2000),
      },
      {
        userId: 'u1',
        displayName: 'A',
        gameId: 'port_sweep',
        difficulty: 'medium',
        score: 50,
        exfilPct: 50,
        tracePct: 50,
        createdAt: new Date(3000),
      },
    ];
    const lb = buildIceLeaderboardForGame(rows, 'port_sweep');
    expect(lb).toHaveLength(1);
    expect(lb[0]?.score).toBe(500);
  });

  it('coerces invalid difficulty to medium', () => {
    const lb = buildIceLeaderboardForGame(
      [
        {
          userId: 'u1',
          displayName: 'A',
          gameId: 'log_wipe',
          difficulty: 'insane',
          score: 10,
          exfilPct: 0,
          tracePct: 0,
          createdAt: new Date(1),
        },
      ],
      'log_wipe',
    );
    expect(lb[0]?.difficulty).toBe('medium');
  });

  it('duplicate userId with empty string does not crash', () => {
    const rows = [
      {
        userId: '',
        displayName: 'Ghost',
        gameId: 'mesh_jack',
        difficulty: 'easy',
        score: 10,
        exfilPct: 0,
        tracePct: 0,
        createdAt: new Date(1),
      },
      {
        userId: '',
        displayName: 'Ghost2',
        gameId: 'mesh_jack',
        difficulty: 'easy',
        score: 20,
        exfilPct: 0,
        tracePct: 0,
        createdAt: new Date(2),
      },
    ];
    expect(() => buildIceLeaderboardForGame(rows, 'mesh_jack')).not.toThrow();
    expect(buildIceLeaderboardForGame(rows, 'mesh_jack')).toHaveLength(1);
  });
});

describe('buildAllIceLeaderboards — catalog coverage', () => {
  it('always returns all catalog game keys even with no data', () => {
    const boards = buildAllIceLeaderboards([]);
    expect(Object.keys(boards).sort()).toEqual([...NRI_ICE_GAME_IDS].sort());
    for (const id of NRI_ICE_GAME_IDS) {
      expect(boards[id]).toEqual([]);
    }
  });
});

describe('arcadeIceWinScore', () => {
  it('returns finite positive scores for all difficulties', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      const s = arcadeIceWinScore(d);
      expect(Number.isFinite(s)).toBe(true);
      expect(s).toBeGreaterThan(0);
    }
  });
});

describe('buildIceLeaderboardForGame — corrupt rows', () => {
  it('handles missing displayName without throw', () => {
    const lb = buildIceLeaderboardForGame(
      [
        {
          userId: 'u1',
          displayName: '',
          gameId: 'trace_rush',
          difficulty: '',
          score: 10,
          exfilPct: 0,
          tracePct: 0,
          createdAt: new Date(1),
        },
      ],
      'trace_rush',
    );
    expect(lb).toHaveLength(1);
    expect(lb[0]?.displayName).toBe('');
  });

  it('unknown gameId filter → empty', () => {
    expect(
      buildIceLeaderboardForGame(
        [
          {
            userId: 'u1',
            displayName: 'A',
            gameId: 'gibson_ice',
            difficulty: 'easy',
            score: 10,
            exfilPct: 0,
            tracePct: 0,
            createdAt: new Date(1),
          },
        ],
        'totally_fake',
      ),
    ).toEqual([]);
  });
});

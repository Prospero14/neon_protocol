import React, { useCallback, useEffect, useState } from 'react';
import GibsonIceHack from './games/GibsonIceHack';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import {
  nriFetchIceLeaderboard,
  nriSubmitIceScore,
  type NriIceLeaderboardEntry,
} from '../logic/nriApi';

type Props = {
  inviteCode: string;
  onOpenInventory?: () => void;
};

export const NriIceRunPanel: React.FC<Props> = ({ inviteCode, onOpenInventory }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [runKey, setRunKey] = useState(() => Date.now());
  const [leaderboard, setLeaderboard] = useState<NriIceLeaderboardEntry[]>([]);

  const refreshLb = useCallback(async () => {
    if (!authToken) return;
    const rows = await nriFetchIceLeaderboard(authToken, inviteCode);
    setLeaderboard(rows);
  }, [authToken, inviteCode]);

  useEffect(() => {
    setRunKey(Date.now());
    refreshLb();
  }, [inviteCode, refreshLb]);

  const onRunComplete = async (result: {
    bits: number;
    exfilPct: number;
    tracePct: number;
    won: boolean;
  }) => {
    if (!authToken) return;
    await nriSubmitIceScore(authToken, inviteCode, {
      score: result.bits,
      exfilPct: result.exfilPct,
      tracePct: result.tracePct,
      won: result.won,
    });
    await refreshLb();
  };

  return (
    <div className="nri-ice-run-panel">
      <GibsonIceHack
        key={runKey}
        nriInviteCode={inviteCode}
        onOpenInventory={onOpenInventory}
        onRunComplete={onRunComplete}
        onFinish={() => {
          setRunKey(Date.now());
        }}
        tableLeaderboardMode
      />

      <section className="nri-ice-lb">
        <h3 className="mono-text">Рейтинг ICE Run · стол</h3>
        <p className="mono-text opacity-60">Лучший результат каждого игрока (очки = BITS за чистый эксfil).</p>
        <ol className="nri-ice-lb__list">
          {leaderboard.map((row, i) => (
            <li key={row.userId} className="mono-text">
              <span className="nri-ice-lb__rank">{i + 1}.</span>
              <strong>{row.displayName}</strong>
              <span className="opacity-70">
                {' '}
                — {row.score} pts · trace {row.tracePct}%
              </span>
            </li>
          ))}
          {leaderboard.length === 0 && <li className="mono-text opacity-50">Пока нет успешных забегов.</li>}
        </ol>
      </section>
    </div>
  );
};

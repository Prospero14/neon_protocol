import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Play, Skull } from 'lucide-react';
import { IcebreakerRouter } from './games/IcebreakerRouter';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import {
  nriFetchIceLeaderboards,
  nriReportIceResult,
  nriSubmitIceScore,
  type NriIceLeaderboardEntry,
} from '../logic/nriApi';
import { NRI_GAME_CATALOG, type IceDifficulty } from '../logic/nriGameCatalog';
import { arcadeIceWinScore } from '../../shared/nri-domain/iceLeaderboard';

type Props = {
  inviteCode: string;
  onOpenInventory?: () => void;
  onNewAchievements?: (unlocks: import('../logic/nriApi').NriAchievementUnlock[]) => void;
};

const DIFFICULTIES: IceDifficulty[] = ['easy', 'medium', 'hard'];

function IceGameLeaderboard({ rows, gameId }: { rows: NriIceLeaderboardEntry[]; gameId: string }) {
  const isGibson = gameId === 'gibson_ice';
  return (
    <ol className="nri-ice-lb__list">
      {rows.map((row, i) => (
        <li key={row.userId} className="mono-text">
          <span className="nri-ice-lb__rank">{i + 1}.</span>
          <strong>{row.displayName}</strong>
          <span className="opacity-70">
            {' '}
            — {row.score} pts
            {isGibson ? ` · trace ${row.tracePct}%` : row.difficulty ? ` · ${row.difficulty}` : ''}
          </span>
        </li>
      ))}
      {rows.length === 0 && (
        <li className="mono-text opacity-50">Пока нет успешных забегов участников стола.</li>
      )}
    </ol>
  );
}

export const NriIceRunPanel: React.FC<Props> = ({ inviteCode, onOpenInventory, onNewAchievements }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [boards, setBoards] = useState<Record<string, NriIceLeaderboardEntry[]>>({});
  const [expandedId, setExpandedId] = useState<string>('gibson_ice');
  const [pickDifficulty, setPickDifficulty] = useState<Record<string, IceDifficulty>>({});
  const [activeGame, setActiveGame] = useState<{ gameId: string; difficulty: IceDifficulty } | null>(null);

  const refreshBoards = useCallback(async () => {
    if (!authToken) return;
    const data = await nriFetchIceLeaderboards(authToken, inviteCode);
    setBoards(data);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refreshBoards();
  }, [inviteCode, refreshBoards]);

  const difficultyFor = (gameId: string): IceDifficulty => pickDifficulty[gameId] ?? 'medium';

  const submitArcadeScore = async (
    gameId: string,
    difficulty: IceDifficulty,
    won: boolean,
    gibson?: { score: number; exfilPct: number; tracePct: number }
  ) => {
    if (!authToken) return;
    const score = gibson?.score ?? (won ? arcadeIceWinScore(difficulty) : 0);
    const result = await nriSubmitIceScore(authToken, inviteCode, {
      gameId,
      difficulty,
      score,
      exfilPct: gibson?.exfilPct ?? (won ? 100 : 0),
      tracePct: gibson?.tracePct ?? (won ? 0 : 100),
      won,
    });
    if (result.ok && result.newAchievements?.length) {
      onNewAchievements?.(result.newAchievements);
    }
    await refreshBoards();
  };

  const handleGibsonComplete = async (result: {
    score: number;
    exfilPct: number;
    tracePct: number;
    won: boolean;
  }) => {
    if (!activeGame) return;
    await submitArcadeScore(activeGame.gameId, activeGame.difficulty, result.won, {
      score: result.score,
      exfilPct: result.exfilPct,
      tracePct: result.tracePct,
    });
  };

  const handleMiniComplete = async (won: boolean) => {
    if (!activeGame || !authToken) return;
    const iceRes = await nriReportIceResult(authToken, inviteCode, won);
    if (iceRes.ok && iceRes.newAchievements?.length) {
      onNewAchievements?.(iceRes.newAchievements);
    }
    await submitArcadeScore(activeGame.gameId, activeGame.difficulty, won);
    setActiveGame(null);
  };

  if (activeGame) {
    return (
      <div className="nri-ice-run-panel nri-ice-run-panel--play">
        <IcebreakerRouter
          gameId={activeGame.gameId}
          difficulty={activeGame.difficulty}
          nriInviteCode={inviteCode}
          tableArcadeMode
          onOpenInventory={onOpenInventory}
          onRunComplete={activeGame.gameId === 'gibson_ice' ? handleGibsonComplete : undefined}
          onComplete={handleMiniComplete}
          onBack={() => setActiveGame(null)}
        />
      </div>
    );
  }

  return (
    <div className="nri-ice-run-panel">
      <header className="nri-ice-hub__head">
        <Skull size={20} />
        <div>
          <h2 className="mono-text">ICE · аркада стола</h2>
          <p className="mono-text opacity-60">
            {NRI_GAME_CATALOG.length} мини-игр · рейтинг только участников этого стола
          </p>
        </div>
      </header>

      <ul className="nri-ice-hub__list">
        {NRI_GAME_CATALOG.map((game) => {
          const open = expandedId === game.id;
          const rows = boards[game.id] ?? [];
          const diff = difficultyFor(game.id);
          return (
            <li key={game.id} className={`nri-ice-game-card ${open ? 'nri-ice-game-card--open' : ''}`}>
              <button
                type="button"
                className="nri-ice-game-card__head"
                onClick={() => setExpandedId((id) => (id === game.id ? '' : game.id))}
              >
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="nri-ice-game-card__title">{game.title}</span>
                <span className="mono-text opacity-50 nri-ice-game-card__count">
                  {rows.length ? `${rows.length} в рейтинге` : '—'}
                </span>
              </button>

              {open && (
                <div className="nri-ice-game-card__body">
                  <p className="mono-text opacity-70 nri-ice-game-card__blurb">{game.blurb}</p>
                  <dl className="nri-ice-game-card__guide mono-text">
                    <div>
                      <dt>Как играть</dt>
                      <dd>{game.guide.how}</dd>
                    </div>
                    <div>
                      <dt>Победа</dt>
                      <dd>{game.guide.win}</dd>
                    </div>
                    <div>
                      <dt>Провал</dt>
                      <dd>{game.guide.fail}</dd>
                    </div>
                  </dl>

                  <div className="nri-ice-game-card__play">
                    <label className="mono-text">
                      Сложность
                      <select
                        value={diff}
                        onChange={(e) =>
                          setPickDifficulty((prev) => ({
                            ...prev,
                            [game.id]: e.target.value as IceDifficulty,
                          }))
                        }
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d} value={d}>
                            {game.difficulties[d].label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="nri-ice-game-card__start"
                      onClick={() => setActiveGame({ gameId: game.id, difficulty: diff })}
                    >
                      <Play size={14} /> Играть
                    </button>
                  </div>

                  <section className="nri-ice-lb nri-ice-lb--inline">
                    <h3 className="mono-text">Рейтинг · {game.title}</h3>
                    <IceGameLeaderboard rows={rows} gameId={game.id} />
                  </section>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { arcadeIceScore } from '../../shared/nri-domain/iceLeaderboard';
import { inventoryHasDeck } from '../../shared/nri-domain/iceCounterHack';
import { nriFetchPlayer } from '../logic/nriApi';

type Props = {
  inviteCode: string;
  /** Мастер может играть без деки в инвентаре. */
  isHost?: boolean;
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

export const NriIceRunPanel: React.FC<Props> = ({
  inviteCode,
  isHost = false,
  onOpenInventory,
  onNewAchievements,
}) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [boards, setBoards] = useState<Record<string, NriIceLeaderboardEntry[]>>({});
  const [expandedId, setExpandedId] = useState<string>('gibson_ice');
  const [pickDifficulty, setPickDifficulty] = useState<Record<string, IceDifficulty>>({});
  const [activeGame, setActiveGame] = useState<{ gameId: string; difficulty: IceDifficulty } | null>(null);
  const [hasDeck, setHasDeck] = useState(true);
  const canPlayIce = isHost || hasDeck;

  const refreshBoards = useCallback(async () => {
    if (!authToken) return;
    const data = await nriFetchIceLeaderboards(authToken, inviteCode);
    setBoards(data);
  }, [authToken, inviteCode]);

  const refreshDeck = useCallback(async () => {
    if (!authToken) return;
    if (isHost) {
      setHasDeck(true);
      return;
    }
    const p = await nriFetchPlayer(authToken, inviteCode);
    setHasDeck(inventoryHasDeck(p?.inventory));
  }, [authToken, inviteCode, isHost]);

  useEffect(() => {
    refreshBoards();
    refreshDeck();
  }, [inviteCode, refreshBoards, refreshDeck]);

  const difficultyFor = (gameId: string): IceDifficulty => pickDifficulty[gameId] ?? 'medium';

  const submitArcadeScore = async (
    gameId: string,
    difficulty: IceDifficulty,
    won: boolean,
    gibson?: { score: number; exfilPct: number; tracePct: number },
    qualityPct?: number,
  ) => {
    if (!authToken) return;
    const score =
      gibson?.score ??
      arcadeIceScore(difficulty, won, qualityPct ?? (won ? 55 : 0));
    const result = await nriSubmitIceScore(authToken, inviteCode, {
      gameId,
      difficulty,
      score,
      exfilPct: gibson?.exfilPct ?? (won ? 100 : 0),
      tracePct: gibson?.tracePct ?? (won ? Math.max(0, 100 - (qualityPct ?? 55)) : 100),
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
    if (!activeGame || !authToken) return;
    const { gameId, difficulty } = activeGame;
    setActiveGame(null);
    const iceRes = await nriReportIceResult(authToken, inviteCode, result.won);
    if (iceRes.ok && iceRes.newAchievements?.length) {
      onNewAchievements?.(iceRes.newAchievements);
    }
    await submitArcadeScore(gameId, difficulty, result.won, {
      score: result.score,
      exfilPct: result.exfilPct,
      tracePct: result.tracePct,
    });
    await refreshDeck();
  };

  const handleMiniComplete = async (
    won: boolean,
    meta?: { qualityPct?: number; tracePct?: number },
  ) => {
    if (!activeGame || !authToken) return;
    const { gameId, difficulty } = activeGame;
    // Сразу размонтировать мини-игру — иначе таймеры Firewall/TRACE шлют второй onComplete.
    setActiveGame(null);
    const iceRes = await nriReportIceResult(authToken, inviteCode, won);
    if (iceRes.ok && iceRes.newAchievements?.length) {
      onNewAchievements?.(iceRes.newAchievements);
    }
    await submitArcadeScore(gameId, difficulty, won, undefined, meta?.qualityPct);
    await refreshDeck();
  };

  return (
    <div className="nri-ice-run-panel nri-deck-module">
      <header className="nri-ice-hub__head">
        <Skull size={20} />
        <div>
          <h2 className="mono-text">ICE · аркада стола</h2>
          <p className="mono-text opacity-60">
            {NRI_GAME_CATALOG.length} мини-игр · рейтинг только участников этого стола
          </p>
          {!canPlayIce && (
            <p className="mono-text nri-ice-hub__deck-warn">
              Нет кибердеки в инвентаре — ICE недоступен. Купи/получи деку или попроси передать.
            </p>
          )}
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
                  <p className="mono-text nri-ice-game-card__diff-hint opacity-70">
                    {game.difficulties[diff].label}: {game.diffHints[diff]}
                  </p>
                  <ul className="nri-ice-game-card__diff-list mono-text">
                    {DIFFICULTIES.map((d) => (
                      <li key={d} className={d === diff ? 'is-active' : ''}>
                        <strong>{game.difficulties[d].label}</strong> — {game.diffHints[d]}
                      </li>
                    ))}
                  </ul>

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
                      disabled={!canPlayIce}
                      title={!canPlayIce ? 'Нужна кибердека в инвентаре' : undefined}
                      onClick={() => {
                        if (!canPlayIce) return;
                        setActiveGame({ gameId: game.id, difficulty: diff });
                      }}
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

      {activeGame &&
        createPortal(
          <div className="nri-ice-play-overlay" role="dialog" aria-modal>
            <div className="nri-ice-play-modal">
              <IcebreakerRouter
                gameId={activeGame.gameId}
                difficulty={activeGame.difficulty}
                nriInviteCode={inviteCode}
                tableArcadeMode
                onOpenInventory={onOpenInventory}
                onRunComplete={
                  activeGame.gameId === 'gibson_ice' ? handleGibsonComplete : undefined
                }
                onComplete={handleMiniComplete}
                onBack={() => setActiveGame(null)}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

import React from 'react';
import GibsonIceHack from './GibsonIceHack';
import {
  AuthBypassGame,
  BreachMatrixGame,
  DeadDropGame,
  DaemonUploadGame,
  HashCrackGame,
  MeshJackGame,
  LogWipeGame,
  PacketSniffGame,
  PortSequenceGame,
  ProxyDodgeGame,
  ScanPickGame,
  SignalLockGame,
} from './IceMiniGames';
import {
  getIceGame,
  resolveIceParams,
  type IceDifficulty,
} from '../../logic/nriGameCatalog';

type Props = {
  gameId: string;
  difficulty: IceDifficulty;
  onComplete: (won: boolean) => void;
  onBack?: () => void;
  /** Аркада стола: Gibson — ban + рейтинг через onRunComplete. */
  nriInviteCode?: string;
  tableArcadeMode?: boolean;
  onOpenInventory?: () => void;
  onRunComplete?: (result: { score: number; exfilPct: number; tracePct: number; won: boolean }) => void;
};

export const IcebreakerRouter: React.FC<Props> = ({
  gameId,
  difficulty,
  onComplete,
  onBack,
  nriInviteCode,
  tableArcadeMode,
  onOpenInventory,
  onRunComplete,
}) => {
  const game = getIceGame(gameId);
  const params = resolveIceParams(gameId, difficulty);

  if (!game || !params) {
    return (
      <div className="ice-mini">
        <p className="mono-text">Неизвестная игра: {gameId}</p>
        <button type="button" onClick={() => onComplete(false)}>Назад</button>
      </div>
    );
  }

  const fail = () => onComplete(false);
  const win = () => onComplete(true);
  const p = { params, onWin: win, onFail: fail };

  if (game.engine === 'gibson') {
    return (
      <GibsonIceHack
        icebreakerMode={!tableArcadeMode}
        tableLeaderboardMode={tableArcadeMode}
        difficulty={difficulty}
        nriInviteCode={nriInviteCode}
        onOpenInventory={onOpenInventory}
        onRunComplete={
          onRunComplete
            ? (r) =>
                onRunComplete({
                  score: r.bits,
                  exfilPct: r.exfilPct,
                  tracePct: r.tracePct,
                  won: r.won,
                })
            : undefined
        }
        onBack={onBack}
        onFinish={() => {
          if (tableArcadeMode) {
            onBack?.();
            return;
          }
          onComplete(false);
        }}
      />
    );
  }

  return (
    <div className="icebreaker-wrap">
      <div className="icebreaker-wrap__frame" aria-hidden>
        <div className="icebreaker-wrap__scanlines" />
      </div>
      <header className="icebreaker-wrap__head">
        <div className="icebreaker-wrap__title-row">
          <h3>{game.title}</h3>
          <span className="mono-text icebreaker-wrap__badge">ICE_MODULE</span>
        </div>
        <p className="mono-text opacity-70">{game.blurb}</p>
        <span className="mono-text icebreaker-wrap__diff">
          DIFF :: {game.difficulties[difficulty].label.toUpperCase()}
        </span>
      </header>
      {game.engine === 'sequence' && <PortSequenceGame {...p} />}
      {game.engine === 'scan' && <ScanPickGame {...p} />}
      {game.engine === 'breach' && <BreachMatrixGame {...p} />}
      {game.engine === 'daemon' && <DaemonUploadGame {...p} />}
      {game.engine === 'mesh' && <MeshJackGame {...p} />}
      {game.engine === 'memory' && <DeadDropGame {...p} />}
      {game.engine === 'dodge' && <ProxyDodgeGame {...p} />}
      {game.engine === 'logwipe' && <LogWipeGame {...p} />}
      {game.engine === 'wordle' && <AuthBypassGame {...p} />}
      {game.engine === 'sniff' && <PacketSniffGame {...p} />}
      {game.engine === 'hash' && <HashCrackGame {...p} />}
      {game.engine === 'signallock' && <SignalLockGame {...p} />}
      {onBack && (
        <button type="button" className="icebreaker-wrap__back" onClick={onBack}>
          ← Отмена
        </button>
      )}
    </div>
  );
};

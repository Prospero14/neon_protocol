import React, { useCallback, useRef, useState } from 'react';
import GibsonIceHack from './GibsonIceHack';
import {
  AuthBypassGame,
  BreachMatrixGame,
  LogWipeGame,
  PortSequenceGame,
  ProxyDodgeGame,
  ScanPickGame,
} from './IceMiniGames';
import {
  CircuitSpliceGame,
  LikenessVaultGame,
  NodeCaptureGame,
} from './IceArcadeExtra';
import {
  BitSweepGame,
  CipherRingsGame,
  DeadSectorGame,
  HandshakeDrillGame,
  KeyspacePruneGame,
  NoiseFloorGame,
  OpcodeForgeGame,
  type IceWinMeta,
} from './IceRewriteGames';
import { IceResultModal } from './IceResultModal';
import {
  getIceGame,
  resolveIceParams,
  type IceDifficulty,
} from '../../logic/nriGameCatalog';

export type IceCompleteMeta = IceWinMeta;

type Props = {
  gameId: string;
  difficulty: IceDifficulty;
  onComplete: (won: boolean, meta?: IceCompleteMeta) => void;
  onBack?: () => void;
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
  const [result, setResult] = useState<{ won: boolean; meta?: IceCompleteMeta } | null>(null);

  const settledRef = useRef(false);
  const fail = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    setResult({ won: false });
  }, []);
  const win = useCallback((meta?: IceCompleteMeta) => {
    if (settledRef.current) return;
    settledRef.current = true;
    setResult({ won: true, meta });
  }, []);

  const confirmResult = useCallback(() => {
    if (!result) return;
    onComplete(result.won, result.meta);
  }, [onComplete, result]);

  if (!game || !params) {
    return (
      <div className="ice-mini">
        <p className="mono-text">Неизвестная игра: {gameId}</p>
        <button type="button" onClick={() => onComplete(false)}>Назад</button>
      </div>
    );
  }

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
        onFinish={(bits) => {
          if (tableArcadeMode) {
            onBack?.();
            return;
          }
          onComplete(bits > 0);
        }}
      />
    );
  }

  return (
    <div className={`icebreaker-wrap ${result ? 'icebreaker-wrap--settled' : ''}`}>
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
          {' · '}
          {game.diffHints[difficulty]}
        </span>
        <dl className="icebreaker-wrap__winfail mono-text">
          <div>
            <dt>WIN</dt>
            <dd>{game.guide.win}</dd>
          </div>
          <div>
            <dt>FAIL</dt>
            <dd>{game.guide.fail}</dd>
          </div>
        </dl>
      </header>
      <div className="icebreaker-wrap__play" aria-hidden={!!result}>
        {game.engine === 'sequence' && <PortSequenceGame {...p} />}
        {game.engine === 'scan' && <ScanPickGame {...p} />}
        {game.engine === 'breach' && <BreachMatrixGame {...p} />}
        {game.engine === 'stack' && <OpcodeForgeGame {...p} />}
        {game.engine === 'constraint' && <KeyspacePruneGame {...p} />}
        {game.engine === 'handshake' && <HandshakeDrillGame {...p} />}
        {game.engine === 'dodge' && <ProxyDodgeGame {...p} />}
        {game.engine === 'logwipe' && <LogWipeGame {...p} />}
        {game.engine === 'wordle' && <AuthBypassGame {...p} />}
        {game.engine === 'toggle' && <DeadSectorGame {...p} />}
        {game.engine === 'balance' && <NoiseFloorGame {...p} />}
        {game.engine === 'circuit' && <CircuitSpliceGame {...p} />}
        {game.engine === 'likeness' && <LikenessVaultGame {...p} />}
        {game.engine === 'capture' && <NodeCaptureGame {...p} />}
        {game.engine === 'rings' && <CipherRingsGame {...p} />}
        {game.engine === 'mines' && <BitSweepGame {...p} />}
      </div>
      {onBack && !result && (
        <button type="button" className="icebreaker-wrap__back" onClick={onBack}>
          ← Отмена
        </button>
      )}
      {result && (
        <IceResultModal
          won={result.won}
          gameId={game.id}
          title={game.title}
          winText={game.guide.win}
          failText={game.guide.fail}
          difficultyLabel={game.difficulties[difficulty].label}
          qualityPct={result.meta?.qualityPct}
          onConfirm={confirmResult}
        />
      )}
    </div>
  );
};

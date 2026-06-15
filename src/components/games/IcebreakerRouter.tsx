import React from 'react';
import GibsonIceHack from './GibsonIceHack';
import { DeadDropGame, PortSequenceGame, ScanPickGame, TapRushGame } from './IceMiniGames';
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
};

export const IcebreakerRouter: React.FC<Props> = ({ gameId, difficulty, onComplete, onBack }) => {
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

  if (game.engine === 'gibson') {
    return (
      <GibsonIceHack
        icebreakerMode
        difficulty={difficulty}
        onBack={onBack}
        onFinish={(bits) => onComplete(bits > 0)}
      />
    );
  }

  return (
    <div className="icebreaker-wrap">
      <header className="icebreaker-wrap__head">
        <h3>{game.title}</h3>
        <p className="mono-text opacity-70">{game.blurb}</p>
        <span className="mono-text icebreaker-wrap__diff">
          {game.difficulties[difficulty].label}
        </span>
      </header>
      {game.engine === 'sequence' && <PortSequenceGame params={params} onWin={win} onFail={fail} />}
      {game.engine === 'scan' && <ScanPickGame params={params} onWin={win} onFail={fail} />}
      {game.engine === 'tap' && <TapRushGame params={params} onWin={win} onFail={fail} />}
      {game.engine === 'memory' && <DeadDropGame params={params} onWin={win} onFail={fail} />}
      {onBack && (
        <button type="button" className="icebreaker-wrap__back" onClick={onBack}>
          ← Отмена
        </button>
      )}
    </div>
  );
};

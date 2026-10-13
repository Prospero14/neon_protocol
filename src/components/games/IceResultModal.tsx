import React from 'react';
import { iceOutcomeFlavor } from '../../logic/iceOutcomeFlavor';

type Props = {
  won: boolean;
  gameId: string;
  title: string;
  winText: string;
  failText: string;
  difficultyLabel: string;
  qualityPct?: number;
  onConfirm: () => void;
};

/** Экран фиксации победы/поражения перед закрытием мини-игры. */
export const IceResultModal: React.FC<Props> = ({
  won,
  gameId,
  title,
  winText,
  failText,
  difficultyLabel,
  qualityPct,
  onConfirm,
}) => {
  const flavor = iceOutcomeFlavor(gameId, won);
  return (
    <div
      className={`ice-result-modal ${won ? 'ice-result-modal--win' : 'ice-result-modal--fail'}`}
      role="dialog"
      aria-modal
    >
      <div className="ice-result-modal__card">
        <p className="mono-text ice-result-modal__status">
          {won ? '▸ BREACH_OK · SESSION LOGGED' : '▸ ICE_LOCKOUT · TRACE DUMPED'}
        </p>

        <div className={`ice-result-modal__stamp ${won ? 'is-win' : 'is-fail'}`} aria-live="polite">
          <span className="ice-result-modal__stamp-mark" aria-hidden>
            {won ? '▣' : '╳'}
          </span>
          <strong className="ice-result-modal__stamp-text">{flavor.stamp}</strong>
          <span className="mono-text ice-result-modal__stamp-line">{flavor.line}</span>
        </div>

        <h4>{title}</h4>
        <p className="mono-text ice-result-modal__diff">DIFF :: {difficultyLabel}</p>
        <p className="ice-result-modal__body">{won ? winText : failText}</p>
        {won && qualityPct != null && (
          <p className="mono-text ice-result-modal__quality">
            quality {qualityPct}% · пойдёт в рейтинг стола
          </p>
        )}
        {!won && (
          <p className="mono-text ice-result-modal__quality opacity-70">
            поражение · в рейтинг 0 pts
          </p>
        )}
        <button type="button" className="ice-result-modal__btn" onClick={onConfirm}>
          {won ? 'Записать результат' : 'Закрыть'}
        </button>
      </div>
    </div>
  );
};

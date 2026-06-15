import React from 'react';
import { C2185_RULES } from '../logic/nriCarbon2185';

type Props = { onClose: () => void };

export const NriRulesPanel: React.FC<Props> = ({ onClose }) => (
  <div className="nri-modal-overlay" onClick={onClose}>
    <div className="nri-modal nri-modal--wide nri-rules" onClick={(e) => e.stopPropagation()}>
      <h2 className="nri-modal__title">Carbon 2185 — краткие правила</h2>
      <p className="mono-text nri-modal__hint">
        Сводка по Core Rulebook (Carbon 2185). Полный текст — в PDF правил.
      </p>
      {C2185_RULES.map((sec) => (
        <section key={sec.title} className="nri-rules__section">
          <h3 className="nri-rules__heading">{sec.title}</h3>
          <ul className="nri-rules__list">
            {sec.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
      <button type="button" className="nri-modal__submit" onClick={onClose}>
        Закрыть
      </button>
    </div>
  </div>
);

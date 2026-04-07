import React from 'react';
import { RefreshCw } from 'lucide-react';
import type { TechnicalTask } from '../../../logic/combatTasks';

interface CombatStatusPanelProps {
  playerProgress: number;
  aiProgress: number;
  bugPoints: number;
  aiDeadline: number;
  missionTz: TechnicalTask;
  deckCount: number;
  mulliganUsed: boolean;
  currentPhase: string;
  planningTurn: number;
  onMulligan: () => void;
  onShowTzModal: (val: boolean) => void;
}

const CombatStatusPanel: React.FC<CombatStatusPanelProps> = ({
  playerProgress, aiProgress, bugPoints, aiDeadline, missionTz, deckCount, mulliganUsed, currentPhase, planningTurn, onMulligan, onShowTzModal
}) => {
  return (
    <aside className="combat-right-panel terminal-v3">
      <div className="ip-section">
        <div className="ip-meter">
          <div className="ip-meter-header">
            <span className="ip-meter-label">PROJECT_PROGRESS</span>
            <span className="ip-meter-val">{playerProgress}%</span>
          </div>
          <div className="ip-bar"><div className="ip-bar-fill shadow-cyan" style={{ width: `${playerProgress}%`, background: 'var(--neon-cyan)' }}></div></div>
        </div>
        <div className="ip-meter">
          <div className="ip-meter-header">
            <span className="ip-meter-label">CRASH_THREAT</span>
            <span className="ip-meter-val">{aiProgress}%</span>
          </div>
          <div className="ip-bar"><div className="ip-bar-fill shadow-amber" style={{ width: `${aiProgress}%`, background: 'var(--neon-amber)' }}></div></div>
        </div>
      </div>

      <div className="ip-section">
        <div className="ip-title">SYSTEM_BUGS</div>
        <div className="ip-meter-val blink-red">{bugPoints} ERRORS</div>
      </div>

      <div className="ip-deadline-box pulse-red-border">
        <span className="ip-deadline-label">AI_DEADLINE_TICK</span>
        <span className="ip-deadline-val">{aiDeadline}L</span>
      </div>

      <div className="ip-mission-board glitch-hover" onClick={() => onShowTzModal(true)}>
        <div className="ip-mission-title">ТЕХНИЧЕСКОЕ ЗАДАНИЕ (ТЗ)</div>
        <div className="ip-mission-detail">
          <span className="lbl">СЛОЖНОСТЬ:</span>
          <span className="val">{(missionTz.rank || 'junior').toUpperCase()}</span>
        </div>
        <div className="ip-mission-detail">
          <span className="lbl">TARGET:</span>
          <span className="val">{missionTz.name}</span>
        </div>
        <div className="ip-mission-description italic opacity-70">
          {missionTz.description.slice(0, 60)}... [CLICK_DETAILS]
        </div>
      </div>

      <div className="ip-footer-deck">
         <div className="protocol-deck-stack-v3">
            <div className="deck-header-v4">
              <div className="deck-label-mini">MEM_STACK / 0.08</div>
              <span className="deck-help-icon" title="Системная очередь. Запуск стоит 1 цикл.">[?]</span>
            </div>
            <div className="deck-main-info">
              <div className="deck-card-count">{deckCount}</div>
            </div>
            <div className="deck-footer-v4">
              <div className="deck-stack-indicator">
                <div className={`deck-bar ${deckCount > 0 ? 'full' : ''}`}></div>
                <div className={`deck-bar ${deckCount > 5 ? 'full' : ''}`}></div>
                <div className={`deck-bar ${deckCount > 10 ? 'full' : ''}`}></div>
                <div className={`deck-bar ${deckCount > 15 ? 'full' : ''}`}></div>
              </div>
              <div className="deck-version">STABLE_BUILD</div>
            </div>
         </div>
         {!mulliganUsed && currentPhase === 'ARCHITECTURE' && planningTurn === 0 && (
           <button className="sb-btn mulligan-bottom glow-amber" onClick={onMulligan}>
             <RefreshCw size={14} className="spin-hover" /> REDRAW_BUFFER
           </button>
         )}
      </div>
    </aside>
  );
};

export default CombatStatusPanel;

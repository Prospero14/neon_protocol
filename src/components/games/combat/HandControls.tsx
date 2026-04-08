import React from 'react';
import CyberCard from '../../CyberCard';
import type { CombatCard } from '../../../logic/combatCards';
import type { CardSource } from '../../../logic/hooks/useCombatLogic';
import type { CombatPhase } from '../../../logic/combatPhases';
import { Play, Zap, Power, TrendingUp } from 'lucide-react';

interface HandControlsProps {
  currentPhase: CombatPhase;
  filteredHand: { card: CombatCard; source: CardSource; idx: number }[];
  fullHand: CombatCard[];
  selectedCard: { source: CardSource; idx: number } | null;
  isPlayerTurn: boolean;
  cpu: number;
  stress: number;
  canAdvancePhase: boolean;
  getEffectiveCost: (card: CombatCard) => number;
  onCardSelect: (source: CardSource, idx: number) => void;
  onEndTurn: () => void;
  onOverclock: () => void;
  onAdvancePhase: () => void;
  onTerminate: () => void;
  onMulligan: () => void;
  mulliganUsed: boolean;
  isPipelineFull: boolean;
}

const HandControls: React.FC<HandControlsProps> = ({
  currentPhase, filteredHand, fullHand, selectedCard, isPlayerTurn, cpu,
  stress, canAdvancePhase, getEffectiveCost, onCardSelect, onEndTurn, onOverclock, onAdvancePhase, onTerminate, onMulligan, mulliganUsed, isPipelineFull
}) => {
  const auxCount = fullHand.length;
  const isCodePuzzle = currentPhase === 'DEVELOPMENT';
  const isSupply = currentPhase === 'ARCHITECTURE';
  const isStabilize = currentPhase === 'VERIFICATION';

  return (
    <div className="hc2">
      {/* ── TAB BAR ── */}
      <div className="hc2-tabs">
        <span className="hc2-label">
          {isSupply && 'SUPPLY_DRAW'}
          {isCodePuzzle && 'CODE_PUZZLE'}
          {isStabilize && 'STABILIZE_DRAW'}
          {currentPhase === 'DEPLOYMENT' && 'DEPLOY'}
        </span>
        <span className="hc2-phase-tag">[{currentPhase}]</span>
        {!isCodePuzzle && currentPhase !== 'DEPLOYMENT' && (
          <span className="hc2-total-count">STACK: {fullHand.length}</span>
        )}
        {isCodePuzzle && (
          <span className="hc2-total-count mono-text opacity-70" style={{ fontSize: 11 }}>
            палитра + script (без дро с колоды)
          </span>
        )}
        <div className="hc2-spacer" />
        {isCodePuzzle ? (
          <button type="button" className="hc2-tab active code" disabled>
            CODE <span className="hc2-tab-count">{filteredHand.length}</span>
          </button>
        ) : currentPhase === 'DEPLOYMENT' ? null : (
          <button type="button" className="hc2-tab active aux" disabled>
            {isSupply ? 'INFRA' : 'STACK'} <span className="hc2-tab-count">{auxCount}</span>
          </button>
        )}
        {isSupply && !mulliganUsed && (
          <button type="button" className="hc2-mulligan-btn" onClick={onMulligan}>
            RE-DRAW
          </button>
        )}
      </div>

      {/* ── HAND + ACTIONS ── */}
      <div className="hc2-main">
        {/* Cards */}
        <div className="hc2-cards">
          {filteredHand.map((item, i) => {
            const isSelected = selectedCard?.source === item.source && selectedCard.idx === item.idx;
            return (
              <div
                key={item.card.id + i}
                className={`hc2-card-wrap ${isSelected ? 'selected' : ''}`}
              >
                <CyberCard
                  card={item.card}
                  onClick={() => onCardSelect(item.source, item.idx)}
                  disabled={!isPlayerTurn || cpu < getEffectiveCost(item.card)}
                />
                {isSelected && <div className="hc2-selected-indicator">▲ SELECTED</div>}
              </div>
            );
          })}
          {filteredHand.length === 0 && (
            <div className="hc2-empty">
              {isCodePuzzle && 'Нет карт кода в колоде — собери деку в конструкторе'}
              {isSupply && 'Нет INFRA в колоде — добавь железо в деку'}
              {isStabilize && 'Нет реакций/софта в колоде'}
              {currentPhase === 'DEPLOYMENT' && '—'}
            </div>
          )}
        </div>

        <div className="hc2-actions">
          <button
            className={`hc2-action-btn ${canAdvancePhase ? 'green' : 'cyan'}`}
            onClick={() => {
              if (canAdvancePhase) {
                onAdvancePhase();
              } else if (isPipelineFull) {
                if (window.confirm("Все слоты памяти заполнены. Скомпилировать код и завершить процесс досрочно?")) {
                  onAdvancePhase();
                } else {
                  onEndTurn();
                }
              } else {
                onEndTurn();
              }
            }}
            disabled={!isPlayerTurn}
          >
            {canAdvancePhase ? <TrendingUp size={14} /> : <Play size={14} />}
            <span>{canAdvancePhase ? (currentPhase === 'VERIFICATION' ? 'DEPLOY' : 'NEXT') : 'COMPILE'}</span>
          </button>
          <button
            className="hc2-action-btn amber"
            onClick={onOverclock}
            disabled={!isPlayerTurn || stress >= 85}
          >
            <Zap size={13} />
            <span>OC</span>
          </button>
          <button className="hc2-action-btn danger" onClick={onTerminate}>
            <Power size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandControls;

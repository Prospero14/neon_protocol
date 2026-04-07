import React from 'react';
import CyberCard from '../../CyberCard';
import type { CombatCard } from '../../../logic/combatCards';
import type { CardSource } from '../../../logic/hooks/useCombatLogic';
import { Play, Zap, Power, TrendingUp } from 'lucide-react';

interface HandControlsProps {
  currentPhase: string;
  activeHandTab: 'AUX' | 'CODE';
  filteredHand: { card: CombatCard; source: CardSource; idx: number }[];
  fullHand: CombatCard[];
  selectedCard: { source: CardSource; idx: number } | null;
  isPlayerTurn: boolean;
  cpu: number;
  stress: number;
  canAdvancePhase: boolean;
  onTabChange: (tab: 'AUX' | 'CODE') => void;
  onCardSelect: (source: CardSource, idx: number) => void;
  onEndTurn: () => void;
  onOverclock: () => void;
  onAdvancePhase: () => void;
  onTerminate: () => void;
  isPipelineFull: boolean;
}

const HandControls: React.FC<HandControlsProps> = ({
  currentPhase, activeHandTab, filteredHand, fullHand, selectedCard, isPlayerTurn, cpu,
  stress, canAdvancePhase, onTabChange, onCardSelect, onEndTurn, onOverclock, onAdvancePhase, onTerminate, isPipelineFull
}) => {
  const codeCount = fullHand.filter(c => c.type === 'SCRIPT').length;
  const auxCount  = fullHand.filter(c => !['SYNTAX', 'FUNCTION', 'SCRIPT'].includes(c.type)).length;

  return (
    <div className="hc2">
      {/* ── TAB BAR ── */}
      <div className="hc2-tabs">
        <span className="hc2-label">PAYLOAD_BUFFER</span>
        <span className="hc2-phase-tag">[{currentPhase}]</span>
        <div className="hc2-spacer" />
        <button
          className={`hc2-tab ${activeHandTab === 'CODE' ? 'active code' : ''}`}
          onClick={() => onTabChange('CODE')}
        >
          CODE <span className="hc2-tab-count">{codeCount}</span>
        </button>
        <button
          className={`hc2-tab ${activeHandTab === 'AUX' ? 'active aux' : ''}`}
          onClick={() => onTabChange('AUX')}
        >
          AUX <span className="hc2-tab-count">{auxCount}</span>
        </button>
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
                  disabled={!isPlayerTurn || cpu < (item.card.cost ?? 0)}
                />
                {isSelected && <div className="hc2-selected-indicator">▲ SELECTED</div>}
              </div>
            );
          })}
          {filteredHand.length === 0 && (
            <div className="hc2-empty">
              {activeHandTab === 'CODE'
                ? 'NO_SCRIPTS — добавь через драфт после боя'
                : 'NO_AUX_CARDS — реакции доступны через Draft'
              }
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

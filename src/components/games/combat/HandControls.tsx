import React from 'react';
import CyberCard from '../../CyberCard';
import type { CombatCard } from '../../../logic/combatCards';
import type { CardSource } from '../../../logic/hooks/useCombatLogic';

interface HandControlsProps {
  currentPhase: string;
  activeHandTab: 'AUX' | 'CODE';
  filteredHand: { card: CombatCard; source: CardSource; idx: number }[];
  selectedCard: { source: CardSource; idx: number } | null;
  isPlayerTurn: boolean;
  cpu: number;
  onTabChange: (tab: 'AUX' | 'CODE') => void;
  onCardSelect: (source: CardSource, idx: number) => void;
}

const HandControls: React.FC<HandControlsProps> = ({
  currentPhase, activeHandTab, filteredHand, selectedCard, isPlayerTurn, cpu, onTabChange, onCardSelect
}) => {
  return (
    <div className="hud-hand-area">
      <div className="hand-header-row">
        <div className="hand-label">NEURAL_PAYLOAD_BUFFER [PHASE: {currentPhase}]</div>
        <div className="hand-switcher">
          <button 
            className={`tab-btn ${activeHandTab === 'AUX' ? 'active neon-glow' : ''}`}
            onClick={() => onTabChange('AUX')}
          >
            [ AUX_CARDS ]
          </button>
          <button 
            className={`tab-btn ${activeHandTab === 'CODE' ? 'active neon-glow' : ''}`}
            onClick={() => onTabChange('CODE')}
          >
            [ CODE_CARDS ]
          </button>
        </div>
      </div>
      
      <div className="hand-grid-area animate-draw-cards">
        {filteredHand.map((item, i) => {
          const isSelected = selectedCard?.source === item.source && selectedCard.idx === item.idx;
          return (
            <div key={item.card.id + i} className={`hand-card-wrap ${isSelected ? 'selected-scale' : ''}`}>
              <CyberCard 
                card={item.card} 
                onClick={() => onCardSelect(item.source, item.idx)} 
                disabled={!isPlayerTurn || cpu < (item.card.cost ?? 0)}
              />
            </div>
          );
        })}
        {filteredHand.length === 0 && (
          <div className="empty-hand-hint">NO_{activeHandTab}_PLANS_IN_BUFFER</div>
        )}
      </div>
    </div>
  );
};

export default HandControls;

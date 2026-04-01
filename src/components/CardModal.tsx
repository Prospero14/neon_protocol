import React from 'react';
import type { CombatCard } from '../logic/combatCards';
import { JAVA_REFERENCE } from '../logic/referenceData';
import { SPRING_JAVA_REFERENCE } from '../logic/springReferenceData';
import { X, Cpu, Shield, Zap, Info, FileCode } from 'lucide-react';

interface CardModalProps {
  card: CombatCard;
  onClose: () => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
  const ref = JAVA_REFERENCE[card.id] ?? SPRING_JAVA_REFERENCE[card.id];
  const isMid = card.grade === 'Middle';

  return (
    <div className="card-modal-overlay animate-float" onClick={onClose}>
      <div className="card-modal-content neon-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={20}/></button>
        
        <div className="modal-layout">
          <div className="modal-visual-side">
            <div className="modal-art-box">
              {card.pixelArt ? (
                <img src={`/assets/cards/${card.pixelArt}.png`} alt={card.name} />
              ) : (
                <div className="v4-pixel-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>
                   <FileCode size={48} opacity={0.3} />
                </div>
              )}
            </div>
            <div className="modal-stats-grid">
              <div className="grade-badge" style={{ color: isMid ? 'var(--neon-amber)' : 'var(--neon-green)', fontSize: '0.7rem', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>
                RANK: {card.grade.toUpperCase()}
              </div>
              <div className="modal-stat">
                <Zap size={16} color="var(--neon-cyan)" />
                <span>COST: {card.cost} RAM</span>
              </div>
              <div className="modal-stat">
                <Cpu size={16} color="var(--neon-pink)" />
                <span>POWER: {card.power}</span>
              </div>
              <div className="modal-stat">
                <Shield size={16} color="var(--neon-green)" />
                <span>INTEGRITY: {card.integrity}</span>
              </div>
            </div>
          </div>

          <div className="modal-info-side">
            <h2 className="modal-card-name" style={{ color: isMid ? 'var(--neon-amber)' : 'var(--neon-cyan)' }}>{card.name}</h2>
            <div className="modal-type-badge">{card.type} PROT_MODULE</div>
            
            <div className="modal-desc-box">
              <p>{isMid ? `[TECHNICAL_SPEC] ${card.description}` : card.description}</p>
              {card.requires && (
                <div className="req-alert">
                  <Info size={14} />
                  REQUIRES_UPLINK: {card.requires}
                </div>
              )}
            </div>

            {ref && (
              <div className={`modal-java-ref neon-panel ${isMid ? 'mid-style' : ''}`}>
                <h4 className="ref-label">[ {isMid ? 'ENGINEERING_DATA' : 'JAVA_DOCUMENTATION'} ]</h4>
                <div className="ref-concept" style={{ color: isMid ? 'var(--neon-amber)' : 'var(--neon-green)' }}>
                  {ref.title}
                </div>
                
                {!isMid && <p className="ref-explanation" style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '1rem' }}>{ref.explanation}</p>}
                
                <div className="ref-example">
                  <pre>{ref.example}</pre>
                </div>
                
                <div className="ref-purpose" style={{ borderLeft: `2px solid ${isMid ? 'var(--neon-amber)' : 'var(--neon-green)'}`, paddingLeft: '10px' }}>
                  <span style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block' }}>TARGET_UTILITY:</span>
                  {ref.purpose}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;

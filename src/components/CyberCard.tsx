import React from 'react';
import type { CombatCard } from '../logic/combatCards';
import { ExternalLink, Coffee } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CyberCardProps {
  card: CombatCard;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  isSmall?: boolean;
  isInDeck?: boolean;
  onInfoClick?: (e: React.MouseEvent) => void;
  headerAction?: React.ReactNode;
}

function accentFromCard(card: CombatCard): 'vanilla' | 'spring' | 'network' | 'collections' | 'infra' | 'react' | 'soft' {
  const libs = card.libs || [];
  if (libs.includes('spring')) return 'spring';
  if (libs.includes('network')) return 'network';
  if (libs.includes('collections')) return 'collections';

  if (card.type === 'INFRASTRUCTURE') return 'infra';
  if (card.type === 'REACTION' || card.type === 'DEFENSIVE') return 'react';
  if (card.type === 'SOFT') return 'soft';
  
  return 'vanilla';
}

const CyberCard: React.FC<CyberCardProps> = ({ card, onClick, disabled, isSmall, isInDeck, onInfoClick, headerAction }) => {
  const [showInfo, setShowInfo] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);

  const typeClass = card.type?.toLowerCase() || 'unknown';
  const accent = accentFromCard(card);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.left + rect.width + 10 });
    }
  };

  const libsToShow = card.libs || [];
  
  const displayType = React.useMemo(() => {
    switch(card.type) {
      case 'INFRASTRUCTURE': return 'INFRA';
      case 'FUNCTION': return 'FUNC';
      case 'SYNTAX': return 'CODE';
      case 'DEFENSIVE': return 'DEF';
      case 'REACTION': return 'COUNTER';
      default: return card.type;
    }
  }, [card.type]);

  // Tag logic: Prefer First Lib > CODE (if syntax/func) > Core Type
  const primaryTag = libsToShow.length > 0 
    ? libsToShow[0].toUpperCase() 
    : displayType;

  // For Java, we always show the Coffee icon for branding
  const isJava = (card.language || 'java') === 'java';
  const infraImpact = React.useMemo(() => {
    if (card.type !== 'INFRASTRUCTURE') return null;
    const map: Record<string, string> = {
      infra_dns_resolver: '+1 CPU (сразу)',
      infra_lb_nginx: '+1 CPU и +512MB RAM',
      infra_basic_pod: '+1 CPU и +512MB RAM',
      infra_mesh_relay: '+1 CPU и +512MB RAM',
      infra_orbital_uplink: '+1 CPU и +2048MB RAM',
      infra_quarantine_vm: '-8 стресс и +512MB RAM',
      infra_street_fusion: '+2 CPU, но +3 стресс',
      infra_docker: '+512MB RAM',
      infra_old_hw: '+512MB RAM',
      infra_s3_bucket: '+1536MB RAM',
      infra_raid_array: '-20 стресс',
      infra_postgres: '+2 CPU (сразу)',
      infra_edge_cache: 'стабилизация старта, помогает снижать риск перегрева',
      infra_safe_proxy: 'смягчает входящий стресс и держит темп',
    };
    return map[card.id] || '+1 CPU (базовый эффект INFRA)';
  }, [card.id, card.type]);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    handleMouseEnter();
    setShowInfo(!showInfo);
    onClick?.(e);
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={disabled || !onClick ? undefined : 0}
      className={`cyber-v4-card ${typeClass} card-origin-${accent} ${disabled ? 'disabled' : ''} ${isSmall ? 'small' : ''} ${isInDeck ? 'is-in-deck' : ''} ${onClick && !disabled ? 'is-interactive' : ''} animate-float`}
      onClick={handleClick}
      onKeyDown={
        onClick && !disabled
          ? (e) => {
               if (e.key === 'Enter' || e.key === ' ') {
                 e.preventDefault();
                 (e.currentTarget as HTMLDivElement).click();
               }
             }
          : undefined
      }
    >
      <div className="card-glitch-overlay" />
      
      <div 
        className="card-info-wrapper"
        ref={cardRef}
      >
        {headerAction && (
          <div className="card-header-action-slot">
            {headerAction}
          </div>
        )}

        {showInfo && createPortal(
          <div 
            className="card-info-portal"
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <div className="spec-header">
              <h5 className="mono-text">[SPEC_ID: {card.id.slice(0,8).toUpperCase()}]</h5>
              <h2 className="entry-title-v4">{card.name}</h2>
            </div>
            
            <div className="popup-body">
              <p className="spec-desc">{card.description}</p>
              <div className="spec-data-grid">
                <div className="spec-item"><span className="label">TIER</span><span className="val">{card.grade?.toUpperCase()}</span></div>
                <div className="spec-item"><span className="label">COST</span><span className="val">{card.cost} CPU</span></div>
                <div className="spec-item"><span className="label">LIBRARIES</span><span className="val">{libsToShow.join(' · ').toUpperCase() || 'JAVA_CORE'}</span></div>
              </div>
              {infraImpact && (
                <div className="spec-item" style={{ marginTop: 8 }}>
                  <span className="label">IMPACT_IN_BATTLE</span>
                  <span className="val">{infraImpact}</span>
                </div>
              )}
              {(card.description.toLowerCase().includes('перегрев') || card.id === 'infra_edge_cache') && (
                <div className="spec-item" style={{ marginTop: 8 }}>
                  <span className="label">NOTE</span>
                  <span className="val">См. DOCS → GAME_SYSTEMS → OVERHEAT</span>
                </div>
              )}
            </div>

            <div className="popup-footer">
              <span className="popup-type mono-text">{card.type}</span>
              <button className="doc-link-btn" onClick={(e) => { e.stopPropagation(); onInfoClick?.(e); }}>
                INITIALIZE_DOC_LINK <ExternalLink size={12} />
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      <div className="card-v4-origin-row mono-text">
        <div className="card-v4-origin-stack">
          <span className={`card-v4-origin-pill pill-infra`}>{primaryTag}</span>
          {isJava && (
            <span className={`card-v4-origin-pill pill-vanilla icon-only`} title="Java Runtime Context">
              <Coffee size={10} />
            </span>
          )}
        </div>
      </div>

      <div className="card-v4-header">
        <span className="card-v4-cost">{card.cost ?? 0}</span>
        <span className="card-v4-type-tag">{displayType}</span>
      </div>

      <div className="card-v4-pixel-art">
        {card.pixelArt ? (
          <img src={`/assets/cards/${card.pixelArt}.png`} alt={card.name} />
        ) : (
          <div className="v4-pixel-placeholder">
            {isJava ? (
              <Coffee size={40} className="v4-placeholder-icon" />
            ) : (
              <span className="v4-placeholder-id">{`0x${(card.id || '00').slice(0, 2)}`}</span>
            )}
          </div>
        )}
      </div>

      <div className="card-v4-body">
        <h4 className="card-v4-name">{card.name}</h4>
        <p className="card-v4-desc">{card.description}</p>
      </div>

      <div className="card-v4-footer">
        <span className={`card-v4-rarity grade-${card.grade?.toLowerCase() || 'junior'}`}>VER_{card.grade?.toUpperCase() || 'JUNIOR'}</span>
        {card.phaseConstraint && (
          <span className="card-v4-phase-tag">{card.phaseConstraint}</span>
        )}
        {card.power !== undefined && card.power > 0 && <span className="card-v4-power">PWR:{card.power}</span>}
      </div>
    </div>
  );
};

export default CyberCard;

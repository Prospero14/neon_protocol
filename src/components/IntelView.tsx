import React from 'react';
import { FACTIONS } from '../logic/factions';
import { Globe, Info, ChevronLeft, Target } from 'lucide-react';

interface IntelViewProps {
  reputation: Record<string, number>;
  discoveredIntel: Record<string, string[]>;
  onBack: () => void;
}

const IntelView: React.FC<IntelViewProps> = ({ reputation, discoveredIntel, onBack }) => {
  const factionIds = Object.keys(FACTIONS);

  return (
    <div className="intel-view-v4 animate-fade-in">
      <header className="intel-view-header">
        <button className="back-btn-v4" onClick={onBack}>
          <ChevronLeft size={20} /> НАЗАД
        </button>
        <h2 className="neon-text glow-cyan">ИНФОСВОДКА_СЕТИ [INTEL_GRID]</h2>
      </header>

      <div className="intel-content-grid">
        {factionIds.map((id) => {
          const faction = FACTIONS[id];
          const rep = reputation[id] || 0;
          const intel = discoveredIntel[id] || [];
          
          let repStatus = 'НЕЙТРАЛЬНО';
          let repColor = '#fff';
          if (rep >= 20) { repStatus = 'СОЮЗНИК'; repColor = 'var(--neon-green)'; }
          else if (rep <= -20) { repStatus = 'ВРАГ'; repColor = 'var(--neon-red)'; }

          return (
            <div key={id} className="faction-card-v4 neon-panel">
              <div className="faction-card-header">
                <div className="faction-name-box">
                  <Globe size={18} className="faction-icon" />
                  <span className="faction-name mono-text">{faction.name}</span>
                </div>
                <div className="faction-rep-badge mono-text" style={{ color: repColor, borderColor: repColor }}>
                  {repStatus} | {rep}
                </div>
              </div>

              <div className="faction-details">
                <div className="detail-row">
                  <span className="detail-label">СЕКТОР:</span>
                  <span className="detail-val">{faction.sector}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">ДОМЕНЫ:</span>
                  <span className="detail-val">{faction.homeDistrictIds.join(', ').toUpperCase()}</span>
                </div>
              </div>

              <div className="faction-lore-section">
                <p className="faction-desc">{faction.description}</p>
                
                <div className="intel-bits-box">
                  <div className="intel-bits-header mono-text">
                    <Info size={12} /> СОБРАННЫЕ_ДАННЫЕ:
                  </div>
                  {intel.length === 0 ? (
                    <div className="none-text">ДАННЫЕ_ОТСУТСТВУЮТ</div>
                  ) : (
                    <ul className="intel-list">
                      {intel.map((bit, idx) => (
                        <li key={idx} className="intel-item">{bit}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="conflict-box">
                  <div className="conflict-header mono-text">
                    <Target size={12} /> ЦЕЛИ_КОНФЛИКТА:
                  </div>
                  <div className="conflict-list">
                    {faction.enemies.length > 0 ? faction.enemies.map(e => (
                       <span key={e} className="enemy-tag">[{e}]</span>
                    )) : <span className="opacity-50">НЕТ_ПРЯМЫХ_УГРОЗ</span>}
                  </div>
                </div>
              </div>
              
              {/* Penalty Warning */}
              {rep <= -30 && (
                <div className="penalty-alert pulse-red mono-text">
                  [КРИТИЧЕСКИ_НИЗКАЯ_РЕПУТАЦИЯ] Доступ в подконтрольные районы заблокирован!
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .intel-view-v4 { padding: 30px; background: rgba(0,0,0,0.9); min-height: 100vh; color: #fff; }
        .intel-view-header { display: flex; align-items: center; gap: 40px; margin-bottom: 30px; border-bottom: 1px solid rgba(0,255,255,0.2); padding-bottom: 20px; }
        .back-btn-v4 { background: none; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 8px 16px; font-family: 'JetBrains Mono', monospace; cursor: pointer; transition: 0.3s; }
        .back-btn-v4:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 15px var(--neon-cyan); }
        
        .intel-content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .faction-card-v4 { padding: 20px; position: relative; overflow: hidden; background: rgba(10,10,20,0.8); }
        .faction-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .faction-name-box { display: flex; align-items: center; gap: 10px; }
        .faction-name { font-weight: bold; font-size: 1.1rem; color: var(--neon-cyan); letter-spacing: 1px; }
        .faction-rep-badge { font-size: 0.7rem; padding: 4px 8px; border: 1px solid; border-radius: 2px; }
        
        .faction-details { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; font-size: 0.75rem; color: #888; }
        .detail-row { display: flex; justify-content: space-between; }
        .detail-val { color: #ccc; }
        
        .faction-desc { font-size: 0.85rem; color: #eee; line-height: 1.5; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        
        .intel-bits-box { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; margin-bottom: 15px; }
        .intel-bits-header { font-size: 0.65rem; color: var(--neon-amber); margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
        .none-text { font-size: 0.65rem; opacity: 0.3; text-align: center; font-family: monospace; }
        .intel-list { list-style: none; padding: 0; margin: 0; }
        .intel-item { font-size: 0.75rem; color: #aaa; border-left: 2px solid var(--neon-amber); padding-left: 8px; margin-bottom: 6px; }
        
        .conflict-box { margin-bottom: 10px; }
        .conflict-header { font-size: 0.65rem; color: var(--neon-red); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
        .conflict-list { display: flex; flex-wrap: wrap; gap: 5px; }
        .enemy-tag { font-size: 0.6rem; color: var(--neon-red); font-family: monospace; }
        
        .penalty-alert { margin-top: 15px; background: rgba(255,0,0,0.1); border: 1px solid var(--neon-red); color: var(--neon-red); padding: 10px; font-size: 0.7rem; text-align: center; }
        
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default IntelView;

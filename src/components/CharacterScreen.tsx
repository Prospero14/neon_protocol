import React, { useState } from 'react';
import type { Trait } from '../logic/traits';
import { PROFESSIONS } from '../logic/professions';
import type { Profession } from '../logic/professions';
import { User, Shield, Zap, Award, Briefcase, MapPin, Code, ChevronRight, Lock } from 'lucide-react';
import './CharacterScreen.css';

interface CharacterScreenProps {
  player: {
    name: string;
    district: string;
    profession: Profession;
    hp: number;
    bits: number;
    xp: number;
    level: number;
    traits: Trait[];
    classUnlocked?: boolean;
    completedQuestCount?: number;
    reputation?: Record<string, number>;
    maxStress: number;
  };
  questStates: any[];
  allQuests: any[];
  onBack: () => void;
  onLogout: () => void;
}

const CharacterScreen: React.FC<CharacterScreenProps> = ({ player, questStates, allQuests, onBack, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'REPUTATION' | 'CONTRACTS'>('IDENTITY');
  const [showAcademy, setShowAcademy] = useState(false);
  const xpToNext = player.level * 100;
  const xpPercent = (player.xp / xpToNext) * 100;

  const hardProfessions = PROFESSIONS.filter(p => p.category === 'HARD');
  const softProfessions = PROFESSIONS.filter(p => p.category === 'SOFT');

  return (
    <div className="character-v4-view animate-float">
      <header className="char-header neon-panel">
        <div className="char-brand">
          <User size={20} color="var(--neon-cyan)" />
          <h3>NEURAL_IDENTITY [SYS_OVERVIEW]</h3>
        </div>
        <div className="header-actions">
           <button className="back-btn-v4" onClick={onBack}>[ RETURN ]</button>
           <button className="logout-btn-v4" onClick={onLogout}>[ DISCONNECT ]</button>
        </div>
      </header>

      <div className="char-layout">
        {/* LEFT: STATUS & AVATAR */}
        <div className="stats-pane">
          <div className="stats-main-card neon-panel">
            <div className="level-badge">LVL_{player.level}</div>
            <div className="avatar-sim">
              <User size={64} color="var(--neon-cyan)" />
            </div>
            <h2 className="player-id-text">{player.name}</h2>
            <div className="district-tag mono-text">
              <MapPin size={12} /> {player.district.toUpperCase()}_SECTOR
            </div>
            
            <div className="xp-container v42">
              <div className="xp-labels">
                <span>XP_SYNERGY</span>
                <span>{player.xp}/{xpToNext}</span>
              </div>
              <div className="xp-bar-outer">
                <div className="xp-bar-inner" style={{width: `${xpPercent}%`}}></div>
              </div>
            </div>
          </div>

          <div className="stats-grid v42">
            <div className="stat-card neon-panel">
              <Shield size={18} color="var(--neon-cyan)" />
              <div className="stat-info">
                <span className="label">SYSTEM_STRESS</span>
                <span className="val">{Math.round((player.hp / player.maxStress) * 100)}%</span>
              </div>
            </div>
            <div className="stat-card neon-panel">
              <Zap size={18} color="var(--neon-amber)" />
              <div className="stat-info">
                <span className="label">BIT_CREDITS</span>
                <span className="val">{player.bits}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: PROFESSION, ENHANCEMENTS OR REPUTATION */}
        <div className="identity-details">
          <div className="tab-switcher" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
             <button 
               className={`tab-btn-v4 ${activeTab === 'IDENTITY' ? 'active' : ''}`} 
               onClick={() => setActiveTab('IDENTITY')}
             >
               [ IDENTITY_MODULES ]
             </button>
             <button 
               className={`tab-btn-v4 ${activeTab === 'REPUTATION' ? 'active' : ''}`} 
               onClick={() => setActiveTab('REPUTATION')}
             >
               [ REPUTATION_MATRIX ]
             </button>
             <button 
               className={`tab-btn-v4 ${activeTab === 'CONTRACTS' ? 'active' : ''}`} 
               onClick={() => setActiveTab('CONTRACTS')}
             >
               [ CONTRACT_BACKLOG ]
             </button>
          </div>

          {activeTab === 'IDENTITY' ? (
            <>
              {/* PROFESSION CARD */}
              <div className="profession-card neon-panel">
                <div className="pane-header-v42" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <Briefcase size={18} color="var(--neon-cyan)" />
                     <span>PROFESSIONAL_MODULES [ACTIVE]</span>
                  </div>
                  <button className="academy-btn" onClick={() => setShowAcademy(true)}>
                     ACADEMY_ACCESS <ChevronRight size={14} />
                  </button>
                </div>
                <div className="prof-body">
                  <div className="prof-path">
                    <span className="p-label">PATH: </span>
                    <span className="p-val">{player.profession.path === 'None' ? 'INITIALIZING...' : player.profession.path.toUpperCase()}</span>
                    <span className={`cat-tag ${player.profession.category}`}>{player.profession.category}</span>
                  </div>
                  <div className="prof-spec">
                    <Code size={16} />
                    <div className="spec-info">
                      <div className="spec-name">{player.profession.name}</div>
                      {player.profession.specialization && <div className="spec-sub">{player.profession.specialization}</div>}
                    </div>
                    {player.profession.id !== 'trainee' && (
                      <div className="grade-badge-v4">{player.profession.grade.toUpperCase()}</div>
                    )}
                  </div>
                  <p className="prof-desc mono-text">{player.profession.description}</p>
                </div>
              </div>

              {/* TRAITS (INSTALLED MODULES) */}
              <div className="traits-pane-v42 neon-panel">
                <div className="pane-header-v42">
                  <Award size={18} color="var(--neon-pink)" />
                  <span>INSTALLED_ENHANCEMENTS</span>
                </div>
                <div className="traits-scroll-list-v42">
                  {player.traits.map((trait) => (
                    <div key={trait.id} className="trait-row-v42 neon-panel interactive">
                      <div className={`trait-indicator ${trait.type}`}></div>
                      <div className="trait-content">
                        <div className="trait-name-row">
                          <span className="trait-n">{trait.name}</span>
                          <span className="trait-t">[{trait.type.toUpperCase()}]</span>
                        </div>
                        <p className="trait-d">{trait.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : activeTab === 'REPUTATION' ? (
            <div className="reputation-pane neon-panel">
               <div className="pane-header-v42">
                  <Shield size={18} color="var(--neon-amber)" />
                  <span>GLOBAL_FACTION_STANDING</span>
               </div>
               <div className="rep-list">
                  {Object.entries(player.reputation || {}).map(([faction, value]) => {
                    const percent = Math.min(100, Math.max(0, (value + 100) / 2));
                    const status = value > 50 ? 'ALLIED' : value < -50 ? 'HOSTILE' : 'NEUTRAL';
                    const colorMap: Record<string, string> = {
                      'GIGA_BANK': 'var(--neon-amber)',
                      'NEO_KYOTO': 'var(--neon-cyan)',
                      'VOSKHOD_OFFICE': 'var(--neon-magenta)',
                      'EU_SYNTAX': 'var(--neon-amethyst)',
                      'ANARCHO_VOID': 'var(--neon-pink)'
                    };
                    return (
                      <div key={faction} className="rep-item" style={{ marginBottom: '15px' }}>
                        <div className="rep-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                          <span className="rep-name" style={{ color: colorMap[faction] || '#fff', fontWeight: 800 }}>{faction.replace('_', ' ')}</span>
                          <span className={`rep-status ${status}`} style={{ opacity: 0.8 }}>{status} ({value})</span>
                        </div>
                        <div className="rep-bar-wrap" style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div className="rep-bar-fill" style={{ width: `${percent}%`, height: '100%', background: colorMap[faction] || '#fff', boxShadow: `0 0 10px ${colorMap[faction]}` }}></div>
                        </div>
                      </div>
                    );
                  })}
               </div>
               <p className="mono-text" style={{ fontSize: '0.65rem', marginTop: 'auto', opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                 REPUTATION_LOG: Standing is zero-sum for rival factions (MegaCorps vs State vs Anarchists). Your choices matter.
               </p>
            </div>
          ) : (
            <div className="contracts-pane neon-panel">
               <div className="pane-header-v42">
                  <Award size={18} color="var(--neon-cyan)" />
                  <span>CONTRACT_HISTORY_&_BACKLOG</span>
               </div>
               <div className="contracts-list">
                  {questStates.length === 0 && (
                    <div className="no-contracts mono-text opacity-50">NO_ACTIVE_OR_COMPLETED_CONTRACTS_FOUND</div>
                  )}
                  {questStates.map(state => {
                    const quest = allQuests.find(q => q.id === state.questId);
                    if (!quest) return null;
                    return (
                      <div key={state.questId} className={`contract-card ${state.status}`}>
                         <div className="contract-h">
                            <span className="c-title">{quest.title}</span>
                            <span className={`c-status-tag ${state.status}`}>{state.status.toUpperCase()}</span>
                         </div>
                         <p className="c-desc mono-text">{quest.description}</p>
                         <div className="c-meta mono-text">
                            <span>TYPE: {quest.type.toUpperCase()}</span>
                            <span>TIER: {quest.tier}</span>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* NEURAL ACADEMY MODAL (STUB) */}
      {showAcademy && (
        <div className="academy-modal-overlay" onClick={() => setShowAcademy(false)}>
           <div className="academy-modal neon-panel" onClick={e => e.stopPropagation()}>
              <div className="academy-header">
                 <h2 className="neon-text" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>NEURAL_ACADEMY</h2>
                 <p className="mono-text" style={{ fontSize: '0.75rem', color: '#888' }}>
                   Acquire new classes using Bit Credits or Quests. [MVP_MODE: JAVA_ONLY]
                 </p>
              </div>
              
              <div className="academy-grid">
                 {/* HARD SKILLS */}
                 <div className="academy-column">
                    <h4 className="column-title"><Zap size={16} color="var(--neon-cyan)"/> HARD_SKILLS</h4>
                    {hardProfessions.map(prof => (
                       <div key={prof.id} className={`academy-class-card ${prof.isUnlocked ? 'unlocked' : 'locked'} ${player.profession.id === prof.id ? 'equipped' : ''}`}>
                          <div className="acc-head">
                             <span className="acc-name">{prof.name}</span>
                             {!prof.isUnlocked && <Lock size={12} color="var(--neon-pink)" />}
                          </div>
                          <div className="acc-path mono-text">{prof.path} · {prof.grade}</div>
                          {player.profession.id === prof.id && <div className="acc-equipped-tag">ACTIVE</div>}
                       </div>
                    ))}
                 </div>
                 
                 {/* SOFT SKILLS */}
                 <div className="academy-column">
                    <h4 className="column-title"><User size={16} color="var(--neon-amber)"/> SOFT_SKILLS</h4>
                    {softProfessions.map(prof => (
                       <div key={prof.id} className={`academy-class-card ${prof.isUnlocked ? 'unlocked' : 'locked'}`}>
                          <div className="acc-head">
                             <span className="acc-name">{prof.name}</span>
                             <Lock size={12} color="var(--neon-pink)" />
                          </div>
                          <div className="acc-path mono-text">{prof.path} · {prof.grade}</div>
                       </div>
                    ))}
                 </div>
              </div>
              
              <button className="neon-border-btn" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setShowAcademy(false)}>
                 CLOSE_TERMINAL
              </button>
           </div>
           
           <style>{`
             .academy-btn { background: rgba(0,255,255,0.1); border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 4px 10px; font-size: 0.65rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: var(--font-mono); transition: 0.2s; }
             .academy-btn:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 10px var(--neon-cyan-glow); }
             .academy-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
             .academy-modal { width: 100%; max-width: 800px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; padding: 2rem; }
             .academy-header { margin-bottom: 1.5rem; text-align: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; }
             .academy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; overflow-y: auto; padding-right: 10px; }
             .academy-column { display: flex; flex-direction: column; gap: 12px; }
             .column-title { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 0.85rem; letter-spacing: 0.1em; color: #fff; margin-bottom: 8px; opacity: 0.8; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px; }
             .academy-class-card { border: 1px solid var(--glass-border); padding: 12px; border-radius: 6px; background: rgba(0,0,0,0.4); position: relative; overflow: hidden; }
             .academy-class-card.unlocked { border-color: rgba(0,255,255,0.3); }
             .academy-class-card.locked { opacity: 0.5; filter: grayscale(1); border-color: rgba(255,0,100,0.2); }
             .academy-class-card.equipped { border-color: var(--neon-cyan); background: rgba(0,255,255,0.1); box-shadow: inset 0 0 15px rgba(0,255,255,0.1); }
             .acc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
             .acc-name { font-size: 0.85rem; font-weight: bold; color: #fff; font-family: var(--font-mono); }
             .academy-class-card.unlocked .acc-name { color: var(--neon-cyan); }
             .acc-path { font-size: 0.65rem; color: #777; }
             .acc-equipped-tag { position: absolute; top: 0; right: 0; background: var(--neon-cyan); color: #000; font-size: 0.55rem; padding: 2px 6px; font-weight: bold; border-bottom-left-radius: 4px; }
             .grade-badge-v4 { font-size: 0.55rem; border: 1px solid currentColor; padding: 2px 6px; border-radius: 10px; margin-left: auto; align-self: center; font-family: var(--font-mono); font-weight: bold; }
             .cat-tag.HARD { color: var(--neon-cyan); background: rgba(0,255,255,0.1); }
             .cat-tag.SOFT { color: var(--neon-amber); background: rgba(255,191,0,0.1); }

             .tab-btn-v4 {
               background: rgba(153, 102, 204, 0.05);
               border: 1px solid rgba(153, 102, 204, 0.2);
               color: rgba(255,255,255,0.5);
               padding: 8px 12px;
               font-family: var(--font-mono);
               font-size: 0.65rem;
               cursor: pointer;
               transition: 0.3s;
               border-radius: 2px;
             }
             .tab-btn-v4.active {
               background: rgba(153, 102, 204, 0.2);
               border-color: var(--neon-amethyst);
               color: var(--neon-amethyst);
               box-shadow: 0 0 10px rgba(153, 102, 204, 0.2);
             }
             .reputation-pane {
               flex: 1;
               display: flex;
               flex-direction: column;
               padding: 1.5rem;
               overflow: hidden;
             }
             .rep-list {
               margin-top: 15px;
               overflow-y: auto;
             }
             .contracts-pane {
               flex: 1;
               display: flex;
               flex-direction: column;
               padding: 1.5rem;
               overflow: hidden;
             }
             .contracts-list {
               margin-top: 15px;
               overflow-y: auto;
               display: flex;
               flex-direction: column;
               gap: 15px;
             }
             .contract-card {
               background: rgba(0,0,0,0.4);
               border: 1px solid rgba(255,255,255,0.1);
               padding: 15px;
               border-radius: 4px;
               border-left: 3px solid #555;
             }
             .contract-card.active { border-left-color: var(--neon-cyan); background: rgba(0,255,255,0.05); }
             .contract-card.completed { border-left-color: var(--neon-green); opacity: 0.7; }
             .contract-h { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: start; }
             .c-title { font-weight: 800; color: #fff; font-size: 0.9rem; }
             .c-status-tag { font-size: 0.6rem; padding: 2px 6px; border-radius: 2px; background: #333; font-family: var(--font-mono); }
             .c-status-tag.active { background: var(--neon-cyan); color: #000; }
             .c-status-tag.completed { background: var(--neon-green); color: #000; }
             .c-desc { font-size: 0.75rem; color: #ccc; line-height: 1.4; margin-bottom: 10px; }
             .c-meta { display: flex; gap: 15px; font-size: 0.6rem; opacity: 0.5; border-top: 1px solid rgba(255,255,255,0.05); paddingTop: 8px; }
           `}</style>
        </div>
      )}
    </div>
  );
};

export default CharacterScreen;

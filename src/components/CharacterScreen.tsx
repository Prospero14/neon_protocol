import React, { useState } from 'react';
import type { Trait } from '../logic/traits';
import { PROFESSIONS } from '../logic/professions';
import type { Profession } from '../logic/professions';
import { User, Shield, Zap, Award, Briefcase, MapPin, Code, ChevronRight, Lock, Cpu, Microchip } from 'lucide-react';
import { HARDWARE_CATALOG, IMPLANT_CATALOG } from '../logic/hardware';
import './CharacterScreen.css';

interface CharacterScreenProps {
  player: {
    name: string;
    district: string;
    profession: Profession;
    hp: number;
    bits: number;
    solvedTaskCounts: Record<string, number>;
    traits: Trait[];
    classUnlocked?: boolean;
    completedQuestCount?: number;
    reputation?: Record<string, number>;
    maxStress: number;
    deckCores: number;
    deckRamMb: number;
    installedImplants: Array<{ id: string, battlesLeft: number }>;
    maxImplantSlots: number;
  };
  onBack: () => void;
  onLogout: () => void;
  onUpgradeHardware: (cores: number, ram: number) => void;
  onInstallImplant: (id: string) => void;
}

const CharacterScreen: React.FC<CharacterScreenProps> = ({ player, onBack, onLogout, onUpgradeHardware, onInstallImplant }) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'REPUTATION' | 'HARDWARE' | 'IMPLANTS'>('IDENTITY');
  const [showAcademy, setShowAcademy] = useState(false);
  const totalSolved = Object.values(player.solvedTaskCounts).reduce((a, b) => a + b, 0);
  // Calculate a visual "System Prowess" based on tasks (purely aesthetic replacement for level)
  const systemProwess = 1 + Math.floor(totalSolved / 5);

  const hardProfessions = PROFESSIONS.filter(p => p.category === 'HARD');
  const softProfessions = PROFESSIONS.filter(p => p.category === 'SOFT');

  return (
    <div className="character-v4-view animate-float">
      <header className="char-header neon-panel">
        <div className="char-brand">
          <User size={20} color="var(--neon-cyan)" />
          <h3>НЕЙРО-ЛИЧНОСТЬ [ОБЗОР_СИСТЕМЫ]</h3>
        </div>
        <div className="header-actions">
           <button className="back-btn-v4" onClick={onBack}>[ НАЗАД ]</button>
           <button className="logout-btn-v4" onClick={onLogout}>[ ОТКЛЮЧИТЬСЯ ]</button>
        </div>
      </header>

      <div className="char-layout">
        {/* LEFT: STATUS & AVATAR */}
        <div className="stats-pane">
          <div className="stats-main-card neon-panel">
            <div className="level-badge">PROWESS_0{systemProwess}</div>
            <div className="avatar-sim">
              <User size={64} color="var(--neon-cyan)" />
            </div>
            <h2 className="player-id-text">{player.name}</h2>
            <div className="district-tag mono-text">
              <MapPin size={12} /> СЕКТОР_{player.district.toUpperCase()}
            </div>
            
            <div className="xp-container v42">
              <div className="xp-labels">
                <span>SYSTEM_RECOGNITION</span>
                <span className="gold">[{totalSolved}]</span>
              </div>
              <div className="task-summary-grid">
                <div className="ts-item"><span className="ts-lbl">KIDDIE:</span> <span className="ts-val">{player.solvedTaskCounts['script-kiddie']}</span></div>
                <div className="ts-item"><span className="ts-lbl">JUNIOR:</span> <span className="ts-val">{player.solvedTaskCounts['junior']}</span></div>
                <div className="ts-item"><span className="ts-lbl">MIDDLE:</span> <span className="ts-val">{player.solvedTaskCounts['mid']}</span></div>
                <div className="ts-item"><span className="ts-lbl">SENIOR:</span> <span className="ts-val">{player.solvedTaskCounts['senior']}</span></div>
              </div>
            </div>
          </div>

          <div className="stats-grid v42">
            <div className="stat-card neon-panel">
              <Shield size={18} color="var(--neon-cyan)" />
              <div className="stat-info">
                <span className="label">СТРЕСС_СИСТЕМЫ</span>
                <span className="val">{Math.round((player.hp / player.maxStress) * 100)}%</span>
              </div>
            </div>
            <div className="stat-card neon-panel">
              <Zap size={18} color="var(--neon-amber)" />
              <div className="stat-info">
                <span className="label">БИТ-КРЕДИТЫ</span>
                <span className="val">{player.bits}</span>
              </div>
            </div>
            <div className="stat-card neon-panel">
              <Code size={18} color="var(--neon-green)" />
              <div className="stat-info">
                <span className="label">БИБЛИОТЕКИ_ОТКРЫТЫ</span>
                <span className="val">{player.traits.length + 10}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: PROFESSION, ENHANCEMENTS OR REPUTATION */}
        <div className="identity-details">
          <div className="tab-switcher" style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
             <button 
               className={`tab-btn-v4 ${activeTab === 'IDENTITY' ? 'active' : ''}`} 
               onClick={() => setActiveTab('IDENTITY')}
             >
               [ МОДУЛИ_ЛИЧНОСТИ ]
             </button>
             <button 
               className={`tab-btn-v4 ${activeTab === 'REPUTATION' ? 'active' : ''}`} 
               onClick={() => setActiveTab('REPUTATION')}
             >
               [ РЕПУТАЦИЯ ]
             </button>

             <button 
               className={`tab-btn-v4 ${activeTab === 'HARDWARE' ? 'active' : ''}`} 
               onClick={() => setActiveTab('HARDWARE')}
             >
               [ ЖЕЛЕЗО ]
             </button>
             <button 
               className={`tab-btn-v4 ${activeTab === 'IMPLANTS' ? 'active' : ''}`} 
               onClick={() => setActiveTab('IMPLANTS')}
             >
               [ ИМПЛАНТЫ ]
             </button>
          </div>

          {activeTab === 'IDENTITY' ? (
            <>
              {/* PROFESSION CARD */}
              <div className="profession-card neon-panel">
                <div className="pane-header-v42" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <Briefcase size={18} color="var(--neon-cyan)" />
                     <span>ПРОФЕССИОНАЛЬНЫЕ_МОДУЛИ [АКТИВНО]</span>
                  </div>
                  <button className="academy-btn" onClick={() => setShowAcademy(true)}>
                     ДОСТУП_В_АКАДЕМИЮ <ChevronRight size={14} />
                  </button>
                </div>
                <div className="prof-body">
                  <div className="prof-path">
                    <span className="p-label">ПУТЬ: </span>
                    <span className="p-val">{player.profession.path === 'None' ? 'ИНИЦИАЛИЗАЦИЯ...' : player.profession.path.toUpperCase()}</span>
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
                  <span>УСТАНОВЛЕННЫЕ_УЛУЧШЕНИЯ</span>
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
                  <span>ГЛОБАЛЬНЫЙ_СТАТУС_ФРАКЦИЙ [МОНИТОРИНГ_ВЛИЯНИЯ]</span>
               </div>
               <div className="rep-list">
                  {Object.entries(player.reputation || {}).map(([faction, value]) => {
                    const status = value > 50 ? 'ALLIED' : value < -50 ? 'HOSTILE' : 'NEUTRAL';
                    const colorMap: Record<string, string> = {
                      'GIGA_BANK': '#FFD700',       // GOLD
                      'TELECON': '#00FFFF',         // CYAN
                      'KRYLOVO_CORP': '#FF0040',    // RUBY
                      'REGULATORS': '#4682B4',      // STEEL
                      'NULLPOINTERS': '#39FF14',    // NEON_GREEN
                      'RUST_VALLEY': '#D2691E',     // RUST
                      'SILICON_HEDGE': '#8B00FF',   // VIOLET
                      'BIOSYNDICATE': '#CCFF00',    // LIME
                      'REDUNDANTS': '#FF00FF',      // MAGENTA
                      'NET_DRIVERS': '#FFBF00',     // AMBER
                      'CYBERCOMMIS': '#DC143C'      // CRIMSON
                    };
                    const color = colorMap[faction] || '#fff';
                    const posWidth = Math.max(0, value);
                    const negWidth = Math.abs(Math.min(0, value));

                    return (
                      <div key={faction} className="rep-graph-row" style={{ marginBottom: '20px' }}>
                        <div className="rep-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="rep-name" style={{ color, fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.05em' }}>{faction.replace('_', ' ')}</span>
                          <span className={`rep-val-v4 ${status}`} style={{ fontSize: '0.65rem', opacity: 0.8, color: value < 0 ? '#ff4040' : color }}>
                            {status} ({value > 0 ? `+${value}` : value})
                          </span>
                        </div>
                        
                        <div className="graph-container" style={{ position: 'relative', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="center-line" style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.2)', zIndex: 2 }}></div>
                          
                          {/* POSITIVE (RIGHT) */}
                          <div className="bar-fill pos" style={{ 
                            position: 'absolute', 
                            left: '50%', 
                            width: `${posWidth / 2}%`, 
                            height: '100%', 
                            background: `linear-gradient(90deg, ${color}44, ${color})`,
                            boxShadow: `0 0 15px ${color}66`,
                            transition: '0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}></div>
                          
                          {/* NEGATIVE (LEFT) */}
                          <div className="bar-fill neg" style={{ 
                            position: 'absolute', 
                            right: '50%', 
                            width: `${negWidth / 2}%`, 
                            height: '100%', 
                            background: `linear-gradient(-90deg, #ff404044, #ff4040)`,
                            boxShadow: `0 0 15px #ff404066`,
                            transition: '0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}></div>
                          
                          <div className="scanline-overlay" style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            background: 'repeating-linear-gradient(transparent 0px, rgba(0,0,0,0.2) 2px, transparent 4px)',
                            pointerEvents: 'none'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
               </div>
               <p className="mono-text" style={{ fontSize: '0.6rem', marginTop: 'auto', opacity: 0.4, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                 ЛОГ_РЕПУТАЦИИ: [0] НЕЙТРАЛЬНО. [ &lt; 0 ] ВРАЖДЕБНО. [ &gt; 0 ] КИБЕР-СОЮЗ. Выбор сторон определяет доступ к терминалам и цепи квестов.
               </p>
            </div>
          ) : activeTab === 'HARDWARE' ? (
            <div className="hardware-pane neon-panel">
               <div className="pane-header-v42">
                  <Cpu size={18} color="var(--neon-green)" />
                  <span>МОДДИНГ_ДЕКИ [ЖЕЛЕЗО]</span>
               </div>
               <div className="hw-grid">
                  {HARDWARE_CATALOG.map(hw => {
                    const isEquipped = (hw.type === 'CPU' && hw.baseCores === player.deckCores) || (hw.type === 'RAM' && hw.baseRamMb === player.deckRamMb);
                    return (
                      <div key={hw.id} className={`hw-card ${isEquipped ? 'equipped' : ''}`}>
                         <div className="hw-meta">
                            <span className="hw-name">{hw.name}</span>
                            <span className="hw-type">[{hw.type}]</span>
                         </div>
                         <p className="hw-desc mono-text">{hw.description}</p>
                         <div className="hw-actions">
                            <span className="hw-cost">ƀ{hw.cost}</span>
                            {isEquipped ? (
                              <span className="equipped-lbl">УСТАНОВЛЕНО</span>
                            ) : (
                              <button 
                                className="buy-btn" 
                                disabled={player.bits < hw.cost}
                                onClick={() => onUpgradeHardware(hw.baseCores || player.deckCores, hw.baseRamMb || player.deckRamMb)}
                              >
                                КУПИТЬ_И_ПОСТАВИТЬ
                              </button>
                            )}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          ) : (
            <div className="implants-pane neon-panel">
               <div className="pane-header-v42">
                  <Microchip size={18} color="var(--neon-pink)" />
                  <span>УПРАВЛЕНИЕ_ИМПЛАНТАМИ [SLOTS: {player.installedImplants.length}/{player.maxImplantSlots}]</span>
               </div>
               
               <div className="implants-layout">
                  <div className="installed-list">
                     <h4 className="sub-h">АКТИВНЫЕ_МОДУЛИ</h4>
                     {player.installedImplants.length === 0 && <p className="mono-text opacity-50">НЕТ_УСТАНОВЛЕННЫХ_МОДУЛЕЙ</p>}
                     {player.installedImplants.map(imp => {
                       const meta = IMPLANT_CATALOG.find(i => i.id === imp.id);
                       const isAdapting = imp.battlesLeft > 0;
                       return (
                         <div key={imp.id} className={`imp-row ${isAdapting ? 'adapting' : 'synced'}`}>
                            <div className="imp-info">
                               <span className="imp-name">{meta?.name || imp.id}</span>
                               <span className="imp-status">{isAdapting ? `АДАПТАЦИЯ: ${imp.battlesLeft} БОЕВ` : 'СИНХРОНИЗИРОВАНО'}</span>
                            </div>
                            {isAdapting && <div className="adaptation-penalty">+10 STRESS_PENALTY</div>}
                         </div>
                       );
                     })}
                  </div>

                  <div className="available-implants">
                     <h4 className="sub-h">ДОСТУПНЫЕ_К_УСТАНОВКЕ</h4>
                     <div className="imp-market">
                        {IMPLANT_CATALOG.map(imp => {
                          const isInstalled = player.installedImplants.some(i => i.id === imp.id);
                          const canInstall = player.installedImplants.length < player.maxImplantSlots && !isInstalled && player.bits >= imp.cost;
                          return (
                            <div key={imp.id} className="market-item">
                               <div className="m-head">
                                  <span className="m-name">{imp.name}</span>
                                  <span className="m-cost">ƀ{imp.cost}</span>
                               </div>
                               <button 
                                 className="install-btn" 
                                 disabled={!canInstall}
                                 onClick={() => onInstallImplant(imp.id)}
                               >
                                 {isInstalled ? 'УСТАНОВЛЕНО' : 'УСТАНОВИТЬ'}
                               </button>
                            </div>
                          );
                        })}
                     </div>
                  </div>
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
                 <h2 className="neon-text" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>НЕЙРО-АКАДЕМИЯ</h2>
                 <p className="mono-text" style={{ fontSize: '0.75rem', color: '#888' }}>
                   Приобретайте новые классы за Бит-кредиты или через квесты. [MVP_MODE: JAVA_ONLY]
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
/* v0.10: HARDWARE & IMPLANTS */
.hardware-pane, .implants-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}

.hw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
  overflow-y: auto;
}

.hw-card {
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--glass-border);
  padding: 15px;
  border-radius: 6px;
  transition: 0.3s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hw-card.equipped {
  border-color: var(--neon-green);
  background: rgba(0, 255, 100, 0.05);
  box-shadow: inset 0 0 15px rgba(0, 255, 100, 0.05);
}

.hw-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hw-name {
  font-weight: 800;
  font-size: 0.8rem;
  color: #fff;
}

.hw-type {
  font-size: 0.6rem;
  opacity: 0.5;
  font-family: var(--font-mono);
}

.hw-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.hw-cost {
  color: var(--neon-amber);
  font-weight: bold;
  font-family: var(--font-mono);
}

.buy-btn {
  background: var(--neon-cyan);
  color: #000;
  border: none;
  padding: 4px 8px;
  font-size: 0.6rem;
  font-weight: 800;
  cursor: pointer;
  border-radius: 2px;
}

.buy-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.equipped-lbl {
  color: var(--neon-green);
  font-size: 0.6rem;
  font-weight: 800;
}

.implants-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 15px;
  overflow: hidden;
}

.sub-h {
  font-size: 0.7rem;
  opacity: 0.5;
  margin-bottom: 10px;
  letter-spacing: 0.1em;
}

.installed-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.imp-row {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border);
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.imp-row.adapting { border-left: 3px solid var(--neon-amber); }
.imp-row.synced { border-left: 3px solid var(--neon-cyan); }

.imp-info { display: flex; flex-direction: column; gap: 2px; }
.imp-name { font-size: 0.75rem; font-weight: bold; }
.imp-status { font-size: 0.55rem; opacity: 0.6; }

.adaptation-penalty {
  color: var(--neon-pink);
  font-size: 0.55rem;
  font-weight: 800;
}

.imp-market {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0,0,0,0.2);
  padding: 10px;
  border-radius: 4px;
}

.market-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.m-name { font-size: 0.7rem; }
.m-cost { font-size: 0.6rem; color: var(--neon-amber); }

.install-btn {
  background: transparent;
  border: 1px solid var(--neon-pink);
  color: var(--neon-pink);
  font-size: 0.55rem;
  padding: 2px 6px;
  cursor: pointer;
}

.install-btn:disabled { opacity: 0.3; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
           `}</style>
        </div>
      )}
    </div>
  );
};

export default CharacterScreen;

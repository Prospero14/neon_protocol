import React, { useState, useEffect } from 'react';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import type { Trait } from '../logic/traits';
import { TRAITS } from '../logic/traits';

interface CharacterCreationProps {
  onComplete: (data: {
    name: string;
    district: MapNodeData;
    hobby: Trait;
  }) => void;
}

const getDistrictBuffDescription = (id: string): string => {
  switch(id) {
    case 'mitino': return 'Радиорынок: +100 Битов. Любой протокол.';
    case 'sokol': return 'Тех-Хаб: +150 HP. Элита авиации.';
    case 'maryino': return 'Сетка: +30 Битов, +75 HP. Жилой массив.';
    case 'babushkinskaya': return 'Индустрия: +50 XP. Старое ядро.';
    case 'fili': return 'Завод: +1 Ядро. Серверные фермы.';
    case 'taganka': return 'Бункер: Скидка 20% в магазинах. Центр.';
    case 'kitay_gorod': return 'Сеть Фиксеров: +75 Битов. Ликвидность в центре.';
    case 'vdnkh': return 'Санаторий: +150 HP. Продвинутый био-уход.';
    case 'komsomolskaya': return 'Транспортный Хаб: +Циклы (While Loop).';
    case 'oktyabrskoe_pole':
    case 'oktiabrskoe_pole': return 'Милитех Сектор: +1 Ядро (Energy).';
    case 'preobrazhenka':
    case 'preobrazhenskaya_ploshchad': return 'Архивы: +50 XP. Фундаментальные знания.';
    case 'tushino': return 'Полигон: +50 HP, Защитные протоколы.';
    case 'vykhino': return 'Торговая Ветка: +100 Битов. Стартовый капитал.';
    case 'chertanovo': return 'Гетто: Хакинг (+1 Тест) ценой здоровья (-20 HP).';
    case 'south_west': return 'Академия: +50 XP. Доступ к редким Java-библиотекам.';
    case 'teply_stan': return 'Лес: +10 к базовой скрытности. Меньше внимания ИИ.';
    case 'izmailovo': return 'Рынок: +20% к стоимости продаваемого хлама.';
    default: return 'Спальный Сектор: +30 Битов, +20 HP. База.';
  }
};

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState<MapNodeData | null>(null);
  const [hobby, setHobby] = useState<Trait | null>(null);
  const [bootLog, setBootLog] = useState<string[]>([]);

  const districts = MAP_NODES.filter(n => n.tier === 1); 

  useEffect(() => {
    const logs = [
      "SYSTEM_BOOT_SEQUENCE: NEURAL_PROTO_0.07",
      "CHECKING_MOSCOW_SERVER_STATUS... [ONLINE]",
      "DECRYPTING_USER_IDENTITY_STREAMS...",
      "AWAITING_INPUT: NEURAL_ID_REQUIRED"
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setBootLog(prev => [...prev.slice(-3), logs[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    if (step === 1 && name.trim()) setStep(2);
    else if (step === 2 && district) setStep(3);
    else if (step === 3 && hobby && district) {
      onComplete({ 
        name, 
        district: district!, 
        hobby: hobby!
      });
    }
  };

  return (
    <div className="cc-view main-crt">
      <div className="cc-container">
        
        {/* Terminal Header */}
        <div className="cc-terminal-header">
          <div className="cc-term-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <div className="cc-term-title">NEURAL_INITIALIZATION_V0.07</div>
        </div>

        {/* Neural Progress Rail */}
        <div className="cc-progress-rail">
          <div className={`cc-step ${step >= 1 ? 'active' : ''}`}>IDENTITY</div>
          <div className="cc-rail-line"></div>
          <div className={`cc-step ${step >= 2 ? 'active' : ''}`}>DEPLOYMENT</div>
          <div className="cc-rail-line"></div>
          <div className={`cc-step ${step >= 3 ? 'active' : ''}`}>TRAITS</div>
        </div>

        <div className="cc-main-panel">
          
          {/* Boot Logs */}
          <div className="cc-boot-logs">
            <div className="cc-log-header">SESSION_INIT // BYPASS_ENCRYPTION</div>
            {bootLog.map((log, i) => (
              <div key={i} className="cc-log-entry">{log}</div>
            ))}
            <div className="cc-cursor-row">
              <span className="cc-cursor">_</span>
              <span className="cc-status-msg">{step === 3 ? "AWAITING_NEURAL_STAMP" : "READY_FOR_DATA"}</span>
            </div>
          </div>

          <div className="cc-content-wrap">
            {step === 1 && (
              <div className="cc-step-content animate-in">
                <h2 className="cc-headline">INSERT_NEURAL_ID</h2>
                <div className="cc-input-wrap">
                  <span className="cc-prompt">{">"}</span>
                  <input 
                    className="cc-input-field" 
                    type="text" 
                    placeholder="ENTER_NAME_HERE..." 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleNext()}
                    autoFocus
                  />
                  {name.trim() && <div className="cc-enter-hint">PRESS [ENTER] TO CONFIRM</div>}
                </div>
                <p className="cc-hint">Ваш ID будет использован для подписи кода в московских сетях.</p>
              </div>
            )}

            {step === 2 && (
              <div className="cc-step-content animate-in">
                <div className="cc-header-row">
                  <h2 className="cc-headline">SELECT_DEPLOYMENT_ZONE</h2>
                  <span className="cc-sub">GEOGRAPHICAL_ORIGIN</span>
                </div>
                <div className="cc-grid districts">
                  {districts.map(d => (
                    <div 
                      key={d.id} 
                      className={`cc-card district ${district?.id === d.id ? 'selected' : ''}`}
                      onClick={() => setDistrict(d)}
                      onKeyDown={(e) => e.key === 'Enter' && (setDistrict(d), handleNext())}
                      tabIndex={0}
                    >
                      <div className="cc-card-scan"></div>
                      <div className="cc-card-id">ZONE_DB_{districts.indexOf(d) + 1}</div>
                      <div className="cc-card-name">{d.name}</div>
                      <div className="cc-card-effect cyan">{getDistrictBuffDescription(d.id)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="cc-step-content animate-in cc-layout-split">
                <div className="cc-grid hobbies">
                  {TRAITS.filter(t => t.type === 'HOBBY').map(h => (
                    <div 
                      key={h.id} 
                      className={`cc-card hobby cat-${h.category.toLowerCase()} ${hobby?.id === h.id ? 'selected' : ''}`}
                      onClick={() => setHobby(h)}
                      onKeyDown={(e) => e.key === 'Enter' && (setHobby(h), handleNext())}
                      tabIndex={0}
                    >
                      <div className="cc-card-scan"></div>
                      <div className="cc-cat-tag">{h.category}</div>
                      <div className="cc-card-name">{h.name}</div>
                      <div className="cc-card-desc">{h.description}</div>
                      <div className="cc-card-effect glow">ACTIVE_BUFF_LOADED</div>
                    </div>
                  ))}
                </div>
                <div className="cc-side-action">
                   <button 
                     className="cc-action-btn primary vibrant large-vertical" 
                     onClick={handleNext} 
                     disabled={!hobby}
                   >
                     [ FINALIZE_NEURAL_BOOT ]
                   </button>
                   <p className="cc-side-hint">Все параметры будут зашиты в вашу новую кибердеку.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- FIXED NAVIGATION BUTTON (STEPS 1-2) --- */}
        {step < 3 && (
          <div className="cc-footer-action">
            <button 
              className="cc-action-btn primary vibrant" 
              onClick={handleNext} 
              disabled={
                (step === 1 && !name.trim()) ||
                (step === 2 && !district)
              }
            >
              {step === 1 && '[ CONFIRM_IDENTITY_STREAM ]'}
              {step === 2 && '[ INITIATE_GEOGRAPHIC_HANDSHAKE ]'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .cc-view {
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at 50% 50%, #060912 0%, #000 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          color: #e0e0e0;
          font-family: var(--font-mono);
          overflow: hidden;
        }
        .cc-container {
          width: 100%;
          max-width: 1200px;
          height: 90vh;
          background: rgba(4, 8, 15, 0.98);
          border: 1px solid rgba(0, 255, 255, 0.15);
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 100px rgba(0,0,0,0.9), 0 0 30px rgba(0, 255, 255, 0.05);
          position: relative;
        }
        
        .cc-terminal-header {
          background: rgba(0, 255, 255, 0.03);
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
        }
        .cc-term-dots { display: flex; gap: 8px; }
        .cc-term-dots .dot { width: 10px; height: 10px; border-radius: 50%; opacity: 0.8; box-shadow: 0 0 5px currentColor; }
        .dot.red { background: #ff4a4a; color: #ff4a4a; }
        .dot.yellow { background: #ffb800; color: #ffb800; }
        .dot.green { background: #00ff88; color: #00ff88; }
        .cc-term-title { font-size: 0.7rem; color: var(--neon-cyan); letter-spacing: 3px; font-weight: 900; }

        .cc-progress-rail {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(255,255,255,0.01);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .cc-step {
          font-size: 0.75rem;
          color: #2a2d35;
          padding: 10px 25px;
          border: 1px solid transparent;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 3px;
          font-weight: 900;
        }
        .cc-step.active {
          color: var(--neon-cyan);
          border-bottom: 2px solid var(--neon-cyan);
          background: linear-gradient(to top, rgba(0,255,255,0.05), transparent);
          text-shadow: 0 0 15px var(--neon-cyan-glow);
        }
        .cc-rail-line { width: 100px; height: 1px; background: rgba(255,255,255,0.05); }

        .cc-main-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 40px;
          padding-bottom: 40px;
          overflow-y: auto;
        }

        .cc-layout-split {
          display: flex;
          gap: 40px;
          align-items: flex-start;
        }
        .cc-layout-split .hobbies { flex: 1; }
        .cc-side-action {
          width: 300px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: rgba(0,255,255,0.02);
          border: 1px dashed rgba(0,255,255,0.2);
          padding: 30px;
          position: sticky;
          top: 0;
        }
        .cc-side-hint { font-size: 0.7rem; color: #567; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }

        .cc-action-btn.large-vertical {
          padding: 40px 20px;
          min-height: 200px;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transform: rotate(180deg);
        }

        .cc-footer-action {
          position: absolute;
          bottom: 40px;
          right: 40px;
          pointer-events: none; /* Let clicks pass through to empty space if needed, button will override */
          z-index: 100;
        }
        .cc-footer-action .cc-action-btn {
          pointer-events: auto; /* Re-enable clicks for the button */
        }
        
        .cc-boot-logs {
          background: rgba(0,0,0,0.7);
          padding: 20px;
          border-right: 2px solid var(--neon-cyan);
          margin-bottom: 40px;
          height: 140px;
          font-size: 0.7rem;
          color: #00ffaa;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 6px;
          box-shadow: inset 0 0 30px rgba(0, 255, 170, 0.05);
          position: relative;
          overflow: hidden;
          letter-spacing: 1px;
        }
        .cc-boot-logs::after {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
          pointer-events: none;
        }
        .cc-log-header { 
          position: absolute; top: 0; left: 0; padding: 5px 12px; 
          font-size: 0.6rem; background: rgba(0,255,170,0.1); color: #00ffaa; font-weight: 900;
        }
        .cc-hint { font-size: 0.8rem; opacity: 0.7; margin-top: 15px; }
        .cc-hint.yellow { color: #ffcc00; opacity: 1; font-weight: 900; background: rgba(255, 204, 0, 0.1); padding: 10px; border-left: 3px solid #ffcc00; }
        .cc-enter-hint { font-size: 0.65rem; color: var(--neon-cyan); opacity: 0.6; margin-left: auto; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }

        .cc-input-wrap {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(0,255,255,0.02);
          border: 1px solid rgba(0, 255, 255, 0.2);
          padding: 20px 30px;
          transition: 0.3s;
        }
        .cc-input-wrap:focus-within { border-color: var(--neon-cyan); background: rgba(0,255,255,0.05); box-shadow: 0 0 20px rgba(0,255,255,0.1); }
        .cc-input-field {
          background: transparent; border: none; outline: none; color: #fff;
          font-size: 1.8rem; font-family: var(--font-mono); width: 100%; letter-spacing: 5px; font-weight: 900;
        }

        .cc-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
        
        .cc-card {
          padding: 25px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }
        .cc-card-scan {
          position: absolute; top: 0; left: 0; width: 100%; height: 2px;
          background: rgba(0,255,255,0.2); opacity: 0;
          animation: cc-scan-anim 3s infinite linear;
          pointer-events: none;
        }
        @keyframes cc-scan-anim { 0% { top: -10px; } 100% { top: 100%; } }
        .cc-card.selected .cc-card-scan { opacity: 1; }

        .cc-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.2); }
        .cc-card.selected { border-color: var(--neon-cyan); background: rgba(0, 255, 255, 0.05); transform: translateY(-5px); }

        /* TRAIT CATEGORY COLORS */
        .cat-tech.selected { border-color: #00e5ff; box-shadow: inset 0 0 20px rgba(0, 229, 255, 0.1); }
        .cat-soft.selected { border-color: #00ff88; box-shadow: inset 0 0 20px rgba(0, 255, 136, 0.1); }
        .cat-social.selected { border-color: #bd00ff; box-shadow: inset 0 0 20px rgba(189, 0, 255, 0.1); }
        .cat-combat.selected { border-color: #ff5e00; box-shadow: inset 0 0 20px rgba(255, 94, 0, 0.1); }
        .cat-sre.selected { border-color: #0088ff; box-shadow: inset 0 0 20px rgba(0, 136, 255, 0.1); }

        .cc-cat-tag {
          font-size: 0.6rem; font-weight: 900; letter-spacing: 2px; padding: 4px 8px;
          background: rgba(255,255,255,0.05); align-self: flex-start;
          border-radius: 2px; color: #667;
        }
        .cc-card.selected.cat-tech .cc-cat-tag { background: #00e5ff; color: #000; }
        .cc-card.selected.cat-soft .cc-cat-tag { background: #00ff88; color: #000; }
        .cc-card.selected.cat-social .cc-cat-tag { background: #bd00ff; color: #000; }
        .cc-card.selected.cat-combat .cc-cat-tag { background: #ff5e00; color: #000; }
        .cc-card.selected.cat-sre .cc-cat-tag { background: #0088ff; color: #000; }

        .cc-card-name { font-size: 1.3rem; font-weight: 900; color: #fff; letter-spacing: 2px; }
        .cc-card-effect.cyan { color: var(--neon-cyan); font-weight: 900; font-size: 0.7rem; letter-spacing: 1px; }
        .cc-card-effect.glow { font-size: 0.6rem; font-weight: 900; opacity: 0; transition: 0.3s; }
        .cc-card.selected .cc-card-effect.glow { opacity: 0.8; color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan-glow); }

        .cc-action-btn.vibrant {
           background: #00ffff;
           color: #000;
           border: none;
           text-shadow: none;
           font-weight: 1000;
           padding: 22px;
           font-size: 1rem;
           box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
           letter-spacing: 2px;
           cursor: pointer;
           transition: 0.2s;
        }
        .cc-action-btn.vibrant:hover:not(:disabled) {
           background: #fff;
           box-shadow: 0 0 40px rgba(255, 255, 255, 0.6);
           transform: scale(1.02);
        }
        .cc-action-btn.vibrant:disabled {
           background: #1a1a1a;
           color: #444;
           box-shadow: none;
           cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default CharacterCreation;

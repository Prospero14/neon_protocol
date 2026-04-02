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
    case 'altufyevo': return 'NORTH_SILOS: +10% Damage (Buffer Underflow).';
    case 'vykhino': return 'TRADE_BRANCH: +150 Битов. Торговый десант.';
    case 'maryino': return 'GRID_EXHAUST: +80 HP, +1 Энергия. Жилой хаб.';
    case 'chertanovo': return 'GLITCH_GHETTO: +2 Энергии, -20 HP Max. Хаос.';
    case 'south_west': return 'ACADEMIC_UPLINK: +200 XP. Фундаментальный старт.';
    case 'teply_stan': return 'FOREST_EDGE: +20% Dodge. Тень роутера.';
    case 'izmailovo': return 'CRAFT_MARKET: -25% Цена покупки софта.';
    case 'bibirevo': return 'NORTH_LINK: +100 HP. Стабильный коннект.';
    case 'tekstilschiki': return 'TEXTILE_GRID: +1 Карта в руке каждый ход.';
    case 'perovo': return 'DATA_SLUMS: +30% Шанс найти редкую карту.';
    case 'sokol': return 'TECH_HUB: +150 HP, +100 XP. Элита Сокола.';
    case 'vdnkh': return 'PAVILION_ZERO: +1 Энергия, +50 Битов.';
    case 'sokolniki': return 'SERVER_FOREST: +3 Энергии, -30% Integrity.';
    case 'fili': return 'SPACE_RUINS: +150 XP. Орбитальный софт.';
    case 'taganka': return 'THE_BUNKER: -20% Цена всех услуг (Скидки).';
    case 'mitino': return 'RADIO_HEAVEN: +300 Битов. Нелегальный импорт.';
    default: return 'СПАЛЬНЫЙ СЕКТОР: +50 Битов, +50 HP. База.';
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
    <div className="v007-creation-context cc-view main-crt">
      <div className="cc-container">
        
        {/* Navigation Tabs (v0.07 Style) */}
        <div className="cc-nav-tabs">
          <div className={`cc-nav-tab ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>IDENTITY</div>
          <div className={`cc-nav-tab ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>DEPLOYMENT</div>
          <div className={`cc-nav-tab ${step === 3 ? 'active' : ''}`} onClick={() => setStep(3)}>TRAITS</div>
        </div>

        <div className="cc-main-panel">
          
          {/* COLUMN 1: INTEGRATED DATA TERMINAL */}
          <div className="cc-col-logs">
            <div className="cc-boot-logs">
              <div className="cc-log-header">SESSION_BOOT // NEURAL_STACK</div>
              {bootLog.map((log, i) => (
                <div key={i} className="cc-log-entry">{log}</div>
              ))}
            </div>

            <div className="cc-user-summary">
              {name && <div className="summary-item">USER_ID: <span className="amber">{name}</span></div>}
              {district && <div className="summary-item">DEPLOY_ZONE: <span className="amber">{district.name.split(':')[0]}</span></div>}
              {hobby && <div className="summary-item">NEURAL_TRAIT: <span className="amber">{hobby.name}</span></div>}
            </div>

            <div className="cc-cursor-row">
              <span className="cc-status-msg">{step === 3 ? "AWAITING_NEURAL_STAMP" : "READY_FOR_DATA"}</span>
              <span className="cc-cursor">_</span>
            </div>
          </div>

          {/* COLUMN 2: WORKSPACE & ACTION */}
          <div className="cc-col-content">
            <div className="cc-step-content">
              {step === 1 && (
                <div className="animate-in">
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
                <div className="animate-in">
                  <h2 className="cc-headline">SELECT_DEPLOYMENT_ZONE</h2>
                  <div className="cc-grid-wrapper">
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
                          <div className="cc-card-id">ZONE_{d.id.toUpperCase()}</div>
                          <div className="cc-card-name">{d.name.split(':')[0]}</div>
                          <div className="cc-card-effect cyan">{getDistrictBuffDescription(d.id)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in">
                  <h2 className="cc-headline">LOAD_NEURAL_TRAITS</h2>
                  <div className="cc-grid-wrapper">
                    <div className="cc-grid hobbies">
                      {TRAITS.filter(t => t.type === 'HOBBY').map(h => (
                        <div 
                          key={h.id} 
                          className={`cc-card hobby ${hobby?.id === h.id ? 'selected' : ''}`}
                          onClick={() => setHobby(h)}
                          onKeyDown={(e) => e.key === 'Enter' && (setHobby(h), handleNext())}
                          tabIndex={0}
                        >
                          <div className="cc-card-scan"></div>
                          <div className="cc-cat-tag">{h.category}</div>
                          <div className="cc-card-name">{h.name}</div>
                          <div className="cc-card-desc">{h.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION AREA (FOOTER) */}
            <div className="cc-footer-area">
              <div className="cc-side-hint">
                Биометрический поток будет синхронизирован с протоколом v0.07.
              </div>
              <div 
                className={`vertical-confirm-bar ${
                  (step === 1 && name.trim()) || 
                  (step === 2 && district) || 
                  (step === 3 && hobby) ? 'active' : 'disabled'
                }`} 
                onClick={() => handleNext()} 
              >
                {step === 1 ? "[ CONFIRM_IDENTITY ]" : step === 2 ? "[ CONFIRM_DEPLOYMENT ]" : "[ FINALIZE_BOOT ]"}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;

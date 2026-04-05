import React, { useState, useEffect } from 'react';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import type { Trait } from '../logic/traits';
import { TRAITS } from '../logic/traits';
import type { Profession } from '../logic/professions';
import { 
  Zap, 
  Activity, 
  X, 
  Info,
  Database,
  Shuffle,
  Waves,
  Flame,
  Cpu,
  Ghost,
  Gem,
  Signal,
  Layers,
  ShieldCheck,
  History,
  Radio,
  Terminal,
  Target,
  MessageSquare,
  HardDrive,
  GraduationCap,
  Anchor,
  Trees,
  Wind,
  Key
} from 'lucide-react';

interface CharacterCreationProps {
  onComplete: (data: {
    name: string;
    district: MapNodeData;
    hobby: Trait;
    ambition?: Profession;
  }) => void;
  skillMode: string;
  setSkillMode: (mode: 'junior' | 'mid' | 'senior') => void;
  userIp: string;
  faction: string;
}

const getDistrictBuffDescription = (id: string): string => {
  switch(id) {
    case 'altufyevo': return 'SIGNAL_INTEGRITY: SHOP_DISCOUNT: 10% (LOCAL). Старые серверные стойки Алтуфьево обеспечивают стабильность, проверенную временем.';
    case 'vykhino': return 'MARKET_CHANNEL: +30 Bits & +10 Max Stress. Крупнейший транспортный узел. Умение быстро проводить транзакции дает начальный капитал.';
    case 'maryino': return 'NEURAL_INTEGRITY: +10 Max Stress & +256 MiB RAM. Плотный трафик жилых массивов требует расширенного кэша и выносливости.';
    case 'chertanovo': return 'GLITCH_OVERCLOCK: +512 MiB RAM & -15 Max Stress. Хаки чертановских анархистов разгоняют память ценой стабильности системы.';
    case 'south_west': return 'NEURAL_CACHE: +512 MiB RAM & +10 Max Stress. Прямое подключение к нейро-сетям Университета оптимизирует использование адресного пространства.';
    case 'teply_stan': return 'RECURSIVE_TRAILS: Trait [SCRIPTOVICHOK] (20% Stress reduction). Архитектура «Леса» позволяет вашим пакетам мимикрировать под шум Сетки.';
    case 'izmailovo': return 'MOD_MARKET: +20 Bits & +10 Max Stress. Рынок мастеров открывает доступ к редким прошивкам и корпоративным скидкам.';
    case 'bibirevo': return 'SYSTEM_STABILITY: +10 Max Stress. Северный узел связи — эталон надежности и целостности передаваемых данных.';
    case 'tekstilschiki': return 'PATTERN_FLOW: +10 Max Stress [+1 INITIAL CARD]. Оптимизированные каналы связи повышают пропускную способность вашей деки.';
    case 'sokol': return 'TECH_HUB: +10 Max Stress & +20 Bits. Элитный район под защитой корпоративных прокси гарантирует безопасность.';
    case 'perovo': return 'NEURAL_INTEGRITY: +10 Max Stress & +30 Bits. Архивы, скрытые в руинах заводских цехов Перово, хранят историю Москвы.';
    case 'sokolniki': return 'NEURAL_RECOVERY: +10% Stress reduction. Природа встречается с машиной в Сокольниках, создавая идеальный фон для релаксации нейронов.';
    case 'fili': return 'ORBITAL_PING: +256 MiB RAM & +10 Max Stress. Высокоскоростные орбитальные линки Филей обеспечивают мгновенный доступ к кэшированным данным.';
    case 'taganka': return 'SECRET_ACCESS: +40 Bits & +10 Intel. Центр бюрократии и теней. Доступ к закрытым реестрам Таганки дает преимущество в информации.';
    case 'hub': return 'MARKET_ACCESS: +100 Bits & +10 Max Stress. Китай-город — это перекресток всех путей. Здесь начинается любая крупная транзакция.';
    case 'academy': return 'SIGNAL_STABILITY: +10 Max Stress & +40 Bits. Главный кампус Silicon Hedge у станции Академическая. Место, где начинается путь Элиты.';
    default: return 'GENERAL_SECTOR: +20 Bits & +10 Max Stress. Стандартная база для тех, кто не ищет лишних системных рисков.';
  }
};

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete, skillMode, setSkillMode, userIp, faction }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState<MapNodeData | null>(null);
  const [hobby, setHobby] = useState<Trait | null>(null);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [activePopup, setActivePopup] = useState<MapNodeData | Trait | null>(null);

  const districts = MAP_NODES.filter(n => n.tier === 1); 

  useEffect(() => {
    const logs = [
      "SYSTEM_BOOT_SEQUENCE: NEURAL_PROTO_0.09",
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
        
        {/* Navigation Tabs (v0.09 Style) */}
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
                <div className="summary-item">CONNECTION_POINT: <span className="copper">{userIp}</span></div>
                <div className="summary-item">USER_IDENTITY: <span className="copper">{name || '---'}</span></div>
                <div className="summary-item">FACTION_PROTOCOL: <span className="copper">{faction}</span></div>
                <div className="summary-item">DEPLOY_ZONE: <span className="copper">{district?.name?.split(':')[0] || '---'}</span></div>
                <div className="summary-item">ACCESS_LEVEL: <span className="copper">{skillMode.toLocaleUpperCase()}</span></div>
                <div className="summary-item">ACTIVE_TRAIT: <span className="copper">{hobby?.name || '---'}</span></div>
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
                  <div className="cc-label-micro">IDENTITY_BOOT // INITIALIZATION</div>
                  <h2 className="cc-headline">INITIALIZE_NEURAL_IDENTITY</h2>
                  <div className="cc-identity-form">
                    <div className="cc-form-group">
                      <label>ENTER_NEURAL_ID</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="0x00_UNDEFINED"
                        className="cc-input"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      />
                    </div>

                    <div className="cc-form-group">
                      <label>DIFFICULTY_INITIALIZATION</label>
                      <div className="cc-skill-selector">
                        <button 
                          className={`cc-skill-btn ${skillMode === 'junior' ? 'active' : ''}`}
                          onClick={() => setSkillMode('junior')}
                        >
                          JUNIOR
                        </button>
                        <button 
                          className={`cc-skill-btn ${skillMode === 'mid' ? 'active' : ''}`}
                          onClick={() => setSkillMode('mid')}
                        >
                          MIDDLE
                        </button>
                        <button 
                          className={`cc-skill-btn ${skillMode === 'senior' ? 'active' : ''}`}
                          onClick={() => setSkillMode('senior')}
                        >
                          SENIOR
                        </button>
                      </div>
                      <div className="cc-skill-description">
                        {skillMode === 'junior' && "System assistance, detailed logs, and AI hints enabled."}
                        {skillMode === 'mid' && "Standard level. Logs active, instructions reduced."}
                        {skillMode === 'senior' && "Ghost Ops. Raw code and logs only. No safety net."}
                      </div>
                    </div>
                  </div>
                  {name.trim() && <div className="cc-enter-hint">PRESS [ENTER] TO AUTHORIZE</div>}
                  <p className="cc-hint">Ваш ID будет использован для подписи кода в московских сетях.</p>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in">
                  <div className="cc-label-micro">GEOGRAPHIC_INDEX // DEPLOYMENT</div>
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
                          <div className="cc-card-bg-icon">
                            {d.id === 'altufyevo' && <Database size={120} strokeWidth={0.5} />}
                            {d.id === 'vykhino' && <Shuffle size={120} strokeWidth={0.5} />}
                            {d.id === 'maryino' && <Waves size={120} strokeWidth={0.5} />}
                            {d.id === 'chertanovo' && <Flame size={120} strokeWidth={0.5} />}
                            {d.id === 'south_west' && <Cpu size={120} strokeWidth={0.5} />}
                            {d.id === 'teply_stan' && <Ghost size={120} strokeWidth={0.5} />}
                            {d.id === 'izmailovo' && <Gem size={120} strokeWidth={0.5} />}
                            {d.id === 'bibirevo' && <Signal size={120} strokeWidth={0.5} />}
                            {d.id === 'tekstilschiki' && <Layers size={120} strokeWidth={0.5} />}
                            {d.id === 'sokol' && <ShieldCheck size={120} strokeWidth={0.5} />}
                            {d.id === 'vdnkh' && <History size={120} strokeWidth={0.5} />}
                            {d.id === 'mitino' && <Radio size={120} strokeWidth={0.5} />}
                            {d.id === 'perovo' && <HardDrive size={120} strokeWidth={0.5} />}
                            {d.id === 'academy' && <GraduationCap size={120} strokeWidth={0.5} />}
                            {d.id === 'hub' && <Anchor size={120} strokeWidth={0.5} />}
                            {d.id === 'sokolniki' && <Trees size={120} strokeWidth={0.5} />}
                            {d.id === 'fili' && <Wind size={120} strokeWidth={0.5} />}
                            {d.id === 'taganka' && <Key size={120} strokeWidth={0.5} />}
                          </div>
                          <div 
                            className="cc-card-id" 
                            onClick={(e) => { e.stopPropagation(); setActivePopup(d); }}
                          >
                            ZONE_{d.id.toUpperCase()} <Info size={10} style={{ marginLeft: '4px' }} color="var(--neon-amber)" />
                          </div>
                          <div className="cc-card-name">{d.name.split(':')[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in">
                  <div className="cc-label-micro">NEURAL_FINGERPRINT // TRAITS</div>
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
                          <div className="cc-card-bg-icon">
                            {h.category === 'TECH' && <Zap size={120} strokeWidth={0.5} />}
                            {h.category === 'SOFT' && <Terminal size={120} strokeWidth={0.5} />}
                            {h.category === 'SOCIAL' && <MessageSquare size={120} strokeWidth={0.5} />}
                            {h.category === 'SRE' && <Activity size={120} strokeWidth={0.5} />}
                            {h.category === 'COMBAT' && <Target size={120} strokeWidth={0.5} />}
                          </div>
                          <div 
                            className="cc-cat-tag copper"
                            onClick={(e) => { e.stopPropagation(); setActivePopup(h); }}
                          >
                            {h.category} <Info size={10} style={{ marginLeft: '4px' }} color="var(--neon-amber)" />
                          </div>
                          <div className="cc-card-name">{h.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* POPUP MODAL */}
            {activePopup && (
              <div className="cc-popup-overlay" onClick={() => setActivePopup(null)}>
                <div className="cc-popup-content" onClick={(e) => e.stopPropagation()}>
                  <button className="cc-popup-close" onClick={() => setActivePopup(null)}>
                    <X size={20} />
                  </button>
                  <div className="cc-popup-header">
                    <div className="cc-label-micro">SYSTEM_DOCUMENTATION // INFO</div>
                    <h2 className="cc-popup-title">
                      {'category' in activePopup ? activePopup.name : activePopup.name.split(':')[0]}
                    </h2>
                  </div>
                  <div className="cc-popup-body">
                    <div className="cc-popup-icon-large">
                      {'category' in activePopup ? (
                        <>
                          {activePopup.category === 'TECH' && <Zap size={160} strokeWidth={0.25} />}
                          {activePopup.category === 'SOFT' && <Terminal size={160} strokeWidth={0.25} />}
                          {activePopup.category === 'SOCIAL' && <MessageSquare size={160} strokeWidth={0.25} />}
                          {activePopup.category === 'SRE' && <Activity size={160} strokeWidth={0.25} />}
                          {activePopup.category === 'COMBAT' && <Target size={160} strokeWidth={0.25} />}
                        </>
                      ) : (
                        <>
                          {activePopup.id === 'altufyevo' && <Database size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'vykhino' && <Shuffle size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'maryino' && <Waves size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'chertanovo' && <Flame size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'south_west' && <Cpu size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'teply_stan' && <Ghost size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'izmailovo' && <Gem size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'bibirevo' && <Signal size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'tekstilschiki' && <Layers size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'sokol' && <ShieldCheck size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'vdnkh' && <History size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'mitino' && <Radio size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'perovo' && <HardDrive size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'academy' && <GraduationCap size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'hub' && <Anchor size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'sokolniki' && <Trees size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'fili' && <Wind size={160} strokeWidth={0.25} />}
                          {activePopup.id === 'taganka' && <Key size={160} strokeWidth={0.25} />}
                        </>
                      )}
                    </div>
                    <div className="cc-popup-desc">
                      {'category' in activePopup ? (
                        (activePopup as Trait).description
                      ) : (
                        (() => {
                           const desc = getDistrictBuffDescription((activePopup as MapNodeData).id);
                           const parts = desc.split('. ');
                           return (
                             <>
                               <div className="cc-popup-bonus-tag">[{parts[0]}]</div>
                               <div className="cc-popup-lore-text">{parts.slice(1).join('. ')}</div>
                             </>
                           );
                        })()
                      )}
                    </div>
                  </div>
                  <div className="cc-popup-footer">
                    <button className="cc-popup-btn" onClick={() => setActivePopup(null)}>
                      [ACKNOWLEDGE_DATA]
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION AREA (FOOTER) */}
            <div className="cc-footer-area">
              <div className="cc-side-hint">
                Biometric stream will be synchronized with Protocol 0.09.
              </div>
              <div 
                className={`vertical-confirm-bar ${
                  (step === 1 && name.trim()) || 
                  (step === 2 && district) || 
                  (step === 3 && hobby) ? 'active' : 'disabled'
                }`} 
                onClick={() => handleNext()} 
              >
                {step === 1 ? "[AUTHORIZE_IDENTITY]" : step === 2 ? "[CONFIRM_ZONE]" : "[COMMIT_DATA_TRAJECTORY]"}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;

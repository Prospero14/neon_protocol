import React, { useState, useEffect } from 'react';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import type { Trait } from '../logic/traits';
import { TRAITS } from '../logic/traits';
import type { Profession } from '../logic/professions';

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
    case 'altufyevo': return 'СЕВЕРНЫЕ_ХРАНИЛИЩА: +10% урона. Переполнение буфера (Buffer Underflow) в старых узлах Алтуфьево разгоняет ваши атакующие скрипты.';
    case 'vykhino': return 'ТОРГОВАЯ_ВЕТВЬ: +150 Битов. Выхино — крупнейший финансовый перекресток, где репутация GIGA_BANK (+20) открывает любые порты.';
    case 'maryino': return 'ВЫХЛОП_СЕТИ: +80 ед. целостности и +128 МБ ОЗУ. Плотный трафик Марьино защищает ваши данные и расширяет кэш. Репутация VOSKHOD (+20).';
    case 'chertanovo': return 'ГЛИТЧ_ГЕТТО: +256 МБ ОЗУ, но -20 ед. целостности. Анархисты Чертаново (+25) научили вас выжимать максимум из железа ценой стабильности.';
    case 'south_west': return 'АКАДЕМИЧЕСКИЙ_КАНАЛ: +200 опыта. Узлы Юго-Запада связаны с EU_SYNTAX (+25), что дает доступ к продвинутым обучающим протоколам.';
    case 'teply_stan': return 'ОПУШКА_ЛЕСА: +20% к уклонению. Рекурсивные тропы Теплого Стана позволяют вашему коду «растворяться» в Сети. Репутация ANARCHO_VOID (+10).';
    case 'izmailovo': return 'РЫНОК_МАСТЕРОВ: -25% к стоимости ПО. Измайловские хакеры NEO_KYOTO (+20) всегда имеют скидки на модули расширения.';
    case 'bibirevo': return 'СЕВЕРНЫЙ_КАНАЛ: +100 ед. целостности. Стабильный линк и репутация VOSKHOD (+10) делают соединение в Бибирево эталоном надежности.';
    case 'tekstilschiki': return 'ТЕКСТИЛЬНАЯ_СЕТЬ: +1 карта в ход. Оптимизированные каналы VOSKHOD (+25) повышают пропускную способность вашей деки.';
    case 'perovo': return 'ТРУЩОБЫ_ДАННЫХ: +30% шанс на редкие карты. Здесь, под патронажем NEO_KYOTO (+10), можно найти самый редкий софт.';
    case 'sokol': return 'ТЕХНО_ХАБ: +150 ед. целостности и +100 опыта. Элитный район под контролем EU_SYNTAX и VOSKHOD (+15) гарантирует рост и безопасность.';
    case 'vdnkh': return 'ПАВИЛЬОН_НОЛЬ: +128 МБ ОЗУ и +50 Битов. Наследие старой системы ВДНХ предоставляет редкие архитектурные ресурсы.';
    case 'sokolniki': return 'СЕРВЕРНЫЙ_ЛЕС: +384 МБ ОЗУ, но -30% целостности. Глубокое погружение в дебри Сокольников расширяет мозг, но опасно для системы.';
    case 'fili': return 'КОСМИЧЕСКИЕ_РУИНЫ: +150 опыта. Прямая синхронизация с орбитальными остатками в Филях ускоряет вашу эволюцию.';
    case 'taganka': return 'БУНКЕР: -20% к стоимости услуг. Подземные каналы Таганки защищены от налогов и комиссий корпораций.';
    case 'mitino': return 'РАДИОРЫНОК: +300 Битов. Нелегальный импорт Митино — лучший способ быстро наполнить кошелек скрипт-кидди.';
    default: return 'ОБЫЧНЫЙ_СЕКТОР: +50 Битов и +50 ед. целостности. Стандартная база для тех, кто не ищет приключений.';
  }
};

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete, skillMode, setSkillMode, userIp, faction }) => {
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
          <div className={`cc-nav-tab ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>ЛИЧНОСТЬ</div>
          <div className={`cc-nav-tab ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>РАЗВЕРТЫВАНИЕ</div>
          <div className={`cc-nav-tab ${step === 3 ? 'active' : ''}`} onClick={() => setStep(3)}>ОСОБЕННОСТИ</div>
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
                <div className="summary-item">ТОЧКА_ПОДКЛЮЧЕНИЯ: <span className="copper">{userIp}</span></div>
                <div className="summary-item">ID_ПОЛЬЗОВАТЕЛЯ: <span className="copper">{name || '---'}</span></div>
                <div className="summary-item">ПРОТОКОЛ_ФРАКЦИИ: <span className="copper">{faction}</span></div>
                <div className="summary-item">ЗОНА_ВЫСАДКИ: <span className="copper">{district?.name || '---'}</span></div>
                <div className="summary-item">УРОВЕНЬ_ДОСТУПА: <span className="copper">{skillMode.toLocaleUpperCase()}</span></div>
                <div className="summary-item">ОСОБЕННОСТЬ: <span className="copper">{hobby?.name || '---'}</span></div>
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
                  <h2 className="cc-headline">ВВОД_НЕЙРО-ID_ЛИЧНОСТИ</h2>
                  <div className="cc-identity-form">
                    <div className="cc-form-group">
                      <label>ВВОД_НЕЙРО_ID</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ENTER_ID..."
                        className="cc-input"
                        autoFocus
                      />
                    </div>

                    <div className="cc-form-group">
                      <label>ИНИЦИАЛИЗАЦИЯ_СЛОЖНОСТИ</label>
                      <div className="cc-skill-selector">
                        <button 
                          className={`cc-skill-btn ${skillMode === 'junior' ? 'active' : ''}`}
                          onClick={() => setSkillMode('junior')}
                        >
                          НОВИЧОК
                        </button>
                        <button 
                          className={`cc-skill-btn ${skillMode === 'mid' ? 'active' : ''}`}
                          onClick={() => setSkillMode('mid')}
                        >
                          МИДЛ
                        </button>
                        <button 
                          className={`cc-skill-btn ${skillMode === 'senior' ? 'active' : ''}`}
                          onClick={() => setSkillMode('senior')}
                        >
                          СЕНЬОР
                        </button>
                      </div>
                      <div className="cc-skill-description">
                        {skillMode === 'junior' && "Системные подсказки, детальный лог и подсказки AI включены."}
                        {skillMode === 'mid' && "Средний уровень. Лог активен, но детальных инструкций в библиотеке меньше."}
                        {skillMode === 'senior' && "Максимальная сложность. Вы работаете только с сырым кодом и логом."}
                      </div>
                    </div>
                  </div>
                  {name.trim() && <div className="cc-enter-hint">НАЖМИТЕ [ENTER] ДЛЯ ПОДТВЕРЖДЕНИЯ</div>}
                  <p className="cc-hint">Ваш ID будет использован для подписи кода в московских сетях.</p>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in">
                  <h2 className="cc-headline">ВЫБОР_ЗОНЫ_РАЗВЕРТЫВАНИЯ</h2>
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
                          <div className="cc-card-id">ЗОНА_{d.id.toUpperCase()}</div>
                          <div className="cc-card-name">{d.name.split(':')[0]}</div>
                          <div className="cc-card-effect copper">{getDistrictBuffDescription(d.id)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in">
                  <h2 className="cc-headline">ЗАГРУЗКА_НЕЙРО-ОСОБЕННОСТЕЙ</h2>
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
                          <div className="cc-cat-tag copper">{h.category}</div>
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
                {step === 1 ? "[ ПОДТВЕРДИТЬ_ЛИЧНОСТЬ ]" : step === 2 ? "[ ПОДТВЕРДИТЬ_ЗОНУ ]" : "[ ЗАВЕРШИТЬ_ЗАГРУЗКУ ]"}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;

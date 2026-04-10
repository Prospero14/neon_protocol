import React, { useMemo, useState } from 'react';
import type { CardLibTag, CombatCard } from '../logic/combatCards';
import { cardMatchesJavaStack, LIB_TAG_LABELS } from '../logic/cardStack';
import CyberCard from './CyberCard';
import { Database, LayoutGrid, ArrowRight, Shield } from 'lucide-react';
import type { SkillMode } from '../logic/skillMode';
import './DeckBuilder.css';

const LIB_KEYS: CardLibTag[] = ['spring', 'network', 'collections'];

interface DeckBuilderProps {
  skillMode: SkillMode;
  /** Репрезентативный набор владения: по одному экз. на id из коллекции. */
  inventoryUnique: CombatCard[];
  activeDeck: CombatCard[];
  onUpdateDeck: (newDeck: CombatCard[]) => void;
  onViewChange: (v: any, id?: string) => void;
  onBack?: () => void;
  classUnlocked?: boolean;
}

const DeckBuilder: React.FC<DeckBuilderProps> = ({
  skillMode,
  inventoryUnique,
  activeDeck,
  onUpdateDeck,
  onViewChange,
  classUnlocked = false,
}) => {
  const beginner = skillMode === 'junior';
  const [activeTargetDeck, setActiveTargetDeck] = useState<'DEV' | 'AUX'>('DEV');
  const [selectedLanguage, setSelectedLanguage] = useState<'java' | 'script' | null>(null);
  const [includeVanilla, setIncludeVanilla] = useState(true);
  const [enabledLibs, setEnabledLibs] = useState<Set<CardLibTag>>(() => new Set());
  const [enabledCats, setEnabledCats] = useState<Set<string>>(() => new Set());
  const [sortBy, setSortBy] = useState<'name' | 'cost'>('name');

  const toggleLanguage = (lang: 'java' | 'script') => {
    setSelectedLanguage(prev => prev === lang ? null : lang);
  };

  const toggleLib = (lib: CardLibTag) => {
    setEnabledLibs((prev) => {
      const next = new Set(prev);
      if (next.has(lib)) next.delete(lib);
      else next.add(lib);
      return next;
    });
  };

  const toggleCat = (cat: string) => {
    setEnabledCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filteredInventory = useMemo(() => {
    const opts = { includeVanilla, enabledLibs, enabledCats, selectedLanguage };
    let filtered = inventoryUnique;
    
    // Script-Kiddo Gating: Only show entry-level modules until profession is unlocked
    if (!classUnlocked) {
      filtered = filtered.filter(c =>
        c.grade === 'Script-Kiddo' ||
        c.type === 'SCRIPT' ||
        c.type === 'REACTION' ||
        c.type === 'DEFENSIVE' ||
        c.type === 'SOFT' ||
        c.type === 'INFRASTRUCTURE'
      );
    }
    
    filtered = filtered.filter((c) => cardMatchesJavaStack(c, opts));
    
    return [...filtered].sort((a, b) => {
      if (sortBy === 'cost') return a.cost - b.cost;
      return a.name.localeCompare(b.name);
    });
  }, [inventoryUnique, includeVanilla, enabledLibs, enabledCats, sortBy, classUnlocked, selectedLanguage]);

  const devTypes = ['SYNTAX', 'FUNCTION', 'NETWORK', 'SCRIPT'];
  const auxTypes = ['SOFT', 'HARD', 'DEFENSIVE', 'REACTION', 'INFRASTRUCTURE', 'STATUS'];

  const addCard = (card: CombatCard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Validation
    if (activeTargetDeck === 'DEV' && !devTypes.includes(card.type)) {
      // Shoud be handled by UI disabling, but for safety:
      return;
    }
    if (activeTargetDeck === 'AUX' && !auxTypes.includes(card.type)) {
      return;
    }

    const count = activeDeck.filter(c => c.id === card.id).length;
    if (count < 3 && activeDeck.length < 30) {
      onUpdateDeck([...activeDeck, card]);
    }
  };

  const removeCard = (card: CombatCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = activeDeck.lastIndexOf(activeDeck.find(c => c.id === card.id)!);
    if (idx !== -1) {
      const nextDeck = [...activeDeck];
      nextDeck.splice(idx, 1);
      onUpdateDeck(nextDeck);
    }
  };

  const handleCardClick = () => {
    // Info tooltip now handled inside CyberCard
  };

  const filterInactive = !includeVanilla && enabledLibs.size === 0;

  return (
    <div className="deck-v4-view">
      <header className="deck-header neon-panel">
        <div className="deck-brand">
          <Database size={20} color="var(--neon-cyan)" />
          <div>
            <h3>КОНСТРУКТОР_КОЛОДЫ</h3>
            {beginner && (
              <p className="deck-subtitle mono-text">
                Включите «ванильный Java» для чистого языка; отметьте библиотеки — Spring, сеть, Collections — чтобы
                их карты появились в списке. Бой Spring-узла требует Spring в колоде.
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="deck-stack-filters neon-panel">
        <div className="stack-filter-row sh-row">
          <span className="filter-label mono-text">СКРИПТИНГ</span>
          <div className="lib-chips">
            <button 
              type="button" 
              className={`lib-chip lang sh ${selectedLanguage === 'script' ? 'on' : ''}`}
              onClick={() => toggleLanguage('script')}
            >
              SH (Shell)
            </button>
          </div>
        </div>

        <div className="stack-filter-row java-row">
          <span className="filter-label mono-text gold">ЯЗЫК</span>
          <div className="lib-chips">
            <button 
              type="button" 
              className={`lib-chip lang java ${selectedLanguage === 'java' ? 'on' : ''}`}
              onClick={() => toggleLanguage('java')}
            >
              JAVA
            </button>
            {selectedLanguage === 'java' && classUnlocked && (
               <button 
                type="button" 
                className={`lib-chip core mini ${includeVanilla ? 'on' : ''}`} 
                onClick={() => setIncludeVanilla(!includeVanilla)}
              >
                CORE_LIB
              </button>
            )}
          </div>
        </div>

        <div className="stack-filter-row cats-row">
          <span className="filter-label mono-text">КАТЕГОРИИ</span>
          <div className="lib-chips">
            <button 
              key="infra" 
              type="button" 
              className={`lib-chip infra ${enabledCats.has('infra') ? 'on' : ''}`} 
              onClick={() => toggleCat('infra')}
            >
              INFRA
            </button>
            <button 
              key="soft" 
              type="button" 
              className={`lib-chip soft ${enabledCats.has('soft') ? 'on' : ''}`} 
              onClick={() => toggleCat('soft')}
            >
              SOFT-SKILLS
            </button>
            <button 
              key="tests" 
              type="button" 
              className={`lib-chip tests ${enabledCats.has('tests') ? 'on' : ''}`} 
              onClick={() => toggleCat('tests')}
            >
              COUNTER
            </button>
          </div>
        </div>
        
        {selectedLanguage === 'java' && classUnlocked && (
          <div className="stack-filter-row libs-row">
            <span className="filter-label mono-text">БИБЛИОТЕКИ</span>
            <div className="lib-chips">
              {LIB_KEYS.map((lib) => (
                <button
                  key={lib}
                  type="button"
                  className={`lib-chip ${enabledLibs.has(lib) ? 'on' : ''}`}
                  onClick={() => toggleLib(lib)}
                >
                  {LIB_TAG_LABELS[lib]}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="stack-filter-row libs-row">
          <span className="filter-label mono-text">СОРТИРОВКА</span>
          <div className="lib-chips">
            <button 
              type="button" 
              className={`lib-chip ${sortBy === 'name' ? 'on' : ''}`} 
              onClick={() => setSortBy('name')}
            >
              ИМЯ
            </button>
            <button 
              type="button" 
              className={`lib-chip ${sortBy === 'cost' ? 'on' : ''}`} 
              onClick={() => setSortBy('cost')}
            >
              СТОИМОСТЬ
            </button>
          </div>
        </div>
        {filterInactive && (
          <p className="filter-warning mono-text">Включите «ванильный Java» или хотя бы одну библиотеку.</p>
        )}
      </div>
      <style>{`.opacity-50 {
  opacity: 0.5;
}

.deck-stack-filters .lib-chip.lang {
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.75rem;
  padding: 4px 16px;
  min-width: 100px;
}

.deck-stack-filters .sh-row .lib-chip.lang.on {
  border-color: var(--neon-amber);
  background: var(--neon-amber);
  box-shadow: 0 0 15px var(--neon-amber-glow);
}

.deck-stack-filters .mini {
  font-size: 0.6rem;
  padding: 2px 8px;
  margin-left: 10px;
}

.card-slot-v4.locked {
  opacity: 0.4;
  filter: grayscale(0.8) blur(0.5px);
  cursor: not-allowed;
}

.lock-badge {
  font-size: 0.6rem;
  color: var(--neon-pink);
  border: 1px solid var(--neon-pink);
  padding: 2px 4px;
  border-radius: 2px;
}

.deck-switcher {
  display: flex !important;
  gap: 0 !important;
  border-bottom: 1px solid var(--glass-border);
  padding: 0 !important;
}

.deck-tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: 0.3s;
  background: rgba(255,255,255,0.02);
  color: #666;
}

.deck-tab:hover {
  background: rgba(255,255,255,0.05);
  color: #aaa;
}

.deck-tab.active {
  background: rgba(0, 255, 255, 0.1);
  color: var(--neon-cyan);
  box-shadow: inset 0 -2px 0 var(--neon-cyan);
}

.active-deck-pane .pane-header.secondary {
  margin-top: 10px;
  margin-bottom: 5px;
}`}</style>

      <div className="inventory-pane">
        <div className="pane-header">
          <LayoutGrid size={16} />
          <span>ДОСТУПНЫЕ_МОДУЛИ ({filteredInventory.length})</span>
          <div className="pane-hint mono-text">
            {beginner ? 'КЛИК_ДЛЯ_ИНФО · НАВЕДИТЕ_ДЛЯ_ДОБАВЛЕНИЯ' : 'ДОБАВИТЬ_В_СНАРЯЖЕНИЕ'}
          </div>
        </div>

        <div className="inventory-grid-v4">
          {!filterInactive ? (
            filteredInventory.map((card, idx) => {
              const count = activeDeck.filter((c) => c.id === card.id).length;
              const isWrongDeck = (activeTargetDeck === 'DEV' && !devTypes.includes(card.type)) || 
                                 (activeTargetDeck === 'AUX' && !auxTypes.includes(card.type));
              
              return (
                <div
                  key={card.id + idx}
                  className={`card-slot-v4 ${count > 0 ? 'in-deck' : ''} ${isWrongDeck ? 'locked' : ''}`}
                  onClick={() => handleCardClick()}
                >
                  <CyberCard 
                    card={card} 
                    isInDeck={count > 0}
                    onInfoClick={(e) => {
                      e.stopPropagation();
                      onViewChange('REFERENCE', card.id);
                    }}
                    headerAction={
                      <div className="card-v4-deck-controls">
                        {count > 0 && (
                          <button className="card-v4-action-btn remove" onClick={(e) => removeCard(card, e)}>
                            -
                          </button>
                        )}
                        {!isWrongDeck ? (
                          <button 
                            className={`card-v4-action-btn add ${count >= 3 ? 'maxed' : ''}`} 
                            onClick={(e) => addCard(card, e)}
                            disabled={count >= 3}
                          >
                            {count > 0 ? `${count}/3` : 'ДОБАВИТЬ'}
                          </button>
                        ) : (
                          <div className="lock-badge mono-text">WRONG_DECK</div>
                        )}
                      </div>
                    }
                  />
                </div>
              );
            })
          ) : (
            <div className="empty-deck-hint mono-text">ИЗМЕНИТЕ_ФИЛЬТРЫ_ВЫШЕ</div>
          )}
        </div>
      </div>

      <div className="active-deck-pane neon-panel">
        <div className="pane-header deck-switcher">
          <div className={`deck-tab ${activeTargetDeck === 'DEV' ? 'active' : ''}`} onClick={() => setActiveTargetDeck('DEV')}>
            <Database size={14} />
            <span>DEV_DECK</span>
          </div>
          <div className={`deck-tab ${activeTargetDeck === 'AUX' ? 'active' : ''}`} onClick={() => setActiveTargetDeck('AUX')}>
            <Shield size={14} />
            <span>AUX_DECK</span>
          </div>
        </div>
        <div className="pane-header secondary">
          <ArrowRight size={14} />
          <span>СНАРЯЖЕНИЕ ({activeDeck.length}/30)</span>
        </div>
        <div className="active-list">
          {Array.from(new Set(activeDeck.map(c => c.id))).map(id => {
            const card = activeDeck.find(c => c.id === id)!;
            const count = activeDeck.filter(c => c.id === id).length;
            const belongsToCurrent = (activeTargetDeck === 'DEV' && devTypes.includes(card.type)) || 
                                     (activeTargetDeck === 'AUX' && auxTypes.includes(card.type));
            
            if (!belongsToCurrent) return null; // Only show cards belonging to the active tab phase in the side list? 
                                                // Or show all but highlighting? Let's show all and highlight.
            return (
              <div
                key={id}
                className="active-row interactive"
                onClick={() => handleCardClick()}
              >
                <div className="active-row-info">
                  <span className="active-card-name">
                    {card.name} 
                    {count > 1 && <span className="deck-count-badge">x{count}</span>}
                  </span>
                  <span className="active-card-type">{card.type}</span>
                </div>
                <button className="remove-pill" onClick={(e) => removeCard(card, e)}>
                  УДАЛИТЬ
                </button>
              </div>
            );
          })}
          {activeDeck.length === 0 && <div className="empty-deck-hint mono-text">МОДУЛИ_НЕ_ВЫБРАНЫ</div>}
        </div>
      </div>

    </div>
  );
};

export default DeckBuilder;

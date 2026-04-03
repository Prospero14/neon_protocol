import React, { useMemo, useState } from 'react';
import type { CardLibTag, CombatCard } from '../logic/combatCards';
import { cardMatchesJavaStack, LIB_TAG_LABELS } from '../logic/cardStack';
import CyberCard from './CyberCard';
import { Database, LayoutGrid, ArrowRight } from 'lucide-react';
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
  const [includeVanilla, setIncludeVanilla] = useState(true);
  const [enabledLibs, setEnabledLibs] = useState<Set<CardLibTag>>(() => new Set());
  const [enabledCats, setEnabledCats] = useState<Set<string>>(() => new Set());
  const [sortBy, setSortBy] = useState<'name' | 'cost'>('name');

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
    const opts = { includeVanilla, enabledLibs, enabledCats };
    let filtered = inventoryUnique;
    
    // Script-Kiddo Gating: Only show entry-level modules until profession is unlocked
    if (!classUnlocked) {
      filtered = filtered.filter(c => c.grade === 'Script-Kiddo');
    } else {
      filtered = filtered.filter((c) => cardMatchesJavaStack(c, opts));
    }
    
    return [...filtered].sort((a, b) => {
      if (sortBy === 'cost') return a.cost - b.cost;
      return a.name.localeCompare(b.name);
    });
  }, [inventoryUnique, includeVanilla, enabledLibs, enabledCats, sortBy, classUnlocked]);

  const addCard = (card: CombatCard, e: React.MouseEvent) => {
    e.stopPropagation();
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
        <div className="stack-filter-row">
          <span className="filter-label mono-text">ЯЗЫК</span>
          <button type="button" className="filter-chip active" disabled>
            Java
          </button>
          <span className="filter-hint mono-text opacity-50">другие языки — позже</span>
        </div>
        {classUnlocked && (
          <>
            <div className="stack-filter-row libs-row">
              <span className="filter-label mono-text">ОСНОВА_ДВИЖКА</span>
              <div className="lib-chips">
                <button 
                  key="core"
                  type="button" 
                  className={`lib-chip ${includeVanilla ? 'on' : ''}`} 
                  onClick={() => setIncludeVanilla(!includeVanilla)}
                >
                  JAVA_CORE
                </button>
              </div>
            </div>
            <div className="stack-filter-row libs-row">
              <span className="filter-label mono-text">+ БИБЛИОТЕКИ</span>
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
            <div className="stack-filter-row libs-row">
              <span className="filter-label mono-text">+ КАТЕГОРИИ</span>
              <div className="lib-chips">
                <button 
                  key="syntax" 
                  type="button" 
                  className={`lib-chip core ${enabledCats.has('syntax') ? 'on' : ''}`} 
                  onClick={() => toggleCat('syntax')}
                >
                  КОД_И_ЛОГИКА
                </button>
                <button 
                  key="soft" 
                  type="button" 
                  className={`lib-chip soft ${enabledCats.has('soft') ? 'on' : ''}`} 
                  onClick={() => toggleCat('soft')}
                >
                  Гибкие_навыки
                </button>
                <button 
                  key="tests" 
                  type="button" 
                  className={`lib-chip tests ${enabledCats.has('tests') ? 'on' : ''}`} 
                  onClick={() => toggleCat('tests')}
                >
                  Тесты_и_Реакции
                </button>
                <button 
                  key="infra" 
                  type="button" 
                  className={`lib-chip infra ${enabledCats.has('infra') ? 'on' : ''}`} 
                  onClick={() => toggleCat('infra')}
                >
                  Инфраструктура
                </button>
              </div>
            </div>
          </>
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
              return (
                <div
                  key={card.id + idx}
                  className={`card-slot-v4 ${count > 0 ? 'in-deck' : ''}`}
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
                        <button 
                          className={`card-v4-action-btn add ${count >= 3 ? 'maxed' : ''}`} 
                          onClick={(e) => addCard(card, e)}
                          disabled={count >= 3}
                        >
                          {count > 0 ? `${count}/3` : 'ДОБАВИТЬ'}
                        </button>
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
        <div className="pane-header">
          <ArrowRight size={16} />
          <span>АКТИВНОЕ_СНАРЯЖЕНИЕ ({activeDeck.length}/30)</span>
        </div>
        <div className="active-list">
          {Array.from(new Set(activeDeck.map(c => c.id))).map(id => {
            const card = activeDeck.find(c => c.id === id)!;
            const count = activeDeck.filter(c => c.id === id).length;
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

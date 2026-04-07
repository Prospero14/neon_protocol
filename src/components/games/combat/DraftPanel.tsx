import React, { useMemo } from 'react';
import type { CombatCard } from '../../../logic/combatCards';
import { CARD_LIBRARY } from '../../../logic/combatCards';


interface DraftPanelProps {
  /** Ранг победителя — Script-Kiddo получает только Script-Kiddo и REACTION карты */
  skillMode: 'script-kiddie' | 'junior' | 'mid' | 'senior';
  /** Текущая дека (чтобы не предлагать дубли) */
  currentDeck: CombatCard[];
  /** Имя выигранного задания */
  missionName: string;
  /** Биты заработанные за бой */
  bitsEarned: number;
  /** Коллбек с выбранной картой */
  onSelectCard: (card: CombatCard) => void;
  /** Пропустить и не брать карту */
  onSkip: () => void;
}

/** Количество карт предлагаемых на выбор по рангу */
const DRAFT_OFFER_COUNT: Record<string, number> = {
  'script-kiddie': 3,
  junior:          3,
  mid:             4,
  senior:          5
};

/** Допустимые грейды карт для драфта по рангу */
const ALLOWED_GRADES: Record<string, string[]> = {
  'script-kiddie': ['Script-Kiddo'],
  junior:          ['Script-Kiddo', 'Junior'],
  mid:             ['Script-Kiddo', 'Junior', 'Mid'],
  senior:          ['Script-Kiddo', 'Junior', 'Mid', 'Senior']
};

/** Выбирает N случайных уникальных карт для офера */
function getDraftOffer(skillMode: string, currentDeck: CombatCard[]): CombatCard[] {
  const grades = ALLOWED_GRADES[skillMode] ?? ['Script-Kiddo'];
  const currentIds = new Set(currentDeck.map(c => c.id));

  // Script Kiddo может брать REACTION-карты независимо от грейда
  const pool = CARD_LIBRARY.filter((c: CombatCard) => {
    if (currentIds.has(c.id)) return false;
    if (c.type === 'REACTION') return true;  // REACTION всегда доступны
    return grades.includes(c.grade ?? '');
  });

  // Перемешиваем и берём N
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, DRAFT_OFFER_COUNT[skillMode] ?? 3);
}

const TYPE_COLORS: Record<string, string> = {
  SCRIPT:   '#22d3ee',
  REACTION: '#a855f7',
  SOFT:     '#f59e0b',
  STATUS:   '#f87171'
};

const DraftPanel: React.FC<DraftPanelProps> = ({
  skillMode, currentDeck, missionName, bitsEarned, onSelectCard, onSkip
}) => {
  const offer = useMemo(
    () => getDraftOffer(skillMode, currentDeck),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="draft-overlay animate-fade-in">
      <div className="draft-box">
        {/* Header */}
        <div className="draft-header">
          <div className="draft-title glow-cyan">MISSION_COMPLETE: CARD_DRAFT</div>
          <div className="draft-mission font-terminal opacity-70">{missionName}</div>
          <div className="draft-bits">
            <span className="gold">+{bitsEarned} BITS</span>
            <span className="opacity-50 ml-2">EARNED</span>
          </div>
        </div>

        <div className="draft-subtitle font-terminal">
          Выбери одну карту для добавления в деку:
        </div>

        {/* Карты на выбор */}
        <div className="draft-cards-row">
          {offer.length === 0 && (
            <div className="draft-empty font-terminal opacity-50">
              [NO_CARDS_AVAILABLE: Вся библиотека уже в деке]
            </div>
          )}
          {offer.map(card => (
            <button
              key={card.id}
              className="draft-card-slot"
              onClick={() => onSelectCard(card)}
              style={{ borderColor: TYPE_COLORS[card.type] ?? '#444' }}
              id={`draft-card-${card.id}`}
            >
              {/* Тип и грейд */}
              <div className="dc-type-row">
                <span
                  className="dc-type-badge"
                  style={{ background: TYPE_COLORS[card.type] ?? '#333' }}
                >
                  {card.type}
                </span>
                <span className="dc-grade opacity-60">{card.grade ?? '???'}</span>
              </div>

              {/* Имя */}
              <div className="dc-name" style={{ color: TYPE_COLORS[card.type] ?? '#fff' }}>
                {card.name}
              </div>

              {/* Описание */}
              <div className="dc-desc font-terminal opacity-80">
                {card.description}
              </div>

              {/* Стоимость */}
              <div className="dc-cost-row">
                {card.cost != null && card.cost > 0 && (
                  <span className="dc-cost">CPU: {card.cost}</span>
                )}
                {card.power != null && card.power > 0 && (
                  <span className="dc-power">PWR: {card.power}</span>
                )}
                {card.integrity != null && (
                  <span className="dc-integrity">INT: {card.integrity}</span>
                )}
              </div>

              <div className="dc-pick-hint">[ PICK ]</div>
            </button>
          ))}
        </div>

        {/* Пропустить */}
        <button className="draft-skip-btn opacity-50" onClick={onSkip} id="draft-skip-btn">
          [ SKIP — продолжить без карты ]
        </button>
      </div>
    </div>
  );
};

export default DraftPanel;

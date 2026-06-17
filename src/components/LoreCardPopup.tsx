import React from 'react';
import { X } from 'lucide-react';
import type { LoreCardRef } from '../../shared/nri-domain/loreCards';
import { resolveEntityIconHref } from '../../shared/nri-domain/zoneIcons';

type Props = {
  card: LoreCardRef | null;
  onClose: () => void;
};

export const LoreCardPopup: React.FC<Props> = ({ card, onClose }) => {
  if (!card?.title) return null;
  const iconHref = resolveEntityIconHref(card.iconId, null);
  const displayTitle = card.subtitle ?? card.title;
  const summary = card.summary?.trim();
  return (
    <div className="nri-lore-card-popup" role="dialog" aria-modal="true">
      <div className="nri-lore-card-popup__backdrop" onClick={onClose} />
      <div className="nri-lore-card-popup__panel">
        <button type="button" className="nri-lore-card-popup__close" onClick={onClose} aria-label="Закрыть">
          <X size={16} />
        </button>
        {iconHref && <img src={iconHref} alt="" className="nri-lore-card-popup__icon" />}
        <h4 className="mono-text">{displayTitle}</h4>
        {card.subtitle && card.subtitle !== card.title && (
          <p className="mono-text opacity-70">{card.title}</p>
        )}
        <div className="nri-lore-card-popup__body mono-text">
          {summary || 'Краткая сводка пока не заполнена.'}
        </div>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import {
  findLoreCardByTitle,
  loreCardsToHighlightEntities,
  type LoreCardRef,
} from '../../shared/nri-domain/loreCards';
import { loreHighlightTitles, parseLoreMarkup } from '../../shared/nri-domain/loreMarkup';

type Props = {
  text: string;
  cards: LoreCardRef[];
  className?: string;
  onOpenCard?: (card: LoreCardRef) => void;
  onBrokenLink?: (title: string) => void;
};

export const LoreMarkupInteractive: React.FC<Props> = ({
  text,
  cards,
  className,
  onOpenCard,
  onBrokenLink,
}) => {
  const safeCards = Array.isArray(cards) ? cards : [];
  const entities = useMemo(() => loreCardsToHighlightEntities(safeCards), [safeCards]);
  const segments = useMemo(() => {
    try {
      return parseLoreMarkup(text, loreHighlightTitles(entities));
    } catch {
      return [{ text, highlight: false, explicit: false }];
    }
  }, [text, entities]);

  const handleClick = (label: string, explicit: boolean) => {
    try {
      const card = findLoreCardByTitle(safeCards, label);
      if (card && onOpenCard) {
        onOpenCard(card);
        return;
      }
      if (explicit || !card) {
        onBrokenLink?.(label.trim() || '—');
      }
    } catch {
      onBrokenLink?.(label.trim() || '—');
    }
  };

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (!seg.highlight) {
          return <React.Fragment key={`${i}-plain`}>{seg.text}</React.Fragment>;
        }
        const card = findLoreCardByTitle(safeCards, seg.text);
        const canOpen = !!card && !!onOpenCard;
        const isBroken = seg.explicit && !card;
        return (
          <button
            key={`${i}-hl`}
            type="button"
            className={`nri-lore-mark nri-lore-mark--btn${seg.explicit ? ' nri-lore-mark--explicit' : ''}${canOpen ? '' : ' nri-lore-mark--unknown'}${isBroken ? ' nri-lore-mark--broken' : ''}`}
            title={
              canOpen
                ? 'Открыть карточку'
                : isBroken
                  ? 'Карточка не найдена — проверьте название в лоре'
                  : 'Название из лора (карточка не привязана)'
            }
            onClick={() => handleClick(seg.text, seg.explicit)}
          >
            {seg.text}
          </button>
        );
      })}
    </span>
  );
};

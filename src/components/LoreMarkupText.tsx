import React, { useMemo } from 'react';
import { loreHighlightTitles, parseLoreMarkup, type LoreHighlightEntity } from '../../shared/nri-domain/loreMarkup';

type Props = {
  text: string;
  entities: LoreHighlightEntity[];
  className?: string;
};

export const LoreMarkupText: React.FC<Props> = ({ text, entities, className }) => {
  const segments = useMemo(
    () => parseLoreMarkup(text, loreHighlightTitles(entities)),
    [text, entities]
  );
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={`${i}-${seg.text.slice(0, 12)}`}
            className={`nri-lore-mark${seg.explicit ? ' nri-lore-mark--explicit' : ''}`}
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={`${i}-${seg.text.slice(0, 12)}`}>{seg.text}</React.Fragment>
        )
      )}
    </span>
  );
};

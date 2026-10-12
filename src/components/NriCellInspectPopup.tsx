import React, { useEffect, useState } from 'react';
import type { NriMapZone } from '../logic/nriApi/map';
import { PLACE_TYPE_LABELS, normalizePlaceType } from '../../shared/nri-domain/districtGrid';
import { districtTileInspectSprite } from '../../shared/nri-domain/districtTileSprites';

type Props = {
  zone: NriMapZone | null;
  onClose: () => void;
};

const BLURB_PEEK = 120;

/** Dossier-карточка клетки: арт + чипы + краткий текст; полный текст по запросу. */
export const NriCellInspectPopup: React.FC<Props> = ({ zone, onClose }) => {
  const [study, setStudy] = useState(false);
  useEffect(() => {
    setStudy(false);
  }, [zone?.zoneKey]);
  if (!zone) return null;
  const placeType = normalizePlaceType(zone.placeType ?? 'generic');
  const sprite = districtTileInspectSprite(
    placeType,
    zone.zoneKey,
    zone.artId,
    typeof zone.rotation === 'number' ? zone.rotation : 0
  );
  const typeLabel = PLACE_TYPE_LABELS[placeType] ?? placeType;
  const blurb = zone.blurb?.trim() ?? '';
  const pois = Array.isArray(zone.pois) ? zone.pois.filter(Boolean) : [];
  const long = blurb.length > BLURB_PEEK;
  const peekText = !blurb
    ? pois.length
      ? `Места: ${pois.slice(0, 3).join(', ')}${pois.length > 3 ? '…' : ''}`
      : 'Нет описания'
    : study || !long
      ? blurb
      : `${blurb.slice(0, BLURB_PEEK).trim()}…`;

  return (
    <div className="nri-cell-inspect" role="dialog" aria-modal="true" aria-label={zone.name}>
      <div className="nri-cell-inspect__backdrop" onClick={onClose} />
      <div className="nri-cell-inspect__panel">
        <button type="button" className="nri-cell-inspect__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        {sprite ? (
          <img src={sprite} alt="" className="nri-cell-inspect__art" draggable={false} />
        ) : (
          <div className="nri-cell-inspect__art nri-cell-inspect__art--empty mono-text">{typeLabel}</div>
        )}
        <div className="nri-cell-inspect__meta">
          <div className="nri-cell-inspect__chips">
            <span className="nri-cell-inspect__chip">{typeLabel}</span>
            {pois.length > 0 ? (
              <span className="nri-cell-inspect__chip nri-cell-inspect__chip--muted">POI {pois.length}</span>
            ) : null}
          </div>
          <h4 className="nri-cell-inspect__title mono-text">{zone.name}</h4>
          <div className="nri-cell-inspect__body mono-text">{peekText}</div>
          {long ? (
            <button
              type="button"
              className="nri-cell-inspect__more mono-text"
              onClick={() => setStudy((v) => !v)}
            >
              {study ? 'Свернуть' : 'Подробнее'}
            </button>
          ) : null}
          {study && pois.length > 0 && blurb ? (
            <p className="nri-cell-inspect__pois mono-text opacity-70">Места: {pois.join(', ')}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { NriMapZone } from '../logic/nriApi/map';
import { PLACE_TYPE_LABELS, normalizePlaceType } from '../../shared/nri-domain/districtGrid';
import { districtTileInspectSprite } from '../../shared/nri-domain/districtTileSprites';

type Props = {
  zone: NriMapZone | null;
  onClose: () => void;
};

/** Попап клетки: крупный фасад + описание. Закрытие — клик по панели или фону. */
export const NriCellInspectPopup: React.FC<Props> = ({ zone, onClose }) => {
  if (!zone) return null;
  const placeType = normalizePlaceType(zone.placeType ?? 'generic');
  const sprite = districtTileInspectSprite(
    placeType,
    zone.zoneKey,
    zone.artId,
    typeof zone.rotation === 'number' ? zone.rotation : 0
  );
  const typeLabel = PLACE_TYPE_LABELS[placeType] ?? placeType;
  const blurb = zone.blurb?.trim();
  const pois = Array.isArray(zone.pois) ? zone.pois.filter(Boolean) : [];

  return (
    <div className="nri-cell-inspect" role="dialog" aria-modal="true" aria-label={zone.name}>
      <div className="nri-cell-inspect__backdrop" onClick={onClose} />
      <button type="button" className="nri-cell-inspect__panel" onClick={onClose}>
        {sprite ? (
          <img src={sprite} alt="" className="nri-cell-inspect__art" draggable={false} />
        ) : (
          <div className="nri-cell-inspect__art nri-cell-inspect__art--empty mono-text">{typeLabel}</div>
        )}
        <div className="nri-cell-inspect__meta">
          <p className="nri-cell-inspect__kind mono-text opacity-70">{typeLabel}</p>
          <h4 className="nri-cell-inspect__title mono-text">{zone.name}</h4>
          <div className="nri-cell-inspect__body mono-text">
            {blurb ||
              (pois.length
                ? `Места: ${pois.join(', ')}`
                : 'Описание пока пустое. В редакторе мастера можно добавить текст, NPC и предметы.')}
          </div>
          {pois.length > 0 && blurb ? (
            <p className="nri-cell-inspect__pois mono-text opacity-70">Места: {pois.join(', ')}</p>
          ) : null}
          <p className="nri-cell-inspect__hint mono-text opacity-50">Клик — закрыть</p>
        </div>
      </button>
    </div>
  );
};

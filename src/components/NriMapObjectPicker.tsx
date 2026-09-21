/** Модалка выбора объекта карты: постройки, формы районов, тоннели. */

import React, { useMemo, useState } from 'react';
import { PLACE_TYPE_LABELS, PLACE_TYPES, type PlaceType } from '../../shared/nri-domain/districtGrid';
import {
  DISTRICT_SHAPE_PRESETS,
  TUNNEL_SHAPE_PRESETS,
  type CityZoneShapePreset,
} from '../../shared/nri-domain/cityZoneShapePresets';

export type MapPickerSelection =
  | { kind: 'place'; placeType: PlaceType }
  | { kind: 'shape'; preset: CityZoneShapePreset };

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (sel: MapPickerSelection) => void;
  mode?: 'buildings' | 'shapes' | 'all';
  activePlaceType?: PlaceType;
  activeShapeId?: string | null;
};

function matchQuery(label: string, q: string): boolean {
  if (!q) return true;
  return label.toLowerCase().includes(q.toLowerCase());
}

export const NriMapObjectPicker: React.FC<Props> = ({
  open,
  onClose,
  onSelect,
  mode = 'all',
  activePlaceType,
  activeShapeId,
}) => {
  const [q, setQ] = useState('');
  const showBuildings = mode === 'buildings' || mode === 'all';
  const showShapes = mode === 'shapes' || mode === 'all';

  const buildings = useMemo(
    () =>
      PLACE_TYPES.filter((pt) => matchQuery(PLACE_TYPE_LABELS[pt], q)).map((pt) => ({
        id: pt,
        label: PLACE_TYPE_LABELS[pt],
      })),
    [q]
  );

  const districts = useMemo(
    () => DISTRICT_SHAPE_PRESETS.filter((p) => matchQuery(p.label, q)),
    [q]
  );
  const tunnels = useMemo(
    () => TUNNEL_SHAPE_PRESETS.filter((p) => matchQuery(p.label, q)),
    [q]
  );

  if (!open) return null;

  return (
    <div className="nri-map-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="nri-map-picker"
        role="dialog"
        aria-label="Выбор объекта карты"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="nri-map-picker__head">
          <h3 className="nri-map-picker__title">Объект карты</h3>
          <button type="button" className="nri-lobby__close" onClick={onClose}>
            Закрыть
          </button>
        </header>
        <input
          className="nri-map-picker__search mono-text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск…"
          autoFocus
        />
        <div className="nri-map-picker__body">
          {showBuildings && (
            <section>
              <h4 className="nri-map-picker__group">Постройки</h4>
              <div className="nri-map-picker__grid">
                {buildings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`nri-map-picker__item ${activePlaceType === b.id ? 'active' : ''}`}
                    onClick={() => {
                      onSelect({ kind: 'place', placeType: b.id as PlaceType });
                      onClose();
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </section>
          )}
          {showShapes && (
            <>
              <section>
                <h4 className="nri-map-picker__group">Районы / формы</h4>
                <div className="nri-map-picker__grid">
                  {districts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`nri-map-picker__item ${activeShapeId === p.id ? 'active' : ''}`}
                      onClick={() => {
                        onSelect({ kind: 'shape', preset: p });
                        onClose();
                      }}
                    >
                      {p.label}
                      <span className="nri-map-picker__meta">
                        {p.w}×{p.h} · {p.defaultZoneType}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="nri-map-picker__group">Тоннели / трассы</h4>
                <div className="nri-map-picker__grid">
                  {tunnels.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`nri-map-picker__item ${activeShapeId === p.id ? 'active' : ''}`}
                      onClick={() => {
                        onSelect({ kind: 'shape', preset: p });
                        onClose();
                      }}
                    >
                      {p.label}
                      <span className="nri-map-picker__meta">
                        {p.w}×{p.h}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

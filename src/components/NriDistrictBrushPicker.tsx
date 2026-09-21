/** Пикер кистей квартала: секции 1×1 / 2×2 / 3×3 / … + типы тайлов. */

import React, { useMemo, useState } from 'react';
import {
  brushesForSection,
  DISTRICT_BRUSH_SECTIONS,
  type DistrictBrush,
} from '../../shared/nri-domain/districtBrushCatalog';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (brush: DistrictBrush) => void;
  activeBrushId?: string | null;
};

export const NriDistrictBrushPicker: React.FC<Props> = ({
  open,
  onClose,
  onSelect,
  activeBrushId,
}) => {
  const [q, setQ] = useState('');
  const [sectionId, setSectionId] = useState(DISTRICT_BRUSH_SECTIONS[0]!.id);

  const items = useMemo(() => brushesForSection(sectionId, q), [sectionId, q]);

  if (!open) return null;

  return (
    <div className="nri-map-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="nri-map-picker nri-district-brush-picker"
        role="dialog"
        aria-label="Кисти квартала"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="nri-map-picker__head">
          <h3 className="nri-map-picker__title">Кисти квартала</h3>
          <button type="button" className="nri-lobby__close" onClick={onClose}>
            Закрыть
          </button>
        </header>
        <input
          className="nri-map-picker__search mono-text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск: штаб, дорога…"
          autoFocus
        />
        <div className="nri-district-brush-picker__tabs" role="tablist">
          {DISTRICT_BRUSH_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={sectionId === s.id}
              className={`nri-district-brush-picker__tab${sectionId === s.id ? ' active' : ''}`}
              onClick={() => setSectionId(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="nri-map-picker__body">
          <div className="nri-map-picker__grid">
            {items.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`nri-map-picker__item${activeBrushId === b.id ? ' active' : ''}`}
                onClick={() => {
                  onSelect(b);
                  onClose();
                }}
              >
                {b.label}
              </button>
            ))}
            {items.length === 0 && (
              <p className="mono-text opacity-60" style={{ margin: 0, gridColumn: '1 / -1' }}>
                Ничего не найдено
              </p>
            )}
          </div>
        </div>
        <p className="nri-district-brush-picker__hint mono-text">
          «Выделение» — клик выбирает клетку, колесо крутит её. Остальные кисти ставят объекты. «Лого …»
          — по размеру. Колесо на карте: 2×1↔1×2 / уголки или поворот спрайта.
        </p>
      </div>
    </div>
  );
};

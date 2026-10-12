/** Пикер кистей квартала: footprint-форма + тип объекта. Mega = один блок на N клеток. */

import React, { useMemo, useState } from 'react';
import {
  brushesForSection,
  DISTRICT_BRUSH_SECTIONS,
  type DistrictBrush,
  type DistrictBrushShape,
} from '../../shared/nri-domain/districtBrushCatalog';
import { shapeCellOffsets, shapeDims } from '../../shared/nri-domain/districtMegaMerge';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (brush: DistrictBrush) => void;
  activeBrushId?: string | null;
};

function ShapeGlyph({ shape }: { shape: DistrictBrushShape }) {
  const dims = shape === '1x1' ? { rows: 1, cols: 1 } : shapeDims(shape as Parameters<typeof shapeDims>[0]);
  const offsets =
    shape === '1x1' ? ([[0, 0]] as const) : shapeCellOffsets(shape as Parameters<typeof shapeCellOffsets>[0]);
  const cell = 6;
  const gap = 1;
  const w = dims.cols * cell + (dims.cols - 1) * gap;
  const h = dims.rows * cell + (dims.rows - 1) * gap;
  const occupied = new Set(offsets.map(([r, c]) => `${r},${c}`));
  return (
    <svg
      className="nri-district-brush-picker__glyph"
      width={Math.max(w, 12)}
      height={Math.max(h, 12)}
      viewBox={`0 0 ${Math.max(w, 12)} ${Math.max(h, 12)}`}
      aria-hidden
    >
      {Array.from({ length: dims.rows }, (_, r) =>
        Array.from({ length: dims.cols }, (_, c) => {
          const on = occupied.has(`${r},${c}`);
          return (
            <rect
              key={`${r}-${c}`}
              x={c * (cell + gap)}
              y={r * (cell + gap)}
              width={cell}
              height={cell}
              rx={0.8}
              fill={on ? 'rgba(180,120,255,0.85)' : 'rgba(255,255,255,0.06)'}
              stroke={on ? 'rgba(200,160,255,0.9)' : 'rgba(255,255,255,0.12)'}
              strokeWidth={0.5}
            />
          );
        })
      )}
    </svg>
  );
}

export const NriDistrictBrushPicker: React.FC<Props> = ({
  open,
  onClose,
  onSelect,
  activeBrushId,
}) => {
  const [q, setQ] = useState('');
  const [sectionId, setSectionId] = useState('2x2');

  const items = useMemo(() => brushesForSection(sectionId, q), [sectionId, q]);
  const section = DISTRICT_BRUSH_SECTIONS.find((s) => s.id === sectionId);

  if (!open) return null;

  return (
    <div className="nri-map-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="nri-map-picker nri-district-brush-picker"
        role="dialog"
        aria-label="Заполнение клеток квартала"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="nri-map-picker__head">
          <h3 className="nri-map-picker__title">Заполнение клеток</h3>
          <button type="button" className="nri-lobby__close" onClick={onClose}>
            Закрыть
          </button>
        </header>
        <p className="nri-district-brush-picker__lead mono-text">
          Выберите размер footprint, затем объект. Mega (2×1…4×4) ставится <strong>одним блоком</strong> —
          клетки не дробятся на отдельные домики.
        </p>
        <input
          className="nri-map-picker__search mono-text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск: трущобы, рынок, штаб, свалка…"
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
          <div className="nri-map-picker__grid nri-district-brush-picker__grid">
            {items.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`nri-map-picker__item nri-district-brush-picker__item${
                  activeBrushId === b.id ? ' active' : ''
                }`}
                onClick={() => {
                  onSelect(b);
                  onClose();
                }}
              >
                <ShapeGlyph shape={b.shape} />
                <span className="nri-district-brush-picker__item-label">{b.label}</span>
              </button>
            ))}
            {items.length === 0 && (
              <p className="mono-text opacity-60" style={{ margin: 0, gridColumn: '1 / -1' }}>
                Ничего не найдено
                {section?.mode === 'tile' && sectionId !== '1x1'
                  ? ' — в этом размере доступны типы с mega-merge (shack, market, corp…)'
                  : ''}
              </p>
            )}
          </div>
        </div>
        <p className="nri-district-brush-picker__hint mono-text">
          Клик на карте ставит объект от клетки-якоря. Колесо: 2×1↔1×2, 3×1↔1×3, 3×2↔2×3 / уголки.
          «Выделение» — выбрать клетку без постановки.
        </p>
      </div>
    </div>
  );
};

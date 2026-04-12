import React, { useState, useEffect } from 'react';
import { Clock, Sun, Sunset, Moon, MapPinned, Layers, X } from 'lucide-react';
import type { GameClockSnapshot } from '../../logic/gameClock';
import type { MapNodeData } from '../../logic/mapData';

export type PoiTypeFilter = 'all' | 'npc' | 'bar' | 'combat' | 'shop' | 'terminal' | 'story';

const DISTRICT_FILTERS: { id: PoiTypeFilter; label: string }[] = [
  { id: 'all', label: 'ВСЕ' },
  { id: 'npc', label: 'NPC' },
  { id: 'bar', label: 'БАР' },
  { id: 'combat', label: 'БОЙ' },
  { id: 'shop', label: 'ЛАВКА' },
  { id: 'terminal', label: 'ТЕРМ' },
  { id: 'story', label: 'ЛОР' },
];

const CITY_FILTERS: { id: 'all' | 'hub' | 'trade' | 'combat' | 'bar'; label: string }[] = [
  { id: 'all', label: 'ВСЕ' },
  { id: 'hub', label: 'ХАБ' },
  { id: 'trade', label: 'ТОРГ' },
  { id: 'combat', label: 'БОЙ' },
  { id: 'bar', label: 'БАР' },
];

const LEGEND = [
  { color: 'var(--neon-amethyst)', label: 'NPC / лор' },
  { color: 'var(--neon-pink)', label: 'Бой' },
  { color: 'var(--neon-amber)', label: 'Бар / лавка' },
  { color: 'var(--neon-cyan)', label: 'Хаб' },
];

function PhaseIcon({ phase }: { phase: GameClockSnapshot['phase'] }) {
  switch (phase) {
    case 'morning':
      return <Sun size={18} className="map-rail-phase-icon" />;
    case 'day':
      return <Sun size={18} className="map-rail-phase-icon map-rail-phase-icon--day" />;
    case 'evening':
      return <Sunset size={18} className="map-rail-phase-icon map-rail-phase-icon--eve" />;
    default:
      return <Moon size={18} className="map-rail-phase-icon map-rail-phase-icon--night" />;
  }
}

interface MapRadarRailProps {
  gameClock: GameClockSnapshot | null;
  viewMode: 'CITY' | 'DISTRICT';
  districtTitle: string;
  poiFilter: PoiTypeFilter;
  onPoiFilter: (f: PoiTypeFilter) => void;
  cityFilter: 'all' | 'hub' | 'trade' | 'combat' | 'bar';
  onCityFilter: (f: 'all' | 'hub' | 'trade' | 'combat' | 'bar') => void;
  districtRows: Array<{ id: string; name: string; type: string; description?: string }>;
  cityRows: MapNodeData[];
  selectedSubNodeId: string | null;
  selectedCityNodeId: string | null;
  onPickSubNode: (id: string) => void;
  onPickCityNode: (node: MapNodeData) => void;
  objectiveNodeId?: string | null;
  listRef: React.RefObject<HTMLDivElement | null>;
}

const MapRadarRail: React.FC<MapRadarRailProps> = ({
  gameClock,
  viewMode,
  districtTitle,
  poiFilter,
  onPoiFilter,
  cityFilter,
  onCityFilter,
  districtRows,
  cityRows,
  selectedSubNodeId,
  selectedCityNodeId,
  onPickSubNode,
  onPickCityNode,
  objectiveNodeId,
  listRef,
}) => {
  const [clockHintOpen, setClockHintOpen] = useState(false);

  useEffect(() => {
    if (!clockHintOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClockHintOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clockHintOpen]);

  const rows = viewMode === 'DISTRICT' ? districtRows : cityRows.map((n) => ({ id: n.id, name: n.name, type: n.type, description: n.description }));

  return (
    <section className="map-radar-rail" aria-label="Реестр точек и время">
      <div className="map-rail-head">
        <div className="map-rail-brand">
          <Layers size={16} className="map-rail-brand-icon" />
          <span className="map-rail-brand-txt">РЕЕСТР_УЗЛОВ</span>
        </div>
        {gameClock && (
          <button
            type="button"
            className={`map-rail-clock map-rail-clock--btn map-rail-clock--${gameClock.phase}`}
            onClick={() => setClockHintOpen(true)}
            aria-label="Игровое время. Подробнее о масштабе времени"
          >
            <div className="map-rail-clock-top">
              <Clock size={14} className="map-rail-clock-ico" />
              <span className="map-rail-time">{gameClock.timeLabel}</span>
              <PhaseIcon phase={gameClock.phase} />
            </div>
            <div className="map-rail-clock-meta">
              <span>{gameClock.phaseLabelRu}</span>
              <span className="map-rail-dot">·</span>
              <span>ДЕНЬ {gameClock.worldDay}</span>
            </div>
          </button>
        )}
        <div className="map-rail-district mono-text">{districtTitle}</div>
        <div className="map-rail-legend" role="list">
          {LEGEND.map((L) => (
            <span key={L.label} className="map-rail-legend-item" role="listitem">
              <i style={{ background: L.color }} />
              {L.label}
            </span>
          ))}
        </div>
      </div>

      <div className="map-rail-filters" role="toolbar" aria-label="Фильтр типа точки">
        {(viewMode === 'DISTRICT' ? DISTRICT_FILTERS : CITY_FILTERS).map((f) => {
          const active =
            viewMode === 'DISTRICT'
              ? poiFilter === f.id
              : cityFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className={`map-rail-chip ${active ? 'on' : ''}`}
              onClick={() =>
                viewMode === 'DISTRICT'
                  ? onPoiFilter(f.id as PoiTypeFilter)
                  : onCityFilter(f.id as 'all' | 'hub' | 'trade' | 'combat' | 'bar')
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="map-rail-list-wrap">
        <div className="map-rail-list-hdr mono-text">
          <MapPinned size={12} />
          {viewMode === 'DISTRICT' ? `ТОЧКИ (${districtRows.length})` : `РАЙОНЫ (${cityRows.length})`}
        </div>
        <div className="map-rail-list" ref={listRef}>
          {viewMode === 'DISTRICT' &&
            districtRows.map((row) => {
              const sel = selectedSubNodeId === row.id;
              const obj = objectiveNodeId === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  data-poi-id={row.id}
                  className={`map-rail-row ${sel ? 'selected' : ''} ${obj ? 'objective' : ''}`}
                  onClick={() => onPickSubNode(row.id)}
                >
                  <span className="map-rail-row-type" style={{ color: 'var(--neon-cyan)' }}>
                    {row.type}
                  </span>
                  <span className="map-rail-row-name">{row.name}</span>
                  {row.description && <span className="map-rail-row-desc">{row.description}</span>}
                </button>
              );
            })}
          {viewMode === 'CITY' &&
            cityRows.map((node) => {
              const sel = selectedCityNodeId === node.id;
              const obj = objectiveNodeId === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  data-poi-id={node.id}
                  className={`map-rail-row ${sel ? 'selected' : ''} ${obj ? 'objective' : ''}`}
                  onClick={() => onPickCityNode(node)}
                >
                  <span className="map-rail-row-type">{node.type}</span>
                  <span className="map-rail-row-name">{node.name.split(':')[0]}</span>
                  <span className="map-rail-row-desc">{node.description}</span>
                </button>
              );
            })}
        </div>
      </div>

      {clockHintOpen && (
        <div
          className="map-rail-hint-overlay"
          onClick={() => setClockHintOpen(false)}
          role="presentation"
        >
          <div
            className="map-rail-hint-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Масштаб игрового времени"
          >
            <button
              type="button"
              className="map-rail-hint-close"
              onClick={() => setClockHintOpen(false)}
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>
            <p className="map-rail-hint-text">12 ч игры ≈ 4 ч реального времени</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default MapRadarRail;

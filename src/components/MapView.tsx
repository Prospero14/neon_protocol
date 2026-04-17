import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import { DEFAULT_DISTRICT_BLUEPRINT, DEFAULT_DISTRICT_BOUNDARY } from '../logic/mapVisualDefaults';
import { Search, MousePointer2, X } from 'lucide-react';
import { type QuestState } from '../logic/questEngine';
import type { GameClockSnapshot } from '../logic/gameClock';
import MapRadarRail, { type PoiTypeFilter } from './map/MapRadarRail';
import './map/MapRadarRail.css';
import '../blueprints.css';

interface MapViewProps {
  viewMode: 'CITY' | 'DISTRICT';
  activeDistrictId: string;
  isCityMapUnlocked: boolean;
  onNodeSelect: (nodeId: string, type: string, cost?: number) => void;
  onToggleView: () => void;
  onBack: () => void;
  questStates?: QuestState[];
  objectiveNodeId?: string | null;
  playerBits?: number;
  customSubNodes?: any[]; // To override the district subNodes
  /** Игровые часы и фаза суток (день/ночь на карте). */
  gameClock?: GameClockSnapshot | null;
  /** Кооп: id субнод для лёгкой подсветки в реестре (бой полигона). */
  coopCombatHighlightIds?: string[] | null;
}

const NODE_COLORS: Record<string, string> = {
  combat:   'var(--neon-pink)',
  bar:      'var(--neon-amethyst)',
  trade:    'var(--neon-amber)',
  story:    'var(--neon-amethyst)',
  hub:      'var(--neon-cyan)',
  npc:      'var(--neon-amethyst)',
  shop:     'var(--neon-amber)',
  terminal: 'var(--neon-amber)',
};

const MapView: React.FC<MapViewProps> = ({ 
  viewMode, 
  activeDistrictId, 
  isCityMapUnlocked,
  onNodeSelect, 
  onBack,
  onToggleView,
  objectiveNodeId = null,
  playerBits = 0,
  customSubNodes = null,
  gameClock = null,
  coopCombatHighlightIds = null,
}) => {
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const [selectedSubNodeId, setSelectedSubNodeId] = useState<string | null>(null);
  const [poiFilter, setPoiFilter] = useState<PoiTypeFilter>('all');
  const [cityFilter, setCityFilter] = useState<'all' | 'hub' | 'trade' | 'combat' | 'bar'>('all');
  const [nodeConnectModalOpen, setNodeConnectModalOpen] = useState(false);

  // Zoom State (Pan disabled by USER_REQUEST)
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const poiListRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.05;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    setZoom(prev => Math.min(Math.max(prev + delta, 1.0), 1.45));
  };

  const resetView = () => {
    setZoom(1);
  };

  const activeDistrictBase = MAP_NODES.find(n => n.id === activeDistrictId) || MAP_NODES[0];
  const allSubNodes = useMemo(
    () => customSubNodes ?? activeDistrictBase.subNodes ?? [],
    [customSubNodes, activeDistrictBase.subNodes, activeDistrictId]
  );
  const filteredSubNodes = useMemo(() => {
    if (poiFilter === 'all') return allSubNodes;
    return allSubNodes.filter((s: { type: string }) => s.type === poiFilter);
  }, [allSubNodes, poiFilter]);
  const filteredCityNodes = useMemo(() => {
    if (cityFilter === 'all') return MAP_NODES;
    return MAP_NODES.filter((n) => n.type === cityFilter);
  }, [cityFilter]);

  const activeDistrict = {
    ...activeDistrictBase,
    boundary: activeDistrictBase.boundary ?? DEFAULT_DISTRICT_BOUNDARY,
    imageSubstrate: activeDistrictBase.imageSubstrate ?? DEFAULT_DISTRICT_BLUEPRINT,
    subNodes: allSubNodes,
  };
  const selectedSubNode = allSubNodes.find((s) => s.id === selectedSubNodeId) ?? null;

  useEffect(() => {
    const id = viewMode === 'DISTRICT' ? selectedSubNodeId : selectedNode?.id;
    if (!id || !poiListRef.current) return;
    const el = poiListRef.current.querySelector(`[data-poi-id="${id}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedSubNodeId, selectedNode?.id, viewMode]);

  useEffect(() => {
    setPoiFilter('all');
    setCityFilter('all');
  }, [activeDistrictId, viewMode]);

  useEffect(() => {
    if (!selectedSubNodeId) return;
    if (!filteredSubNodes.some((s) => s.id === selectedSubNodeId)) {
      setSelectedSubNodeId(null);
    }
  }, [filteredSubNodes, selectedSubNodeId]);

  useEffect(() => {
    setNodeConnectModalOpen(false);
  }, [selectedSubNodeId]);

  useEffect(() => {
    if (!nodeConnectModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNodeConnectModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nodeConnectModalOpen]);

  const renderSubNodes = React.useMemo(() => {
    const source = filteredSubNodes;
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    type Placed = (typeof source)[number] & {
      rx: number;
      ry: number;
      labelDx: number;
      nameLines: string[];
      nameFontSize: number;
      labelGap: number;
      lineStep: number;
      firstY: number;
      typeY: number;
      bw: number;
      bh: number;
    };

    /** Маркеры остаются в данных чертежа; расстояние «точка → подпись» компактное; крупный шрифт в единицах viewBox. */
    const LABEL_GAP = 4.05;
    const placed: Placed[] = [];

    for (const sn of source) {
      const rx = clamp(sn.x, 3, 97);
      const ry = clamp(sn.y, 3, 97);
      /** На карте — одна короткая строка; полное имя в реестре справа. */
      const rawName = (sn.name || '').toUpperCase().trim();
      const nameLines =
        rawName.length > 15 ? [`${rawName.slice(0, 14)}…`] : [rawName || '???'];
      const nameFontSize = 0.76;
      const lineStep = 1.02;
      const padTop = 0.52;
      const padBot = 0.48;
      const firstY = padTop + nameFontSize * 0.92;
      const lastNameY = firstY + Math.max(0, nameLines.length - 1) * lineStep;
      const typeY = lastNameY + 0.88;
      const longestLine = Math.max(
        nameLines.reduce((acc, l) => Math.max(acc, l.length), 0),
        sn.type.length + 2
      );
      const bw = Math.min(60, 3.0 + longestLine * (nameFontSize * 0.52));
      const bh = typeY + 0.45 + padBot;

      placed.push({
        ...sn,
        rx,
        ry,
        labelDx: 0,
        nameLines,
        nameFontSize,
        labelGap: LABEL_GAP,
        lineStep,
        firstY,
        typeY,
        bw,
        bh,
      });
    }

    const pairOverlaps = (a: Placed, b: Placed) => {
      const ax = a.rx + a.labelDx;
      const ay = a.ry + a.labelGap + a.bh / 2;
      const bx = b.rx + b.labelDx;
      const by = b.ry + b.labelGap + b.bh / 2;
      const hd = Math.abs(ax - bx);
      const vd = Math.abs(ay - by);
      return hd < ((a.bw + b.bw) / 2) * 0.88 && vd < ((a.bh + b.bh) / 2) * 0.88;
    };

    for (let pass = 0; pass < 20; pass++) {
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i];
          const b = placed[j];
          if (!pairOverlaps(a, b)) continue;
          const push = 2.1;
          if (a.rx + a.labelDx <= b.rx + b.labelDx) {
            a.labelDx -= push;
            b.labelDx += push;
          } else {
            a.labelDx += push;
            b.labelDx -= push;
          }
          a.labelDx = clamp(a.labelDx, -18, 18);
          b.labelDx = clamp(b.labelDx, -18, 18);
        }
      }
    }

    for (const p of placed) {
      let dx = p.labelDx;
      const half = p.bw / 2;
      if (p.rx + dx - half < 2) dx = 2 + half - p.rx;
      if (p.rx + dx + half > 98) dx = 98 - half - p.rx;
      p.labelDx = clamp(dx, -18, 18);
    }

    return placed;
  }, [filteredSubNodes]);
  const selectedRenderSubNode = renderSubNodes.find((s) => s.id === selectedSubNodeId) ?? null;

  const getTravelCost = (targetNode: MapNodeData) => {
    if (targetNode.id === activeDistrictId) return 0;
    const dist = Math.sqrt(Math.pow(targetNode.x - activeDistrict.x, 2) + Math.pow(targetNode.y - activeDistrict.y, 2));
    return Math.floor(dist * 2);
  };

  const handlePickSubNode = (id: string) => {
    if (selectedSubNodeId === id) {
      setNodeConnectModalOpen(true);
    } else {
      setSelectedSubNodeId(id);
    }
  };

  return (
    <div className={`map-view-v4 no-pan ${gameClock ? `map-phase-${gameClock.phase}` : ''}`}>
      <header className="map-hdr-v5 map-hdr-v5--radar">
        <div className="hdr-main-area">
          <div className="hdr-micro-label side-fixed">
            GEOGRAPHIC_INDEX // {viewMode === 'DISTRICT' ? `${activeDistrict.name.split(':')[0].toUpperCase()}_СЕТЕВОЙ_РАДАР` : 'МОСКВА_СЕТЕВОЙ_РАДАР'}
          </div>
          <h1 className="hdr-headline">РАДАР_РАЙОНА</h1>
        </div>
        <div className="hdr-actions-area">
          <div className="hdr-status-row">
            <div className="hdr-tech-meta pulse-opacity"> // СКАНИРОВАНИЕ_[ZOOM:{Math.round(zoom * 100)}%] </div>
            <div className="hdr-actions">
            {viewMode === 'DISTRICT' && isCityMapUnlocked && (
               <button className="map-hdr-btn" onClick={onToggleView}>
                 <Search size={14} /> ОБЩАЯ_КАРТА
               </button>
            )}
            {viewMode === 'CITY' && (
               <button className="map-hdr-btn" onClick={onToggleView}>
                 <MousePointer2 size={14} /> КАРТА_РАЙОНА
               </button>
            )}
            <button className="map-hdr-btn" onClick={resetView}>[ СБРОС_ЗУМА ]</button>
            <button className="map-hdr-btn exit" onClick={onBack}>[ ВЫХОД_В_ХАБ ]</button>
            </div>
          </div>
        </div>
      </header>

      <main className="map-body map-body--radar-v2">
        <div 
          className="map-canvas-wrap"
          onWheel={handleWheel}
          ref={containerRef}
        >
          {gameClock && <div className={`map-atmo map-atmo--${gameClock.phase}`} aria-hidden />}
          <svg viewBox="0 0 100 100" className="map-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0, 255, 255, 0.05)" />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
              </radialGradient>
              
              {/* CITY BLOCKS PATTERN (Blueprint Detail) */}
              <pattern id="cityBlocks" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                 <rect x="1" y="1" width="3" height="2" fill="none" stroke="rgba(0, 255, 255, 0.08)" strokeWidth="0.05" />
                 <rect x="5" y="1" width="4" height="4" fill="none" stroke="rgba(0, 255, 255, 0.08)" strokeWidth="0.05" />
                 <rect x="1" y="4" width="2" height="5" fill="none" stroke="rgba(0, 255, 255, 0.08)" strokeWidth="0.05" />
                 <rect x="4" y="6" width="5" height="3" fill="none" stroke="rgba(0, 255, 255, 0.08)" strokeWidth="0.05" />
                 <line x1="0" y1="0" x2="10" y2="0" stroke="rgba(0, 255, 255, 0.03)" strokeWidth="0.02" />
                 <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(0, 255, 255, 0.03)" strokeWidth="0.02" />
              </pattern>

              {/* DISTRICT MASK */}
              {viewMode === 'DISTRICT' && activeDistrict.boundary && (
                <mask id="districtMask">
                   <path d={activeDistrict.boundary} fill="white" />
                </mask>
              )}
              <filter id="mapPillShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0.25" stdDeviation="0.45" floodColor="#000" floodOpacity="0.75" />
              </filter>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#radarGlow)" />
            
            <g className="radar-grid" opacity="0.05">
              {[...Array(11)].map((_, i) => (
                <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="var(--neon-amethyst)" strokeWidth="0.04" />
              ))}
              {[...Array(11)].map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="var(--neon-amethyst)" strokeWidth="0.04" />
              ))}
            </g>

            <line x1="50" y1="50" x2="50" y2="0" stroke="var(--neon-cyan)" strokeWidth="0.1" opacity="0.3" className="radar-sweep" />

            <g style={{ 
              transform: `translate(50px, 50px) scale(${zoom}) translate(-50px, -50px)`,
              transition: 'transform 0.4s cubic-bezier(0.1, 0.9, 0.2, 1)'
            }}>
              {viewMode === 'CITY' ? (
                MAP_NODES.map(node => {
                  const color = NODE_COLORS[node.type] || '#aaa';
                  const isCurrent = activeDistrictId === node.id;
                  const isSelected = selectedNode?.id === node.id;
                  const isObjective = objectiveNodeId === node.id;
                  
                  return (
                    <g key={node.id} onClick={() => setSelectedNode(node)} onDoubleClick={() => onNodeSelect(node.id, 'district', getTravelCost(node))} style={{ cursor: 'pointer' }}>
                       <rect x={node.x - 1.5} y={node.y - 1.5} width="3" height="3" fill="none" stroke={color} strokeWidth="0.1" opacity="0.2" />
                       <circle cx={node.x} cy={node.y} r={isSelected ? 1.8 : 1.2} fill={isSelected ? '#fff' : color} />
                       {isCurrent && (
                         <text x={node.x} y={node.y-4} fontSize="0.9" fill="var(--neon-cyan)" textAnchor="middle" style={{ fontWeight: 800, fontFamily: 'monospace' }}>ВЫ_ЗДЕСЬ</text>
                       )}
                       {isObjective && (
                         <g>
                           <circle cx={node.x} cy={node.y} r="3" fill="none" stroke="var(--neon-amethyst)" strokeWidth="0.2" className="animate-ping" />
                           <text x={node.x} y={node.y+5} fontSize="1.4" fill="var(--neon-amethyst)" textAnchor="middle" style={{ fontWeight: 900, fontFamily: 'monospace' }}>[ЦЕЛЬ]</text>
                         </g>
                       )}
                       <text x={node.x} y={node.y+3} fontSize="1.2" fill={isSelected ? "#fff" : "rgba(255,255,255,0.4)"} textAnchor="middle" style={{ pointerEvents: 'none', fontFamily: 'monospace' }}>
                         {node.name.split(':')[0]}
                       </text>
                    </g>
                  );
                })
              ) : (
                <g className="district-view-blueprint">
                  {/* PNG SUBSTRATE LAYER (High Fidelity Backdrop) */}
                  {activeDistrict.imageSubstrate && (
                    <image 
                      href={activeDistrict.imageSubstrate} 
                      x="0" y="0" width="100" height="100" 
                      opacity="0.85"
                      style={{ filter: 'grayscale(0.3) brightness(0.8) contrast(1.2)' }}
                    />
                  )}

                  {/* Grid Numbers Layer */}
                  <g className="blueprint-grid-labels" opacity="0.18" fontSize="1.0" fill="var(--neon-cyan)" style={{ fontFamily: 'monospace', fontWeight: 300 }}>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(val => (
                      <g key={val}>
                        <text x={val} y="3" textAnchor="middle">{val}</text>
                        <text x="3" y={val + 0.3} textAnchor="start">{val}</text>
                      </g>
                    ))}
                  </g>

                  <g className="district-substrate">
                    {/* Boundary */}
                    {activeDistrict.boundary && (
                      <path 
                        d={activeDistrict.boundary} 
                        fill="rgba(0, 255, 255, 0.005)" 
                        stroke="rgba(0, 255, 255, 0.5)" 
                        strokeWidth="0.12" 
                        className="substrate-boundary"
                      />
                    )}
                    
                    {/* Coordinate Markers at Corners */}
                    {activeDistrict.boundary && (
                      <g className="blueprint-coords" fontSize="0.55" fill="var(--neon-cyan)" opacity="0.22" style={{fontFamily: 'monospace'}}>
                         <text x="36" y="8">[X:35.00 Y:05.12]</text>
                         <text x="86" y="8">[X:85.00 Y:05.00]</text>
                         <text x="94" y="32">[X:95.12 Y:30.44]</text>
                         <text x="11" y="58">[X:10.04 Y:55.21]</text>
                      </g>
                    )}

                    {/* Features */}
                    {activeDistrict.features?.map((f, i) => {
                      const isRoad = f.type === 'road';
                      const isLake = f.type === 'lake';
                      const isLabel = f.type === 'label';
                      
                      if (isLabel) {
                         const coords = f.path.replace('M ', '').split(' ');
                         return (
                           <g key={i} transform={`translate(${coords[0]}, ${coords[1]})`} opacity="0.1" aria-hidden>
                              <circle r="0.35" fill="var(--neon-cyan)" />
                           </g>
                         );
                      }
                      
                      return (
                        <path 
                          key={i}
                          d={f.path}
                          fill={isLake ? 'rgba(0, 255, 255, 0.12)' : (f.type === 'park' ? 'rgba(0, 255, 0, 0.01)' : 'none')}
                          stroke={isRoad ? 'rgba(0, 255, 255, 0.18)' : (f.type === 'park_hatch' ? 'rgba(0, 255, 0, 0.25)' : 'rgba(0, 255, 255, 0.3)')}
                          strokeWidth={isRoad ? "0.08" : "0.15"}
                          className={`substrate-${f.type}`}
                        />
                      );
                    })}
                  </g>

                  {/* Active Selection Scanning Square */}
                  {selectedRenderSubNode && (
                    <g className="blueprint-selection-wrap">
                      <rect 
                        x={selectedRenderSubNode.rx - 4} 
                        y={selectedRenderSubNode.ry - 4} 
                        width="8" 
                        height="8" 
                        fill="none" 
                        stroke="var(--neon-cyan)" 
                        strokeWidth="0.08" 
                        strokeDasharray="1, 2"
                        className="blueprint-selection-sq"
                      />
                      <line x1={selectedRenderSubNode.rx} y1="0" x2={selectedRenderSubNode.rx} y2="100" stroke="rgba(0, 255, 255, 0.15)" strokeWidth="0.05" />
                      <line x1="0" y1={selectedRenderSubNode.ry} x2="100" y2={selectedRenderSubNode.ry} stroke="rgba(0, 255, 255, 0.15)" strokeWidth="0.05" />
                    </g>
                  )}

                  {/* Nodes Layer */}
                  <g className="blueprint-nodes-layer">
                    {renderSubNodes.map((sn) => {
                       const isSelected = selectedSubNodeId === sn.id;
                       const fillType = NODE_COLORS[sn.type] || '#889';
                       const tagColor = isSelected ? 'var(--neon-cyan)' : fillType;
                       const { lineStep, firstY, typeY, bw, bh } = sn;
                       const labelTransform = `translate(${sn.rx + sn.labelDx}, ${sn.ry + sn.labelGap})`;
                       const pillFill = isSelected ? 'rgba(0, 28, 42, 0.94)' : 'rgba(2, 10, 18, 0.92)';
                       const pillStroke = isSelected ? 'rgba(0, 212, 255, 0.45)' : 'rgba(0, 180, 220, 0.22)';
                       const nameFill = isSelected ? '#b8f4ff' : '#e8f2ff';
                       const txtStroke = { stroke: '#030810', strokeWidth: 0.07, paintOrder: 'stroke fill' as const };
                       return (
                        <g
                          key={sn.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePickSubNode(sn.id);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle cx={sn.rx} cy={sn.ry} r="5" fill="transparent" />
                          <line
                            x1={sn.rx}
                            y1={sn.ry + 1.0}
                            x2={sn.rx + sn.labelDx}
                            y2={sn.ry + sn.labelGap + 0.08}
                            stroke="rgba(0, 212, 255, 0.4)"
                            strokeWidth="0.07"
                            strokeLinecap="round"
                            style={{ pointerEvents: 'none' }}
                          />
                          <circle cx={sn.rx} cy={sn.ry} r="0.95" fill={isSelected ? '#fff' : NODE_COLORS[sn.type]} />
                          <circle
                            cx={sn.rx}
                            cy={sn.ry}
                            r="1.45"
                            fill="none"
                            stroke={isSelected ? '#fff' : NODE_COLORS[sn.type]}
                            strokeWidth="0.045"
                            opacity={isSelected ? 0.55 : 0.32}
                          />
                          
                          <g transform={labelTransform} filter="url(#mapPillShadow)" style={{ pointerEvents: 'none' }}>
                            <rect
                              x={-bw / 2}
                              y="0"
                              width={bw}
                              height={bh}
                              rx="0.85"
                              ry="0.85"
                              fill={pillFill}
                              stroke={pillStroke}
                              strokeWidth="0.07"
                            />
                            {sn.nameLines.map((line, li) => (
                              <text
                                key={li}
                                x="0"
                                y={firstY + li * lineStep}
                                fontSize={sn.nameFontSize}
                                fill={nameFill}
                                textAnchor="middle"
                                style={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.15px' }}
                                {...txtStroke}
                              >
                                {line}
                              </text>
                            ))}
                            <text
                              x="0"
                              y={typeY}
                              fontSize="0.5"
                              fill={tagColor}
                              textAnchor="middle"
                              style={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: '1.1px' }}
                              {...txtStroke}
                            >
                              {sn.type}
                            </text>
                          </g>
                        </g>
                       );
                    })}
                  </g>
                </g>
              )}
            </g>
          </svg>
        </div>

        <div
          className={
            viewMode === 'DISTRICT'
              ? 'map-radar-column map-radar-column--district-rail-only'
              : 'map-radar-column'
          }
        >
        <MapRadarRail
          gameClock={gameClock ?? null}
          viewMode={viewMode}
          districtTitle={viewMode === 'DISTRICT' ? (activeDistrict.name.split(':')[0] || 'РАЙОН') : 'МОСКВА'}
          poiFilter={poiFilter}
          onPoiFilter={setPoiFilter}
          cityFilter={cityFilter}
          onCityFilter={setCityFilter}
          districtRows={filteredSubNodes}
          cityRows={filteredCityNodes}
          selectedSubNodeId={selectedSubNodeId}
          selectedCityNodeId={selectedNode?.id ?? null}
          onPickSubNode={handlePickSubNode}
          onPickCityNode={(node) => {
            setSelectedNode(node);
            setSelectedSubNodeId(null);
          }}
          objectiveNodeId={objectiveNodeId}
          highlightPoiIds={
            coopCombatHighlightIds && coopCombatHighlightIds.length > 0
              ? new Set(coopCombatHighlightIds)
              : null
          }
          listRef={poiListRef}
        />
        {viewMode === 'CITY' && (
        <aside className="map-info-panel arctic-monolith map-info-panel--radar-detail">
          {selectedNode ? (
            <div className="panel-content animate-slide-in">
              <div className="node-tag" style={{ color: NODE_COLORS[selectedNode.type] }}> {selectedNode.type.toUpperCase()} / TIER_{selectedNode.tier} </div>
              <h1 className="node-title">{selectedNode.name}</h1>
              <p className="node-desc mono-text">{selectedNode.description}</p>
              <div className="travel-stats">
                 <span>СТОИМОСТЬ:</span> <span className="val-bits">ƀ{getTravelCost(selectedNode)}</span>
              </div>
              <button 
                className={`btn-engage ${playerBits < getTravelCost(selectedNode) ? 'locked' : ''}`}
                onClick={() => playerBits >= getTravelCost(selectedNode) && onNodeSelect(selectedNode.id, 'district', getTravelCost(selectedNode))}
              >
                {selectedNode.id === activeDistrictId ? 'ПЕРЕЙТИ_К_РАЙОНУ' : 'ИНИЦИИРОВАТЬ_ПЕРЕМЕЩЕНИЕ'}
              </button>
            </div>
          ) : (
            <div className="no-selection mono-text">
               <MousePointer2 size={32} opacity="0.3" />
               <p>ВЫБЕРИТЕ_ЦЕЛЬ_НА_РАДАРЕ</p>
            </div>
          )}
        </aside>
        )}
        </div>
      </main>

      {typeof document !== 'undefined' &&
        selectedSubNode &&
        nodeConnectModalOpen &&
        createPortal(
          <div
            className="map-node-connect-overlay"
            onClick={() => setNodeConnectModalOpen(false)}
            role="presentation"
          >
            <div
              className="map-node-connect-modal arctic-monolith"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="map-node-connect-title"
            >
              <button
                type="button"
                className="map-node-connect-close"
                onClick={() => setNodeConnectModalOpen(false)}
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
              <div className="node-tag" style={{ color: NODE_COLORS[selectedSubNode.type] }}>
                {selectedSubNode.type.toUpperCase()}
              </div>
              <h2 id="map-node-connect-title" className="map-node-connect-headline">
                {selectedSubNode.name}
              </h2>
              <div className="tech-briefing">
                <div className="brief-label">DATA_STREAM:</div>
                <p className="node-desc mono-text">{selectedSubNode.description}</p>
                <div className="brief-stats">
                  <span>SECURITY: {activeDistrict.tier > 2 ? 'HIGH' : 'LOW'}</span>
                  <span>PING: STABLE</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-engage"
                onClick={() => {
                  onNodeSelect(selectedSubNode.id, selectedSubNode.type);
                  setNodeConnectModalOpen(false);
                }}
              >
                ПОДКЛЮЧИТЬСЯ_К_УЗЛУ
              </button>
            </div>
          </div>,
          document.body
        )}

      <style>{`
        .map-view-v4 { height: 100%; display: flex; flex-direction: column; background: #000; overflow: hidden; }
        .map-radar-column--district-rail-only > .map-radar-rail {
          flex: 1;
          min-height: 0;
        }
        .map-node-connect-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: rgba(0, 0, 0, 0.78);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .map-node-connect-modal {
          position: relative;
          width: min(100%, 420px);
          max-height: min(88vh, 640px);
          overflow-y: auto;
          padding: 28px 24px 24px;
          border: 1px solid rgba(0, 212, 255, 0.28);
          box-shadow: 0 0 48px rgba(0, 0, 0, 0.85);
        }
        .map-node-connect-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: #889;
          cursor: pointer;
          padding: 6px;
          line-height: 0;
          border-radius: 4px;
        }
        .map-node-connect-close:hover { color: var(--neon-cyan); }
        .map-node-connect-headline {
          font-size: 1.35rem;
          font-weight: 900;
          color: #fff;
          margin: 0 0 16px;
          line-height: 1.2;
          padding-right: 36px;
        }
        .map-hdr-v5 {
          height: 100px; display: grid; grid-template-columns: 1fr 340px; 
          background: rgba(0,0,0,0.9); border-bottom: 1px solid rgba(188,19,254,0.1);
        }
        .map-hdr-v5--radar {
          height: 64px !important;
          grid-template-columns: 1fr auto !important;
          align-items: center;
        }
        .hdr-main-area {
          display: flex; align-items: center; justify-content: center; position: relative;
        }
        .hdr-micro-label.side-fixed { 
          position: absolute; left: 40px; top: 50%; transform: translateY(-50%); 
          margin: 0; white-space: nowrap; 
        }
        .hdr-actions-area {
          display: flex; align-items: center; justify-content: flex-end; padding-right: 25px;
        }
        .hdr-status-row { display: flex; align-items: center; gap: 20px; justify-content: flex-end; width: 100%; }
        .hdr-micro-label { font-size: 0.65rem; color: var(--neon-amethyst); letter-spacing: 2px; font-weight: 800; font-family: var(--font-mono); }
        .hdr-headline { font-size: 1.8rem; font-weight: 950; color: #fff; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
        .hdr-tech-meta { font-family: var(--font-mono); font-size: 0.6rem; opacity: 0.6; color: var(--neon-amethyst); white-space: nowrap; }
        .pulse-opacity { animation: pulseOpacity 2s infinite; }
        @keyframes pulseOpacity { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .hdr-actions { display: flex; gap: 10px; }
        
        .map-hdr-btn { 
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(188,19,254,0.05); border: 1px solid rgba(188,19,254,0.2); 
          color: #fff; padding: 6px 14px; font-family: var(--font-mono); font-size: 0.65rem;
          cursor: pointer; transition: 0.2s; 
          height: 32px; white-space: nowrap; border-radius: 2px;
        }
        .map-hdr-btn:hover { background: var(--neon-amethyst); color: #000; box-shadow: 0 0 15px var(--neon-purple-glow); }
        .map-hdr-btn.exit { border-color: rgba(255,255,255,0.1); opacity: 0.7; }
        
        .map-body { flex: 1; display: grid; grid-template-columns: 1fr 340px; overflow: hidden; position: relative; }
        .map-body--radar-v2 {
          grid-template-columns: minmax(0, 1fr) minmax(300px, 400px);
        }
        .map-radar-column {
          display: flex;
          flex-direction: column;
          min-height: 0;
          min-width: 0;
          background: linear-gradient(180deg, rgba(4, 10, 20, 0.98) 0%, rgba(0, 4, 12, 1) 100%);
          border-left: 1px solid rgba(0, 212, 255, 0.14);
        }
        .map-info-panel--radar-detail {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          border-left: none !important;
          padding-top: 16px !important;
        }
        .map-canvas-wrap { 
          position: relative; background: radial-gradient(circle at 50% 50%, rgba(26,11,46,0.3) 0%, #000 100%); 
          cursor: crosshair; overflow: hidden; 
        }
        .map-atmo {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          transition: opacity 1.2s ease;
        }
        .map-atmo--morning {
          background: linear-gradient(195deg, rgba(255, 220, 180, 0.09) 0%, transparent 45%);
        }
        .map-atmo--day {
          background: radial-gradient(ellipse 90% 45% at 50% 0%, rgba(120, 200, 255, 0.07) 0%, transparent 58%);
        }
        .map-atmo--evening {
          background: linear-gradient(180deg, transparent 35%, rgba(255, 100, 40, 0.1) 100%),
            linear-gradient(95deg, rgba(60, 30, 10, 0.12) 0%, transparent 45%);
        }
        .map-atmo--night {
          background: radial-gradient(ellipse 110% 85% at 50% 110%, rgba(40, 10, 80, 0.55) 0%, transparent 52%),
            linear-gradient(180deg, rgba(0, 4, 28, 0.5) 0%, transparent 55%);
          mix-blend-mode: multiply;
        }
        .map-svg { width: 100%; height: 100%; position: relative; z-index: 3; }
        
        .radar-sweep { transform-origin: 50px 50px; animation: radar-rotate 5s linear infinite; }
        @keyframes radar-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .map-info-panel {
          background: rgba(13,2,8,0.95); border-left: 1px solid rgba(188,19,254,0.1);
          padding: 40px 25px; display: flex; flex-direction: column; position: relative;
          height: 100%; z-index: 100; pointer-events: auto;
        }
        .map-info-panel::before {
          content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--neon-amethyst); opacity: 0.3;
        }
        .node-tag { font-family: var(--font-mono); font-size: 0.65rem; font-weight: 950; margin-bottom: 12px; letter-spacing: 1px; color: var(--neon-amethyst) !important; }
        .node-title { font-size: 2.2rem; margin-bottom: 20px; color: #fff; line-height: 1.1; font-weight: 900; }
        .node-desc { font-size: 0.85rem; color: #888; line-height: 1.6; margin-bottom: 2.5rem; }
        
        .tech-briefing { background: rgba(188,19,254,0.03); padding: 20px; border-left: 2px solid var(--neon-amethyst); margin-bottom: 2.5rem; }
        .brief-label { font-size: 0.55rem; opacity: 0.4; margin-bottom: 12px; letter-spacing: 1px; color: var(--neon-amethyst); }
        .brief-stats { display: flex; flex-direction: column; gap: 8px; font-family: var(--font-mono); font-size: 0.65rem; color: var(--neon-amber); margin-top: 10px; }
        
        .btn-engage {
          background: transparent; color: var(--neon-amber); font-family: var(--font-mono);
          font-weight: 900; padding: 18px; border: 1px solid var(--neon-amber); cursor: pointer; transition: 0.2s;
          letter-spacing: 2px; text-transform: uppercase; font-size: 0.9rem;
        }
        .btn-engage:hover:not(.locked) { background: var(--neon-amber); color: #000; box-shadow: 0 0 25px var(--neon-amber-glow); }
        .btn-engage.locked { border-color: #333; color: #666; cursor: not-allowed; }
        
        .no-selection { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; color: #333; }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        @media (max-width: 1280px) {
          .map-hdr-v5 { grid-template-columns: 1fr 280px; }
          .map-body:not(.map-body--radar-v2) { grid-template-columns: 1fr 280px; }
          .map-body--radar-v2 { grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); }
          .hdr-main-area { justify-content: flex-start; padding-left: 20px; }
          .hdr-micro-label.side-fixed { position: static; transform: none; margin-right: 14px; }
          .hdr-headline { font-size: 1.35rem; }
        }

        @media (max-width: 960px) {
          .map-hdr-v5 { height: auto; grid-template-columns: 1fr; gap: 8px; padding: 10px 12px; }
          .hdr-main-area { justify-content: space-between; }
          .hdr-actions-area { justify-content: flex-start; padding-right: 0; }
          .hdr-status-row { flex-wrap: wrap; gap: 8px; }
          .map-body { grid-template-columns: 1fr; }
          .map-body--radar-v2 {
            grid-template-columns: 1fr;
            grid-template-rows: minmax(220px, 48vh) auto;
            overflow-y: auto;
          }
          .map-radar-column {
            border-left: none;
            border-top: 1px solid rgba(0, 212, 255, 0.12);
            max-height: none;
          }
          .map-info-panel { border-left: none; border-top: 1px solid rgba(188,19,254,0.1); max-height: 42vh; overflow-y: auto; }
          .node-title { font-size: 1.4rem; margin-bottom: 12px; }
        }
      `}</style>
    </div>
  );
};

export default MapView;

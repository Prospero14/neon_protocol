import React, { useState, useRef } from 'react';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import { DEFAULT_DISTRICT_BLUEPRINT, DEFAULT_DISTRICT_BOUNDARY } from '../logic/mapVisualDefaults';
import { Search, MousePointer2 } from 'lucide-react';
import { type QuestState } from '../logic/questEngine';
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
}) => {
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const [selectedSubNodeId, setSelectedSubNodeId] = useState<string | null>(null);

  // Zoom State (Pan disabled by USER_REQUEST)
  const [zoom, setZoom] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.05;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    setZoom(prev => Math.min(Math.max(prev + delta, 1.0), 1.2));
  };

  const resetView = () => {
    setZoom(1);
  };

  const activeDistrictBase = MAP_NODES.find(n => n.id === activeDistrictId) || MAP_NODES[0];
  const activeDistrict = {
    ...activeDistrictBase,
    boundary: activeDistrictBase.boundary ?? DEFAULT_DISTRICT_BOUNDARY,
    imageSubstrate: activeDistrictBase.imageSubstrate ?? DEFAULT_DISTRICT_BLUEPRINT,
    subNodes: customSubNodes || activeDistrictBase.subNodes
  };
  const selectedSubNode = activeDistrict.subNodes?.find((s) => s.id === selectedSubNodeId) ?? null;

  const renderSubNodes = React.useMemo(() => {
    const source = activeDistrict.subNodes || [];
    const minGap = 11;
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const hash = (s: string) => {
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    };

    const splitMapLabel = (raw: string, maxLine = 18): string[] => {
      const s = raw.toUpperCase().trim();
      if (s.length <= maxLine) return [s];
      const mid = Math.floor(s.length / 2);
      let cut = s.lastIndexOf(' ', mid);
      if (cut < 5) cut = s.indexOf(' ', mid);
      if (cut < 1 || cut >= s.length - 1) cut = mid;
      const a = s.slice(0, cut).trim();
      const b = s.slice(cut).trim();
      if (!b) return [a];
      return b.length > maxLine ? [a, b.slice(0, maxLine) + '…'] : [a, b];
    };

    type Placed = (typeof source)[number] & {
      rx: number;
      ry: number;
      nameLines: string[];
      nameFontSize: number;
      labelGap: number;
    };

    const placed: Placed[] = [];
    for (const sn of source) {
      let rx = sn.x;
      let ry = sn.y;
      const seed = hash(sn.id);
      const baseAngle = (seed % 360) * (Math.PI / 180);
      for (let iter = 0; iter < 36; iter++) {
        let collided = false;
        for (const p of placed) {
          const dx = rx - p.rx;
          const dy = ry - p.ry;
          const dist = Math.hypot(dx, dy);
          if (dist < minGap) {
            collided = true;
            const push = minGap - dist + 1.15;
            const angle = baseAngle + iter * 0.55;
            rx += Math.cos(angle) * push;
            ry += Math.sin(angle) * push;
          }
        }
        rx = clamp(rx, 5, 95);
        ry = clamp(ry, 5, 95);
        if (!collided) break;
      }
      const nameLines = splitMapLabel(sn.name || '', 16);
      const longName = (sn.name || '').length > 22;
      const nameFontSize = longName ? 0.68 : 0.78;
      /** Всегда под узлом: стабильная привязка, без наслоения на круг. */
      const labelGap = 11.2 + (seed % 5) * 0.22;

      placed.push({
        ...sn,
        rx,
        ry,
        nameLines,
        nameFontSize,
        labelGap,
      });
    }

    for (let pass = 0; pass < 14; pass++) {
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i];
          const b = placed[j];
          let dx = b.rx - a.rx;
          let dy = b.ry - a.ry;
          const d = Math.hypot(dx, dy) || 0.001;
          if (d < minGap) {
            const push = ((minGap - d) * 0.52) / d;
            dx *= push;
            dy *= push;
            a.rx = clamp(a.rx - dx, 5, 95);
            a.ry = clamp(a.ry - dy, 5, 95);
            b.rx = clamp(b.rx + dx, 5, 95);
            b.ry = clamp(b.ry + dy, 5, 95);
          }
        }
      }
    }

    return placed;
  }, [activeDistrict.subNodes]);
  const selectedRenderSubNode = renderSubNodes.find((s) => s.id === selectedSubNodeId) ?? null;

  const getTravelCost = (targetNode: MapNodeData) => {
    if (targetNode.id === activeDistrictId) return 0;
    const dist = Math.sqrt(Math.pow(targetNode.x - activeDistrict.x, 2) + Math.pow(targetNode.y - activeDistrict.y, 2));
    return Math.floor(dist * 2);
  };

  return (
    <div className="map-view-v4 no-pan">
      <header className="map-hdr-v5">
        <div className="hdr-main-area">
          <div className="hdr-micro-label side-fixed">
            GEOGRAPHIC_INDEX // {viewMode === 'DISTRICT' ? `${activeDistrict.name.split(':')[0].toUpperCase()}_СЕТЕВОЙ_РАДАР` : 'МОСКВА_СЕТЕВОЙ_РАДАР'}
          </div>
          <h1 className="hdr-headline">SELECT_ENGAGEMENT_TARGET</h1>
        </div>
        <div className="hdr-actions-area">
          <div className="hdr-status-row">
            <div className="hdr-tech-meta pulse-opacity"> // СКАНИРОВАНИЕ_АКТИВНО_[ZOOM:{Math.round(zoom * 100)}%] </div>
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

      <main className="map-body">
        <div 
          className="map-canvas-wrap"
          onWheel={handleWheel}
          ref={containerRef}
        >
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
                       const lineStep = 1.04;
                       const padTop = 0.5;
                       const padBot = 0.44;
                       const firstY = padTop + sn.nameFontSize * 0.9;
                       const lastNameY = firstY + Math.max(0, sn.nameLines.length - 1) * lineStep;
                       const typeY = lastNameY + 0.92;
                       const longestLine = Math.max(
                         sn.nameLines.reduce((acc, l) => Math.max(acc, l.length), 0),
                         sn.type.length + 2
                       );
                       const bw = Math.min(54, 2.6 + longestLine * (sn.nameFontSize * 0.5));
                       const bh = typeY + 0.38 + padBot;
                       const labelTransform = `translate(${sn.rx}, ${sn.ry + sn.labelGap})`;
                       const pillFill = isSelected ? 'rgba(0, 28, 42, 0.94)' : 'rgba(2, 10, 18, 0.92)';
                       const pillStroke = isSelected ? 'rgba(0, 212, 255, 0.45)' : 'rgba(0, 180, 220, 0.22)';
                       const nameFill = isSelected ? '#b8f4ff' : '#e8f2ff';
                       const txtStroke = { stroke: '#030810', strokeWidth: 0.08, paintOrder: 'stroke fill' as const };
                       return (
                        <g key={sn.id} onClick={(e) => { e.stopPropagation(); setSelectedSubNodeId(sn.id); }} style={{ cursor: 'pointer' }}>
                          <circle cx={sn.rx} cy={sn.ry} r="5" fill="transparent" />
                          <circle cx={sn.rx} cy={sn.ry} r="0.85" fill={isSelected ? '#fff' : NODE_COLORS[sn.type]} />
                          <circle
                            cx={sn.rx}
                            cy={sn.ry}
                            r="1.35"
                            fill="none"
                            stroke={isSelected ? '#fff' : NODE_COLORS[sn.type]}
                            strokeWidth="0.04"
                            opacity={isSelected ? 0.55 : 0.28}
                          />
                          
                          <g transform={labelTransform} filter="url(#mapPillShadow)" style={{ pointerEvents: 'none' }}>
                            <rect
                              x={-bw / 2}
                              y="0"
                              width={bw}
                              height={bh}
                              rx="0.75"
                              ry="0.75"
                              fill={pillFill}
                              stroke={pillStroke}
                              strokeWidth="0.06"
                            />
                            {sn.nameLines.map((line, li) => (
                              <text
                                key={li}
                                x="0"
                                y={firstY + li * lineStep}
                                fontSize={sn.nameFontSize}
                                fill={nameFill}
                                textAnchor="middle"
                                style={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.2px' }}
                                {...txtStroke}
                              >
                                {line}
                              </text>
                            ))}
                            <text
                              x="0"
                              y={typeY}
                              fontSize="0.38"
                              fill={tagColor}
                              textAnchor="middle"
                              style={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: '1.2px' }}
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

        <aside className="map-info-panel arctic-monolith">
          {viewMode === 'CITY' && selectedNode ? (
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
          ) : selectedSubNode ? (
            <div className="panel-content animate-slide-in">
              <div className="node-tag" style={{ color: NODE_COLORS[selectedSubNode.type] }}> {selectedSubNode.type.toUpperCase()} </div>
              <h1 className="node-title">{selectedSubNode.name}</h1>
              <div className="tech-briefing">
                 <div className="brief-label">DATA_STREAM:</div>
                 <p className="node-desc mono-text">{selectedSubNode.description}</p>
                 <div className="brief-stats">
                    <span>SECURITY: {activeDistrict.tier > 2 ? 'HIGH' : 'LOW'}</span>
                    <span>PING: STABLE</span>
                 </div>
              </div>
              <button className="btn-engage" onClick={() => {
                console.group(`[MAP_RADAR] Node Select: ${selectedSubNode.id}`);
                console.log("Type:", selectedSubNode.type);
                console.log("Handler Status: OPERATIONAL");
                console.groupEnd();
                onNodeSelect(selectedSubNode.id, selectedSubNode.type);
              }}>
                 ПОДКЛЮЧИТЬСЯ_К_УЗЛУ
              </button>
            </div>
          ) : (
            <div className="no-selection mono-text">
               <MousePointer2 size={32} opacity="0.3" />
               <p>ВЫБЕРИТЕ_ЦЕЛЬ_НА_РАДАРЕ</p>
            </div>
          )}
        </aside>
      </main>

      <style>{`
        .map-view-v4 { height: 100%; display: flex; flex-direction: column; background: #000; overflow: hidden; }
        .map-hdr-v5 {
          height: 100px; display: grid; grid-template-columns: 1fr 340px; 
          background: rgba(0,0,0,0.9); border-bottom: 1px solid rgba(188,19,254,0.1);
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
        .map-canvas-wrap { 
          position: relative; background: radial-gradient(circle at 50% 50%, rgba(26,11,46,0.3) 0%, #000 100%); 
          cursor: crosshair; overflow: hidden; 
        }
        .map-svg { width: 100%; height: 100%; }
        
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
          .map-body { grid-template-columns: 1fr 280px; }
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
          .map-info-panel { border-left: none; border-top: 1px solid rgba(188,19,254,0.1); max-height: 42vh; overflow-y: auto; }
          .node-title { font-size: 1.4rem; margin-bottom: 12px; }
        }
      `}</style>
    </div>
  );
};

export default MapView;

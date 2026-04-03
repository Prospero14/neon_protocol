import React, { useState, useRef } from 'react';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import { X, Search, MousePointer2 } from 'lucide-react';
import { type QuestState } from '../logic/questEngine';

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
}

const NODE_COLORS: Record<string, string> = {
  combat:   '#ff2d6d',
  bar:      'var(--neon-amethyst)',
  trade:    'var(--neon-amber)',
  story:    '#a78bfa',
  hub:      'var(--neon-cyan)',
  npc:      'var(--neon-amethyst)',
  shop:     'var(--neon-magenta)',
  terminal: '#00ffff',
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
}) => {
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const [selectedSubNodeId, setSelectedSubNodeId] = useState<string | null>(null);

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fix: The local scope state needs to be handled inside the functions below.
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.8), 3.0));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const activeDistrict = MAP_NODES.find(n => n.id === activeDistrictId) || MAP_NODES[0];
  const selectedSubNode = activeDistrict.subNodes?.find((s) => s.id === selectedSubNodeId) ?? null;

  const getTravelCost = (targetNode: MapNodeData) => {
    if (targetNode.id === activeDistrictId) return 0;
    const dist = Math.sqrt(Math.pow(targetNode.x - activeDistrict.x, 2) + Math.pow(targetNode.y - activeDistrict.y, 2));
    return Math.floor(dist * 2);
  };

  return (
    <div className="map-view-v4">
      <header className="map-hdr">
        <div className="map-hdr-left">
          <span className="map-hdr-icon">◎</span>
          <span className="map-hdr-title">МОСКВА_СЕТЕВОЙ_РАДАР</span>
          <span className="map-hdr-sub">// СКАНИРОВАНИЕ_АКТИВНО_[ZOOM:{Math.round(zoom * 100)}%]</span>
        </div>
        <div className="map-hdr-right">
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
          <button className="map-hdr-btn" onClick={resetView}>[ СБРОС_ОКНА ]</button>
          <button className="map-hdr-btn exit" onClick={onBack}><X size={14} /> [ ВЫХОД_В_ХАБ ]</button>
        </div>
      </header>

      <main className="map-body">
        <div 
          className="map-canvas-wrap"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          ref={containerRef}
        >
          <svg viewBox="0 0 100 100" className="map-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0, 255, 255, 0.05)" />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#radarGlow)" />
            
            <g className="radar-grid" opacity="0.1">
              {[...Array(11)].map((_, i) => (
                <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="var(--neon-cyan)" strokeWidth="0.05" />
              ))}
              {[...Array(11)].map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="var(--neon-cyan)" strokeWidth="0.05" />
              ))}
            </g>

            <line x1="50" y1="50" x2="50" y2="0" stroke="var(--neon-cyan)" strokeWidth="0.1" opacity="0.3" className="radar-sweep" />

            <g style={{ 
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                activeDistrict.subNodes?.map(sn => (
                  <g key={sn.id} onClick={() => setSelectedSubNodeId(sn.id)} style={{ cursor: 'pointer' }}>
                    <rect x={sn.x - 2} y={sn.y - 2} width="4" height="4" fill="none" stroke={NODE_COLORS[sn.type]} strokeWidth="0.1" opacity="0.1" />
                    <circle cx={sn.x} cy={sn.y} r={selectedSubNodeId === sn.id ? 1.5 : 1.0} fill={NODE_COLORS[sn.type] || '#fff'} />
                    <text x={sn.x} y={sn.y+3.5} fontSize="1.5" fill="#fff" textAnchor="middle" style={{fontFamily: 'monospace', fontWeight: 600}}>{sn.name.toUpperCase()}</text>
                  </g>
                ))
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
              <button className="btn-engage" onClick={() => onNodeSelect(selectedSubNode.id, selectedSubNode.type)}>
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
        .map-hdr {
          height: 60px; display: flex; justify-content: space-between; align-items: center;
          padding: 0 20px; background: rgba(0,20,20,0.8); border-bottom: 1px solid rgba(0,255,255,0.1);
        }
        .map-hdr-left { display: flex; align-items: center; gap: 15px; }
        .map-hdr-title { font-weight: 900; letter-spacing: 2px; color: var(--neon-cyan); }
        .map-hdr-sub { font-family: var(--font-mono); font-size: 0.65rem; opacity: 0.5; }
        .map-hdr-btn { 
          background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2); 
          color: #fff; padding: 6px 12px; font-family: var(--font-mono); font-size: 0.7rem;
          cursor: pointer; transition: 0.2s; margin-left: 8px;
        }
        .map-hdr-btn:hover { background: var(--neon-cyan); color: #000; }
        
        .map-body { flex: 1; display: grid; grid-template-columns: 1fr 350px; overflow: hidden; }
        .map-canvas-wrap { position: relative; background: radial-gradient(circle at 50% 50%, #001a1a 0%, #000 100%); cursor: crosshair; overflow: hidden; }
        .map-svg { width: 100%; height: 100%; }
        
        .radar-sweep { transform-origin: 50px 50px; animation: radar-rotate 5s linear infinite; }
        @keyframes radar-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .map-info-panel {
          background: rgba(0,10,10,0.9); border-left: 1px solid rgba(0,255,255,0.1);
          padding: 30px; display: flex; flex-direction: column;
        }
        .node-tag { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 900; margin-bottom: 8px; }
        .node-title { font-size: 1.8rem; margin-bottom: 15px; color: #fff; line-height: 1.1; }
        .node-desc { font-size: 0.9rem; color: #888; line-height: 1.6; margin-bottom: 2rem; }
        
        .tech-briefing { background: rgba(0,255,255,0.03); padding: 15px; border-left: 3px solid var(--neon-cyan); margin-bottom: 2rem; }
        .brief-label { font-size: 0.6rem; opacity: 0.5; margin-bottom: 10px; }
        .brief-stats { display: flex; flex-direction: column; gap: 5px; font-family: var(--font-mono); font-size: 0.65rem; color: var(--neon-cyan); margin-top: 10px; }
        
        .btn-engage {
          background: var(--neon-cyan); color: #000; font-family: var(--font-mono);
          font-weight: 900; padding: 15px; border: none; cursor: pointer; transition: 0.2s;
          letter-spacing: 1px;
        }
        .btn-engage:hover:not(.locked) { box-shadow: 0 0 20px var(--neon-cyan-glow); transform: translateY(-3px); }
        .btn-engage.locked { background: #333; color: #666; cursor: not-allowed; }
        
        .no-selection { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; color: #333; }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MapView;

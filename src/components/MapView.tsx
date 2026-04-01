import React, { useState, useRef } from 'react';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import { X, Search, MousePointer2 } from 'lucide-react';

interface MapViewProps {
  viewMode: 'CITY' | 'DISTRICT';
  activeDistrictId: string;
  isCityMapUnlocked: boolean;
  onNodeSelect: (nodeId: string, type: string, cost?: number) => void;
  onToggleView: () => void;
  onBack: () => void;
}

const NODE_COLORS: Record<string, string> = {
  combat: '#ff2d6d',
  bar:    '#00ffc8',
  trade:  '#ffaa00',
  story:  '#a78bfa',
  hub:    '#00c8ff',
};

const MapView: React.FC<MapViewProps> = ({ 
  viewMode, 
  activeDistrictId, 
  isCityMapUnlocked,
  onNodeSelect, 
  onBack,
  onToggleView
}) => {
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const [selectedSubNodeId, setSelectedSubNodeId] = useState<string | null>(null);
  // showLanding removed for instant activity access

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // Snap zoom: Toggle between 1x and 1.5x for clarity and reliability
    setZoom(prev => prev === 1 ? 1.5 : 1);
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const activeDistrict = MAP_NODES.find(n => n.id === activeDistrictId) || MAP_NODES[0];

  const getTravelCost = (targetNode: MapNodeData) => {
    if (targetNode.id === activeDistrictId) return 0;
    const dist = Math.sqrt(Math.pow(targetNode.x - activeDistrict.x, 2) + Math.pow(targetNode.y - activeDistrict.y, 2));
    return Math.floor(dist * 2); // 2 bits per unit distance
  };

  return (
    <div className="map-view-v4">
      {/* Header */}
      <div className="map-hdr">
        <div className="map-hdr-left">
          <span className="map-hdr-icon">◎</span>
          <span className="map-hdr-title">МОСКВА: СЕТЕВОЙ РАДАР</span>
          <span className="map-hdr-sub">// СКАНИРОВАНИЕ АКТИВНО [ZOOM: {Math.round(zoom * 100)}%]</span>
        </div>
        <div className="map-hdr-right">
          {viewMode === 'DISTRICT' && isCityMapUnlocked && (
             <button className="map-btn-util vibrancy" onClick={onToggleView}>
               <Search size={14} /> GLOBAL_MAP
             </button>
          )}
          {viewMode === 'CITY' && (
             <button className="map-btn-util vibrancy" onClick={onToggleView}>
               <MousePointer2 size={14} /> DISTRICT_VIEW
             </button>
          )}
          <button className="map-btn-util" onClick={resetView} title="RECENTER_SCANNER">
            <Search size={14} /> RECENTER
          </button>
          <button className="map-close-btn" onClick={onBack}>
            <X size={18} /> BACK_TO_HUB
          </button>
        </div>
      </div>

      <div className="map-body">
        {/* SVG MAP with Zoom/Pan */}
        <div 
          className="map-canvas-wrap"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          ref={containerRef}
        >
          <svg
            viewBox="0 0 100 100"
            className="map-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              className="map-transform-layer"
              style={{ 
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {viewMode === 'CITY' ? (
                <>
                  {/* Global Map Layers */}
                  <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(0,255,255,0.06)" strokeWidth="0.2" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0,255,255,0.10)" strokeWidth="0.4" />
                  
                  {MAP_NODES.map(node => {
                    const color = NODE_COLORS[node.type] || '#aaa';
                    const isCurrent = activeDistrictId === node.id;
                    
                    return (
                      <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                         <circle cx={node.x} cy={node.y} r={isCurrent ? 3 : 1.8} fill={isCurrent ? 'var(--neon-cyan)' : color} opacity={0.3} />
                         <circle cx={node.x} cy={node.y} r={1.2} fill={color} />
                         <text x={node.x} y={node.y+4} fontSize="1.5" fill="#fff" textAnchor="middle">{node.name.split(':')[0]}</text>
                      </g>
                    );
                  })}
                </>
              ) : (
                <>
                  {/* District Grid */}
                  <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.4)" stroke="rgba(0,255,255,0.1)" strokeWidth="0.5" />
                  {Array(10).fill(0).map((_, i) => (
                    <line key={i} x1={i*10} y1="0" x2={i*10} y2="100" stroke="rgba(0,255,255,0.05)" strokeWidth="0.1" />
                  ))}
                  {Array(10).fill(0).map((_, i) => (
                    <line key={i} x1="0" y1={i*10} x2="100" y2={i*10} stroke="rgba(0,255,255,0.05)" strokeWidth="0.1" />
                  ))}

                  {/* District SubNodes */}
                  {activeDistrict.subNodes?.map(sn => (
                    <g key={sn.id} onClick={() => setSelectedSubNodeId(sn.id)} style={{ cursor: 'pointer' }}>
                      <circle cx={sn.x} cy={sn.y} r="2.5" fill={NODE_COLORS[sn.type] || '#fff'} opacity="0.4" className="animate-pulse" />
                      <circle cx={sn.x} cy={sn.y} r="1.2" fill={NODE_COLORS[sn.type] || '#fff'} />
                      <text x={sn.x} y={sn.y-3} fontSize="2.5" fill="#fff" textAnchor="middle" style={{fontWeight: 900}}>{sn.name}</text>
                    </g>
                  ))}
                </>
              )}
            </g>
          </svg>

          {/* Landing Overlay Removed */}
        </div>

        {/* Info Side Panel */}
        <div className="map-info-panel">
          {viewMode === 'CITY' && selectedNode ? (
            <>
              <div className="map-node-type" style={{ color: NODE_COLORS[selectedNode.type] }}>
                {selectedNode.type.toUpperCase()} | TIER {selectedNode.tier}
              </div>
              <h2 className="map-node-name">{selectedNode.name}</h2>
              <p className="map-node-desc">{selectedNode.description}</p>
              
              <div className="travel-cost-box">
                 <span className="lbl">TRAVEL_COST:</span>
                 <span className="val gold">{getTravelCost(selectedNode)} BITS</span>
              </div>

              <button 
                className="map-enter-confirm" 
                onClick={() => onNodeSelect(selectedNode.id, 'district', getTravelCost(selectedNode))}
                style={{ borderColor: NODE_COLORS[selectedNode.type], color: NODE_COLORS[selectedNode.type] }}
              >
                INITIATE_FAST_TRAVEL
              </button>
            </>
          ) : viewMode === 'DISTRICT' && selectedSubNodeId ? (
            (() => {
              const sn = activeDistrict.subNodes?.find(s => s.id === selectedSubNodeId);
              if (!sn) return null;
              return (
                <>
                  <div className="map-node-type" style={{ color: NODE_COLORS[sn.type] }}>
                    {sn.type.toUpperCase()}
                  </div>
                  <h2 className="map-node-name">{sn.name}</h2>
                  <p className="map-node-desc">{sn.description}</p>

                  <button 
                    className="map-enter-confirm vibrancy" 
                    onClick={() => onNodeSelect(sn.id, sn.type)}
                    style={{ borderColor: NODE_COLORS[sn.type] }}
                  >
                    ENGAGE_SUB_NODE
                  </button>
                </>
              );
            })()
          ) : viewMode === 'DISTRICT' && !isCityMapUnlocked ? (
            <div className="map-no-selection">
              <h3 className="neon-text">LOCAL_LOCKDOWN</h3>
              <p>Вы заперты в {activeDistrict.name.split(':')[0]}. Чтобы разблокировать карту города, найдите Терминал такси.</p>
              <div className="activity-item compact" onClick={() => onNodeSelect('UNLOCK_CITY', 'terminal')}>
                <div className="activity-icon-mini"><Search size={14} /></div>
                <div className="activity-info">
                   <span className="activity-name">ВЗЛОМАТЬ КАРТУ (DEV_HACK)</span>
                   <span className="activity-sub">Принудительная разблокировка</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="map-no-selection">
              <MousePointer2 size={40} className="map-no-sel-icon" />
              <div className="map-no-sel-text" style={{ marginBottom: '20px' }}>
                {viewMode === 'CITY' ? 'ВЫБЕРИТЕ РАЙОН' : 'ВЫБЕРИТЕ ТОЧКУ В РАЙОНЕ'}
              </div>
              
              {viewMode === 'DISTRICT' && (
                <div className="activity-list-container">
                  <div className="activity-list-title">АКТИВНОСТИ_РАЙОНА:</div>
                  <div className="activity-list-scroll">
                    {activeDistrict.subNodes?.map(sn => (
                      <div 
                        key={sn.id} 
                        className={`activity-list-item ${selectedSubNodeId === sn.id ? 'active' : ''}`}
                        onClick={() => setSelectedSubNodeId(sn.id)}
                      >
                         <div className="activity-list-icon" style={{ backgroundColor: NODE_COLORS[sn.type] }}></div>
                         <div className="activity-list-info">
                            <div className="activity-list-name">{sn.name}</div>
                            <div className="activity-list-type">{sn.type.toUpperCase()}</div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;

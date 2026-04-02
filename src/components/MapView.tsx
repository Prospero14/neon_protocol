import React, { useState, useRef } from 'react';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import { X, Search, MousePointer2 } from 'lucide-react';
import type { QuestDefinition } from '../logic/questData';
import type { QuestState } from '../logic/questEngine';

interface MapViewProps {
  viewMode: 'CITY' | 'DISTRICT';
  activeDistrictId: string;
  isCityMapUnlocked: boolean;
  onNodeSelect: (nodeId: string, type: string, cost?: number) => void;
  onToggleView: () => void;
  onBack: () => void;
  getNpcQuests?: (npcId: string) => QuestDefinition[];
  questStates?: QuestState[];
  onAcceptQuest?: (questId: string) => void;
  onTrackQuest?: (questId: string) => void;
  onCompleteTalkQuest?: (questId: string) => void;
  trackedQuestId?: string | null;
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
  onToggleView,
  getNpcQuests,
  questStates = [],
  onAcceptQuest,
  onTrackQuest,
  onCompleteTalkQuest,
  trackedQuestId = null,
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
  const selectedSubNode = activeDistrict.subNodes?.find((s) => s.id === selectedSubNodeId) ?? null;
  const selectedNpcQuests =
    selectedSubNode?.type === 'npc' && getNpcQuests ? getNpcQuests(selectedSubNode.id) : [];
  const getQuestState = (questId: string) => questStates.find((s) => s.questId === questId);

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
                  {/* District Contours (Visual Clusters) */}
                  <g className="map-contours">
                    {/* NORTH SECTOR */}
                    <path d="M 15 5 L 60 5 L 65 35 L 45 40 Z" className="map-district-outline" />
                    {/* EAST SECTOR */}
                    <path d="M 65 15 L 95 20 L 95 55 L 75 60 Z" className="map-district-outline" />
                    {/* SOUTH-EAST */}
                    <path d="M 70 55 L 95 65 L 95 95 L 65 95 Z" className="map-district-outline" />
                    {/* SOUTH */}
                    <path d="M 40 70 L 65 70 L 70 95 L 35 95 Z" className="map-district-outline" />
                    {/* SOUTH-WEST / WEST */}
                    <path d="M 5 40 L 40 40 L 35 95 L 5 95 Z" className="map-district-outline" />
                  </g>

                  {/* Global Map Layers */}
                  <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(0,255,255,0.04)" strokeWidth="0.1" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0,255,255,0.06)" strokeWidth="0.2" />
                  
                  {MAP_NODES.map(node => {
                    const color = NODE_COLORS[node.type] || '#aaa';
                    const isCurrent = activeDistrictId === node.id;
                    const isSelected = selectedNode?.id === node.id;
                    
                    return (
                      <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                         <circle 
                           cx={node.x} cy={node.y} 
                           r={isSelected ? 2.5 : isCurrent ? 1.5 : 1.2} 
                           fill={isSelected ? '#fff' : isCurrent ? 'var(--neon-cyan)' : color} 
                           className="map-node-dot"
                           style={{ color }}
                         />
                         {isSelected && (
                           <circle cx={node.x} cy={node.y} r="4" fill="none" stroke="#fff" strokeWidth="0.2" opacity="0.5" className="animate-ping" />
                         )}
                         <text x={node.x} y={node.y+4} fontSize="1.2" fill={isSelected ? "#fff" : "rgba(255,255,255,0.5)"} textAnchor="middle" style={{ pointerEvents: 'none', border: '1px solid black' }}>
                           {node.name.split(':')[0]}
                         </text>
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

              <div 
                className="vertical-confirm-bar"
                onClick={() => onNodeSelect(selectedNode.id, 'district', getTravelCost(selectedNode))}
              >
                [ INITIATE_FAST_TRAVEL ]
              </div>
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

                  <div 
                    className="vertical-confirm-bar vibrancy" 
                    onClick={() => onNodeSelect(sn.id, sn.type)}
                  >
                    [ ENGAGE_SUB_NODE ]
                  </div>

                  {sn.type === 'npc' && selectedNpcQuests.length > 0 && (
                    <div className="map-quest-panel">
                      <div className="map-quest-title">NPC_CONTRACTS</div>
                      {selectedNpcQuests.slice(0, 4).map((q) => {
                        const state = getQuestState(q.id);
                        const status = state?.status ?? 'available';
                        return (
                          <div key={q.id} className="map-quest-item">
                            <div className="map-quest-row">
                              <span>{q.title}</span>
                              <span className={`map-quest-status ${status}`}>{status.toUpperCase()}</span>
                            </div>
                            <div className="map-quest-actions">
                              {status !== 'active' && status !== 'completed' && onAcceptQuest && (
                                <button className="map-mini-btn" onClick={() => onAcceptQuest(q.id)}>ACCEPT</button>
                              )}
                              {status === 'active' && onTrackQuest && (
                                <button className="map-mini-btn" onClick={() => onTrackQuest(q.id)}>
                                  {trackedQuestId === q.id ? 'TRACKED' : 'TRACK'}
                                </button>
                              )}
                              {status === 'active' && q.type === 'talk' && onCompleteTalkQuest && (
                                <button className="map-mini-btn" onClick={() => onCompleteTalkQuest(q.id)}>COMPLETE</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

import React, { useState, useRef } from 'react';
import type { MapNodeData } from '../logic/mapData';
import { MAP_NODES } from '../logic/mapData';
import { X, Search, MousePointer2 } from 'lucide-react';
import type { QuestDefinition } from '../logic/questData';
import type { QuestState } from '../logic/questEngine';
import { baseQuestBits } from '../logic/economy';

interface MapViewProps {
  viewMode: 'CITY' | 'DISTRICT';
  activeDistrictId: string;
  isCityMapUnlocked: boolean;
  onNodeSelect: (nodeId: string, type: string, cost?: number) => void;
  onToggleView: () => void;
  onBack: () => void;
  getNpcQuests?: (npcId: string) => QuestDefinition[];
  questStates?: QuestState[];
  onAcceptQuest?: (npcId: string, questId?: string) => void;
  onTrackQuest?: (questId: string) => void;
  onCompleteTalkQuest?: (questId: string) => void;
  trackedQuestId?: string | null;
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
  getNpcQuests,
  questStates = [],
  onAcceptQuest,
  onTrackQuest,
  onCompleteTalkQuest,
  trackedQuestId = null,
  objectiveNodeId = null,
  playerBits = 0,
}) => {
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const [selectedSubNodeId, setSelectedSubNodeId] = useState<string | null>(null);
  const [briefingQuest, setBriefingQuest] = useState<{ snId: string, q: QuestDefinition } | null>(null);
  // showLanding removed for instant activity access

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    setZoom(prev => {
      const next = prev + delta;
      return Math.min(Math.max(next, 0.8), 3.0);
    });
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
             <button className="map-hdr-btn" onClick={onToggleView}>
               <Search size={14} /> GLOBAL_MAP
             </button>
          )}
          {viewMode === 'CITY' && (
             <button className="map-hdr-btn" onClick={onToggleView}>
               <MousePointer2 size={14} /> DISTRICT_VIEW
             </button>
          )}
          <button className="map-hdr-btn" onClick={resetView}>
            <Search size={14} /> RECENTER
          </button>
          <button className="map-hdr-btn" onClick={onBack}>
            <X size={14} /> BACK_TO_HUB
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
                    const isObjective = objectiveNodeId === node.id;
                    
                    return (
                      <g 
                        key={node.id} 
                        onClick={() => setSelectedNode(node)} 
                        onDoubleClick={() => onNodeSelect(node.id, 'district', getTravelCost(node))}
                        style={{ cursor: 'pointer' }}
                      >
                         {isCurrent && (
                           <g className="player-loc-marker">
                             <circle cx={node.x} cy={node.y} r="4" fill="none" stroke="var(--neon-cyan)" strokeWidth="0.3" className="animate-pulse" style={{ animation: 'mission-pulse 2s infinite' }} />
                             <circle cx={node.x} cy={node.y} r="6" fill="none" stroke="var(--neon-cyan)" strokeWidth="0.1" opacity="0.3" className="animate-ping" />
                           </g>
                         )}
                         <circle 
                           cx={node.x} cy={node.y} 
                           r={isSelected ? 2.5 : isCurrent ? 1.5 : 1.2} 
                           fill={isSelected ? '#fff' : isCurrent ? 'var(--neon-cyan)' : color} 
                           className={`map-node-dot ${isObjective ? 'mission-target' : ''}`}
                           style={{ color }}
                         />
                         {isObjective && (
                           <circle cx={node.x} cy={node.y} r="5" fill="none" stroke="var(--neon-amethyst)" strokeWidth="0.5" className="animate-pulse" style={{ animation: 'mission-pulse 1.5s infinite' }} />
                         )}
                         {(isSelected || isObjective) && (
                           <circle cx={node.x} cy={node.y} r="4" fill="none" stroke={isObjective ? "var(--neon-amethyst)" : "#fff"} strokeWidth="0.2" opacity="0.5" className="animate-ping" />
                         )}
                         <text x={node.x} y={node.y+5} fontSize="1.4" fill={isObjective ? "var(--neon-amethyst)" : isSelected ? "#fff" : "rgba(255,255,255,0.5)"} textAnchor="middle" style={{ pointerEvents: 'none', fontWeight: isObjective ? 900 : 400 }}>
                           {isObjective ? `[ MISSION ] ${node.name.split(':')[0]}` : node.name.split(':')[0]}
                         </text>
                         {isCurrent && (
                           <text x={node.x} y={node.y-4} fontSize="1.0" fill="var(--neon-cyan)" textAnchor="middle" style={{ fontWeight: 800 }}>YOU_ARE_HERE</text>
                         )}
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
                      <circle cx={sn.x} cy={sn.y} r="1.5" fill={NODE_COLORS[sn.type] || '#fff'} opacity="0.4" className="animate-pulse" />
                      <circle cx={sn.x} cy={sn.y} r="0.7" fill={NODE_COLORS[sn.type] || '#fff'} />
                      <text x={sn.x} y={sn.y-2.5} fontSize="1.7" fill="#fff" textAnchor="middle" style={{fontWeight: 900}}>{sn.name}</text>
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
                className={`btn-premium-engage ${playerBits < getTravelCost(selectedNode) ? 'locked' : ''}`}
                onClick={() => playerBits >= getTravelCost(selectedNode) && onNodeSelect(selectedNode.id, 'district', getTravelCost(selectedNode))}
              >
                {selectedNode.id === activeDistrictId ? 'RETURN_TO_DISTRICT' : playerBits < getTravelCost(selectedNode) ? 'INSUFFICIENT_CREDITS' : 'INITIATE_FAST_TRAVEL'}
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
                  <div className="map-node-briefing neon-panel">
                     <div className="briefing-label mono-text">TACTICAL_SCAN_RESULTS:</div>
                     <p className="map-node-desc">{sn.description}</p>
                     <div className="briefing-stats">
                        <div className="stat">SECURITY: <span className="val">{activeDistrict.tier > 2 ? 'HIGH' : 'LOW'}</span></div>
                        <div className="stat">SIGNAL: <span className="val">STABLE</span></div>
                     </div>
                  </div>

                  <div className="map-action-zone">
                    {sn.type === 'combat' && (
                      <button className="btn-premium-engage" onClick={() => onNodeSelect(sn.id, 'combat')}>
                         [ INITIATE_COMBAT_SEQUENCE ]
                      </button>
                    )}
                    {sn.type === 'shop' && (
                      <button className="btn-premium-engage" onClick={() => onNodeSelect(sn.id, 'shop')}>
                         [ ACCESS_VENDOR_PROTOCOL ]
                      </button>
                    )}
                    {sn.type === 'bar' && (
                      <button className="btn-premium-engage" onClick={() => onNodeSelect(sn.id, 'bar')}>
                         [ ENTER_ESTABLISHMENT ]
                      </button>
                    )}
                    {sn.type === 'terminal' && (
                      <button className="btn-premium-engage" onClick={() => onNodeSelect(sn.id, 'terminal')}>
                         [ CONNECT_TO_NODE ]
                      </button>
                    )}
                  </div>

                  {sn.type === 'npc' && (
                    <div className="map-quest-panel">
                      <div className="map-quest-title">NPC_CONTRACTS</div>
                      <div className="map-quest-item talk-option">
                        <div className="map-quest-row">
                           <span className="gold">[ TALK / INQUIRY ]</span>
                           <span className="map-quest-status available">ACTIVE_LINK</span>
                        </div>
                        <div className="map-quest-actions">
                           <button className="map-mini-btn talk" onClick={() => onAcceptQuest?.(sn.id)}>ESTABLISH_COMM</button>
                        </div>
                      </div>
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
                                <button className="map-mini-btn" onClick={() => setBriefingQuest({ snId: sn.id, q: q })}>ACCEPT</button>
                              )}
                              {status === 'active' && onTrackQuest && (
                                <button className="map-mini-btn" onClick={() => onTrackQuest(q.id)}>
                                  {trackedQuestId === q.id ? 'TRACKED' : 'TRACK'}
                                </button>
                              )}
                              {status === 'active' && q.type === 'talk' && (
                                <button className="map-mini-btn talk" onClick={() => onNodeSelect(sn.id, 'npc')}>ESTABLISH_COMM</button>
                              )}
                              {status === 'active' && q.type === 'diagnostics' && (
                                <button className="map-mini-btn diag" onClick={() => onNodeSelect(sn.id, sn.type)}>RUN_DIAGNOSTICS</button>
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
      {/* QUEST_BRIEFING_OVERLAY */}
      {briefingQuest && (
        <div className="briefing-overlay" onClick={() => setBriefingQuest(null)}>
           <div className="briefing-modal neon-panel arctic-monolith animate-scale-up" onClick={e => e.stopPropagation()}>
              <div className="briefing-header">
                 <div className="briefing-tag mono-text">INCOMING_CONTRACT_BRIEFING</div>
                 <h2 className="neon-text glow-cyan">{briefingQuest.q.title}</h2>
              </div>
              <div className="briefing-body">
                 <p className="briefing-story mono-text">{briefingQuest.q.description}</p>
                 <div className="briefing-meta">
                    <div className="meta-item">
                       <span className="label">REWARD:</span>
                       <span className="val glow-amber">ƀ{baseQuestBits(briefingQuest.q.tier, briefingQuest.q.difficulty)}</span>
                    </div>
                    <div className="meta-item">
                       <span className="label">TYPE:</span>
                       <span className="val">{briefingQuest.q.type.toUpperCase()}</span>
                    </div>
                 </div>
              </div>
              <div className="briefing-actions">
                 <button className="btn-briefing accept" onClick={() => {
                   onAcceptQuest?.(briefingQuest.snId, briefingQuest.q.id);
                   setBriefingQuest(null);
                 }}>
                   <span className="b-bracket">[</span>
                   <span className="b-text">ESTABLISH_CONTRACT</span>
                   <span className="b-bracket">]</span>
                 </button>
                 <button className="btn-briefing abort" onClick={() => setBriefingQuest(null)}>
                   <span className="b-bracket">[</span>
                   <span className="b-text">ABORT_COMM</span>
                   <span className="b-bracket">]</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .briefing-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .briefing-modal { width: 100%; max-width: 500px; padding: 2rem; border-left: 4px solid var(--neon-cyan); }
        .briefing-tag { font-size: 0.6rem; opacity: 0.5; margin-bottom: 10px; letter-spacing: 0.2em; }
        .briefing-story { font-size: 0.85rem; line-height: 1.6; color: #ccc; margin: 1.5rem 0; background: rgba(0,255,255,0.03); padding: 15px; border-radius: 4px; }
        .briefing-meta { display: flex; gap: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-bottom: 2rem; }
        .meta-item .label { font-size: 0.6rem; display: block; opacity: 0.5; }
        .meta-item .val { font-size: 0.9rem; font-weight: bold; font-family: var(--font-mono); }
        .briefing-actions { display: flex; gap: 15px; margin-top: 10px; }
        .btn-briefing {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(0,255,255,0.2);
          color: var(--neon-cyan);
          padding: 10px 18px;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          cursor: pointer;
          transition: 0.2s;
          border-radius: 4px;
          position: relative;
        }
        .btn-briefing:hover {
          background: rgba(0,255,255,0.1);
          border-color: var(--neon-cyan);
          box-shadow: 0 0 15px rgba(0,255,255,0.2);
          transform: translateY(-2px);
        }
        .btn-briefing.abort {
          border-color: rgba(255,255,255,0.1);
          color: #777;
        }
        .btn-briefing.abort:hover {
          border-color: #999;
          color: #fff;
          background: rgba(255,255,255,0.05);
        }
        .b-bracket { font-weight: 100; color: var(--neon-cyan); opacity: 0.5; font-size: 1.1rem; }
        .btn-briefing.abort .b-bracket { color: #555; }
        .b-text { letter-spacing: 2px; font-weight: 700; }
        .map-mini-btn.talk { border-color: var(--neon-amber); color: var(--neon-amber); }
        .map-mini-btn.diag { border-color: var(--neon-green); color: var(--neon-green); }
        
        .map-node-briefing {
          background: rgba(0,255,255,0.02);
          padding: 15px;
          margin: 15px 0;
          border-left: 2px solid var(--neon-cyan);
        }
        .briefing-label { font-size: 0.6rem; opacity: 0.5; margin-bottom: 8px; letter-spacing: 1px; }
        .briefing-stats { display: flex; gap: 15px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; }
        .briefing-stats .stat { font-size: 0.65rem; color: #888; font-family: var(--font-mono); }
        .briefing-stats .val { color: var(--neon-cyan); font-weight: bold; }
        
        .map-action-zone { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
        
        .animate-scale-up { animation: scaleUp 0.2s ease-out; }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MapView;

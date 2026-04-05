import React from 'react';
import { Shield, Zap, Layout, ChevronRight, Award, Database, Globe, MapPin, User } from 'lucide-react';
import type { MapNodeData } from '../../logic/mapData';
import type { Profession } from '../../logic/professions';
import { QUEST_LIBRARY } from '../../logic/questData';
import type { QuestState } from '../../logic/questEngine';
import type { CombatCard } from '../../logic/combatCards';

interface HubViewProps {
  playerName: string;
  homeDistrict: MapNodeData | null;
  stress: number;
  maxStress: number;
  deckCores: number;
  deckRamMb: number;
  bits: number;
  classUnlocked: boolean;
  profession: Profession;
  solvedTaskCounts: Record<string, number>;
  completedQuestCount: number;
  bitsFromQuests: number;
  canUnlockNow: boolean;
  activeDeck: CombatCard[];
  inventoryUnique: CombatCard[];
  questStates: QuestState[];
  onNavigateToView: (view: string) => void;
  onNavigateToBarNode: (nodeId: string) => void;
}

const PRECLASS_UNLOCK_QUESTS = 2;
const PRECLASS_UNLOCK_BITS = 100;

export const HubView: React.FC<HubViewProps> = ({
  playerName,
  homeDistrict,
  stress,
  maxStress,
  deckCores,
  deckRamMb,
  bits,
  classUnlocked,
  profession,
  solvedTaskCounts,
  completedQuestCount,
  bitsFromQuests,
  canUnlockNow,
  activeDeck,
  inventoryUnique,
  questStates,
  onNavigateToView,
  onNavigateToBarNode
}) => {
  return (
    <div className="hub-v4-view animate-float">
      <header className="hub-header-v4">
        <div className="brand-box">
          <h1 className="neon-text glow-green">MOSCOW_ZERO <span className="mvp-tag">[NEURAL_PROTO_0.09]</span></h1>
          <div className="meta-line mono-text">
            <span className="meta-item"><MapPin size={12} /> {homeDistrict?.name.split(':')[0] || 'SAFE_HOUSE_04'}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item"><User size={12} /> {playerName}</span>
          </div>
        </div>
        <div className="hub-top-stats">
          <div className="top-stat arctic-monolith">
            <div className="hub-stat-v4">
              <span className="stat-label">NEURAL_STRESS</span>
              <div className="stat-bar-v4 large">
                <div className="stat-fill-v4 stress" style={{width: `${Math.min(100, Math.round((stress/maxStress)*100))}%`}}></div>
                <span className="stat-value">{Math.min(100, Math.round((stress/maxStress)*100))}%</span>
              </div>
            </div>
            <div className="hub-stat-v4" title="МОЩНОСТЬ ДЕКИ (ЦПУ)">
              <span className="stat-label">DECK_POWER (CPU)</span>
              <div className="stat-bar-v4">
                <div className="stat-fill-v4 cpu" style={{width: `100%`}}></div>
                <span className="stat-value">{deckCores.toFixed(1)} CORES</span>
              </div>
            </div>
            <div className="hub-stat-v4" title="МОЩНОСТЬ ДЕКИ (RAM)">
              <span className="stat-label">RAM_CAPACITY</span>
              <div className="stat-bar-v4">
                <div className="stat-fill-v4 ram" style={{width: `${(deckRamMb/8192)*100}%`}}></div>
                <span className="stat-value">{deckRamMb >= 1024 ? `${(deckRamMb/1024).toFixed(1)} GiB` : `${deckRamMb} MiB`}</span>
              </div>
            </div>
            <div className="val pulse-amber">ƀ{bits}</div>
          </div>
        </div>
      </header>

      <div className="hub-grid-v4">
        <div className="hub-col identity">
          <div className="col-header mono-text"><Shield size={14} /> IDENTITY_MODULE</div>
          <div className="neon-panel interactive arctic-monolith stat-card-v4" onClick={() => onNavigateToView('CHARACTER')}>
            <div className="card-inner">
              <div className="prof-tag">{classUnlocked ? profession.name : "SCRIPT-KIDDO"}</div>
               <div className="main-stat-row">
                  <div className="avatar-mini"><User size={32} /></div>
                  <div className="hp-ring">
                     <div className="hp-val">{Math.round((stress/maxStress)*100)}%</div>
                     <div className="hp-label">STRESS_LEVEL</div>
                  </div>
               </div>
               <div className="progress-mini">
                  <div className="prog-labels">
                    <span>SOLVED_TASKS_SUMMARY</span>
                    <span className="gold">[{Object.values(solvedTaskCounts).reduce((a, b) => a + b, 0)}]</span>
                  </div>
                  <div className="task-mini-grid">
                     <div className="task-mini-item">KIDDIE: {solvedTaskCounts['script-kiddie']}</div>
                     <div className="task-mini-item">JUNIOR: {solvedTaskCounts['junior']}</div>
                     <div className="task-mini-item">MIDDLE: {solvedTaskCounts['mid']}</div>
                     <div className="task-mini-item">SENIOR: {solvedTaskCounts['senior']}</div>
                  </div>
               </div>
            </div>
          </div>
          {!classUnlocked && (
            <div className="progression-gate neon-panel">
              <div className="gate-label">ТРЕБОВАНИЯ_КЛАССА:</div>
              <div className="gate-stats">
                <span>MISSIONS: {completedQuestCount}/{PRECLASS_UNLOCK_QUESTS}</span>
                <span>BITS_EARNED: {bitsFromQuests}/{PRECLASS_UNLOCK_BITS}</span>
              </div>
              {canUnlockNow && (
                 <button className="neon-border-btn glow-cyan pulse" onClick={() => onNavigateToBarNode('npc_professor')}>SET_SPECIALIZATION</button>
              )}
            </div>
          )}
        </div>

        <div className="hub-col operations">
           <div className="col-header mono-text"><Zap size={14} /> OPERATIONS_HUB</div>
           <div className="neon-panel interactive op-card map-lnk glow-cyan" onClick={() => onNavigateToView('MAP')}>
              <div className="op-icon"><Layout size={32} /></div>
              <div className="op-text">
                 <div className="op-title">NEURAL_MAP</div>
                 <div className="op-sub">Navigate Moscow Grid</div>
              </div>
              <ChevronRight className="op-arrow" />
           </div>
           <div className="neon-panel interactive op-card deck-lnk" onClick={() => onNavigateToView('DECK_BUILDER')}>
              <div className="op-icon"><Database size={32} /></div>
              <div className="op-text">
                 <div className="op-title">DECK_CONSTRUCTOR</div>
                 <div className="op-sub">{activeDeck.length}/30 Modules Loaded</div>
              </div>
              <ChevronRight className="op-arrow" />
           </div>
           <div className="neon-panel interactive op-card intel-lnk glow-amber" onClick={() => onNavigateToView('INTEL')}>
              <div className="op-icon"><Globe size={32} /></div>
              <div className="op-text">
                 <div className="op-title">INTEL_FEED [ИНФОСВОДКА]</div>
                 <div className="op-sub">Faction Lore & Recognition</div>
              </div>
              <ChevronRight className="op-arrow" />
           </div>
        </div>

        <div className="hub-col intel">
           <div className="active-quest-preview neon-panel">
              <div className="intel-header">
                 <div className="intel-title">CONTRACT_BACKLOG</div>
                 <Award size={14} color="var(--neon-amber)" />
              </div>
              <div className="hub-backlog-list mono-text">
                 {questStates.length === 0 && <div className="q-none opacity-50">NO_DATA_FOUND</div>}
                 {questStates.filter(s => s.status !== 'completed').slice(-2).reverse().map(s => {
                   const q = QUEST_LIBRARY.find(x => x.id === s.questId);
                   return (
                     <div key={s.questId} className="backlog-entry active">
                        <div className="b-header">
                           <span className="b-status pulse-cyan">[АКТИВЕН]</span>
                           <span className="b-title">{q?.title.split(']')[1] || q?.title}</span>
                        </div>
                        <div className="b-body">{q?.description}</div>
                     </div>
                   );
                 })}
                 {questStates.filter(s => s.status === 'completed').length > 0 && questStates.filter(s => s.status === 'active').length === 0 && (
                   (() => {
                      const s = questStates.filter(s => s.status === 'completed').slice(-1)[0];
                      const q = QUEST_LIBRARY.find(x => x.id === s.questId);
                      return (
                        <div className="backlog-entry completed">
                           <div className="b-header">
                              <span className="b-status">[ГОТОВО]</span>
                              <span className="b-title">{q?.title.split(']')[1] || q?.title}</span>
                           </div>
                        </div>
                      );
                   })()
                 )}
              </div>
           </div>
           <div className="neon-panel interactive intel-card" style={{ marginTop: '15px' }} onClick={() => onNavigateToView('REFERENCE')}>
              <div className="intel-header">
                 <div className="intel-title">DOCUMENTATION</div>
                 <div className="intel-count gold">{inventoryUnique.length}</div>
              </div>
              <p className="intel-desc mono-text">LIBRARIES_OPENED / ARCHED_CONCEPTS</p>
           </div>
        </div>
      </div>
    </div>
  );
};

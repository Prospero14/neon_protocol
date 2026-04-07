import React from 'react';
import type { CombatPhase } from '../../../logic/combatPhases';
import type { CombatCard } from '../../../logic/combatCards';
import type { RailSlot } from '../../../logic/hooks/useCombatLogic';
import { Database, ShieldAlert, Terminal } from 'lucide-react';

interface NeuralBusProps {
  currentPhase: CombatPhase;
  skillMode: string;
  infraSlots: (CombatCard | null)[];
  softSlots: (CombatCard | null)[];
  runtimeRail: RailSlot[];
  ramSlotsMax: number;
  missionTzStepsCount: number;
  enemy: any;
  onExecuteCardOnSlot: (idx: number) => void;
}

const NeuralBus: React.FC<NeuralBusProps> = ({
  currentPhase, skillMode, infraSlots, softSlots, runtimeRail, ramSlotsMax, missionTzStepsCount, enemy, onExecuteCardOnSlot
}) => {
  return (
    <main className="combat-workspace">
      <div className="ws-enemy">
        <div className="enemy-avatar-wrap">
          {enemy?.visualType === 'AI' && <Database className="enemy-avatar ai animate-flicker" size={40} />}
          {enemy?.visualType === 'ICE' && <ShieldAlert className="enemy-avatar ice pulse-red" size={40} />}
          {enemy?.visualType === 'DEVELOPER' && <Terminal className="enemy-avatar dev glow-green" size={40} />}
        </div>
        <div className="enemy-rail">
          {runtimeRail.slice(0, 5).map((slot, i) => (
            <div key={i} className={`enemy-slot ${slot.type !== 'EMPTY' ? 'active pulse-amber' : ''}`}>
               <span className="enemy-slot-label">0x0{i+1}</span>
               <span className="enemy-slot-name">{slot.content?.name || '---'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ws-main-stage">
        {(currentPhase === 'ARCHITECTURE' && skillMode !== 'script-kiddie') ? (
          <div className="planning-view animate-fade-in">
            <div className="sb-title">INFRASTRUCTURE_RESOURCES</div>
            <div className="pipeline-track wrap">
              {infraSlots.map((s, i) => (
                <div key={i} className={`pipeline-stage infra ${s ? 'active glow-cyan' : ''}`}>
                  <span className="stage-label">{s ? 'DEPLOYED' : 'UNDEPLOYED'}</span>
                  <span className="stage-name">{s ? s.name : `SLOT_0${i+1}`}</span>
                </div>
              ))}
            </div>
            <div className="sb-title" style={{ marginTop: '20px' }}>NEURAL_BUFFER_EXTENSIONS (SOFT)</div>
            <div className="pipeline-track">
              {softSlots.map((s, i) => (
                <div key={i} className={`pipeline-stage soft ${s ? 'active glow-amber' : ''}`}>
                  <span className="stage-label">{s ? 'ATTACHED' : 'UNAVAILABLE'}</span>
                  <span className="stage-name">{s ? s.name : `SOCKET_0${i+1}`}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="coding-view animate-fade-in">
            <div className="sb-title">NEURAL_BUS_PIPELINE</div>
            <div className="pipeline-track datastream">
              {runtimeRail.map((slot, i) => {
                const isLocked = i >= ramSlotsMax;
                const isCriticallyLocked = isLocked && i < missionTzStepsCount;
                return (
                  <div 
                    key={i} 
                    className={`pipeline-stage ${isLocked ? 'locked' : ''} ${isCriticallyLocked ? 'critical-lock shadow-red' : ''} ${slot.type !== 'EMPTY' ? 'active' : ''}`}
                    onClick={() => !isLocked && onExecuteCardOnSlot(i)}
                  >
                    <span className="stage-name">
                      {isLocked ? (isCriticallyLocked ? 'INSUFFICIENT_RAM' : 'LOCKED') : (slot.type === 'EMPTY' ? `0x0${i+1}` : (slot.content as any).name)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default NeuralBus;

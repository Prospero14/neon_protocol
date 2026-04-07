import React from 'react';
import { ShieldAlert, Zap, Database } from 'lucide-react';
import { SDLC_PHASES } from '../../../logic/combatPhases';
import type { CombatPhase } from '../../../logic/combatPhases';

interface CombatSidebarProps {
  currentPhase: CombatPhase;
  stress: number;
  cpu: number;
  cpuMax: number;
  ramMaxMb: number;
  log: string[];
  isPlayerTurn: boolean;
  canAdvancePhase: boolean;
  onAdvancePhase: () => void;
  onEndTurn: () => void;
  onOverclock: () => void;
  onTerminate: () => void;
}

const CombatSidebar: React.FC<CombatSidebarProps> = ({
  currentPhase, stress, cpu, ramMaxMb, log, isPlayerTurn,
  canAdvancePhase, onAdvancePhase, onEndTurn, onOverclock, onTerminate
}) => {
  return (
    <aside className="combat-sidebar">
      <div className="sb-section">
        <div className="sb-title">SYSTEM_STRESS_DIAG</div>
        <div className="sb-stat">
          <ShieldAlert size={20} color="var(--neon-pink)" />
          <div className="sb-stat-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <span className="sb-stat-name">STRESS_LEVEL:</span>
            <div className="stress-meter-wrap" style={{ flex: 1, margin: '0 5px' }}>
              <div className="stress-meter-fill" style={{ 
                width: `${stress}%`,
                background: stress > 70 ? 'var(--neon-pink)' : 'var(--neon-amethyst)',
                boxShadow: stress > 70 ? '0 0 10px var(--neon-pink)' : 'none'
              }}></div>
            </div>
            <span className="sb-stat-val" style={{ fontSize: '1rem', minWidth: '45px', textAlign: 'right' }}>{stress}%</span>
          </div>
        </div>

        <div className="sb-stat">
          <Zap size={20} color="var(--neon-cyan)" />
          <div className="sb-stat-info">
            <span className="sb-stat-name">CPU_COMPUTE: </span>
            <span className="sb-stat-val">
              {(cpu * 1000) % 1000 === 0 ? (cpu * 1000) / 1000 : `${Math.floor(cpu * 1000)}mc`}
            </span>
          </div>
        </div>
        <div className="sb-stat">
          <Database size={20} color="var(--neon-amber)" />
          <div className="sb-stat-info">
            <span className="sb-stat-name">BUFFER_RAM: </span>
            <span className="sb-stat-val">{ramMaxMb}MB</span>
          </div>
        </div>
      </div>

      <div className="sb-log">
        <div className="sb-title">SYSTEM_OUTPUT</div>
        {log.map((l, i) => (
          <div key={i} className="sb-log-row animate-slide-in">{l}</div>
        ))}
      </div>

      <div className="sb-actions">
        {canAdvancePhase ? (
          <button className="sb-btn highlight-green animate-pulse" onClick={onAdvancePhase}>
            NEXT_PHASE: {SDLC_PHASES[currentPhase].nextPhaseId}
          </button>
        ) : (
          <button className="sb-btn" onClick={onEndTurn} disabled={!isPlayerTurn}>
            COMPILE_&_END_TURN
          </button>
        )}
        
        <button 
          className="sb-btn"
          onClick={onOverclock}
          disabled={!isPlayerTurn || stress >= 85}
          style={{ marginTop: '10px', borderColor: 'var(--neon-amber)', color: 'var(--neon-amber)' }}
        >
          [ OVERCLOCK: +1 CPU / -15 STRESS ]
        </button>

        <button 
          className="sb-btn" 
          onClick={onTerminate} 
          style={{ marginTop: '10px', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', opacity: 0.9 }}
        >
          [ TERMINATE_SESSION ]
        </button>
      </div>
    </aside>
  );
};

export default CombatSidebar;

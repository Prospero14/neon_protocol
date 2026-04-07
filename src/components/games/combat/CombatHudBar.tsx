import React from 'react';
import { ShieldAlert, Zap, Database, FileCode2, Terminal } from 'lucide-react';
import type { CombatPhase } from '../../../logic/combatPhases';
import { SDLC_PHASES } from '../../../logic/combatPhases';

interface CombatHudBarProps {
  currentPhase: CombatPhase;
  stress: number;
  cpu: number;
  cpuMax: number;
  ramMaxMb: number;
  lastLog: string;
  tzName: string;
  playerProgress: number;
  aiProgress: number;
  onShowTzModal: () => void;
}

const CombatHudBar: React.FC<CombatHudBarProps> = ({
  currentPhase, stress, cpu, cpuMax, ramMaxMb, lastLog, tzName,
  playerProgress, aiProgress, onShowTzModal
}) => {
  const phases = Object.keys(SDLC_PHASES) as CombatPhase[];
  const phaseIdx = phases.indexOf(currentPhase);
  const stressColor = stress > 70 ? '#ff4060' : stress > 40 ? '#ffaa00' : '#a855f7';

  return (
    <header className="chb">
      {/* Phase dots */}
      <div className="chb-phase">
        <div className="chb-dots">
          {phases.map((_, i) => (
            <span key={i} className={`chb-dot ${i < phaseIdx ? 'done' : i === phaseIdx ? 'now' : ''}`} />
          ))}
        </div>
        <span className="chb-phase-name">{currentPhase}</span>
      </div>

      <div className="chb-sep" />

      {/* Stress bar */}
      <div className="chb-metric">
        <ShieldAlert size={16} color={stressColor} />
        <span className="chb-metric-label">STRESS</span>
        <div className="chb-bar-track">
          <div className="chb-bar-fill" style={{ width: `${stress}%`, background: stressColor, boxShadow: `0 0 6px ${stressColor}44` }} />
        </div>
        <span className="chb-metric-val" style={{ color: stressColor }}>{stress}%</span>
      </div>

      <div className="chb-sep" />

      {/* CPU dots */}
      <div className="chb-metric">
        <Zap size={16} color="#00d4ff" />
        <span className="chb-metric-label">CPU</span>
        <span className="chb-metric-val" style={{ color: '#00d4ff', marginRight: '6px' }}>{cpu}/{cpuMax}</span>
        <div className="chb-cpu-dots">
          {Array.from({ length: cpuMax }).map((_, i) => (
            <div key={i} className={`chb-cpu-dot ${i < cpu ? 'on' : ''}`} />
          ))}
        </div>
      </div>

      <div className="chb-sep" />

      {/* RAM */}
      <div className="chb-metric">
        <Database size={16} color="#ffaa00" />
        <span className="chb-metric-val amber">{ramMaxMb}MB</span>
      </div>

      {/* Spacer */}
      <div className="chb-spacer" />

      {/* Last log flash */}
      <div className="chb-log-flash" title={lastLog}>
        <Terminal size={14} color="#335" />
        <span className="chb-log-text">{lastLog || '> idle'}</span>
      </div>

      <div className="chb-sep" />

      {/* TZ mini button */}
      <button className="chb-tz-btn" onClick={onShowTzModal} title={tzName}>
        <FileCode2 size={14} color="#00ff6e" />
        <span className="chb-tz-name">{tzName.length > 20 ? tzName.slice(0, 20) + '…' : tzName}</span>
      </button>
    </header>
  );
};

export default CombatHudBar;

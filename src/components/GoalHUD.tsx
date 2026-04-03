import React from 'react';
import { Target, Info } from 'lucide-react';

interface GoalHUDProps {
  questName: string;
  objectiveText: string;
  hint?: string;
  progress?: number; // 0 to 100
}

const GoalHUD: React.FC<GoalHUDProps> = ({ questName, objectiveText, hint, progress }) => {
  return (
    <div className="goal-hud-v1 animate-fade-in">
      <style>{`
        .goal-hud-v1 {
          background: rgba(0, 5, 10, 0.85);
          border: 1px solid rgba(153, 102, 204, 0.3);
          border-left: 4px solid var(--neon-amethyst);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          max-width: 450px;
          pointer-events: auto;
        }
        .goal-icon {
          color: var(--neon-amethyst);
          filter: drop-shadow(0 0 5px var(--neon-amethyst-glow));
        }
        .goal-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .goal-header {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--neon-amethyst);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 900;
        }
        .goal-title {
          font-size: 1rem;
          font-weight: bold;
          color: #fff;
        }
        .goal-hint {
          font-size: 0.75rem;
          color: #888;
          font-style: italic;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 4px;
        }
        .goal-progress-bar {
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,0.05);
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }
        .goal-progress-fill {
          height: 100%;
          background: var(--neon-amethyst);
          box-shadow: 0 0 10px var(--neon-amethyst-glow);
          transition: width 0.5s ease;
        }
      `}</style>

      <div className="goal-icon">
        <Target size={24} />
      </div>
      
      <div className="goal-content">
        <div className="goal-header">ТЕКУЩАЯ ДИРЕКТИВА</div>
        <div className="goal-title">{questName}: {objectiveText}</div>
        {hint && (
          <div className="goal-hint">
            <Info size={12} />
            {hint}
          </div>
        )}
        {progress !== undefined && (
          <div className="goal-progress-bar">
            <div className="goal-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalHUD;

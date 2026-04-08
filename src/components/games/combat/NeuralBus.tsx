import React from 'react';
import type { CombatPhase } from '../../../logic/combatPhases';
import type { CombatCard } from '../../../logic/combatCards';
import type { RailSlot } from '../../../logic/hooks/useCombatLogic';
import type { BugAction, BugEnemy } from '../../../logic/combatEnemies';
import { problemTypeLabelRu } from '../../../logic/combatCounterplay';
import { Database, ShieldAlert, Terminal, Lock, ChevronRight } from 'lucide-react';

interface NeuralBusProps {
  currentPhase: CombatPhase;
  /** Софт-скиллы кладутся только в фазе стабилизации (после кода). */
  softSocketsLocked: boolean;
  skillMode: string;
  infraSlots: (CombatCard | null)[];
  softSlots: (CombatCard | null)[];
  runtimeRail: RailSlot[];
  ramSlotsMax: number;
  missionTzStepsCount: number;
  enemy: BugEnemy | null;
  nextBugAction: BugAction | null;
  selectedCard: { source: string; idx: number; card: CombatCard } | null;
  playerProgress: number;
  aiProgress: number;
  bugPoints: number;
  aiDeadline: number;
  onExecuteCardOnSlot: (idx: number) => void;
}

const NeuralBus: React.FC<NeuralBusProps> = ({
  currentPhase, softSocketsLocked, infraSlots, softSlots, runtimeRail, ramSlotsMax,
  enemy, nextBugAction, selectedCard, playerProgress, aiProgress,
  bugPoints, aiDeadline, onExecuteCardOnSlot
}) => {
  const hasSelection = selectedCard !== null;
  const threatColor = aiProgress > 60 ? '#ff4060' : '#ffaa00';

  return (
    <main className="nb2">
      {/* ── ENEMY RAIL ── */}
      <div className="nb2-enemy">
        <div className="nb2-enemy-avatar">
          {enemy?.visualType === 'AI' && <Database className="nb2-enemy-icon" size={44} />}
          {enemy?.visualType === 'ICE' && <ShieldAlert className="nb2-enemy-icon ice" size={44} />}
          {enemy?.visualType === 'DEVELOPER' && <Terminal className="nb2-enemy-icon dev" size={44} />}
          {!enemy?.visualType && <Terminal className="nb2-enemy-icon" size={44} />}
          <span className="nb2-enemy-name">{enemy?.name || 'UNKNOWN_PROCESS'}</span>
        </div>
        <div className="nb2-enemy-slots">
          {(enemy?.actions || []).slice(0, 5).map((action: BugAction, i: number) => {
            const isActive = nextBugAction?.id === action.id;
            return (
              <div key={i} className={`nb2-enemy-slot ${isActive ? 'active' : ''}`}>
                <span className="nb2-eslot-id">0x0{i + 1}</span>
                <span className="nb2-eslot-name" style={{ color: isActive ? '#ff4060' : undefined }}>
                  {action.name.length > 15 ? action.name.slice(0, 15) + '…' : action.name}
                </span>
                <div className="nb2-eslot-tooltip">
                  <div className="tooltip-title">{action.name}</div>
                  <div className="tooltip-desc">{action.description}</div>
                  <div className="tooltip-stats">
                    {action.damage > 0 && <span style={{ color: '#ff4060' }}>Stress: +{action.damage}</span>}
                    {action.progressPoints > 0 && <span style={{ color: '#ffaa00' }}>Threat: +{action.progressPoints}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PIPELINE (CODE EDITOR) ── */}
      <div className="nb2-pipeline-area">
        {currentPhase === 'ARCHITECTURE' ? (
          <div className="nb2-planning">
            <div className="nb2-section-label">INFRA_RESOURCES</div>
            <div className="nb2-plan-slots">
              {infraSlots.map((s, i) => (
                <div key={i} className={`nb2-plan-slot ${s ? 'deployed' : ''}`}>
                  <span>{s ? s.name : `SLOT_${i + 1}`}</span>
                </div>
              ))}
            </div>
            <div className="nb2-section-label" style={{ marginTop: 12 }}>
              SOFT_SOCKETS
              {softSocketsLocked && (
                <span className="nb2-soft-locked mono-text"> [фаза 3: стабилизация]</span>
              )}
            </div>
            <div className="nb2-plan-slots">
              {softSlots.map((s, i) => (
                <div
                  key={i}
                  className={`nb2-plan-slot soft ${s ? 'deployed' : ''} ${softSocketsLocked && !s ? 'locked-preview' : ''}`}
                >
                  <span>
                    {s ? s.name : softSocketsLocked ? `LOCKED_${i + 1}` : `SOCKET_${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="nb2-code-editor">
            <div className="nb2-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>NEURAL_BUS <span className="nb2-caret">█</span></span>
              {currentPhase === 'VERIFICATION' && (
                <span className={`nb2-test-status ${bugPoints === 0 ? 'passed' : 'failed'}`}>
                  {bugPoints === 0 ? '[OK] CI/CD RUNNER: TESTS PASSED' : `[FATAL] CI/CD RUNNER: ${bugPoints} BUGS DETECTED`}
                </span>
              )}
            </div>
            <div className="nb2-code-flow" style={{ position: 'relative' }}>
              {currentPhase === 'VERIFICATION' && (
                <div className={`nb2-scanner-line ${bugPoints === 0 ? 'passed' : 'failed'}`} />
              )}
              {runtimeRail.map((slot, i) => {
                const isLocked = i >= ramSlotsMax;
                const hasCard = slot.type !== 'EMPTY';
                const canPatch = hasCard && slot.type === 'PLAYER_CODE' && currentPhase === 'VERIFICATION' && 
                                (selectedCard?.card.type === 'REACTION' || selectedCard?.card.type === 'DEFENSIVE');
                const isTarget = hasSelection && !isLocked && (!hasCard || canPatch);
                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <div className="nb2-flow-arrow">
                        <ChevronRight size={24} color={hasCard ? '#00d4ff44' : '#ffffff08'} />
                      </div>
                    )}
                    <div
                      className={`nb2-code-slot ${isLocked ? 'locked' : ''} ${hasCard ? 'filled' : ''} ${isTarget ? 'target-glow' : ''}`}
                      onClick={() => !isLocked && onExecuteCardOnSlot(i)}
                    >
                      {isLocked ? (
                        <Lock size={24} className="nb2-lock-icon" />
                      ) : hasCard ? (
                        <>
                          {isTarget && <span className="nb2-slot-cursor patch">▸</span>}
                          {slot.type === 'BUG_ERROR' ? (
                            <div className="nb2-bug-slot-inner">
                              <span className="nb2-slot-code">{(slot.content as BugAction)?.name || 'BUG'}</span>
                              {(slot.content as BugAction)?.problemType && (
                                <span className="nb2-bug-type mono-text">
                                  {problemTypeLabelRu((slot.content as BugAction).problemType!)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="nb2-slot-code">{(slot.content as CombatCard)?.name || 'UNVERIFIED_GAP'}</span>
                          )}
                        </>
                      ) : (
                        <span className="nb2-slot-cursor">{isTarget ? '▸ _' : `0x0${i + 1}`}</span>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── PROGRESS BARS (inline) ── */}
      <div className="nb2-progress-row">
        <div className="nb2-prog-item">
          <span className="nb2-prog-label">PROJECT</span>
          <div className="nb2-prog-track">
            <div className="nb2-prog-fill cyan" style={{ width: `${playerProgress}%` }} />
          </div>
          <span className="nb2-prog-pct" style={{ color: '#00d4ff' }}>{playerProgress}%</span>
        </div>
        <div className="nb2-prog-item">
          <span className="nb2-prog-label">THREAT</span>
          <div className="nb2-prog-track">
            <div className="nb2-prog-fill" style={{ width: `${aiProgress}%`, background: threatColor }} />
          </div>
          <span className="nb2-prog-pct" style={{ color: threatColor }}>{aiProgress}%</span>
        </div>
        <div className="nb2-prog-stat">
          <span>DEADLINE <strong>{aiDeadline}</strong></span>
        </div>
        <div className="nb2-prog-stat">
          <span>BUGS <strong className={bugPoints > 0 ? 'red' : ''}>{bugPoints}</strong></span>
        </div>
      </div>
    </main>
  );
};

export default NeuralBus;

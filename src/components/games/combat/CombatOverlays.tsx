import React from 'react';
import { SDLC_PHASES } from '../../../logic/combatPhases';
import type { CombatPhase } from '../../../logic/combatPhases';
import type { TechnicalTask } from '../../../logic/combatTasks';
import { getStepCardIds } from '../../../logic/combatTasks';
import type { BugEnemy, IcePersonality } from '../../../logic/combatEnemies';
import { getOpponentPipelineNarrative } from '../../../logic/combatNarrative';
import type { SkillMode } from '../../../logic/skillMode';
import type { CoopSprintReport } from '../../../logic/coopSprint';

const PERSONALITY_COLORS: Record<IcePersonality, string> = {
  TRACER:  '#ff4060',
  AUDITOR: '#f59e0b',
  PHANTOM: '#a855f7',
  SNIFFER: '#22d3ee',
  MIME:    '#f97316',
};

const PERSONALITY_LABELS: Record<IcePersonality, string> = {
  TRACER:  'TRACER ▲',
  AUDITOR: 'AUDITOR ■',
  PHANTOM: 'PHANTOM ◆',
  SNIFFER: 'SNIFFER ●',
  MIME:    'MIME ∼',
};


interface CombatOverlaysProps {
  phaseIntro: string | null;
  skillMode: SkillMode;
  cpuMax: number;
  ramMaxMb: number;
  showTzModal: boolean;
  /** Каноническое ТЗ (прогресс, id миссии, победа). */
  missionTz: TechnicalTask;
  /** Текст ТЗ для модалки/победы: для кооп QA/SRE/PM — параллельная подача той же задачи. */
  missionTzDisplay?: TechnicalTask;
  /** Кооп не-dev: не показывать пошаговый список конструкций кода (это гайд разработчика). */
  hideDevImplementationChecklist?: boolean;
  enemy?: BugEnemy | null;
  showVictory: boolean;
  showDefeat: boolean;
  victoryResult: { bits: number; chain: string[] } | null;
  deploymentReport: any;
  stress: number;
  onCloseTzModal: () => void;
  onWin: (bits: number, rank: string, chain: string[], name: string) => void;
  coopVictoryReport?: CoopSprintReport | null;
  coopDefeatReport?: CoopSprintReport | null;
  coopDefeatAttemptIndex?: number;
  coopMaxAttempts?: number;
  coopWillLiquidateAfterThisDefeat?: boolean;
}

const CombatOverlays: React.FC<CombatOverlaysProps> = ({
  phaseIntro,
  skillMode,
  showTzModal,
  missionTz,
  missionTzDisplay = missionTz,
  hideDevImplementationChecklist = false,
  enemy,
  showVictory,
  showDefeat,
  victoryResult,
  deploymentReport,
  stress,
  onCloseTzModal,
  onWin,
  coopVictoryReport,
  coopDefeatReport,
  coopDefeatAttemptIndex,
  coopMaxAttempts,
  coopWillLiquidateAfterThisDefeat,
}) => {
  const opponentStory = showTzModal ? getOpponentPipelineNarrative(skillMode, enemy) : null;

  return (
    <>
      {/* PHASE INTRO OVERLAY */}
      {phaseIntro && (
        <div className="phase-intro-overlay animate-flicker-in">
          <div className="pi-content">
            <h1 className="pi-title text-shadow-neon">{SDLC_PHASES[phaseIntro as CombatPhase].name.toUpperCase()}</h1>
            <p className="pi-sub">{SDLC_PHASES[phaseIntro as CombatPhase].description}</p>
          </div>
        </div>
      )}

      {/* TZ MISSION MODAL */}
      {showTzModal && (
        <div className="tz-modal-overlay blur-bg" onClick={onCloseTzModal}>
          <div className="tz-modal-box border-pulse-cyan" onClick={e => e.stopPropagation()}>
            <div className="tz-modal-title glow-cyan">ТЕХНИЧЕСКОЕ ЗАДАНИЕ: ДЕТАЛИ</div>

            {/* ICE PERSONALITY BADGE */}
            {enemy?.personality && (
              <div className="tz-personality-block" style={{ borderLeftColor: PERSONALITY_COLORS[enemy.personality] }}>
                <span
                  className="tz-personality-badge"
                  style={{ background: PERSONALITY_COLORS[enemy.personality] }}
                >
                  ПОВЕДЕНИЕ: {PERSONALITY_LABELS[enemy.personality]}
                </span>
                {enemy.personalityHint && (
                  <div className="tz-personality-hint font-terminal">
                    {enemy.personalityHint}
                  </div>
                )}
              </div>
            )}

            {opponentStory && (
              <div className="tz-pipeline-narrative font-terminal">
                <div className="tz-pipeline-title">{opponentStory.headline}</div>
                {opponentStory.spectrum ? (
                  <p className="tz-pipeline-spectrum">{opponentStory.spectrum}</p>
                ) : null}
                <p className="tz-pipeline-body">{opponentStory.body}</p>
                <p className="tz-pipeline-encounter mono-text opacity-90">{opponentStory.encounter}</p>
              </div>
            )}

            <div className="tz-modal-desc font-terminal">
              {missionTzDisplay.description}
            </div>
            
            <div className="tz-req-grid">
              <div className="tz-req-item full-width">
                {hideDevImplementationChecklist ? (
                  <>
                    <span className="lbl text-amber">КОНТУР КОМАНДЫ</span>
                    <p className="font-terminal opacity-90" style={{ margin: '8px 0 0', lineHeight: 1.45 }}>
                      Задача «{missionTz.name}» общая для спринта. Пошаговый чеклист конструкций на шине и список карт по
                      шагам — только у роли DEVELOPER; ваша роль закрывает свои фазы боя (INFRA / QA / PM) без этого
                      гайда.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="lbl text-amber">ТРЕБУЕМЫЕ ШАГИ РЕАЛИЗАЦИИ:</span>
                    <div className="tz-steps-list">
                      {missionTzDisplay.steps.map((step, idx) => (
                        <div key={idx} className="tz-step-row">
                          <span className="step-name">{step.name}:</span>
                          <span className="step-options opacity-80">
                            {getStepCardIds(missionTz.steps[idx] ?? step)
                              .map((id) => id.replace('syntax_', '').replace('fn_', ''))
                              .join(' | ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="tz-close-hint opacity-50" onClick={onCloseTzModal}>
              [ CLICK_ANYWHERE_TO_EXIT_ENCRYPTED_INTEL ]
            </div>
          </div>
        </div>
      )}

      {/* VICTORY OVERLAY */}
      {showVictory && victoryResult && (
        <div className="result-overlay victory animate-fade-in">
          <div className="result-box shadow-green">
            <div className="result-title green glow-green">DEPLOYMENT_SUCCESS</div>
            <div className="result-subtitle">SYSTEM_INTEGRITY_ESTABLISHED</div>
            <div className="result-stats">
              <div className="stat-row">
                <span>TASK_COMPLETED:</span>
                <span className="green">{missionTzDisplay.name}</span>
              </div>
              <div className="stat-row total">
                <span>REWARDS_EARNED:</span>
                <span className="gold">{victoryResult.bits} BITS</span>
              </div>
            </div>
            {coopVictoryReport && (
              <div className="coop-retro-block">
                <div className="coop-retro-title">РЕТРОСПЕКТИВА СПРИНТА</div>
                <p className="coop-retro-summary font-terminal">{coopVictoryReport.summaryLine}</p>
                <div className="coop-retro-criteria">
                  <span className="lbl text-amber">ВАША РОЛЬ — КРИТЕРИИ:</span>
                  {coopVictoryReport.playerCriteria.map((c, i) => (
                    <div key={i} className="coop-crit-row">
                      <span>{c.label}</span>
                      <span className="coop-crit-score">{c.score}</span>
                      <span className="coop-crit-blur">{c.blurb}</span>
                    </div>
                  ))}
                </div>
                <div className="coop-squad-strip">
                  {coopVictoryReport.squad.map((s) => (
                    <span key={s.role} className="coop-squad-pill">
                      {s.role}:{s.score}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button className="result-btn green bg-green-90" onClick={() => onWin(victoryResult.bits, missionTz.rank, victoryResult.chain, missionTz.name)}>
              [ CONTINUE_TO_CITY ]
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT OVERLAY */}
      {showDefeat && (
        <div className="result-overlay defeat animate-glitch-in">
          <div className="result-box shadow-red">
            <div className="result-title red glow-red text-glitch">SYSTEM_CRASH</div>
            <div className="result-subtitle">FATAL_ERROR_IN_PRODUCTION</div>
            <div className="result-stats">
              {deploymentReport && (
                <>
                  {!deploymentReport.cpuOk && <div className="stat-row red">ERROR: INSUFFICIENT_CPU</div>}
                  {!deploymentReport.ramOk && <div className="stat-row red">ERROR: BUFFER_OVERFLOW_RAM</div>}
                  {!deploymentReport.slotsOk && <div className="stat-row red">ERROR: INSUFFICIENT_MEMORY_SLOTS</div>}
                  {deploymentReport.missingSteps && deploymentReport.missingSteps.length > 0 && (
                    <div className="stat-row red">ERROR: REQUIREMENTS_NOT_MET</div>
                  )}
                  {stress >= 100 && <div className="stat-row red">ERROR: NEURAL_STRESS_OVERLOAD</div>}
                </>
              )}
              {typeof coopDefeatAttemptIndex === 'number' && typeof coopMaxAttempts === 'number' && (
                <div className="stat-row red">
                  ПОПЫТКА РЕЛИЗА: {coopDefeatAttemptIndex} / {coopMaxAttempts}
                </div>
              )}
              {coopWillLiquidateAfterThisDefeat && (
                <div className="stat-row red font-terminal">
                  ПРОВАЛ ПРОДУКТА: стартап будет ликвидирован после выхода.
                </div>
              )}
            </div>
            {coopDefeatReport && (
              <div className="coop-retro-block coop-retro-block--defeat">
                <div className="coop-retro-title">ОЦЕНКА ПРИ ПОРАЖЕНИИ</div>
                <p className="coop-retro-summary font-terminal">{coopDefeatReport.summaryLine}</p>
                <div className="coop-retro-criteria">
                  {coopDefeatReport.playerCriteria.map((c, i) => (
                    <div key={i} className="coop-crit-row">
                      <span>{c.label}</span>
                      <span className="coop-crit-score">{c.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="result-btn red bg-red-90" onClick={() => onWin(0, missionTz.rank, [], missionTz.name)}>
              [ RETURN_TO_CITY_HUB ]
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CombatOverlays;

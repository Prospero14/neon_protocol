import React from 'react';
import type { CombatPhase } from '../../../logic/combatPhases';
import { SDLC_PHASES, SDLC_PHASE_IDS_FULL } from '../../../logic/combatPhases';
import type { CoopRole } from '../../../logic/sessionMode';
import type { SessionMode } from '../../../logic/sessionMode';
import type { CombatCard } from '../../../logic/combatCards';
import type { RailSlot } from '../../../logic/hooks/useCombatLogic';
import type { BugAction, BugEnemy } from '../../../logic/combatEnemies';
import { problemTypeLabelRu } from '../../../logic/combatCounterplay';
import { Database, ShieldAlert, Terminal, Lock, ChevronRight } from 'lucide-react';

interface NeuralBusProps {
  /** Классы темы поля на рабочей зоне (SDLC + код); оппонент/дедлайн — общие. */
  pipelineFieldClass?: string;
  /** Порядок фаз на рельсе (кооп dev/qa/pm — без ARCHITECTURE). */
  phaseOrder?: CombatPhase[];
  currentPhase: CombatPhase;
  /** Софт-скиллы кладутся только в фазе стабилизации (после кода). */
  softSocketsLocked: boolean;
  /** Кооп GDD: единый спринт — INFRA у admin в DEVELOPMENT, SOFT не блокируются фазой. */
  coopUnifiedSprint?: boolean;
  infraSlots: (CombatCard | null)[];
  softSlots: (CombatCard | null)[];
  runtimeRail: RailSlot[];
  ramSlotsMax: number;
  enemy: BugEnemy | null;
  nextBugAction: BugAction | null;
  isPlayerTurn: boolean;
  selectedCard: { source: string; idx: number; card: CombatCard } | null;
  playerProgress: number;
  aiProgress: number;
  bugPoints: number;
  aiDeadline: number;
  onExecuteCardOnSlot: (idx: number) => void;
  /** Кооп PM: подсказка, что шина кода не «ваша зона клика». */
  sessionMode?: SessionMode;
  coopRole?: CoopRole | null;
}

const NeuralBus: React.FC<NeuralBusProps> = ({
  pipelineFieldClass = '',
  phaseOrder = SDLC_PHASE_IDS_FULL,
  currentPhase, softSocketsLocked, coopUnifiedSprint = false, infraSlots, softSlots, runtimeRail, ramSlotsMax,
  enemy, nextBugAction, isPlayerTurn, selectedCard, playerProgress, aiProgress,
  bugPoints, aiDeadline, onExecuteCardOnSlot,
  sessionMode = 'solo',
  coopRole = null,
}) => {
  const showInfraPlanning =
    currentPhase === 'ARCHITECTURE' ||
    Boolean(coopUnifiedSprint && coopRole === 'admin' && currentPhase === 'DEVELOPMENT');
  const sprintStabilizationUi =
    currentPhase === 'VERIFICATION' || (coopUnifiedSprint && sessionMode === 'coop' && currentPhase === 'DEVELOPMENT');
  const phaseIndex = Math.max(0, phaseOrder.indexOf(currentPhase));
  const hasSelection = selectedCard !== null;
  const threatColor = aiProgress > 60 ? '#ff4060' : '#ffaa00';
  const ENEMY_VISIBLE_SLOTS = 7;
  const maskedCount = Math.max(0, ENEMY_VISIBLE_SLOTS - 1);

  return (
    <main className="nb2">
      {/* Общая полоса: оппонент, интенты, дедлайн — без перекраски под роль/соло-поле */}
      <div className="nb2-opponent-lane nb2-opponent-lane--shared">
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
          {nextBugAction && (
            <div className={`nb2-enemy-slot active ${!isPlayerTurn ? 'executing' : ''}`}>
              <span className="nb2-eslot-id">NEXT_INTENT</span>
              <span className="nb2-eslot-name" style={{ color: '#ff4060' }}>
                {nextBugAction.name.length > 18 ? nextBugAction.name.slice(0, 18) + '…' : nextBugAction.name}
              </span>
              <div className="nb2-eslot-tooltip">
                <div className="tooltip-title">{nextBugAction.name}</div>
                <div className="tooltip-desc">{nextBugAction.description}</div>
                <div className="tooltip-stats">
                  {nextBugAction.problemType && (
                    <span style={{ color: '#7ad7ff' }}>Класс: {problemTypeLabelRu(nextBugAction.problemType)}</span>
                  )}
                  {nextBugAction.damage > 0 && <span style={{ color: '#ff4060' }}>Stress: +{nextBugAction.damage}</span>}
                  {nextBugAction.progressPoints > 0 && <span style={{ color: '#ffaa00' }}>Threat: +{nextBugAction.progressPoints}%</span>}
                </div>
              </div>
            </div>
          )}
          {Array(maskedCount).fill(0).map((_, i) => (
            <div key={`mask_${i}`} className="nb2-enemy-slot masked">
              <span className="nb2-eslot-id">0x1{i + 1}</span>
              <span className="nb2-eslot-name">SIGNAL_OBFUSCATED</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROGRESS: сразу под оппонентом (основные метрики) ── */}
      <div className="nb2-progress-row nb2-progress-row--under-enemy">
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
      </div>

      {/* ── PIPELINE (CODE EDITOR) ── */}
      <div className={`nb2-pipeline-area ${pipelineFieldClass}`.trim()}>
        <div className="nb2-sdlc-rail" role="navigation" aria-label="Фазы цикла разработки">
          {phaseOrder.map((id, i) => {
            const cur = phaseIndex;
            const stepState = i < cur ? 'past' : i === cur ? 'current' : 'future';
            const rules = SDLC_PHASES[id];
            return (
              <div key={id} className={`nb2-sdlc-step nb2-sdlc-step--${stepState}`} title={rules.description}>
                <span className="nb2-sdlc-num">{i + 1}</span>
                <span className="nb2-sdlc-name">{rules.name.split(':')[0]?.trim() || id}</span>
              </div>
            );
          })}
        </div>
        {coopUnifiedSprint && (
          <p className="nb2-sdlc-coop-caption">
            COOP_SPRINT: код, инфра, тест и SOFT идут параллельно; ИИ давит как на стабилизации. Одна кнопка SHIP
            ведёт к финальному деплою «приложения» при PROJECT 100%.
          </p>
        )}
        {!coopUnifiedSprint && phaseOrder.length < SDLC_PHASE_IDS_FULL.length && (
          <p className="nb2-sdlc-coop-caption">
            INFRA/снабжение — зона admin в общем цикле команды; ваш клиент в этом спринте без отдельной фазы снабжения.
          </p>
        )}
        {sessionMode === 'coop' && coopRole === 'pm' && currentPhase === 'DEVELOPMENT' && (
          <p className="nb2-sdlc-coop-caption" style={{ borderLeft: '2px solid #f472b6', paddingLeft: 8 }}>
            PM: слоты кода на шине собирает синтетический разработчик команды — вы не кликаете по ним. Играйте SOFT из
            руки (стресс, срок, буферы), смотрите угрозу и «Вклад в релиз»; когда PROJECT 100% — SHIP к деплою.
          </p>
        )}
        {showInfraPlanning && (
          <div className="nb2-planning">
            <div className="nb2-plan-pipeline-seg nb2-plan-pipeline-seg--infra nb2-plan-pipeline-seg--active">
              <div className="nb2-section-label">INFRA_RESOURCES</div>
              <div className="nb2-plan-slots">
                {infraSlots.map((s, i) => (
                  <div key={i} className={`nb2-plan-slot ${s ? 'deployed' : ''}`}>
                    <span>{s ? s.name : `SLOT_${i + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`nb2-plan-pipeline-seg nb2-plan-pipeline-seg--soft ${
                sprintStabilizationUi ? 'nb2-plan-pipeline-seg--active' : 'nb2-plan-pipeline-seg--idle'
              }`}
            >
              <div className="nb2-section-label nb2-soft-section-head" style={{ marginTop: 12 }}>
                <span>SOFT_SOCKETS</span>
                {softSocketsLocked && (
                  <span
                    className="nb2-soft-badge"
                    title="Софт-слоты открываются после кода, на фазе стабилизации (VERIFY)."
                  >
                    ф3 · закрыто
                  </span>
                )}
              </div>
              <div className="nb2-plan-slots nb2-plan-slots--soft">
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
          </div>
        )}
        {currentPhase !== 'ARCHITECTURE' && (
          <div className="nb2-code-editor nb2-code-editor--phase-wrap">
            <div className="nb2-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>NEURAL_BUS <span className="nb2-caret">█</span></span>
              {sprintStabilizationUi && (
                <span className={`nb2-test-status ${bugPoints === 0 ? 'passed' : 'failed'}`}>
                  {bugPoints === 0 ? '[OK] CI/CD RUNNER: TESTS PASSED' : `[FATAL] CI/CD RUNNER: ${bugPoints} BUGS DETECTED`}
                </span>
              )}
            </div>
            <div className="nb2-code-flow" style={{ position: 'relative' }}>
              {sprintStabilizationUi && (
                <div className={`nb2-scanner-line ${bugPoints === 0 ? 'passed' : 'failed'}`} />
              )}
              {runtimeRail.map((slot, i) => {
                if (!slot) return <React.Fragment key={i} />;
                const isLocked = i >= ramSlotsMax;
                const hasCard = slot.type !== 'EMPTY';
                const canPatch =
                  hasCard &&
                  slot.type === 'PLAYER_CODE' &&
                  sprintStabilizationUi &&
                  (selectedCard?.card?.type === 'REACTION' || selectedCard?.card?.type === 'DEFENSIVE');
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
    </main>
  );
};

export default NeuralBus;

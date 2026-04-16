import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Trait } from '../../logic/traits';
import type { CombatCard } from '../../logic/combatCards';
import type { TechnicalTask } from '../../logic/combatTasks';
import type { CoopRole, DevLanguageStack, SessionMode } from '../../logic/sessionMode';
import type { CoopSquadFill } from '../../logic/coopTeamFlow';
import {
  getCombatFieldOuterClass,
  getPipelineFieldClass,
  resolveSoloFieldVariant,
} from '../../logic/combatFieldTheme';
import {
  COOP_SPRINT_MAX_ATTEMPTS,
  buildCoopSprintReport,
  getCoopBriefTz,
} from '../../logic/coopSprint';
import { coopOpponentHintBody, coopOpponentHintTitle } from '../../logic/coopOpponentHints';
import { sdlcRailPhaseOrder } from '../../logic/combatPhases';
import { useCombatLogic } from '../../logic/hooks/useCombatLogic';
import { useAuth } from '../../logic/AuthContext';
import {
  coopMatchAction,
  coopMatchEventsSource,
  coopMatchFetchState,
  type CoopMatchState,
} from '../../logic/coopLobbyApi';

// UI Components — new layout
import CombatHudBar from './combat/CombatHudBar';
import NeuralBus from './combat/NeuralBus';
import HandControls from './combat/HandControls';
import CombatOverlays from './combat/CombatOverlays';
import DraftPanel from './combat/DraftPanel';
import { CoopTeamSitrep } from './combat/CoopTeamSitrep';

// Styles
import '../../styles/CombatAnimations.css';

interface CombatBridgeProps {
  skillMode: 'script-kiddie' | 'junior' | 'mid' | 'senior';
  playerTraits: Trait[];
  activeDeck: CombatCard[];
  taskLibrary: TechnicalTask[];
  initialTaskIndex?: number;
  onWin: (
    bitsEarned: number,
    taskRank: string,
    finalChain: string[],
    missionName: string,
    updatedDeck?: CombatCard[],
    missionTaskId?: string
  ) => void;
  isQuestCombat?: boolean;
  isFirstCombatQuestTutorial?: boolean;
  tier: number;
  deckCores: number;
  deckRamMb: number;
  homeDistrictId?: string;
  /** Режим сессии: соло — ротация поля; кооп — акцент рабочей зоны по роли. */
  sessionMode?: SessionMode;
  coopRole?: CoopRole | null;
  /** Для стабильной смены поля в соло (день + район + нода). */
  fieldWorldDay?: number;
  fieldDistrictId?: string;
  fieldBarNode?: string | null;
  /** Кооп-спринт: имя стартапа, стек, число поражений до входа в этот бой. */
  coopStartupName?: string | null;
  devLanguageStack?: DevLanguageStack | null;
  coopSprintLossesBeforeBattle?: number;
  /** Пати людей vs симуляция союзников на одном клиенте. */
  coopSquadFill?: CoopSquadFill;
  /** Сетевой matchId для живой пати (серверный общий state). */
  coopMatchId?: string | null;
}

const CombatBridge: React.FC<CombatBridgeProps> = (props) => {
  const { taskLibrary, initialTaskIndex = 0 } = props;
  const missionTz = taskLibrary[initialTaskIndex] ?? taskLibrary[0];

  const sessionMode = props.sessionMode ?? 'solo';
  const coopRole = props.coopRole ?? null;
  const railPhases = sdlcRailPhaseOrder(sessionMode, coopRole);
  const fieldWorldDay = props.fieldWorldDay ?? 1;
  const fieldDistrictId = props.fieldDistrictId ?? props.homeDistrictId ?? 'altufyevo';
  const soloVariant = resolveSoloFieldVariant(fieldWorldDay, fieldDistrictId, props.fieldBarNode);
  const combatFieldOuterClass = getCombatFieldOuterClass(sessionMode, coopRole, soloVariant);
  const pipelineFieldClass = getPipelineFieldClass(sessionMode, coopRole, soloVariant);
  
  const [showTzModal, setShowTzModal] = useState(false);
  const [showCoopBrief, setShowCoopBrief] = useState(() => sessionMode === 'coop' && Boolean(props.coopStartupName?.trim()));
  const [showFirstQuestMemo, setShowFirstQuestMemo] = useState(Boolean(props.isFirstCombatQuestTutorial));

  // --- DRAFT STATE ---
  const [showDraft, setShowDraft] = useState(false);
  const [draftDeck, setDraftDeck] = useState<CombatCard[]>(props.activeDeck);
  const [pendingWin, setPendingWin] = useState<{
    bits: number;
    rank: string;
    chain: string[];
    name: string;
    taskId: string;
  } | null>(null);
  const [endTurnPending, setEndTurnPending] = useState(false);
  const [pmSupportPending, setPmSupportPending] = useState(false);
  const [qaSupportPending, setQaSupportPending] = useState(false);
  const [adminSupportPending, setAdminSupportPending] = useState(false);
  const [pmReleasePending, setPmReleasePending] = useState(false);

  // Core Logic Hook
  const coopSquadFill = props.coopSquadFill ?? 'synthetic_bots';
  const { token, user } = useAuth();
  const [netMatch, setNetMatch] = useState<CoopMatchState | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const { state, actions } = useCombatLogic({
    ...props,
    missionTz,
    coopSquadFill,
  });

  const handleCombatWin = (bits: number, rank: string, chain: string[], name: string) => {
    const taskId = missionTz.id;
    if (bits > 0 && props.skillMode === 'script-kiddie') {
      setPendingWin({ bits, rank, chain, name, taskId });
      setShowDraft(true);
    } else {
      props.onWin(bits, rank, chain, name, undefined, taskId);
    }
  };

  const handleDraftPick = (card: CombatCard) => {
    setDraftDeck(prev => [...prev, card]);
    setShowDraft(false);
    if (pendingWin)
      props.onWin(pendingWin.bits, pendingWin.rank, pendingWin.chain, pendingWin.name, [...draftDeck, card], pendingWin.taskId);
  };

  const handleDraftSkip = () => {
    setShowDraft(false);
    if (pendingWin) props.onWin(pendingWin.bits, pendingWin.rank, pendingWin.chain, pendingWin.name, draftDeck, pendingWin.taskId);
  };

  React.useEffect(() => {
    setShowFirstQuestMemo(Boolean(props.isFirstCombatQuestTutorial));
  }, [props.isFirstCombatQuestTutorial]);

  const deploymentOk = (r: unknown): boolean => {
    if (!r || typeof r !== 'object') return true;
    const x = r as { cpuOk?: boolean; ramOk?: boolean; slotsOk?: boolean; missingSteps?: unknown[] };
    const miss = Array.isArray(x.missingSteps) ? x.missingSteps.length === 0 : true;
    return !!(x.cpuOk && x.ramOk && x.slotsOk && miss);
  };

  const stack = props.devLanguageStack ?? null;
  const coopVictoryReport =
    sessionMode === 'coop' && coopRole && state.showVictory && state.victoryResult
      ? buildCoopSprintReport(coopRole, stack, {
          won: true,
          stressEnd: state.stress,
          bugPointsEnd: state.bugPoints,
          playerProgressEnd: state.playerProgress,
          aiProgressEnd: state.aiProgress,
          aiDeadlineEnd: state.aiDeadline,
          chainLength: state.victoryResult.chain.length,
          deploymentOk: deploymentOk(state.deploymentReport),
        })
      : null;

  const coopDefeatReport =
    sessionMode === 'coop' && coopRole && state.showDefeat
      ? buildCoopSprintReport(coopRole, stack, {
          won: false,
          stressEnd: state.stress,
          bugPointsEnd: state.bugPoints,
          playerProgressEnd: state.playerProgress,
          aiProgressEnd: state.aiProgress,
          aiDeadlineEnd: state.aiDeadline,
          chainLength: 0,
          deploymentOk: false,
        })
      : null;

  const lossesBefore = props.coopSprintLossesBeforeBattle ?? 0;
  const defeatAttemptIndex = lossesBefore + 1;
  const coopWillLiquidateAfterThisDefeat = defeatAttemptIndex >= COOP_SPRINT_MAX_ATTEMPTS;

  useEffect(() => {
    const matchId = props.coopMatchId ?? null;
    if (coopSquadFill !== 'live_party' || !matchId || !token) {
      setNetMatch(null);
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }
    let alive = true;
    const load = async () => {
      const m = await coopMatchFetchState(token, matchId);
      if (!alive || !m) return;
      setNetMatch(m);
    };
    load();
    const poll = window.setInterval(load, 4000);
    try {
      const src = coopMatchEventsSource(token, matchId);
      sseRef.current = src;
      src.addEventListener('match_update', (evt) => {
        try {
          const payload = JSON.parse((evt as MessageEvent).data) as { event?: { seq?: number } };
          if (payload?.event?.seq) {
            setNetMatch((prev) =>
              prev ? { ...prev, seq: Math.max(prev.seq, payload.event?.seq ?? prev.seq) } : prev
            );
            void load();
          }
        } catch {
          // ignore malformed frame
        }
      });
      src.onerror = () => {
        src.close();
        sseRef.current = null;
      };
    } catch {
      // fallback to polling only
    }
    return () => {
      alive = false;
      window.clearInterval(poll);
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [coopSquadFill, props.coopMatchId, token]);

  const sitrepStats = useMemo(() => {
    if (coopSquadFill !== 'live_party' || !netMatch) {
      return {
        stress: state.stress,
        bugPoints: state.bugPoints,
        playerProgress: state.playerProgress,
        aiDeadline: state.aiDeadline,
        aiProgress: state.aiProgress,
        mitigationBuffer: state.mitigationBuffer,
        infraFilled: state.infraSlots.filter(Boolean).length,
      };
    }
    return {
      stress: netMatch.shared.stress,
      bugPoints: netMatch.shared.bugPressure,
      playerProgress: netMatch.shared.projectProgress,
      aiDeadline: netMatch.shared.deadlineTicks,
      aiProgress: 100 - netMatch.shared.infraReliability,
      mitigationBuffer: netMatch.shared.infraReliability,
      infraFilled: Math.max(0, Math.min(8, Math.floor((netMatch.shared.infraResources / 100) * 8))),
    };
  }, [coopSquadFill, netMatch, state]);
  const supportFeed = useMemo(() => {
    if (!netMatch || coopSquadFill !== 'live_party') return [];
    return netMatch.recentEvents
      .filter(
        (e) =>
          e.type === 'apply_pm_support' ||
          e.type === 'apply_qa_defense' ||
          e.type === 'apply_admin_infra' ||
          e.type === 'release_checked'
      )
      .slice(-6)
      .reverse()
      .map((e) => {
        if (e.type === 'release_checked') {
          return `[RELEASE] ${e.payload?.ok ? 'OK' : 'FAIL'}: ${typeof e.payload?.note === 'string' ? e.payload.note : ''}`;
        }
        const actorRole = e.actorUserId ? netMatch.roleByUserId[e.actorUserId] ?? '?' : '?';
        const targetRole =
          typeof e.payload?.targetRole === 'string' ? e.payload.targetRole : null;
        return `[SYNC] ${actorRole.toUpperCase()} support${targetRole ? ` -> ${targetRole.toUpperCase()}` : ''}`;
      });
  }, [netMatch, coopSquadFill]);
  const livePartyMode = coopSquadFill === 'live_party' && Boolean(netMatch && token);
  const isParallelWindow = livePartyMode && netMatch?.shared.mode === 'parallel_window';
  const isMyRoleTurn =
    livePartyMode &&
    Boolean(coopRole && (isParallelWindow || netMatch?.shared.activeRole === coopRole));
  const liveActionGateOpen = (!livePartyMode || isMyRoleTurn) && !endTurnPending;

  const handleEndTurn = async () => {
    if (endTurnPending) return;
    if (livePartyMode && netMatch && token) {
      setEndTurnPending(true);
      try {
        const actionName =
          isParallelWindow
            ? coopRole === 'developer'
              ? 'apply_dev_progress'
              : coopRole === 'qa'
                ? 'apply_qa_defense'
                : coopRole === 'admin'
                  ? 'apply_admin_infra'
                  : 'apply_pm_support'
            : 'end_turn';
        const payload =
          isParallelWindow
            ? coopRole === 'developer'
              ? { progressUp: 10, stressUp: 4 }
              : coopRole === 'qa'
                ? { bugsDown: 7, reliabilityUp: 3, stressDown: 4, targetRole: 'developer' }
                : coopRole === 'admin'
                  ? { reliabilityUp: 8, resourcesDown: 4, stressUp: 2, targetRole: 'developer' }
                  : { stressDown: 9, deadlineUp: 1, targetRole: 'developer' }
            : {};
        const updated = await coopMatchAction(
          token,
          netMatch.id,
          actionName,
          payload,
          netMatch.seq,
          `intent_${coopRole}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        );
        if (updated) setNetMatch(updated);
      } finally {
        setEndTurnPending(false);
      }
      return;
    }
    actions.endTurn();
  };

  const handlePmReleaseCheck = async () => {
    if (pmReleasePending) return;
    if (!livePartyMode || !netMatch || !token || coopRole !== 'pm' || !isParallelWindow) return;
    setPmReleasePending(true);
    try {
      const updated = await coopMatchAction(
        token,
        netMatch.id,
        'release_check',
        {},
        netMatch.seq,
        `release_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      );
      if (updated) setNetMatch(updated);
    } finally {
      setPmReleasePending(false);
    }
  };

  const handlePmSupportTarget = async (targetRole: CoopRole) => {
    if (pmSupportPending) return;
    if (!livePartyMode || !netMatch || !token || coopRole !== 'pm') return;
    setPmSupportPending(true);
    try {
      const updated = await coopMatchAction(
        token,
        netMatch.id,
        'apply_pm_support',
        { targetRole, stressDown: 9, deadlineUp: 1 },
          netMatch.seq,
          `pm_${targetRole}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      );
      if (updated) setNetMatch(updated);
    } finally {
      setPmSupportPending(false);
    }
  };

  const handleQaSupportTarget = async (targetRole: CoopRole) => {
    if (qaSupportPending) return;
    if (!livePartyMode || !netMatch || !token || coopRole !== 'qa') return;
    setQaSupportPending(true);
    try {
      const updated = await coopMatchAction(
        token,
        netMatch.id,
        'apply_qa_defense',
        { targetRole, bugsDown: 7, reliabilityUp: 3, stressDown: 4 },
          netMatch.seq,
          `qa_${targetRole}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      );
      if (updated) setNetMatch(updated);
    } finally {
      setQaSupportPending(false);
    }
  };

  const handleAdminSupportTarget = async (targetRole: CoopRole) => {
    if (adminSupportPending) return;
    if (!livePartyMode || !netMatch || !token || coopRole !== 'admin') return;
    setAdminSupportPending(true);
    try {
      const updated = await coopMatchAction(
        token,
        netMatch.id,
        'apply_admin_infra',
        { targetRole, reliabilityUp: 8, resourcesDown: 4, stressUp: 2 },
          netMatch.seq,
          `ops_${targetRole}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      );
      if (updated) setNetMatch(updated);
    } finally {
      setAdminSupportPending(false);
    }
  };

  return (
    <div className={`combat-v2 ${combatFieldOuterClass} ${state.stress > 70 ? 'screen-glitch' : ''}`}>
      {sessionMode === 'coop' && coopRole && (
        <div className="coop-combat-dock" aria-live="polite">
          <div className="coop-opponent-hint">
            <div className="coop-opponent-hint__title">{coopOpponentHintTitle(coopRole)}</div>
            <div className="coop-opponent-hint__body">{coopOpponentHintBody(coopRole)}</div>
          </div>
          <CoopTeamSitrep
            coopRole={coopRole}
            squadFill={coopSquadFill}
            matchActiveRole={netMatch?.shared.activeRole ?? null}
            isMyTurn={isMyRoleTurn}
            matchShared={netMatch?.shared ?? null}
            onPmSupportTarget={coopRole === 'pm' && livePartyMode && isMyRoleTurn ? handlePmSupportTarget : null}
            pmSupportBusy={pmSupportPending}
            onPmReleaseCheck={coopRole === 'pm' && livePartyMode && isParallelWindow ? handlePmReleaseCheck : null}
            pmReleaseBusy={pmReleasePending}
            onQaSupportTarget={coopRole === 'qa' && livePartyMode && isMyRoleTurn ? handleQaSupportTarget : null}
            qaSupportBusy={qaSupportPending}
            onAdminSupportTarget={coopRole === 'admin' && livePartyMode && isMyRoleTurn ? handleAdminSupportTarget : null}
            adminSupportBusy={adminSupportPending}
            supportFeed={supportFeed}
            stress={sitrepStats.stress}
            bugPoints={sitrepStats.bugPoints}
            playerProgress={sitrepStats.playerProgress}
            aiDeadline={sitrepStats.aiDeadline}
            aiProgress={sitrepStats.aiProgress}
            mitigationBuffer={sitrepStats.mitigationBuffer}
            infraFilled={sitrepStats.infraFilled}
            nextIntentName={state.nextBugAction?.name ?? null}
            lastAiActionName={
              netMatch && coopSquadFill === 'live_party'
                ? `MATCH #${netMatch.id.slice(-8)} · turn ${netMatch.shared.turn} · active ${netMatch.shared.activeRole}${
                    user?.id ? ` · me ${netMatch.roleByUserId[user.id] ?? '?'}` : ''
                  }`
                : (state.lastAiAction?.name ?? null)
            }
          />
        </div>
      )}
      {sessionMode === 'coop' && showCoopBrief && props.coopStartupName?.trim() && (
        <div
          className="coop-brief-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Краткое ТЗ спринта"
        >
          <div className="coop-brief-box border-pulse-cyan">
            <div className="coop-brief-title">СПРИНТ // КРАТКОЕ ТЗ</div>
            <div className="coop-brief-startup">{props.coopStartupName.trim()}</div>
            <p className="coop-brief-body font-terminal">{getCoopBriefTz(props.coopStartupName.trim(), missionTz.name)}</p>
            <button type="button" className="coop-brief-ack" onClick={() => setShowCoopBrief(false)}>
              [ ПРИСТУПИТЬ К РЕЛИЗУ ]
            </button>
          </div>
        </div>
      )}
      {/* ── TOP HUD BAR ── */}
      <CombatHudBar
        phaseOrder={railPhases}
        currentPhase={state.currentPhase}
        stress={state.stress}
        cpu={state.cpu}
        cpuMax={state.cpuMax}
        ramMaxMb={state.ramMaxMb}
        lastLog={state.log[0] || ''}
        lastAiActionName={state.lastAiAction?.name ?? null}
        nextIntentName={state.nextBugAction?.name ?? null}
        isPlayerTurn={state.isPlayerTurn}
        tzName={missionTz.name}
        playerProgress={state.playerProgress}
        aiProgress={state.aiProgress}
        onShowTzModal={() => setShowTzModal(true)}
      />

      {/* ── ARENA (full width) ── */}
      <NeuralBus 
        pipelineFieldClass={pipelineFieldClass}
        phaseOrder={railPhases}
        currentPhase={state.currentPhase}
        softSocketsLocked={state.currentPhase !== 'VERIFICATION'}
        infraSlots={state.infraSlots}
        softSlots={state.softSlots}
        runtimeRail={state.runtimeRail}
        ramSlotsMax={state.ramSlotsMax}
        enemy={state.enemy}
        nextBugAction={state.nextBugAction}
        isPlayerTurn={state.isPlayerTurn}
        selectedCard={state.selectedCard}
        playerProgress={state.playerProgress}
        aiProgress={state.aiProgress}
        bugPoints={state.bugPoints}
        aiDeadline={state.aiDeadline}
        onExecuteCardOnSlot={actions.executeCardOnSlot}
      />
      {showFirstQuestMemo && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(2, 6, 16, 0.94)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all',
          }}
        >
          <div className="result-box shadow-green" style={{ maxWidth: 520 }}>
            <div className="result-title green glow-green">ПАМЯТКА: ПЕРВЫЙ КОНТРАКТ</div>
            <div className="result-stats" style={{ textAlign: 'left' }}>
              <div className="stat-row">1) Смотри `NEXT_INTENT` — это следующий ход оппонента.</div>
              <div className="stat-row">2) В `DEVELOPMENT` выкладывай код в шину, цель: `PROJECT 100%`.</div>
              <div className="stat-row">3) В `VERIFICATION` чисти баги реакциями/защитой.</div>
              <div className="stat-row">4) `THREAT 100%` = оппонент успел раньше тебя.</div>
              <div className="stat-row">5) `OC` даёт +1 CPU, но повышает стресс (перегрев).</div>
            </div>
            <button className="result-btn green bg-green-90" onClick={() => setShowFirstQuestMemo(false)}>
              [ ПОНЯЛ, ПОГНАЛИ ]
            </button>
          </div>
        </div>
      )}

      {/* ── HAND + ACTIONS ── */}
      <HandControls 
        currentPhase={state.currentPhase}
        filteredHand={state.filteredHand}
        fullHand={state.hand}
        selectedCard={state.selectedCard}
        isPlayerTurn={state.isPlayerTurn && liveActionGateOpen}
        cpu={state.cpu}
        stress={state.stress}
        canAdvancePhase={state.canAdvancePhase}
        getEffectiveCost={actions.getEffectiveCost}
        onCardSelect={actions.handleCardSelect}
        onEndTurn={handleEndTurn}
        onOverclock={actions.handleOverclock}
        onAdvancePhase={actions.advancePhase}
        onTerminate={() => actions.setShowDefeat(true)}
        onMulligan={actions.handleMulligan}
        mulliganUsed={state.mulliganUsed}
        isPipelineFull={state.isPipelineFull}
      />

      {/* Overlays */}
      <CombatOverlays 
        phaseIntro={state.phaseIntro}
        skillMode={props.skillMode}
        cpuMax={state.cpuMax}
        ramMaxMb={state.ramMaxMb}
        showTzModal={showTzModal}
        missionTz={missionTz}
        enemy={state.enemy}
        showVictory={state.showVictory}
        showDefeat={state.showDefeat}
        victoryResult={state.victoryResult}
        deploymentReport={state.deploymentReport}
        stress={state.stress}
        onCloseTzModal={() => setShowTzModal(false)}
        onWin={handleCombatWin}
        coopVictoryReport={coopVictoryReport}
        coopDefeatReport={coopDefeatReport}
        coopDefeatAttemptIndex={defeatAttemptIndex}
        coopMaxAttempts={COOP_SPRINT_MAX_ATTEMPTS}
        coopWillLiquidateAfterThisDefeat={coopWillLiquidateAfterThisDefeat}
      />

      {showDraft && pendingWin && (
        <DraftPanel
          skillMode={props.skillMode}
          currentDeck={draftDeck}
          missionName={pendingWin.name}
          bitsEarned={pendingWin.bits}
          onSelectCard={handleDraftPick}
          onSkip={handleDraftSkip}
        />
      )}
    </div>
  );
};

export default CombatBridge;

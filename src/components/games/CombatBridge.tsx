import React, { useState } from 'react';
import type { Trait } from '../../logic/traits';
import type { CombatCard } from '../../logic/combatCards';
import type { TechnicalTask } from '../../logic/combatTasks';
import { useCombatLogic } from '../../logic/hooks/useCombatLogic';

// UI Components — new layout
import CombatHudBar from './combat/CombatHudBar';
import NeuralBus from './combat/NeuralBus';
import HandControls from './combat/HandControls';
import CombatOverlays from './combat/CombatOverlays';
import DraftPanel from './combat/DraftPanel';

// Styles
import '../../styles/CombatAnimations.css';

interface CombatBridgeProps {
  skillMode: 'script-kiddie' | 'junior' | 'mid' | 'senior';
  playerTraits: Trait[];
  activeDeck: CombatCard[];
  taskLibrary: TechnicalTask[];
  initialTaskIndex?: number;
  onWin: (bitsEarned: number, taskRank: string, finalChain: string[], missionName: string, updatedDeck?: CombatCard[]) => void;
  isQuestCombat?: boolean;
  tier: number;
  deckCores: number;
  deckRamMb: number;
  homeDistrictId?: string;
}

const CombatBridge: React.FC<CombatBridgeProps> = (props) => {
  const { taskLibrary, initialTaskIndex = 0 } = props;
  const missionTz = taskLibrary[initialTaskIndex] ?? taskLibrary[0];
  
  const [showTzModal, setShowTzModal] = useState(false);

  // --- DRAFT STATE ---
  const [showDraft, setShowDraft] = useState(false);
  const [draftDeck, setDraftDeck] = useState<CombatCard[]>(props.activeDeck);
  const [pendingWin, setPendingWin] = useState<{ bits: number; rank: string; chain: string[]; name: string } | null>(null);

  // Core Logic Hook
  const { state, actions } = useCombatLogic({
    ...props,
    missionTz
  });

  const handleCombatWin = (bits: number, rank: string, chain: string[], name: string) => {
    if (bits > 0 && props.skillMode === 'script-kiddie') {
      setPendingWin({ bits, rank, chain, name });
      setShowDraft(true);
    } else {
      props.onWin(bits, rank, chain, name);
    }
  };

  const handleDraftPick = (card: CombatCard) => {
    setDraftDeck(prev => [...prev, card]);
    setShowDraft(false);
    if (pendingWin) props.onWin(pendingWin.bits, pendingWin.rank, pendingWin.chain, pendingWin.name, [...draftDeck, card]);
  };

  const handleDraftSkip = () => {
    setShowDraft(false);
    if (pendingWin) props.onWin(pendingWin.bits, pendingWin.rank, pendingWin.chain, pendingWin.name, draftDeck);
  };

  return (
    <div className={`combat-v2 ${state.stress > 70 ? 'screen-glitch' : ''}`}>
      {/* ── TOP HUD BAR ── */}
      <CombatHudBar
        currentPhase={state.currentPhase}
        stress={state.stress}
        cpu={state.cpu}
        cpuMax={state.cpuMax}
        ramMaxMb={state.ramMaxMb}
        lastLog={state.log[0] || ''}
        tzName={missionTz.name}
        playerProgress={state.playerProgress}
        aiProgress={state.aiProgress}
        onShowTzModal={() => setShowTzModal(true)}
      />

      {/* ── ARENA (full width) ── */}
      <NeuralBus 
        currentPhase={state.currentPhase}
        softSocketsLocked={state.currentPhase !== 'VERIFICATION'}
        skillMode={props.skillMode}
        infraSlots={state.infraSlots}
        softSlots={state.softSlots}
        runtimeRail={state.runtimeRail}
        ramSlotsMax={state.ramSlotsMax}
        missionTzStepsCount={missionTz.steps.length}
        enemy={state.enemy}
        nextBugAction={state.nextBugAction}
        selectedCard={state.selectedCard}
        playerProgress={state.playerProgress}
        aiProgress={state.aiProgress}
        bugPoints={state.bugPoints}
        aiDeadline={state.aiDeadline}
        onExecuteCardOnSlot={actions.executeCardOnSlot}
      />

      {/* ── HAND + ACTIONS ── */}
      <HandControls 
        currentPhase={state.currentPhase}
        filteredHand={state.filteredHand}
        fullHand={state.hand}
        selectedCard={state.selectedCard}
        isPlayerTurn={state.isPlayerTurn}
        cpu={state.cpu}
        stress={state.stress}
        canAdvancePhase={state.canAdvancePhase}
        getEffectiveCost={actions.getEffectiveCost}
        onCardSelect={actions.handleCardSelect}
        onEndTurn={actions.endTurn}
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

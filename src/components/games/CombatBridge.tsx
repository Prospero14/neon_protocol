import React, { useState } from 'react';
import type { Trait } from '../../logic/traits';
import type { CombatCard } from '../../logic/combatCards';
import type { TechnicalTask } from '../../logic/combatTasks';
import { useCombatLogic } from '../../logic/hooks/useCombatLogic';

// UI Components
import CombatSidebar from './combat/CombatSidebar';
import NeuralBus from './combat/NeuralBus';
import HandControls from './combat/HandControls';
import CombatStatusPanel from './combat/CombatStatusPanel';
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
  onWin: (bitsEarned: number, taskRank: string, finalChain: string[], missionName: string) => void;
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

  // Перехватываем победу: Script Kiddo → показываем Draft, остальные → сразу onWin
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
    if (pendingWin) props.onWin(pendingWin.bits, pendingWin.rank, pendingWin.chain, pendingWin.name);
  };

  const handleDraftSkip = () => {
    setShowDraft(false);
    if (pendingWin) props.onWin(pendingWin.bits, pendingWin.rank, pendingWin.chain, pendingWin.name);
  };

  return (
    <div className={`combat-bridge-root ${state.stress > 70 ? 'screen-glitch' : ''}`}>
      <div className="combat-hud">
        <CombatSidebar 
          currentPhase={state.currentPhase}
          stress={state.stress}
          cpu={state.cpu}
          cpuMax={state.cpuMax}
          ramMaxMb={state.ramMaxMb}
          log={state.log}
          isPlayerTurn={state.isPlayerTurn}
          canAdvancePhase={state.canAdvancePhase}
          onAdvancePhase={actions.advancePhase}
          onEndTurn={actions.endTurn}
          onOverclock={actions.handleOverclock}
          onTerminate={() => actions.setShowDefeat(true)}
        />

        <NeuralBus 
          currentPhase={state.currentPhase}
          skillMode={props.skillMode}
          infraSlots={state.infraSlots}
          softSlots={state.softSlots}
          runtimeRail={state.runtimeRail}
          ramSlotsMax={state.ramSlotsMax}
          missionTzStepsCount={missionTz.steps.length}
          enemy={state.enemy}
          onExecuteCardOnSlot={actions.executeCardOnSlot}
        />

        <CombatStatusPanel 
          playerProgress={state.playerProgress}
          aiProgress={state.aiProgress}
          bugPoints={state.bugPoints}
          aiDeadline={state.aiDeadline}
          missionTz={missionTz}
          deckCount={state.deck.length}
          mulliganUsed={state.mulliganUsed}
          currentPhase={state.currentPhase}
          planningTurn={state.planningTurn}
          onMulligan={actions.handleMulligan}
          onShowTzModal={setShowTzModal}
        />
      </div>

      <HandControls 
        currentPhase={state.currentPhase}
        activeHandTab={state.activeHandTab}
        filteredHand={state.filteredHand}
        selectedCard={state.selectedCard}
        isPlayerTurn={state.isPlayerTurn}
        cpu={state.cpu}
        onTabChange={actions.setActiveHandTab}
        onCardSelect={actions.handleCardSelect}
      />

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

      {/* DRAFT PANEL — после победы Script Kiddo */}
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

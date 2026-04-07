import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CombatPhase } from '../combatPhases';
import { SDLC_PHASES } from '../combatPhases';
import type { CombatCard } from '../combatCards';
import type { TechnicalTask } from '../combatTasks';
import { getStepCardIds } from '../combatTasks';

import type { Trait } from '../traits';
import { BUGS, getRandomBugAction } from '../combatEnemies';
import type { BugEnemy, BugAction, BugProblemType } from '../combatEnemies';

export type RailSlotType = 'EMPTY' | 'PLAYER_CODE' | 'BUG_ERROR';
export interface RailSlot {
  type: RailSlotType;
  content: CombatCard | BugAction | null;
  integrity: number;
}


export type CardSource = 'hand' | 'palette';

interface UseCombatLogicProps {
  skillMode: 'script-kiddie' | 'junior' | 'mid' | 'senior';
  playerTraits: Trait[];
  activeDeck: CombatCard[];
  missionTz: TechnicalTask;
  tier: number;
  deckCores: number;
  deckRamMb: number;
  homeDistrictId?: string;
  isQuestCombat?: boolean;
}

export function useCombatLogic({
  skillMode,
  playerTraits,
  activeDeck,
  missionTz,
  tier,
  deckCores,
  deckRamMb,
  homeDistrictId,
  isQuestCombat
}: UseCombatLogicProps) {
  const START_HAND_SIZE = homeDistrictId === 'tekstilschiki' ? 6 : 5;

  // --- CORE STATE ---
  const [currentPhase, setCurrentPhase] = useState<CombatPhase>(skillMode === 'script-kiddie' ? 'DEVELOPMENT' : 'ARCHITECTURE');
  const [playerProgress, setPlayerProgress] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [bugPoints, setBugPoints] = useState(0);
  const [stress, setStress] = useState(0);
  const [activeProblem] = useState<BugProblemType | null>(null);
  const [aiDeadline, setAiDeadline] = useState(Math.max(3, 10 - tier));

  const [showVictory, setShowVictory] = useState(false);

  const [showDefeat, setShowDefeat] = useState(false);
  const [victoryResult, setVictoryResult] = useState<{ bits: number, chain: string[] } | null>(null);
  const [deploymentReport, setDeploymentReport] = useState<any>(null);

  const [cpuMax, setCpuMax] = useState(deckCores);
  const [cpu, setCpu] = useState(deckCores);
  const [ramMaxMb, setRamMaxMb] = useState(deckRamMb);

  const [planningTurn, setPlanningTurn] = useState(0);
  const [mulliganUsed, setMulliganUsed] = useState(false);
  const [activeHandTab, setActiveHandTab] = useState<'AUX' | 'CODE'>('AUX');

  const [infraSlots, setInfraSlots] = useState<(CombatCard | null)[]>(Array(6).fill(null));
  const [softSlots, setSoftSlots] = useState<(CombatCard | null)[]>(Array(2).fill(null));

  const [hand, setHand] = useState<CombatCard[]>([]);
  const [deck, setDeck] = useState<CombatCard[]>([]);
  const [discard, setDiscard] = useState<CombatCard[]>([]);

  const [selectedCard, setSelectedCard] = useState<{ source: CardSource, idx: number } | null>(null);
  const [runtimeRail, setRuntimeRail] = useState<RailSlot[]>(
    Array(8).fill(null).map(() => ({ type: 'EMPTY', content: null, integrity: 0 }))
  );

  const [enemy] = useState<BugEnemy | null>(() => {
    if (missionTz.id.includes('copy_logs') || missionTz.isExecutionChain) {
      return BUGS.find(b => b.id === 'enemy_passive') || BUGS[0];
    }
    const enemies = BUGS.filter(b => b.id !== 'enemy_passive');
    return enemies[Math.floor(Math.random() * enemies.length)];
  });
  const [nextBugAction, setNextBugAction] = useState<BugAction | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [canAdvancePhase, setCanAdvancePhase] = useState(false);
  const [phaseIntro, setPhaseIntro] = useState<string | null>(skillMode === 'script-kiddie' ? 'DEVELOPMENT' : 'ARCHITECTURE');

  const [cardsPlayedThisTurn, setCardsPlayedThisTurn] = useState(0);

  // --- DERIVED ---
  const ramSlotsMax = useMemo(() => {
    const raw = Math.floor(ramMaxMb / 512);
    if (skillMode === 'script-kiddie') return Math.max(raw, missionTz.steps.length);
    return raw;
  }, [ramMaxMb, skillMode, missionTz]);

  const codingPalette = useMemo(() =>
    activeDeck.filter(c => c.type === 'SYNTAX' || c.type === 'FUNCTION'),
    [activeDeck]);

  const initialDrawDeck = useMemo(() =>
    activeDeck.filter(c => c.type !== 'SYNTAX' && c.type !== 'FUNCTION'),
    [activeDeck]);

  const filteredHand = useMemo(() => {
    const scriptsHand = hand
      .map((c, i) => ({ card: c, source: 'hand' as const, idx: i }))
      .filter(item => item.card.type === 'SCRIPT');

    if (activeHandTab === 'CODE') {
      const palette = codingPalette.map((c, i) => ({ card: c, source: 'palette' as const, idx: i }));
      let allCode = [...palette, ...scriptsHand];
      if (skillMode === 'script-kiddie') {
          // Filter out Java/Kotlin for kiddo
          allCode = allCode.filter(item => item.card.type === 'SCRIPT' || item.card.type === 'SOFT');
      }
      return allCode;
    }

    const aux = hand
      .map((c, i) => ({ card: c, source: 'hand' as const, idx: i }))
      .filter(item => {
        if (activeHandTab === 'AUX') {
          return ['INFRASTRUCTURE', 'SOFT', 'REACTION', 'DEFENSIVE', 'HARD'].includes(item.card.type);
        }
        return true;
      });
      
    if (skillMode === 'script-kiddie') {
        return aux.filter(item => item.card.type === 'SCRIPT' || item.card.type === 'SOFT');
    }
    return aux;
  }, [hand, activeHandTab, codingPalette, skillMode]);

  const addLog = useCallback((msg: string) => setLog(prev => [msg, ...prev].slice(0, 15)), []);

  // --- INIT ---
  useEffect(() => {
    const shuffled = [...initialDrawDeck].sort(() => Math.random() - 0.5);
    let startHand = shuffled.slice(0, START_HAND_SIZE);
    let remainingDeck = shuffled.slice(START_HAND_SIZE);

    if (skillMode === 'script-kiddie') {
      const scripts = shuffled.filter(c => c.type === 'SCRIPT' || c.type === 'SOFT');
      const rest = shuffled.filter(c => c.type !== 'SCRIPT' && c.type !== 'SOFT');
      // Ensure kiddo has at least 3-4 scripts in hand
      startHand = [...scripts.slice(0, 4), ...rest.slice(0, START_HAND_SIZE)].slice(0, START_HAND_SIZE + 1);
      remainingDeck = [...scripts.slice(4), ...rest.slice(START_HAND_SIZE)];
    }

    setHand(startHand);
    setDeck(remainingDeck);
    if (enemy) setNextBugAction(getRandomBugAction(enemy));

    addLog('[SYSTEM] BOOT_SEQUENCE... [OK]');
    addLog(`[SYSTEM] PHASE_${currentPhase}_ACTIVE.`);

    if (playerTraits.some(t => t.id === 'hobby_comp_coding')) setRamMaxMb(prev => prev + 512);
    if (playerTraits.some(t => t.id === 'hardware_reclaimer')) setRamMaxMb(prev => prev + 512);
    if (playerTraits.some(t => t.id === 'overclocked')) {
      setCpuMax(prev => prev + 1);
      setCpu(prev => prev + 1);
    }

    setPhaseIntro(currentPhase);
    setTimeout(() => setPhaseIntro(null), 2500);
  }, []);

  // --- PROGRESS LOGIC ---
  useEffect(() => {
    if (!missionTz.steps) return;
    const railIds = runtimeRail.filter(s => s.type === 'PLAYER_CODE').map(s => (s.content as CombatCard).id);
    if (missionTz.isExecutionChain) {
      let matchedSteps = 0;
      for (let i = 0; i < missionTz.steps.length; i++) {
        const step = missionTz.steps[i];
        const deployedCardId = railIds[i];
        if (deployedCardId && getStepCardIds(step).includes(deployedCardId)) matchedSteps++; else break;
      }
      setPlayerProgress(Math.floor((matchedSteps / missionTz.steps.length) * 100));
    } else {
      const satisfiedSteps = missionTz.steps.filter(step => getStepCardIds(step).some(id => railIds.includes(id)));
      setPlayerProgress(Math.floor((satisfiedSteps.length / missionTz.steps.length) * 100));
    }
  }, [runtimeRail, missionTz]);

  const drawCards = (count: number) => {
    setHand(prevHand => {
      const newHand = [...prevHand];
      let currentDeck = [...deck];
      let currentDiscard = [...discard];
      for (let i = 0; i < count; i++) {
        if (currentDeck.length === 0) {
          currentDeck = [...currentDiscard].sort(() => Math.random() - 0.5);
          currentDiscard = [];
        }
        if (currentDeck.length > 0) newHand.push(currentDeck.pop()!);
      }
      setDeck(currentDeck);
      setDiscard(currentDiscard);
      return newHand;
    });
  };

  const getEffectiveCost = (card: CombatCard) => {
    let cost = card.cost ?? 0;
    if (activeProblem === 'TECH_DEBT') cost += 1;
    if (currentPhase === 'ARCHITECTURE' && card.type === 'SCRIPT' && playerTraits.some(t => t.id === 'legacy_diggr')) cost = Math.max(0, cost - 1);
    return cost;
  };

  const handleCardSelect = (source: CardSource, idx: number) => {
    if (!isPlayerTurn) return;
    const card = source === 'hand' ? hand[idx] : codingPalette[idx];

    if (card.type === 'STATUS') {
      const cost = getEffectiveCost(card);
      if (cpu < cost) { addLog(`[ERROR] CPU_LOW`); return; }
      setCpu(prev => prev - cost);
      setHand(prev => prev.filter((_, i) => i !== idx));
      setDiscard(prev => [...prev, card]);
      addLog(`[BURN] ${card.name}`);
      return;
    }

    const rules = SDLC_PHASES[currentPhase];
    if (!rules.allowedTypes.includes(card.type)) {
      addLog(`[DENIED] ${card.type}_NOT_ALLOWED_IN_${currentPhase}`);
      return;
    }

    const cost = getEffectiveCost(card);
    if (cpu < cost) { addLog(`[ERROR] CPU_LOW`); return; }

    if (card.type === 'INFRASTRUCTURE') {
      const emptyIdx = infraSlots.findIndex(s => s === null);
      if (emptyIdx !== -1) {
        const next = [...infraSlots];
        next[emptyIdx] = card;
        setInfraSlots(next);
        applyInfraEffect(card);
        setCpu(prev => prev - cost);
        setHand(prev => prev.filter((_, i) => i !== idx));
        addLog(`[SYSTEM] INFRA_DEPLOYED: ${card.name}`);
      }
      return;
    } else if (card.type === 'SOFT') {
      const emptyIdx = softSlots.findIndex(s => s === null);
      if (emptyIdx !== -1) {
        const next = [...softSlots];
        next[emptyIdx] = card;
        setSoftSlots(next);
        setCpu(prev => prev - cost);
        setHand(prev => prev.filter((_, i) => i !== idx));
        addLog(`[SYSTEM] SOFT_SKILL_ATTACHED: ${card.name}`);
      }
      return;
    }

    if (currentPhase === 'VERIFICATION' && (card.type === 'SYNTAX' || card.type === 'FUNCTION')) {
      addLog(`[DENIED] CODE_FREEZE_ACTIVE. NO_NEW_CODE_IN_VERIFICATION.`);
      return;
    }

    setSelectedCard({ source, idx });
    addLog(`[READY] ${card.name}`);
  };

  const applyInfraEffect = (card: CombatCard) => {
    switch (card.id) {
      case 'infra_dns_resolver': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); break;
      case 'infra_lb_nginx': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 512); break;
      case 'infra_basic_pod': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 512); break;
      case 'infra_docker': setRamMaxMb(prev => prev + 512); break;
      case 'infra_s3_bucket': setRamMaxMb(prev => prev + 1536); break;
      case 'infra_raid_array': setStress(prev => Math.max(0, prev - 20)); break;
      case 'infra_postgres': setCpuMax(prev => prev + 2); setCpu(cur => cur + 2); break;
      default: setCpuMax(prev => prev + 1); setCpu(cur => cur + 1);
    }
  };

  const executeCardOnSlot = (idx: number) => {
    if (!selectedCard || !isPlayerTurn) return;
    if (idx >= ramSlotsMax) { addLog('[ERROR] RAM_LOCKED'); return; }
    const card = selectedCard.source === 'hand' ? hand[selectedCard.idx] : codingPalette[selectedCard.idx];
    const slot = runtimeRail[idx];

    if (slot.type === 'BUG_ERROR') {
      const canDestroyIce = card.type === 'DEFENSIVE' || card.type === 'REACTION' || (card.type === 'SCRIPT' && (card.id === 'script_ping' || card.id === 'script_auth'));
      if (canDestroyIce) {
        const newRail = [...runtimeRail];
        newRail[idx] = { type: 'EMPTY', content: null, integrity: 0 };
        setRuntimeRail(newRail);
        if (selectedCard.source === 'hand') {
          setHand(prev => prev.filter((_, i) => i !== selectedCard.idx));
          setDiscard(prev => [...prev, card]);
        }
        setSelectedCard(null);
        addLog(`[SEC] ${card.name} PATCHED/BYPASSED_ICE.`);
      } else addLog(`[DENIED] CANNOT_PATCH_WITH_THIS_CARD.`);
      return;
    }
    if (slot.type !== 'EMPTY') return;

    const activeCards = runtimeRail.filter(s => s.type === 'PLAYER_CODE').length;
    if (activeCards === 0) {
      if (missionTz.resistanceType === 'AUTH_LOCKED' && !['script_auth', 'script_sudo_fix', 'fn_sudo_fix'].includes(card.id)) { addLog(`[DENIED] TARGET_REQUIRES_AUTH.`); return; }
      if (missionTz.resistanceType === 'ENCRYPTED' && card.id !== 'script_ssh') { addLog(`[DENIED] TARGET_IS_ENCRYPTED.`); return; }
    }

    const cost = getEffectiveCost(card);
    setCpu(prev => prev - cost);
    let finalIntegrity = card.integrity ?? 10;

    const newRail = [...runtimeRail];
    newRail[idx] = { type: 'PLAYER_CODE', content: card, integrity: finalIntegrity };
    setRuntimeRail(newRail);

    // --- EXTENDED CHAIN SYNERGIES ---
    if (idx > 0 && runtimeRail[idx - 1].type === 'PLAYER_CODE') {
      const prev1 = (runtimeRail[idx - 1].content as CombatCard).id;
      const prev2 = idx > 1 && runtimeRail[idx - 2].type === 'PLAYER_CODE'
        ? (runtimeRail[idx - 2].content as CombatCard).id : null;

      // 2-card chains
      if ((prev1 === 'script_ls' && card.id === 'script_grep') ||
          (prev1 === 'script_grep' && card.id === 'script_scp') ||
          (prev1 === 'script_ssh' && card.id === 'script_auth') ||
          (prev1 === 'script_grep' && card.id === 'script_wash_logs') ||
          (prev1 === 'script_curl' && card.id === 'script_chmod') ||
          (prev1 === 'script_ping' && card.id === 'script_grep') ||
          (prev1 === 'script_auth' && card.id === 'script_sudo_fix')) {
        finalIntegrity = Math.floor(finalIntegrity * 1.5);
        addLog(`[ CHAIN_LINK ] ${prev1.replace('script_', '')} → ${card.id.replace('script_', '')} +50% integrity`);
        newRail[idx] = { ...newRail[idx], integrity: finalIntegrity };
        setRuntimeRail([...newRail]);
      }

      // 3-card chains (максимальный бонус)
      if (prev2) {
        const chain3 = [prev2, prev1, card.id];
        let bonusLog = '';
        let progressBonus = 0;
        let stressRelief = 0;

        if (chain3.join(',') === 'script_ls,script_grep,script_cat') {
          bonusLog = '[ DATA_EXFIL_CHAIN ] ls→grep→cat — INTEL_EXTRACTED!';
          progressBonus = 15;
        } else if (chain3.join(',') === 'script_ls,script_grep,script_wash_logs') {
          bonusLog = '[ STEALTH_CHAIN ] ls→grep→wash_logs — TRACES_ERASED!';
          stressRelief = 10;
        } else if (chain3.join(',') === 'script_ssh,script_auth,script_sudo_fix') {
          bonusLog = '[ ROOT_OVERRIDE ] ssh→auth→sudo — ROOT_ACCESS_GRANTED!';
          finalIntegrity *= 2;
          newRail[idx] = { ...newRail[idx], integrity: finalIntegrity };
          setRuntimeRail([...newRail]);
        } else if (chain3.join(',') === 'script_ssh,script_auth,script_cat') {
          bonusLog = '[ TUNNEL_READ ] ssh→auth→cat — SECURE_READ_COMPLETE!';
          progressBonus = 15;
        } else if (chain3.join(',') === 'script_curl,script_chmod,script_nc') {
          bonusLog = '[ BACKDOOR_CHAIN ] curl→chmod→nc — PERSISTENCE_ESTABLISHED!';
          finalIntegrity = Math.floor(finalIntegrity * 2);
          newRail[idx] = { ...newRail[idx], integrity: finalIntegrity };
          setRuntimeRail([...newRail]);
        } else if (chain3.join(',') === 'script_ping,script_grep,script_scp') {
          bonusLog = '[ EXFIL_PIPELINE ] ping→grep→scp — DATA_SECURED!';
          progressBonus = 20;
        } else if (chain3.join(',') === 'script_grep,script_wash_logs,script_rm') {
          bonusLog = '[ FULL_WIPE ] grep→wash→rm — CLEAN_SWEEP!';
          progressBonus = 25;
        } else if (chain3.join(',') === 'script_auth,script_sudo_fix,script_rm') {
          bonusLog = '[ PRIV_WIPE ] auth→sudo→rm — ROOT_WIPE_COMPLETE!';
          progressBonus = 20;
          stressRelief = 5;
        }

        if (bonusLog) {
          addLog(bonusLog);
          if (progressBonus > 0) setPlayerProgress(p => Math.min(100, p + progressBonus));
          if (stressRelief > 0) setStress(s => Math.max(0, s - stressRelief));
        }
      }
    }

    // --- SPECIAL REACTION CARD EFFECTS ---
    if (card.id === 'react_emergency_flush') {
      setHand([]);
      drawCards(4);
      setStress(s => Math.max(0, s - 8));
      addLog('[FLUSH] BUFFER_EMERGENCY_FLUSHED. Hand cleared, -8 stress.');
    }
    if (card.id === 'react_null_packet') {
      setRuntimeRail(prev => {
        const next = [...prev];
        const bugIdx = next.findIndex(s => s.type === 'BUG_ERROR');
        if (bugIdx !== -1) {
          next[bugIdx] = { type: 'EMPTY', content: null, integrity: 0 };
          addLog('[NULL_PACKET] BUG_ERROR_NEUTRALIZED.');
        }
        return next;
      });
    }

    if (selectedCard.source === 'hand') {
      const canReturn = (card.type === 'SCRIPT' && playerTraits.some(t => t.id === 'stack_archaeologist') && Math.random() < 0.25);
      if (!canReturn) {
        setHand(prev => prev.filter((_, i) => i !== selectedCard.idx));
        setDiscard(prev => [...prev, card]);
      } else addLog(`[RECOVERY] ${card.name} RETURNED_TO_STACK.`);
    }

    // --- REactive Enemy Logic ---
    setCardsPlayedThisTurn(p => p + 1);
    if (enemy?.id === 'enemy_traceback' && cardsPlayedThisTurn >= 2) {
        setStress(s => Math.min(100, s + 10));
        addLog(`[WARNING] TRACEBACK_ANOMALY_PUNISHED_STRESS!`);
    }

    setSelectedCard(null);

    addLog(`[EXEC] ${card.name}`);

    const rules = SDLC_PHASES[currentPhase];
    if (rules.targetProgress && playerProgress >= rules.targetProgress) setCanAdvancePhase(true);
  };

  const handleAiStep = () => {
    if (!nextBugAction || !enemy) return;
    if (currentPhase === 'ARCHITECTURE') { addLog(`[AI] ${enemy.name} IS WATCHING...`); return; }
    setAiProgress(prev => Math.min(100, prev + nextBugAction.progressPoints));
    setBugPoints(prev => prev + nextBugAction.bugPoints);
    if (nextBugAction.spawnId) {
      setRuntimeRail(prev => {
        const next = [...prev];
        const empty = next.findIndex(s => s.type === 'EMPTY');
        if (empty !== -1) next[empty] = { type: 'BUG_ERROR', content: nextBugAction, integrity: 10 };
        return next;
      });
    }
    if (nextBugAction.damage > 0) setStress(prev => Math.min(100, prev + Math.floor(nextBugAction.damage * (1 + (tier - 1) * 0.25))));
    addLog(`[AI] ${nextBugAction.name}`);
  };

  const advancePhase = () => {
    const rules = SDLC_PHASES[currentPhase];
    if (rules.nextPhaseId) {
      const targetPhase = rules.nextPhaseId;
      setCurrentPhase(targetPhase);
      setCanAdvancePhase(false);
      setPhaseIntro(targetPhase);
      addLog(`[PHASE] ${targetPhase}`);
      setTimeout(() => setPhaseIntro(null), 2500);
      if (targetPhase === 'DEVELOPMENT') {
        setHand(prev => [...prev, ...deck, ...codingPalette]);
        setDeck([]);
        addLog('[SYSTEM] PROGRAMMING_DECK_LOADED');
        if (ramSlotsMax < missionTz.steps.length) addLog('[WARNING] ARCHITECTURAL_DIFF_DETECTED!');
      }
      if (targetPhase === 'DEPLOYMENT') runFinalDeploymentCheck();
    }
  };

  const runFinalDeploymentCheck = () => {
    addLog('[SYSTEM] INITIALIZING_FINAL_DEPLOYMENT_CHECK...');
    const railIds = runtimeRail.filter(s => s.type === 'PLAYER_CODE').map(s => (s.content as CombatCard).id);
    let missingSteps = missionTz.steps.filter(step => !getStepCardIds(step).some(id => railIds.includes(id)));
    if (missionTz.isExecutionChain) {
      const isSequenceValid = missionTz.steps.every((step, index) => railIds[index] && getStepCardIds(step).includes(railIds[index]));
      if (!isSequenceValid || railIds.length !== missionTz.steps.length) { missingSteps = [...missionTz.steps]; addLog('[ERROR] EXECUTION_CHAIN_BROKEN'); }
    }
    const productionCards = runtimeRail.filter(s => s.type === 'PLAYER_CODE' && s.content && ['SYNTAX', 'FUNCTION', 'REACTION'].includes((s.content as any).type)).length;
    const cpuOk = cpuMax >= productionCards * 0.5;
    const ramOk = ramMaxMb >= productionCards * 256;
    const slotsOk = ramSlotsMax >= missionTz.steps.length;
    const stabilityDamage = runtimeRail.filter(s => s.type === 'BUG_ERROR').length * 15;
    const currentStress = stress + stabilityDamage;
    setStress(Math.min(100, currentStress));
    const isSuccess = missingSteps.length === 0 && cpuOk && ramOk && slotsOk && currentStress < 100;
    setDeploymentReport({ missingSteps, cpuOk, ramOk, slotsOk, slotsAvailable: ramSlotsMax, slotsRequired: missionTz.steps.length, stabilityDamage, isSuccess });
    const finalBits = isQuestCombat ? 15 : (skillMode === 'script-kiddie' ? 25 : 100 + tier * 50);
    const finalChain = runtimeRail.filter(s => s.type === 'PLAYER_CODE' && s.content).map(s => (s.content as CombatCard).name);
    setTimeout(() => { if (isSuccess) { setVictoryResult({ bits: finalBits, chain: finalChain }); setShowVictory(true); } else setShowDefeat(true); }, 2000);
  };

  const endTurn = () => {
    if (missionTz.isExecutionChain && playerProgress >= 100) { addLog('[SYSTEM] COMPILE... [OK]'); setIsPlayerTurn(false); runFinalDeploymentCheck(); return; }
    setIsPlayerTurn(false); setSelectedCard(null); setAiDeadline(prev => Math.max(0, prev - 1)); addLog('[AI] THINKING...');
    
    // Reset turn-level counters
    setCardsPlayedThisTurn(0);

    // --- PERSONALITY EFFECTS (end of player turn) ---
    if (enemy?.personality === 'TRACER' && cardsPlayedThisTurn > 2) {
      setStress(s => Math.min(100, s + 15));
      addLog(`[TRACER] SIGNATURE_DETECTED! ${cardsPlayedThisTurn} cards played. +15 stress penalty.`);
    }
    if (enemy?.personality === 'SNIFFER') {
      const statusCount = hand.filter(c => c.type === 'STATUS').length;
      if (statusCount > 0) {
        const dmg = statusCount * 8;
        setStress(s => Math.min(100, s + dmg));
        addLog(`[SNIFFER] ${statusCount} STATUS_CARDS_DETECTED. +${dmg} stress.`);
      }
    }
    if (enemy?.personality === 'AUDITOR') {
      const firstRailCard = runtimeRail.find(s => s.type === 'PLAYER_CODE');
      if (firstRailCard && firstRailCard.content) {
        const card = firstRailCard.content as CombatCard;
        if (card.type !== 'REACTION' && card.id !== 'react_spoof_id') {
          setPlayerProgress(p => Math.max(0, p - 10));
          addLog('[AUDITOR] PROTOCOL_VIOLATION! First slot non-REACTION. -10 progress.');
        }
      }
    }
    if (enemy?.personality === 'PHANTOM' && planningTurn % 2 === 0) {
      setRuntimeRail(prev => {
        const next = [...prev];
        const occupied = next.map((s, i) => s.type === 'PLAYER_CODE' ? i : -1).filter(i => i !== -1);
        if (occupied.length > 1) {
          const fromIdx = occupied[Math.floor(Math.random() * occupied.length)];
          const emptyIdx = next.findIndex(s => s.type === 'EMPTY');
          if (emptyIdx !== -1) {
            next[emptyIdx] = next[fromIdx];
            next[fromIdx] = { type: 'EMPTY', content: null, integrity: 0 };
            addLog('[PHANTOM] PHASE_SHIFT! A card was displaced on the bus.');
          }
        }
        return next;
      });
    }

    setTimeout(() => {
      handleAiStep();
      setTimeout(() => {
        setIsPlayerTurn(true); setCpu(cpuMax); drawCards(1);
        if (enemy) setNextBugAction(getRandomBugAction(enemy));
        if (enemy?.visualType === 'DEVELOPER') {
          setAiDeadline(prev => {
            const clock = prev - 1;
            if (clock <= 0) setShowDefeat(true); else addLog(`[WARNING] SYSTEM_CLOCK: ${clock} CYCLES_LEFT`);
            return clock;
          });
        } else { setStress(prev => Math.min(100, prev + 5)); addLog(`[WARNING] SYSTEM_STRESS: +5%`); }
        if (currentPhase === 'ARCHITECTURE') {
          const nextTurn = planningTurn + 1;
          if (nextTurn >= 2) { setPlanningTurn(0); advancePhase(); } else setPlanningTurn(nextTurn);
        }
      }, 800);
    }, 500);
  };

  const handleMulligan = () => {
    if (mulliganUsed || currentPhase !== 'ARCHITECTURE' || planningTurn > 0) return;
    addLog(`[SYSTEM] REDRAW_BUFFER_INITIATED...`);
    const oldHand = [...hand];
    const newDeck = [...deck, ...oldHand].sort(() => Math.random() - 0.5);
    setHand(newDeck.slice(0, START_HAND_SIZE));
    setDeck(newDeck.slice(START_HAND_SIZE));
    setMulliganUsed(true);
  };

  const handleOverclock = () => {
    if (!isPlayerTurn || stress >= 85) return;
    setStress(prev => Math.min(100, prev + 15));
    setCpu(prev => prev + 1);
    addLog('[WARN] OVERCLOCK_ENGAGED.');
  };

  return {
    state: {
      currentPhase, playerProgress, aiProgress, bugPoints, stress, activeProblem, aiDeadline,
      showVictory, showDefeat, victoryResult, deploymentReport, cpuMax, cpu, ramMaxMb,
      planningTurn, mulliganUsed, activeHandTab, infraSlots, softSlots, hand, deck, discard,
      selectedCard, runtimeRail, enemy, nextBugAction, isPlayerTurn, log, canAdvancePhase, phaseIntro,
      ramSlotsMax, filteredHand, codingPalette
    },
    actions: {
      setActiveHandTab, handleCardSelect, executeCardOnSlot, handleMulligan,
      handleOverclock, endTurn, advancePhase, setShowVictory, setShowDefeat
    }
  };
}

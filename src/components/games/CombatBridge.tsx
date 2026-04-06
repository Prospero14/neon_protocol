import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Zap, 
  Database, 
  Terminal, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import type { CombatPhase } from '../../logic/combatPhases';
import { SDLC_PHASES } from '../../logic/combatPhases';
import type { CombatCard } from '../../logic/combatCards';
import type { TechnicalTask } from '../../logic/combatTasks';
import type { Trait } from '../../logic/traits';
import { BUGS, getRandomBugAction } from '../../logic/combatEnemies';
import type { BugEnemy, BugAction, BugProblemType } from '../../logic/combatEnemies';

import CyberCard from '../CyberCard';

interface CombatBridgeProps {
  skillMode: 'script-kiddie' | 'junior' | 'mid' | 'senior';
  playerTraits: Trait[];
  activeDeck: CombatCard[];
  taskLibrary: TechnicalTask[];
  initialTaskIndex?: number;
  onDiscoverCard?: (id: string) => void;
  onViewChange?: (view: any) => void;
  onWin: (bitsEarned: number, taskRank: 'script-kiddie' | 'junior' | 'mid' | 'senior', finalChain: string[], missionName: string) => void;
  isQuestCombat?: boolean;
  tier: number;
  deckCores: number;
  deckRamMb: number;
  homeDistrictId?: string;
}

type RailSlotType = 'EMPTY' | 'PLAYER_CODE' | 'BUG_ERROR';
interface RailSlot {
  type: RailSlotType;
  content: CombatCard | BugAction | null;
  integrity: number;
}

type CardSource = 'hand' | 'palette';

const CombatBridge: React.FC<CombatBridgeProps> = ({
  skillMode,
  playerTraits,
  activeDeck,
  taskLibrary,
  initialTaskIndex = 0,
  onWin,
  tier,
  deckCores,
  deckRamMb,
  homeDistrictId,
  isQuestCombat = false
}) => {
  const missionTz = taskLibrary[initialTaskIndex] ?? taskLibrary[0];
  const START_HAND_SIZE = homeDistrictId === 'tekstilschiki' ? 6 : 5;

  // --- CORE STATE ---
  const [currentPhase, setCurrentPhase] = useState<CombatPhase>(skillMode === 'script-kiddie' ? 'DEVELOPMENT' : 'ARCHITECTURE');
  const [playerProgress, setPlayerProgress] = useState(0); // This will be calculated in a useEffect below
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
  
  const [selectedCard, setSelectedCard] = useState<{source: CardSource, idx: number} | null>(null);
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
       return [...palette, ...scriptsHand];
    }
    return hand
      .map((c, i) => ({ card: c, source: 'hand' as const, idx: i }))
      .filter(item => {
        if (activeHandTab === 'AUX') {
          return ['INFRASTRUCTURE', 'SOFT', 'REACTION', 'DEFENSIVE', 'HARD'].includes(item.card.type);
        }
        return true;
      });
  }, [hand, activeHandTab, codingPalette]);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 15));

  // --- INIT ---
  useEffect(() => {
    // Шаттл колоды
    const shuffled = [...initialDrawDeck].sort(() => Math.random() - 0.5);
    // Стартовая рука по ТЗ (5 карт база, 6 для Текстильщиков)
    let startHand = shuffled.slice(0, START_HAND_SIZE);
    let remainingDeck = shuffled.slice(START_HAND_SIZE);

    if (skillMode === 'script-kiddie') {
        const scripts = shuffled.filter(c => c.type === 'SCRIPT');
        const rest = shuffled.filter(c => c.type !== 'SCRIPT');
        startHand = [...scripts, ...rest.slice(0, START_HAND_SIZE)];
        remainingDeck = rest.slice(START_HAND_SIZE);
    }
    
    setHand(startHand);
    setDeck(remainingDeck);
    if (enemy) setNextBugAction(getRandomBugAction(enemy));

    addLog('[SYSTEM] BOOT_SEQUENCE... [OK]');
    addLog(`[SYSTEM] PHASE_${currentPhase}_ACTIVE.`);

    if (playerTraits.some(t => t.id === 'hobby_comp_coding')) {
      setRamMaxMb(prev => prev + 512); 
    }
    if (playerTraits.some(t => t.id === 'hardware_reclaimer')) {
      setRamMaxMb(prev => prev + 512); // Reclaimer gets extra slot early
    }
    if (playerTraits.some(t => t.id === 'overclocked')) {
      setCpuMax(prev => prev + 1);
      setCpu(prev => prev + 1);
    }

    // Trigger initial phase intro
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
            if (deployedCardId && step.requiredCardIds.includes(deployedCardId)) {
                matchedSteps++;
            } else {
                break; // Chain broken
            }
        }
        setPlayerProgress(Math.floor((matchedSteps / missionTz.steps.length) * 100));
    } else {
        const satisfiedSteps = missionTz.steps.filter(step => step.requiredCardIds.some(id => railIds.includes(id)));
        setPlayerProgress(Math.floor((satisfiedSteps.length / missionTz.steps.length) * 100));
    }
  }, [runtimeRail, missionTz]);

  const handleMulligan = () => {
    if (mulliganUsed || currentPhase !== 'ARCHITECTURE' || planningTurn > 0) return;
    
    addLog(`[SYSTEM] REDRAW_BUFFER_INITIATED...`);
    const oldHand = [...hand];
    const newDeck = [...deck, ...oldHand].sort(() => Math.random() - 0.5);
    const newHand = newDeck.slice(0, START_HAND_SIZE);
    const finalDeck = newDeck.slice(START_HAND_SIZE);
    
    setHand(newHand);
    setDeck(finalDeck);
    setMulliganUsed(true);
  };


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
            if (currentDeck.length > 0) {
                newHand.push(currentDeck.pop()!);
            }
        }
        setDeck(currentDeck);
        setDiscard(currentDiscard);
        return newHand;
    });
  };

  const getEffectiveCost = (card: CombatCard) => {
    let cost = card.cost ?? 0;
    if (activeProblem === 'TECH_DEBT') cost += 1;
    
    // Trait: Legacy Diggr makes SCRIPT cards cheaper in ARCHITECTURE
    if (currentPhase === 'ARCHITECTURE' && card.type === 'SCRIPT' && playerTraits.some(t => t.id === 'legacy_diggr')) {
      cost = Math.max(0, cost - 1);
    }
    
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

    // В фазе VERIFICATION нельзя выкладывать новый код (Syntax/Function)
    if (currentPhase === 'VERIFICATION' && (card.type === 'SYNTAX' || card.type === 'FUNCTION')) {
        addLog(`[DENIED] CODE_FREEZE_ACTIVE. NO_NEW_CODE_IN_VERIFICATION.`);
        return;
    }

    setSelectedCard({ source, idx });
    addLog(`[READY] ${card.name}`);
  };

  const applyInfraEffect = (card: CombatCard) => {
    switch(card.id) {
        case 'infra_dns_resolver': 
            setCpuMax(prev => prev + 1); 
            setCpu(cur => cur + 1); 
            break;
        case 'infra_lb_nginx': 
            setCpuMax(prev => prev + 1); 
            setCpu(cur => cur + 1);
            setRamMaxMb(prev => prev + 512); 
            break;
        case 'infra_basic_pod': 
            setCpuMax(prev => prev + 1); 
            setCpu(cur => cur + 1);
            setRamMaxMb(prev => prev + 512); 
            break;
        case 'infra_docker': 
            setRamMaxMb(prev => prev + 512); 
            break;
        case 'infra_s3_bucket': 
            setRamMaxMb(prev => prev + 1536); 
            break;
        case 'infra_raid_array': 
            setStress(prev => Math.max(0, prev - 20)); // RAIDs now lower stress
            break;
        case 'infra_postgres': 
            setCpuMax(prev => prev + 2); 
            setCpu(cur => cur + 2);
            break;
        default: 
            setCpuMax(prev => prev + 1);
            setCpu(cur => cur + 1);
    }
  };

  const executeCardOnSlot = (idx: number) => {
    if (!selectedCard || !isPlayerTurn) return;
    if (idx >= ramSlotsMax) { addLog('[ERROR] RAM_LOCKED'); return; }
    
    const card = selectedCard.source === 'hand' ? hand[selectedCard.idx] : codingPalette[selectedCard.idx];
    const slot = runtimeRail[idx];

    if (slot.type === 'BUG_ERROR') {
        const canDestroyIce = 
            card.type === 'DEFENSIVE' || 
            card.type === 'REACTION' || 
            (card.type === 'SCRIPT' && (card.id === 'script_ping' || card.id === 'script_auth'));

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
        } else {
            addLog(`[DENIED] CANNOT_PATCH_WITH_THIS_CARD. USE REACTION/DEFENSE OR PING/AUTH.`);
        }
        return;
    }

    if (slot.type !== 'EMPTY') return;

    // --- SCRIPT RESISTANCE MECHANIC ---
    const activeCards = runtimeRail.filter(s => s.type === 'PLAYER_CODE').length;
    if (activeCards === 0) { // First card played against target
        if (missionTz.resistanceType === 'AUTH_LOCKED') {
            if (card.id !== 'script_auth' && card.id !== 'script_sudo_fix' && card.id !== 'fn_sudo_fix') {
                addLog(`[DENIED] TARGET_REQUIRES_AUTH. ACCESS_BOUNCED.`);
                return;
            }
        } else if (missionTz.resistanceType === 'ENCRYPTED') {
            if (card.id !== 'script_ssh') {
                addLog(`[DENIED] TARGET_IS_ENCRYPTED. SSH_TUNNEL_REQUIRED_FIRST.`);
                return;
            }
        }
    }

    const cost = getEffectiveCost(card);
    setCpu(prev => prev - cost);
    
    // --- PIPELINE SYNERGY MECHANIC ---
    let finalIntegrity = card.integrity ?? 10;
    if (idx > 0 && runtimeRail[idx - 1].type === 'PLAYER_CODE') {
        const prevCard = runtimeRail[idx - 1].content as CombatCard;
        if (
            (prevCard.id === 'script_ls' && card.id === 'script_grep') ||
            (prevCard.id === 'script_grep' && card.id === 'script_cat') ||
            (prevCard.id === 'script_grep' && card.id === 'script_wash_logs')
        ) {
            finalIntegrity *= 2;
            addLog(`[SYNERGY] PIPELINE_BONUS_ACTIVATED! INT_MULTIPLY`);
        }
    }

    const newRail = [...runtimeRail];
    newRail[idx] = { type: 'PLAYER_CODE', content: card, integrity: finalIntegrity };
    setRuntimeRail(newRail);

    if (selectedCard.source === 'hand') {
        const canReturnToHand = (card.type === 'SCRIPT' && playerTraits.some(t => t.id === 'stack_archaeologist') && Math.random() < 0.25);
        if (!canReturnToHand) {
            setHand(prev => prev.filter((_, i) => i !== selectedCard.idx));
            setDiscard(prev => [...prev, card]);
        } else {
            addLog(`[RECOVERY] ${card.name} RETURNED_TO_STACK.`);
        }
    }

    setSelectedCard(null);
    addLog(`[EXEC] ${card.name}`);

    const rules = SDLC_PHASES[currentPhase];
    // Progress is now calculated in useEffect, but we check if we met phase requirements here
    if (rules.targetProgress && playerProgress >= rules.targetProgress) setCanAdvancePhase(true);
  };

  const handleOverclock = () => {
    if (!isPlayerTurn) return;
    if (stress >= 85) {
      addLog('[ERROR] NEURAL_BURN_IMMINENT. CANNOT_OVERCLOCK.');
      return;
    }
    setStress(prev => Math.min(100, prev + 15));
    setCpu(prev => prev + 1);
    addLog('[WARN] OVERCLOCK_ENGAGED. +1 CPU, +15 STRESS.');
  };

  const endTurn = () => {
    // 1. ПОБЕДА ПО ТЗ (Execution Chain)
    if (missionTz.isExecutionChain && playerProgress >= 100) {
        addLog('[SYSTEM] COMPILE... [OK]');
        setIsPlayerTurn(false); // Disable interaction immediately
        runFinalDeploymentCheck();
        return;
    }

    setIsPlayerTurn(false);
    setSelectedCard(null);
    setAiDeadline(prev => Math.max(0, prev - 1));
    addLog('[AI] THINKING...');
    
    setTimeout(() => {
        handleAiStep();
        setTimeout(() => {
            setIsPlayerTurn(true);
            setCpu(cpuMax);
            drawCards(1);
            if (enemy) setNextBugAction(getRandomBugAction(enemy));
            
            // Auto-Stress Accumulation (Pressure)
            if (enemy?.visualType === 'DEVELOPER') {
              // PASSIVE TIMER MODE
              setAiDeadline(prev => {
                const clock = prev - 1;
                if (clock <= 0) {
                   setShowDefeat(true);
                   addLog(`[CRITICAL] SYSTEM_TIMEOUT`);
                } else {
                   addLog(`[WARNING] SYSTEM_CLOCK: ${clock} CYCLES_LEFT`);
                }
                return clock;
              });
            } else {
              setStress(prev => Math.min(100, prev + 5)); 
              addLog(`[WARNING] SYSTEM_STRESS: +5% (PASSIVE_LOAD)`);
            }
            
            // ARCHITECTURE phase turn logic
            if (currentPhase === 'ARCHITECTURE') {
               const nextTurn = planningTurn + 1;
               if (nextTurn >= 2) {
                  setPlanningTurn(0);
                  advancePhase();
               } else {
                  setPlanningTurn(nextTurn);
               }
            }
        }, 800);
    }, 500);
  };

  const handleAiStep = () => {
    if (!nextBugAction || !enemy) return;
    
    // Противник начинает действовать только с фазы DEVELOPMENT
    if (currentPhase === 'ARCHITECTURE') {
        addLog(`[AI] ${enemy.name} IS WATCHING...`);
        return;
    }

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
    if (nextBugAction.damage > 0) {
        const difficultyMult = 1 + (tier - 1) * 0.25;
        const finalDamage = Math.floor(nextBugAction.damage * difficultyMult);
        setStress(prev => Math.min(100, prev + finalDamage));
    }
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
        
        // Автоматическая подгрузка всех карт для фазы DEVELOPMENT
        if (targetPhase === 'DEVELOPMENT') {
            setHand(prev => [...prev, ...deck, ...codingPalette]);
            setDeck([]);
            addLog('[SYSTEM] PROGRAMMING_DECK_LOADED');
            addLog('[SYSTEM] ALL_PROTOCOLS_AVAILABLE');
            
            // ПРОВЕРКА СЛОТОВ
            if (ramSlotsMax < missionTz.steps.length) {
                addLog('[WARNING] ARCHITECTURAL_DIFF_DETECTED!');
                addLog(`[WARNING] SLOTS_AVAILABLE (${ramSlotsMax}) < SLOTS_REQUIRED (${missionTz.steps.length})`);
                addLog('[SYSTEM] BUILD_EXPECTED_TO_FAIL_ON_DEPLOYMENT.');
            }
        }

        if (targetPhase === 'DEPLOYMENT') {
            runFinalDeploymentCheck();
        }
    }
  };

  const runFinalDeploymentCheck = () => {
    addLog('[SYSTEM] INITIALIZING_FINAL_DEPLOYMENT_CHECK...');
    
    // 1. Проверка ТЗ (Steps)
    const railIds = runtimeRail.filter(s => s.type === 'PLAYER_CODE').map(s => (s.content as CombatCard).id);
    let missingSteps = missionTz.steps.filter(step => !step.requiredCardIds.some(id => railIds.includes(id)));
    
    if (missionTz.isExecutionChain) {
      const isSequenceValid = missionTz.steps.every((step, index) => {
        return railIds[index] && step.requiredCardIds.includes(railIds[index]);
      });
      if (!isSequenceValid || railIds.length !== missionTz.steps.length) {
         missingSteps = [...missionTz.steps]; // Fail chain
         addLog('[ERROR] EXECUTION_CHAIN_BROKEN_OR_EXCEEDED');
      }
    }
    
    // 2. Проверка ресурсов (Capacity)
    // Каждая карта "полноценного кода" (SYNTAX/FUNCTION) на шине требует 0.5 CPU и 256MB RAM.
    // Скриптовые команды (SCRIPT) и утилиты (SOFT) ресурсов не потребляют (запуск через интерпретатор).
    const productionCards = runtimeRail.filter(s => 
        s.type === 'PLAYER_CODE' && 
        s.content && 
        ['SYNTAX', 'FUNCTION', 'REACTION'].includes((s.content as any).type)
    ).length;
    
    const totalCpuNeeded = productionCards * 0.5;
    const totalRamNeeded = productionCards * 256;
    
    const cpuOk = cpuMax >= totalCpuNeeded;
    const ramOk = ramMaxMb >= totalRamNeeded;
    
    // 3. Проверка слотов (Architecture)
    const slotsOk = ramSlotsMax >= missionTz.steps.length;
    
    // 4. Стабильность (Bugs)
    const bugsOnRail = runtimeRail.filter(s => s.type === 'BUG_ERROR').length;
    const stabilityDamage = bugsOnRail * 15;
    
    const currentStress = stress + stabilityDamage;
    setStress(Math.min(100, currentStress));

    const isSuccess = missingSteps.length === 0 && cpuOk && ramOk && slotsOk && currentStress < 100;

    setDeploymentReport({
        missingSteps,
        totalCpuNeeded,
        totalRamNeeded,
        cpuOk,
        ramOk,
        slotsOk,
        slotsAvailable: ramSlotsMax,
        slotsRequired: missionTz.steps.length,
        bugsOnRail,
        stabilityDamage,
        isSuccess
    });

    const finalBits = isQuestCombat ? 15 : (skillMode === 'script-kiddie' ? 25 : 100 + tier * 50);
    const finalChain = runtimeRail
      .filter(s => s.type === 'PLAYER_CODE' && s.content)
      .map(s => (s.content as CombatCard).name);

    setTimeout(() => {
        if (isSuccess) {
            setVictoryResult({ bits: finalBits, chain: finalChain });
            setShowVictory(true);
        } else {
            setShowDefeat(true);
        }
    }, 2000);
  };

  const [showTzModal, setShowTzModal] = useState(false);

  return (
    <div className="combat-bridge-root">
      {/* PHASE INTRO OVERLAY */}
      {phaseIntro && (
        <div className="phase-intro-overlay animate-fade-in-out">
          <div className="pi-content">
            <h1 className="pi-title">{SDLC_PHASES[phaseIntro as CombatPhase].name.toUpperCase()}</h1>
            <p className="pi-sub">{SDLC_PHASES[phaseIntro as CombatPhase].description}</p>
            {skillMode === 'script-kiddie' && phaseIntro === 'ARCHITECTURE' && (
              <div className="pi-resource-note pulse-amber">
                Используются ресурсы вашей деки: [ЦПУ: {cpuMax}] [RAM: {ramMaxMb}MB]
              </div>
            )}
          </div>
        </div>
      )}

      {/* TZ MISSION MODAL */}
      {showTzModal && (
        <div className="tz-modal-overlay" onClick={() => setShowTzModal(false)}>
          <div className="tz-modal-box" onClick={e => e.stopPropagation()}>
            <div className="tz-modal-title">ТЕХНИЧЕСКОЕ ЗАДАНИЕ: ДЕТАЛИ</div>
            <div className="tz-modal-desc">
              {missionTz.description}
            </div>
            
            <div className="tz-req-grid">
              <div className="tz-req-item full-width">
                <span className="lbl">ТРЕБУЕМЫЕ ШАГИ РЕАЛИЗАЦИИ:</span>
                <div className="tz-steps-list">
                  {missionTz.steps.map((step, idx) => (
                    <div key={idx} className="tz-step-row">
                      <span className="step-name">{step.name}:</span>
                      <span className="step-options">
                        {step.requiredCardIds.map(id => id.replace('syntax_', '').replace('fn_', '')).join(' | ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="tz-close-hint" onClick={() => setShowTzModal(false)}>
              [ CLICK_ANYWHERE_TO_EXIT_ENCRYPTED_INTEL ]
            </div>
          </div>
        </div>
      )}

      <div className="combat-hud">
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
              <div key={i} className="sb-log-row">{l}</div>
            ))}
          </div>

          <div className="sb-actions">
            {canAdvancePhase ? (
              <button className="sb-btn" onClick={advancePhase} style={{ borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}>
                NEXT_PHASE: {SDLC_PHASES[currentPhase].nextPhaseId}
              </button>
            ) : (
              <button className="sb-btn" onClick={endTurn} disabled={!isPlayerTurn}>
                COMPILE_&_END_TURN
              </button>
            )}
            
            <button 
              className="sb-btn"
              onClick={handleOverclock}
              disabled={!isPlayerTurn || stress >= 85}
              style={{ marginTop: '10px', borderColor: 'var(--neon-amber)', color: 'var(--neon-amber)' }}
            >
              [ OVERCLOCK: +1 CPU / -15 HP ]
            </button>

            <button 
              className="sb-btn" 
              onClick={() => setShowDefeat(true)} 
              style={{ marginTop: '10px', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', opacity: 0.9 }}
              title="Экстренное прерывание. Штраф: Прогресс миссии будет потерян."
            >
              [ TERMINATE_SESSION ]
            </button>
          </div>
        </aside>

        <main className="combat-workspace">
          <div className="ws-enemy">
            <div className="enemy-avatar-wrap">
               {enemy?.visualType === 'AI' && <Database className="enemy-avatar ai" size={40} />}
               {enemy?.visualType === 'ICE' && <ShieldAlert className="enemy-avatar ice" size={40} />}
               {enemy?.visualType === 'DEVELOPER' && <Terminal className="enemy-avatar dev" size={40} />}
            </div>
            <div className="enemy-rail">
              {runtimeRail.slice(0, 5).map((slot, i) => (
                <div key={i} className={`enemy-slot ${slot.type !== 'EMPTY' ? 'active' : ''}`}>
                   <span className="enemy-slot-label">0x0{i+1}</span>
                   <span className="enemy-slot-name">{slot.content?.name || '---'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ws-main-stage">
            {(currentPhase === 'ARCHITECTURE' && skillMode !== 'script-kiddie') ? (
              <div className="planning-view">
                <div className="sb-title">INFRASTRUCTURE_RESOURCES</div>
                <div className="pipeline-track wrap">
                  {infraSlots.map((s, i) => (
                    <div key={i} className={`pipeline-stage infra ${s ? 'active' : ''}`}>
                      <span className="stage-label">{s ? 'DEPLOYED' : 'UNDEPLOYED'}</span>
                      <span className="stage-name">{s ? s.name : `SLOT_0${i+1}`}</span>
                    </div>
                  ))}
                </div>
                <div className="sb-title" style={{ marginTop: '20px' }}>NEURAL_BUFFER_EXTENSIONS (SOFT)</div>
                <div className="pipeline-track">
                  {softSlots.map((s, i) => (
                    <div key={i} className={`pipeline-stage soft ${s ? 'active' : ''}`}>
                      <span className="stage-label">{s ? 'ATTACHED' : 'UNAVAILABLE'}</span>
                      <span className="stage-name">{s ? s.name : `SOCKET_0${i+1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="coding-view">
                <div className="sb-title">NEURAL_BUS_PIPELINE</div>
                <div className="pipeline-track">
                  {runtimeRail.map((slot, i) => {
                    const isLocked = i >= ramSlotsMax;
                    const isCriticallyLocked = isLocked && i < missionTz.steps.length;
                    return (
                      <div 
                        key={i} 
                        className={`pipeline-stage ${isLocked ? 'locked' : ''} ${isCriticallyLocked ? 'critical-lock' : ''}`}
                        onClick={() => !isLocked && executeCardOnSlot(i)}
                      >
                        <span className="stage-name">
                          {isLocked ? (isCriticallyLocked ? 'INSUFFICIENT_RAM' : 'LOCKED') : (slot.type === 'EMPTY' ? `0x0${i+1}` : (slot.content as any).name)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="hud-hand-area">
            <div className="hand-header-row">
              <div className="hand-label">NEURAL_PAYLOAD_BUFFER [PHASE: {currentPhase}]</div>
              <div className="hand-switcher">
                <button 
                  className={`tab-btn ${activeHandTab === 'AUX' ? 'active' : ''}`}
                  onClick={() => setActiveHandTab('AUX')}
                >
                  [ AUX_CARDS ]
                </button>
                <button 
                  className={`tab-btn ${activeHandTab === 'CODE' ? 'active' : ''}`}
                  onClick={() => setActiveHandTab('CODE')}
                >
                  [ CODE_CARDS ]
                </button>
              </div>
            </div>
            
            <div className="hand-grid-area">
              {filteredHand.map((item, i) => {
                return (
                  <div key={item.card.id + i} className={`hand-card-wrap ${selectedCard?.source === item.source && selectedCard.idx === item.idx ? 'selected' : ''}`}>
                    <CyberCard 
                      card={item.card} 
                      onClick={() => handleCardSelect(item.source, item.idx)} 
                      disabled={!isPlayerTurn || cpu < (item.card.cost ?? 0)}
                    />
                  </div>
                );
              })}
              {filteredHand.length === 0 && (
                <div className="empty-hand-hint">NO_{activeHandTab}_PLANS_IN_BUFFER</div>
              )}
            </div>
          </div>
        </main>

        <aside className="combat-right-panel terminal-v3">
          <div className="ip-section">
            <div className="ip-meter">
              <div className="ip-meter-header">
                <span className="ip-meter-label">PROJECT_PROGRESS</span>
                <span className="ip-meter-val">{playerProgress}%</span>
              </div>
              <div className="ip-bar"><div className="ip-bar-fill" style={{ width: `${playerProgress}%`, background: 'var(--neon-cyan)' }}></div></div>
            </div>
            <div className="ip-meter">
              <div className="ip-meter-header">
                <span className="ip-meter-label">CRASH_THREAT</span>
                <span className="ip-meter-val">{aiProgress}%</span>
              </div>
              <div className="ip-bar"><div className="ip-bar-fill" style={{ width: `${aiProgress}%`, background: 'var(--neon-amber)' }}></div></div>
            </div>
          </div>

          <div className="ip-section">
            <div className="ip-title">SYSTEM_BUGS</div>
            <div className="ip-meter-val">{bugPoints} ERRORS</div>
          </div>

          <div className="ip-deadline-box">
            <span className="ip-deadline-label">AI_DEADLINE_TICK</span>
            <span className="ip-deadline-val">{aiDeadline}L</span>
          </div>

          <div className="ip-mission-board" onClick={() => setShowTzModal(true)}>
            <div className="ip-mission-title">ТЕХНИЧЕСКОЕ ЗАДАНИЕ (ТЗ)</div>
            <div className="ip-mission-detail">
              <span className="lbl">СЛОЖНОСТЬ:</span>
              <span className="val">{(missionTz.rank || 'junior').toUpperCase()}</span>
            </div>
            <div className="ip-mission-detail">
              <span className="lbl">TARGET:</span>
              <span className="val">{missionTz.name}</span>
            </div>
            {missionTz.id === 'combat_silo_inner' && (
              <div className="ip-tutorial-hint">
                <span className="lbl">HINTS:</span>
                <div className="step-hints">
                  {missionTz.steps.map((s, i) => (
                    <div key={i} className={`step-hint ${playerProgress >= (i + 1) * (100 / missionTz.steps.length) ? 'ok' : ''}`}>
                      {i + 1}. {s.requiredCardIds[0].replace('script_', '').toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="ip-mission-description">
              {missionTz.description.slice(0, 60)}... [CLICK]
            </div>
          </div>

          <div className="ip-footer-deck">
             <div className="protocol-deck-stack-v3">
                <div className="deck-header-v4">
                  <div className="deck-label-mini">MEM_STACK / 0.08</div>
                  <span className="deck-help-icon" title="Системная очередь. Запуск стоит 1 цикл.">[?]</span>
                </div>
                <div className="deck-main-info">
                  <div className="deck-card-count">{deck.length}</div>
                </div>
                <div className="deck-footer-v4">
                  <div className="deck-stack-indicator">
                    <div className={`deck-bar ${deck.length > 0 ? 'full' : ''}`}></div>
                    <div className={`deck-bar ${deck.length > 5 ? 'full' : ''}`}></div>
                    <div className={`deck-bar ${deck.length > 10 ? 'full' : ''}`}></div>
                    <div className={`deck-bar ${deck.length > 15 ? 'full' : ''}`}></div>
                  </div>
                  <div className="deck-version">STABLE_BUILD</div>
                </div>
             </div>
             {!mulliganUsed && currentPhase === 'ARCHITECTURE' && planningTurn === 0 && (
               <button className="sb-btn mulligan-bottom" onClick={handleMulligan}>
                 <RefreshCw size={14} /> REDRAW_BUFFER
               </button>
             )}
          </div>
        </aside>
      </div>

      {/* VICTORY OVERLAY */}
      {showVictory && victoryResult && (
        <div className="result-overlay victory">
          <div className="result-box">
            <div className="result-title green">DEPLOYMENT_SUCCESS</div>
            <div className="result-subtitle">{isQuestCombat ? 'OBJECTIVE_CRIT_REACHED' : 'SYSTEM_INTEGRITY_ESTABLISHED'}</div>
            <div className="result-stats">
              <div className="stat-row">
                <span>TASK_COMPLETED:</span>
                <span className="green">{missionTz.name}</span>
              </div>
              <div className="stat-row">
                <span>EXPLOIT_RECORDED:</span>
                <span className="green">TRUE</span>
              </div>
              <div className="stat-row total">
                <span>{isQuestCombat ? 'COMBAT_LOOT:' : 'REWARDS_EARNED:'}</span>
                <span className="gold">{victoryResult.bits} BITS</span>
              </div>
              {isQuestCombat && (
                <div className="stat-row" style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px' }}>
                  <span>PRIMARY_PAYOUT:</span>
                  <span>AT_FIXER_NPC</span>
                </div>
              )}
            </div>
            <button className="result-btn green" onClick={() => onWin(victoryResult.bits, missionTz.rank, victoryResult.chain, missionTz.name)}>
              [ CONTINUE_TO_CITY ]
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT OVERLAY */}
      {showDefeat && (
        <div className="result-overlay defeat">
          <div className="result-box">
            <div className="result-title red">SYSTEM_CRASH</div>
            <div className="result-subtitle">FATAL_ERROR_IN_PRODUCTION</div>
            <div className="result-stats">
              {deploymentReport && (
                <>
                  {!deploymentReport.cpuOk && (
                    <div className="stat-row red">
                      <span>ERROR:</span>
                      <span>INSUFFICIENT_CPU</span>
                    </div>
                  )}
                  {!deploymentReport.ramOk && (
                    <div className="stat-row red">
                      <span>ERROR:</span>
                      <span>BUFFER_OVERFLOW_RAM</span>
                    </div>
                  )}
                  {!deploymentReport.slotsOk && (
                    <div className="stat-row red">
                      <span>ERROR:</span>
                      <span>INSUFFICIENT_MEMORY_SLOTS</span>
                    </div>
                  )}
                  {deploymentReport.missingSteps.length > 0 && (
                    <div className="stat-row red">
                      <span>ERROR:</span>
                      <span>REQUIREMENTS_NOT_MET ({deploymentReport.missingSteps.length})</span>
                    </div>
                  )}
                  {stress >= 100 && (
                    <div className="stat-row red">
                      <span>ERROR:</span>
                      <span>NEURAL_STRESS_OVERLOAD (BRAIN_MELT)</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <button className="result-btn red" onClick={() => onWin(0, missionTz.rank, [], missionTz.name)}>
              [ RETURN_TO_CITY_HUB ]
            </button>
          </div>
        </div>
      )}

      {activeProblem && (
        <div className="hud-alert-overlay" style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,0,0,0.8)', padding: '10px 20px', borderRadius: '4px', zIndex: 100 }}>
          <AlertTriangle size={20} />
          <span>{activeProblem}</span>
        </div>
      )}
    </div>
  );
};

export default CombatBridge;

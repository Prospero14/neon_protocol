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
  onWin: (bitsEarned: number, taskRank: 'script-kiddie' | 'junior' | 'mid' | 'senior') => void;
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
  homeDistrictId
}) => {
  const missionTz = taskLibrary[initialTaskIndex] ?? taskLibrary[0];
  const START_HAND_SIZE = homeDistrictId === 'tekstilschiki' ? 6 : 5;

  // --- CORE STATE ---
  const [currentPhase, setCurrentPhase] = useState<CombatPhase>('ARCHITECTURE');
  const [playerProgress, setPlayerProgress] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [bugPoints, setBugPoints] = useState(0);
  const [stress, setStress] = useState(0); 
  const [activeProblem] = useState<BugProblemType | null>(null);
  const [aiDeadline, setAiDeadline] = useState(Math.max(3, 10 - tier));

  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
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

  const [enemy] = useState<BugEnemy | null>(BUGS[0]);
  const [nextBugAction, setNextBugAction] = useState<BugAction | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [canAdvancePhase, setCanAdvancePhase] = useState(false);
  const [phaseIntro, setPhaseIntro] = useState<string | null>(null);

  // --- DERIVED ---
  const ramSlotsMax = Math.floor(ramMaxMb / 512);
  const codingPalette = useMemo(() => 
    activeDeck.filter(c => c.type === 'SYNTAX' || c.type === 'FUNCTION'), 
  [activeDeck]);

  const initialDrawDeck = useMemo(() => 
    activeDeck.filter(c => c.type !== 'SYNTAX' && c.type !== 'FUNCTION'), 
  [activeDeck]);

  const filteredHand = useMemo(() => {
    if (activeHandTab === 'CODE') {
       return codingPalette;
    }
    return hand.filter(card => {
      if (activeHandTab === 'AUX') return ['INFRASTRUCTURE', 'SOFT', 'REACTION', 'DEFENSIVE', 'HARD', 'SCRIPT'].includes(card.type);
      return true;
    });
  }, [hand, activeHandTab, codingPalette]);

  // --- INIT ---
  useEffect(() => {
    // Шаттл колоды
    const shuffled = [...initialDrawDeck].sort(() => Math.random() - 0.5);
    // Стартовая рука по ТЗ (5 карт база, 6 для Текстильщиков)
    const startHand = shuffled.slice(0, START_HAND_SIZE);
    const remainingDeck = shuffled.slice(START_HAND_SIZE);
    
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

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 15));

  const drawCards = (count: number) => {
    setHand(prevHand => {
        let newHand = [...prevHand];
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

    if (slot.type === 'BUG_ERROR' && (card.type === 'DEFENSIVE' || card.type === 'REACTION')) {
        const newRail = [...runtimeRail];
        newRail[idx] = { type: 'EMPTY', content: null, integrity: 0 };
        setRuntimeRail(newRail);
        if (selectedCard.source === 'hand') {
            setHand(prev => prev.filter((_, i) => i !== selectedCard.idx));
            setDiscard(prev => [...prev, card]);
        }
        setSelectedCard(null);
        addLog(`[SEC] ${card.name} PATCHED.`);
        return;
    }

    if (slot.type !== 'EMPTY') return;

    const cost = getEffectiveCost(card);
    setCpu(prev => prev - cost);
    
    const newRail = [...runtimeRail];
    newRail[idx] = { type: 'PLAYER_CODE', content: card, integrity: card.integrity };
    setRuntimeRail(newRail);

    const progGain = card.power || 10;
    setPlayerProgress(prev => Math.min(100, prev + progGain));

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
    if (rules.targetProgress && playerProgress + progGain >= rules.targetProgress) setCanAdvancePhase(true);
  };

  const endTurn = () => {
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
            setStress(prev => Math.min(100, prev + 5)); 
            addLog(`[WARNING] SYSTEM_STRESS: +5% (PASSIVE_LOAD)`);
            
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
    const missingSteps = missionTz.steps.filter(step => !step.requiredCardIds.some(id => railIds.includes(id)));
    
    // 2. Проверка ресурсов (Capacity)
    // Допустим, каждая карта на шине потребляет 0.5 CPU и 256MB RAM (упрощенно)
    const activeCodeCount = runtimeRail.filter(s => s.type === 'PLAYER_CODE').length;
    const totalCpuNeeded = activeCodeCount * 0.5;
    const totalRamNeeded = activeCodeCount * 256;
    
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

    setTimeout(() => {
        if (isSuccess) {
            setShowVictory(true);
            // ПРИМЕЧАНИЕ: onWin теперь вызывается при нажатии кнопки на экране победы
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
          <div className="sb-section stress-priority">
            <div className="sb-title">SYSTEM_STRESS_DIAG</div>
            <div className="sb-stat stress-container large">
              <ShieldAlert size={28} color="var(--neon-pink)" />
              <div className="sb-stat-info">
                <span className="sb-stat-name highlight">STRESS_LEVEL:</span>
                <div className="stress-meter-wrap large">
                  <div className="stress-meter-fill" style={{ 
                    width: `${stress}%`,
                    boxShadow: stress > 70 ? '0 0 15px var(--neon-pink)' : 'none'
                  }}></div>
                </div>
                <span className="sb-stat-val big">{stress}%</span>
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
            {currentPhase === 'ARCHITECTURE' ? (
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
              {filteredHand.map((card, i) => {
                const source: 'hand' | 'palette' = activeHandTab === 'CODE' ? 'palette' : 'hand';
                return (
                  <div key={card.id + i} className={`hand-card-wrap ${selectedCard?.source === source && selectedCard.idx === i ? 'selected' : ''}`}>
                    <CyberCard 
                      card={card} 
                      onClick={() => handleCardSelect(source, i)} 
                      disabled={!isPlayerTurn || cpu < (card.cost ?? 0)}
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
            <div className="ip-mission-description">
              {missionTz.description.slice(0, 80)}... [CLICK FOR INTEL]
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
      {showVictory && (
        <div className="result-overlay victory">
          <div className="result-box">
            <div className="result-title green">DEPLOYMENT_SUCCESS</div>
            <div className="result-subtitle">SYSTEM_INTEGRITY_ESTABLISHED</div>
            <div className="result-stats">
              <div className="stat-row">
                <span>TASK_COMPLETED:</span>
                <span className="green">{missionTz.name}</span>
              </div>
              {deploymentReport && (
                <>
                  <div className="stat-row">
                    <span>CPU_ALLOCATED:</span>
                    <span>{cpuMax} core</span>
                  </div>
                  <div className="stat-row">
                    <span>RAM_RETAINED:</span>
                    <span>{ramMaxMb}MB</span>
                  </div>
                </>
              )}
              <div className="stat-row total">
                <span>REWARDS_EARNED:</span>
                <span className="gold">{200 + tier * 100} BITS</span>
              </div>
            </div>
            <button className="result-btn green" onClick={() => onWin(200 + tier * 100, missionTz.rank)}>
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
            <button className="result-btn red" onClick={() => onWin(0, missionTz.rank)}>
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

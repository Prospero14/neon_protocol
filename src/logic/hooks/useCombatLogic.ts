import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CombatPhase } from '../combatPhases';
import { SDLC_PHASES } from '../combatPhases';
import { isInfraDrawCard, isStabilizationDrawCard, isStaticCodeCardType } from '../combatFlow';
import type { CombatCard } from '../combatCards';
import { getCardById } from '../combatCards';
import { isOutplayCounter, problemTypeLabelRu } from '../combatCounterplay';
import type { TechnicalTask } from '../combatTasks';
import { getStepCardIds } from '../combatTasks';

import type { Trait } from '../traits';
import { BUGS, pickNextBugAction } from '../combatEnemies';
import type { BugEnemy, BugAction, BugProblemType, AiRecentEntry } from '../combatEnemies';

export type RailSlotType = 'EMPTY' | 'PLAYER_CODE' | 'BUG_ERROR';
export interface RailSlot {
  type: RailSlotType;
  content: CombatCard | BugAction | null;
  integrity: number;
}


export type CardSource = 'hand' | 'palette' | 'script_pool';

interface UseCombatLogicProps {
  skillMode: 'script-kiddie' | 'junior' | 'mid' | 'senior';
  playerTraits: Trait[];
  activeDeck: CombatCard[];
  missionTz: TechnicalTask;
  tier: number;
  deckCores: number;
  deckRamMb: number;
  isQuestCombat?: boolean;
}

interface AiImpactSummary {
  stressDelta: number;
  threatDelta: number;
  bugDelta: number;
  statusInjected: string | null;
  ts: number;
}

export function useCombatLogic({
  skillMode,
  playerTraits,
  activeDeck,
  missionTz,
  tier,
  deckCores,
  deckRamMb,
  isQuestCombat
}: UseCombatLogicProps) {
  const START_HAND_SIZE = 6;

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
  const [victoryResult, setVictoryResult] = useState<{ bits: number, chain: string[] } | null>(null);
  const [deploymentReport, setDeploymentReport] = useState<any>(null);

  const [cpuMax, setCpuMax] = useState(deckCores);
  const [cpu, setCpu] = useState(deckCores);
  const [ramMaxMb, setRamMaxMb] = useState(deckRamMb);

  const [planningTurn, setPlanningTurn] = useState(0);
  const [mulliganUsed, setMulliganUsed] = useState(false);
  /** Очередь карт стабилизации (реакции/софт/status), раздаётся при входе в VERIFICATION. */
  const stabilizationQueueRef = useRef<CombatCard[]>([]);

  const [infraSlots, setInfraSlots] = useState<(CombatCard | null)[]>(Array(8).fill(null));
  const [softSlots, setSoftSlots] = useState<(CombatCard | null)[]>(Array(3).fill(null));

  const [hand, setHand] = useState<CombatCard[]>([]);
  const [deck, setDeck] = useState<CombatCard[]>([]);
  const [discard, setDiscard] = useState<CombatCard[]>([]);

  const [selectedCard, setSelectedCard] = useState<{ source: CardSource, idx: number, card: CombatCard } | null>(null);
  const [runtimeRail, setRuntimeRail] = useState<RailSlot[]>(
    Array(10).fill(null).map(() => ({ type: 'EMPTY', content: null, integrity: 0 }))
  );

  const [enemy] = useState<BugEnemy | null>(() => {
    if (missionTz.id.includes('copy_logs') || missionTz.isExecutionChain) {
      return BUGS.find(b => b.id === 'enemy_sysadmin') || BUGS[0];
    }
    const enemies = BUGS.filter(b => b.id !== 'enemy_sysadmin');
    return enemies[Math.floor(Math.random() * enemies.length)];
  });
  const [nextBugAction, setNextBugAction] = useState<BugAction | null>(null);
  const [lastAiAction, setLastAiAction] = useState<BugAction | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAiResolving, setIsAiResolving] = useState(false);
  const [lastAiImpact, setLastAiImpact] = useState<AiImpactSummary | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [canAdvancePhase, setCanAdvancePhase] = useState(false);
  const [phaseIntro, setPhaseIntro] = useState<string | null>('ARCHITECTURE');

  const [cardsPlayedThisTurn, setCardsPlayedThisTurn] = useState(0);
  const [clearedBugsThisTurn, setClearedBugsThisTurn] = useState(0);
  const [mitigationBuffer, setMitigationBuffer] = useState(0);
  const [idleTurnStreak, setIdleTurnStreak] = useState(0);

  /** История ходов ИИ — веса в pickNextBugAction (анти-спам). */
  const aiRecentRef = useRef<AiRecentEntry[]>([]);
  /** Слабые снятия бага без outplay по классу сбоя → толще следующий баг этого класса. */
  const weakPatchStackRef = useRef<Partial<Record<BugProblemType, number>>>({});
  /** Уникальные CombatCard.type за бой — бонус за «широкий тулчейн». */
  const cardFamiliesRef = useRef<Set<string>>(new Set());
  const familyMilestoneRef = useRef({ t3: false, t5: false });

  // --- DERIVED ---
  const ramSlotsMax = useMemo(() => {
    const raw = Math.floor(ramMaxMb / 512);
    if (skillMode === 'script-kiddie') return Math.max(raw, missionTz.steps.length);
    return raw;
  }, [ramMaxMb, skillMode, missionTz]);

  const codingPalette = useMemo(
    () => activeDeck.filter((c) => isStaticCodeCardType(c.type)),
    [activeDeck]
  );

  const scriptPool = useMemo(
    () => activeDeck.filter((c) => c.type === 'SCRIPT' && !discard.some((d) => d.id === c.id)),
    [activeDeck, discard]
  );

  const filteredHand = useMemo(() => {
    if (currentPhase === 'DEVELOPMENT') {
      const p = codingPalette.map((c, i) => ({ card: c, source: 'palette' as const, idx: i }));
      const s = scriptPool.map((c, i) => ({ card: c, source: 'script_pool' as const, idx: i }));
      return [...p, ...s];
    }
    if (currentPhase === 'ARCHITECTURE' || currentPhase === 'VERIFICATION') {
      return hand.map((c, i) => ({ card: c, source: 'hand' as const, idx: i }));
    }
    return [];
  }, [currentPhase, hand, codingPalette, scriptPool]);

  const addLog = useCallback((msg: string) => setLog(prev => [msg, ...prev].slice(0, 15)), []);

  const registerPlayDiversity = useCallback(
    (card: CombatCard) => {
      if (skillMode === 'script-kiddie') return;
      if (cardFamiliesRef.current.has(card.type)) return;
      cardFamiliesRef.current.add(card.type);
      const n = cardFamiliesRef.current.size;
      if (n >= 3 && !familyMilestoneRef.current.t3) {
        familyMilestoneRef.current.t3 = true;
        setStress((s) => Math.max(0, s - 4));
        addLog('[TOOLCHAIN] Разные классы карт в бою — −4 стресс.');
      }
      if (n >= 5 && !familyMilestoneRef.current.t5) {
        familyMilestoneRef.current.t5 = true;
        setCpu((prev) => Math.min(cpuMax, prev + 1));
        addLog('[TOOLCHAIN] Пять разных типов — +1 CPU (до максимума).');
      }
    },
    [addLog, cpuMax, skillMode]
  );

  // --- INIT ---
  useEffect(() => {
    aiRecentRef.current = [];
    weakPatchStackRef.current = {};
    cardFamiliesRef.current = new Set();
    familyMilestoneRef.current = { t3: false, t5: false };

    const infraPile = [...activeDeck.filter(isInfraDrawCard)].sort(() => Math.random() - 0.5);
    if (infraPile.length === 0) {
      // Fail-safe: бой не должен разваливаться, если в деке случайно нет INFRA карт.
      setCpuMax((p) => p + 1);
      setCpu((p) => p + 1);
      setRamMaxMb((p) => p + 512);
      addLog('[SYSTEM] EMERGENCY_INFRA_BOOT: +1 CPU, +512 MiB RAM');
    }
    const n = Math.min(START_HAND_SIZE, infraPile.length);
    setHand(infraPile.slice(0, n));
    setDeck(infraPile.slice(n));

    stabilizationQueueRef.current = [...activeDeck.filter(isStabilizationDrawCard)].sort(() => Math.random() - 0.5);

    if (enemy) setNextBugAction(pickNextBugAction(enemy, [], { phase: currentPhase, bugPressure: 0, playerProgress: 0 }));

    addLog('[SYSTEM] BOOT_SEQUENCE... [OK]');
    addLog('[SYSTEM] PHASE_SUPPLY: infra draw only.');
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
    if (missionTz.isExecutionChain) {
      let matchedSteps = 0;
      for (let i = 0; i < missionTz.steps.length; i++) {
        const step = missionTz.steps[i];
        const slot = runtimeRail[i];
        if (slot?.type !== 'PLAYER_CODE' || !slot.content) break;
        const id = (slot.content as CombatCard).id;
        if (getStepCardIds(step).includes(id)) matchedSteps++;
        else break;
      }
      setPlayerProgress(Math.floor((matchedSteps / missionTz.steps.length) * 100));
    } else {
      const railIds = runtimeRail.filter((s) => s.type === 'PLAYER_CODE').map((s) => (s.content as CombatCard).id);
      const satisfiedSteps = missionTz.steps.filter((step) =>
        getStepCardIds(step).some((id) => railIds.includes(id))
      );
      setPlayerProgress(Math.floor((satisfiedSteps.length / missionTz.steps.length) * 100));
    }
  }, [runtimeRail, missionTz]);

  useEffect(() => {
    const rules = SDLC_PHASES[currentPhase];
    if (currentPhase === 'ARCHITECTURE') {
      setCanAdvancePhase(true);
      return;
    }
    if (currentPhase === 'DEVELOPMENT') {
      if (missionTz.isExecutionChain) {
        let ok = true;
        for (let i = 0; i < missionTz.steps.length; i++) {
          const step = missionTz.steps[i];
          const slot = runtimeRail[i];
          if (slot?.type !== 'PLAYER_CODE' || !slot.content) {
            ok = false;
            break;
          }
          const id = (slot.content as CombatCard).id;
          if (!getStepCardIds(step).includes(id)) {
            ok = false;
            break;
          }
        }
        setCanAdvancePhase(ok);
        return;
      }
      const need = rules.targetProgress ?? 70;
      setCanAdvancePhase(playerProgress >= need);
      return;
    }
    if (currentPhase === 'VERIFICATION') {
      const need = rules.targetProgress ?? 100;
      setCanAdvancePhase(playerProgress >= need);
      return;
    }
    if (currentPhase === 'DEPLOYMENT') {
      setCanAdvancePhase(false);
      return;
    }
    setCanAdvancePhase(true);
  }, [currentPhase, playerProgress, missionTz, runtimeRail]);

  const drawCards = (count: number) => {
    if (currentPhase === 'DEVELOPMENT') return;
    setHand((prevHand) => {
      const newHand = [...prevHand];
      let currentDeck = [...deck];
      let currentDiscard = [...discard];
      for (let i = 0; i < count; i++) {
        if (currentDeck.length === 0) {
          const recycle = currentDiscard.filter((c) =>
            currentPhase === 'VERIFICATION'
              ? isStabilizationDrawCard(c)
              : currentPhase === 'ARCHITECTURE'
                ? isInfraDrawCard(c)
                : false
          );
          if (recycle.length === 0) break;
          currentDeck = [...recycle].sort(() => Math.random() - 0.5);
          currentDiscard = currentDiscard.filter((c) => !recycle.includes(c));
        }
        if (currentDeck.length > 0) newHand.push(currentDeck.pop()!);
      }
      setDeck(currentDeck);
      setDiscard(currentDiscard);
      return newHand;
    });
  };

  const getEffectiveCost = useCallback(
    (card: CombatCard) => {
      let cost = card.cost ?? 0;
      if (activeProblem === 'TECH_DEBT') cost += 1;
      if (currentPhase === 'ARCHITECTURE' && card.type === 'SCRIPT' && playerTraits.some((t) => t.id === 'legacy_diggr'))
        cost = Math.max(0, cost - 1);
      return cost;
    },
    [activeProblem, currentPhase, playerTraits]
  );

  const handleCardSelect = (source: CardSource, idx: number) => {
    if (!isPlayerTurn) return;
    const card = source === 'hand' ? hand[idx] : (source === 'palette' ? codingPalette[idx] : scriptPool[idx]);

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
        registerPlayDiversity(card);
        if (source === 'hand') setHand(prev => prev.filter((_, i) => i !== idx));
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
        switch (card.id) {
          case 'soft_tactical_breath':
            setStress((s) => Math.max(0, s - 10));
            addLog('[SOFT] TACTICAL_BREATH: -10 stress');
            break;
          case 'soft_patch_drill':
            setMitigationBuffer((b) => Math.min(30, b + 8));
            addLog('[SOFT] PATCH_DRILL: +8 mitigation');
            break;
          case 'soft_signal_prediction':
            setBugPoints((p) => Math.max(0, p - 4));
            setAiProgress((p) => Math.max(0, p - 6));
            addLog('[SOFT] SIGNAL_PREDICTION: threat/bugs reduced');
            break;
          case 'soft_deadline_trance':
            setCpu((c) => Math.min(cpuMax + 1, c + 1));
            drawCards(1);
            setStress((s) => Math.min(100, s + 4));
            addLog('[SOFT] DEADLINE_TRANCE: +1 CPU, +1 draw, +4 stress');
            break;
          default:
            break;
        }
        registerPlayDiversity(card);
        if (source === 'hand') setHand(prev => prev.filter((_, i) => i !== idx));
        addLog(`[SYSTEM] SOFT_SKILL_ATTACHED: ${card.name}`);
      }
      return;
    }

    if (currentPhase === 'VERIFICATION' && (card.type === 'SYNTAX' || card.type === 'FUNCTION')) {
      addLog(`[DENIED] CODE_FREEZE_ACTIVE. NO_NEW_CODE_IN_VERIFICATION.`);
      return;
    }

    setSelectedCard({ source, idx, card });
    addLog(`[READY] ${card.name}`);
  };

  const applyInfraEffect = (card: CombatCard) => {
    switch (card.id) {
      case 'infra_dns_resolver': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); break;
      case 'infra_lb_nginx': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 512); break;
      case 'infra_basic_pod': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 512); break;
      case 'infra_mesh_relay': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 512); break;
      case 'infra_orbital_uplink': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 2048); break;
      case 'infra_quarantine_vm': setStress(prev => Math.max(0, prev - 8)); setRamMaxMb(prev => prev + 512); break;
      case 'infra_street_fusion':
        setCpuMax(prev => prev + 2);
        setCpu(cur => cur + 2);
        setStress((s) => Math.min(100, s + 3));
        break;
      case 'infra_docker': setRamMaxMb(prev => prev + 512); break;
      case 'infra_old_hw': setRamMaxMb(prev => prev + 512); break;
      case 'infra_s3_bucket': setRamMaxMb(prev => prev + 1536); break;
      case 'infra_raid_array': setStress(prev => Math.max(0, prev - 20)); break;
      case 'infra_postgres': setCpuMax(prev => prev + 2); setCpu(cur => cur + 2); break;
      default: setCpuMax(prev => prev + 1); setCpu(cur => cur + 1);
    }
  };

  const executeCardOnSlot = (idx: number) => {
    if (!selectedCard || !isPlayerTurn) return;
    if (idx >= ramSlotsMax) { addLog('[ERROR] RAM_LOCKED'); return; }
    const { card } = selectedCard;
    const slot = runtimeRail[idx];

    if (slot.type === 'BUG_ERROR') {
      const canDestroyIce = card.type === 'DEFENSIVE' || card.type === 'REACTION' || (card.type === 'SCRIPT' && (card.id === 'script_ping' || card.id === 'script_auth'));
      if (canDestroyIce) {
        const bugPayload = slot.content as BugAction;
        const outplay = isOutplayCounter(card, bugPayload.problemType);
        const newRail = [...runtimeRail];
        newRail[idx] = { type: 'EMPTY', content: null, integrity: 0 };
        setRuntimeRail(newRail);
        setBugPoints((p) => Math.max(0, p - (outplay ? 3 : 1)));
        setAiProgress((p) => Math.max(0, p - (outplay ? 14 : 6)));
        setStress((s) => Math.max(0, s - (outplay ? 10 : 4)));
        if (outplay) {
          addLog(`[OUTPLAY] Попадание в тип сбоя — угроза и стресс срезаны.`);
          setMitigationBuffer((b) => Math.min(30, b + 5));
          addLog('[GUARD] OUTPLAY reinforced mitigation (+5).');
        } else {
          addLog(`[PATCH] ${card.name} снял блокировку (слабее оптимального инструмента).`);
        }
        setClearedBugsThisTurn((n) => n + 1);
        if (bugPayload.problemType) {
          const pt = bugPayload.problemType;
          if (outplay) {
            weakPatchStackRef.current[pt] = Math.max(0, (weakPatchStackRef.current[pt] ?? 0) - 1);
          } else {
            weakPatchStackRef.current[pt] = (weakPatchStackRef.current[pt] ?? 0) + 1;
          }
        }
        registerPlayDiversity(card);
        if (selectedCard.source === 'hand') {
          setHand(prev => prev.filter((_, i) => i !== selectedCard.idx));
          setDiscard(prev => [...prev, card]);
        }
        setSelectedCard(null);
      } else addLog(`[DENIED] CANNOT_PATCH_WITH_THIS_CARD.`);
      return;
    }
    const looksLikePatch = currentPhase === 'VERIFICATION' && (card.type === 'REACTION' || card.type === 'DEFENSIVE');
    if (slot.type !== 'EMPTY' && !looksLikePatch) return;

    if (looksLikePatch && slot.type === 'EMPTY') {
      const cost = getEffectiveCost(card);
      setCpu(prev => prev - cost);
      setMitigationBuffer((b) => Math.min(30, b + (card.type === 'DEFENSIVE' ? 7 : 4)));
      addLog(`[GUARD] ${card.name} primed mitigation on empty slot.`);
      if (selectedCard.source === 'hand') {
        setHand(prev => prev.filter((_, i) => i !== selectedCard.idx));
        setDiscard(prev => [...prev, card]);
      } else if (selectedCard.source === 'script_pool') {
        setDiscard(prev => [...prev, card]);
      }
      setSelectedCard(null);
      registerPlayDiversity(card);
      return;
    }

    if (slot.type === 'PLAYER_CODE' && looksLikePatch) {
      // Защитные/реакции не должны разрушать уже собранный кодовый пайплайн.
      addLog('[DENIED] PATCH_TARGET_MUST_BE_BUG_OR_EMPTY');
      return;
    }

    const activeCards = runtimeRail.filter(s => s.type === 'PLAYER_CODE').length;
    if (activeCards === 0) {
      if (missionTz.resistanceType === 'AUTH_LOCKED' && !['script_auth', 'script_sudo_fix', 'fn_sudo_fix'].includes(card.id)) { addLog(`[DENIED] TARGET_REQUIRES_AUTH.`); return; }
      if (missionTz.resistanceType === 'ENCRYPTED' && card.id !== 'script_ssh') { addLog(`[DENIED] TARGET_IS_ENCRYPTED.`); return; }
    }

    /** Карты с `requires` должны идти после зависимости слева направо по шине (как в реальном коде). */
    if (!looksLikePatch && card.requires) {
      const idsBefore = runtimeRail
        .slice(0, idx)
        .filter((s) => s.type === 'PLAYER_CODE' && s.content)
        .map((s) => (s.content as CombatCard).id);
      if (!idsBefore.includes(card.requires)) {
        addLog(`[DENIED] MISSING_PREREQ → deploy "${card.requires}" in an earlier slot first`);
        return;
      }
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
    } else if (selectedCard.source === 'script_pool') {
      setDiscard(prev => [...prev, card]);
    }

    registerPlayDiversity(card);

    // --- Reactive enemy: traceback наказывает за 2+ карты за тот же ход (используем актуальный счётчик, не stale state).
    setCardsPlayedThisTurn((p) => {
      const next = p + 1;
      if (enemy?.id === 'enemy_traceback' && next >= 2 && skillMode !== 'script-kiddie') {
        setStress((s) => Math.min(100, s + 10));
        addLog('[WARNING] TRACEBACK_ANOMALY_PUNISHED_STRESS!');
      }
      return next;
    });

    setSelectedCard(null);

    addLog(`[EXEC] ${card.name}`);
  };

  const handleAiStep = () => {
    if (!nextBugAction || !enemy) return;
    if (currentPhase === 'ARCHITECTURE') { addLog(`[AI] ${enemy.name} IS WATCHING...`); return; }
    const threatDelta =
      skillMode === 'script-kiddie'
        ? Math.max(1, Math.floor(nextBugAction.progressPoints * 0.75))
        : nextBugAction.progressPoints;
    const bugDelta = nextBugAction.bugPoints;
    const rawDamage = Math.floor(nextBugAction.damage * (1 + (tier - 1) * 0.25));
    const stressDelta =
      nextBugAction.damage > 0
        ? (skillMode === 'script-kiddie' ? Math.max(1, Math.floor(rawDamage * 0.65)) : rawDamage)
        : 0;
    setAiProgress((prev) => {
      const n = Math.min(100, prev + threatDelta);
      if (n >= 100 && prev < 100) {
        queueMicrotask(() => {
          addLog('[CRITICAL] THREAT_MAX — снимай баги; сильный контрплей режет угрозу.');
          setStress((s) => Math.min(100, s + 8));
        });
      }
      return n;
    });
    setBugPoints(prev => prev + bugDelta);
    if (nextBugAction.spawnId) {
      setRuntimeRail((prev) => {
        const next = [...prev];
        const empty = next.findIndex((s, i) => s.type === 'EMPTY' && i < ramSlotsMax);
        if (empty !== -1) {
          const pt = nextBugAction.problemType;
          const stack = pt ? (weakPatchStackRef.current[pt] ?? 0) : 0;
          const shell = 10 + stack * 6;
          if (stack > 0) {
            queueMicrotask(() =>
              addLog(`[ADAPTATION] Повторяющийся класс сбоя — оболочка ICE +${stack * 6} (снимай outplay-ом).`)
            );
          }
          next[empty] = { type: 'BUG_ERROR', content: nextBugAction, integrity: shell };
        }
        return next;
      });
    }
    if (nextBugAction.injectStatusId) {
      const raw = getCardById(nextBugAction.injectStatusId);
      if (raw) {
        const inst: CombatCard = { ...raw };
        const dest = nextBugAction.injectDestination ?? 'discard';
        if (dest === 'hand') setHand((h) => [...h, inst]);
        else if (dest === 'deck')
          setDeck((d) => [...d, inst].sort(() => Math.random() - 0.5));
        else setDiscard((d) => [...d, inst]);
        addLog(`[INJECT] ${inst.name} → ${dest.toUpperCase()}`);
      }
    }
    if (nextBugAction.damage > 0) {
      const absorbed = Math.min(mitigationBuffer, stressDelta);
      const dmgAfterAbsorb = Math.max(0, stressDelta - absorbed);
      if (absorbed > 0) {
        setMitigationBuffer((b) => Math.max(0, b - absorbed));
        addLog(`[GUARD] MITIGATION absorbed ${absorbed} stress.`);
      }
      if (dmgAfterAbsorb > 0) setStress((prev) => Math.min(100, prev + dmgAfterAbsorb));
    }
    if (nextBugAction.problemType && skillMode === 'junior') {
      addLog(
        `[HINT] Класс сбоя: ${problemTypeLabelRu(nextBugAction.problemType)} — подбери инструмент (тест/рефакторинг/защита/скрипт).`
      );
    }
    if (nextBugAction.problemType && skillMode === 'script-kiddie' && Math.random() < 0.4) {
      addLog(`[HINT] ${problemTypeLabelRu(nextBugAction.problemType)} — grep/ping/auth, смотри тип.`);
    }
    if (mitigationBuffer > 0) setMitigationBuffer((b) => Math.max(0, b - 2));
    addLog(`[AI] ${nextBugAction.name}`);
    setLastAiAction(nextBugAction);
    setLastAiImpact({
      stressDelta,
      threatDelta,
      bugDelta,
      statusInjected: nextBugAction.injectStatusId ?? null,
      ts: Date.now(),
    });
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
        setDiscard((prev) => [...prev, ...hand, ...deck]);
        setHand([]);
        setDeck([]);
        addLog('[SYSTEM] CODE_PUZZLE: palette + scripts (no random draw)');
        if (ramSlotsMax < missionTz.steps.length) addLog('[WARNING] ARCHITECTURAL_DIFF_DETECTED!');
      }
      if (targetPhase === 'DEPLOYMENT') {
        setDiscard((prev) => [...prev, ...hand, ...deck]);
        setHand([]);
        setDeck([]);
        runFinalDeploymentCheck();
      }
      
      if (targetPhase === 'VERIFICATION') {
        addLog('[SYSTEM] INITIATING_SECURITY_SCAN...');
        const bugSlots = runtimeRail.filter(s => s.type === 'BUG_ERROR');
        const currentBugs = bugSlots.length;

        if (playerProgress >= 100 && currentBugs === 0) {
           // --- CASE: PERFECT PROJECT ---
           // Спавним в пустые слоты. Не уничтожаем валидный код по ТЗ.
           const injectionCount = Math.random() > 0.5 ? 2 : 1;
           setRuntimeRail(prev => {
             const next = [...prev];
             let injected = 0;
             for (let i = 0; i < ramSlotsMax && injected < injectionCount; i++) {
               if (next[i].type === 'EMPTY') {
                 next[i] = {
                   type: 'BUG_ERROR',
                   content: {
                     id: 'bug_unverified',
                     name: 'UNVERIFIED_GAP',
                     description: 'Hidden security risk discovered during scan.',
                     progressPoints: 0,
                     bugPoints: 5,
                     damage: 0
                   },
                   integrity: 15
                 };
                 injected++;
               }
             }
             return next;
           });
           addLog(`[WARN] SECURITY_SCAN injected ${injectionCount} risks into free slots.`);
        } else if (playerProgress < 100) {
           // --- CASE: INCOMPLETE PROJECT ---
           setRuntimeRail(prev => {
             const next = [...prev];
             // Find an empty slot or overwrite a random code slot
             const emptyIdx = next.findIndex((s, idx) => s.type === 'EMPTY' && idx < ramSlotsMax);
             const targetIdx = emptyIdx !== -1 ? emptyIdx : Math.floor(Math.random() * ramSlotsMax);
             next[targetIdx] = { 
               type: 'BUG_ERROR', 
               content: { id: 'bug_logic_gap', name: 'LOGIC_INCONSISTENCY', description: 'Incomplete project paths detected. System state is unstable.', progressPoints: 0, bugPoints: 10, damage: 5 }, 
               integrity: 20 
             };
             return next;
           });
           addLog('[FATAL] INCOMPLETE_COVERAGE! UNEXPECTED_LOGIC_GAP_INJECTED.');
           setStress(s => Math.min(100, s + 10));
        } else if (currentBugs > 0) {
           // --- CASE: VULNERABLE PROJECT (Already has bugs) ---
           setRuntimeRail(prev => prev.map(s => s.type === 'BUG_ERROR' ? { ...s, integrity: s.integrity + 10 } : s));
           setStress(s => Math.min(100, s + 15));
           addLog('[DANGER] VULNERABILITIES_CONFIRMED! ESCALATING_BREACH_SEVERITY.');
        }

        setDiscard((prev) => [...prev, ...hand, ...deck]);
        const stabQ = stabilizationQueueRef.current;
        stabilizationQueueRef.current = [];
        const drawN = Math.min(START_HAND_SIZE, stabQ.length);
        setHand(stabQ.slice(0, drawN));
        setDeck(stabQ.slice(drawN));
        addLog(`[SYSTEM] STABILIZATION_DRAW: ${drawN} cards (react / soft / status)`);
      }
    }
  };

  const runFinalDeploymentCheck = () => {
    addLog('[SYSTEM] INITIALIZING_FINAL_DEPLOYMENT_CHECK...');
    const railIds = runtimeRail.filter(s => s.type === 'PLAYER_CODE').map(s => (s.content as CombatCard).id);
    let missingSteps = missionTz.steps.filter(step => !getStepCardIds(step).some(id => railIds.includes(id)));
    if (missionTz.isExecutionChain) {
      const isSequenceValid = missionTz.steps.every((step, index) => railIds[index] && getStepCardIds(step).includes(railIds[index]));
      // Лишние карты после валидной цепочки не ломают контракт: важен префикс по шагам.
      if (!isSequenceValid) { missingSteps = [...missionTz.steps]; addLog('[ERROR] EXECUTION_CHAIN_BROKEN'); }
    }
    const productionCards = runtimeRail.filter(s => s.type === 'PLAYER_CODE' && s.content && ['SYNTAX', 'FUNCTION', 'REACTION'].includes((s.content as any).type)).length;
    const codeCardsOnRail = runtimeRail.filter((s) => s.type === 'PLAYER_CODE').length;
    const overbuild = Math.max(0, codeCardsOnRail - (missionTz.steps.length + 2));
    const cpuOk = cpuMax >= productionCards * 0.5;
    const ramOk = ramMaxMb >= productionCards * 256;
    const slotsOk = ramSlotsMax >= missionTz.steps.length;
    const stabilityDamage = runtimeRail.filter(s => s.type === 'BUG_ERROR').length * 15 + overbuild * 4;
    if (overbuild > 0) addLog(`[WARN] CODE_BLOAT penalty: +${overbuild * 4} stress`);
    const currentStress = stress + stabilityDamage;
    setStress(Math.min(100, currentStress));
    const isSuccess = missingSteps.length === 0 && cpuOk && ramOk && slotsOk && currentStress < 100;
    setDeploymentReport({ missingSteps, cpuOk, ramOk, slotsOk, slotsAvailable: ramSlotsMax, slotsRequired: missionTz.steps.length, stabilityDamage, isSuccess });
    const finalBits = isQuestCombat ? 15 : (skillMode === 'script-kiddie' ? 25 : 100 + tier * 50);
    const finalChain = runtimeRail.filter(s => s.type === 'PLAYER_CODE' && s.content).map(s => (s.content as CombatCard).name);
    setTimeout(() => { if (isSuccess) { setVictoryResult({ bits: finalBits, chain: finalChain }); setShowVictory(true); } else setShowDefeat(true); }, 2000);
  };

  const endTurn = () => {
    const playedThisTurn = cardsPlayedThisTurn;
    const hadCleanCounterplay = clearedBugsThisTurn > 0;
    setIsPlayerTurn(false); setSelectedCard(null); setAiDeadline(prev => Math.max(0, prev - 1)); addLog('[AI] THINKING...');

    // --- PERSONALITY EFFECTS (end of player turn; считаем до сброса счётчика) ---
    if (enemy?.personality === 'TRACER' && playedThisTurn > (skillMode === 'script-kiddie' ? 3 : 2)) {
      setStress((s) => Math.min(100, s + 15));
      addLog(`[TRACER] SIGNATURE_DETECTED! ${playedThisTurn} cards played. +15 stress penalty.`);
    }

    setCardsPlayedThisTurn(0);
    setClearedBugsThisTurn(0);
    if ((currentPhase === 'DEVELOPMENT' || currentPhase === 'VERIFICATION') && playedThisTurn === 0) {
      setIdleTurnStreak((n) => n + 1);
      const stallThreat = Math.min(12, 4 + idleTurnStreak * 2);
      const stallStress = Math.min(8, 2 + idleTurnStreak);
      setAiProgress((p) => Math.min(100, p + stallThreat));
      setStress((s) => Math.min(100, s + stallStress));
      addLog(`[STALL] Idle turn penalty: +${stallThreat}% threat, +${stallStress} stress.`);
    } else {
      setIdleTurnStreak(0);
    }
    if (enemy?.personality === 'SNIFFER') {
      const statusCount = hand.filter(c => c.type === 'STATUS').length;
      if (statusCount > 0) {
        const dmg = statusCount * 8;
        setStress(s => Math.min(100, s + dmg));
        addLog(`[SNIFFER] ${statusCount} STATUS_CARDS_DETECTED. +${dmg} stress.`);
      }
    }
    if (enemy?.personality === 'AUDITOR' && currentPhase === 'VERIFICATION') {
      const firstRailCard = runtimeRail.find((s) => s.type === 'PLAYER_CODE');
      if (firstRailCard && firstRailCard.content) {
        const card = firstRailCard.content as CombatCard;
        if (card.type !== 'REACTION' && card.id !== 'react_spoof_id') {
          setPlayerProgress((p) => Math.max(0, p - 10));
          addLog('[AUDITOR] PROTOCOL_VIOLATION! First slot non-REACTION. -10 progress.');
        }
      }
    }
    if (
      enemy?.personality === 'PHANTOM' &&
      planningTurn % 2 === 0 &&
      !(skillMode === 'script-kiddie' && missionTz.isExecutionChain)
    ) {
      setRuntimeRail(prev => {
        const next = [...prev];
        const occupied = next.map((s, i) => s.type === 'PLAYER_CODE' ? i : -1).filter(i => i !== -1);
        if (occupied.length > 1) {
          const fromIdx = occupied[Math.floor(Math.random() * occupied.length)];
          const emptyIdx = next.findIndex((s, i) => s.type === 'EMPTY' && i < ramSlotsMax);
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
      const executed = nextBugAction;
      setIsAiResolving(true);
      handleAiStep();
      if (enemy && executed && currentPhase !== 'ARCHITECTURE') {
        aiRecentRef.current = [...aiRecentRef.current, { id: executed.id, problemType: executed.problemType }].slice(-10);
      }
      setTimeout(() => {
        setIsAiResolving(false);
        setIsPlayerTurn(true); setCpu(cpuMax); drawCards(hadCleanCounterplay ? 2 : 1);
        if (hadCleanCounterplay) addLog('[TEMPO] Clean counterplay last turn: +1 extra draw.');
        if (enemy) {
          setNextBugAction(
            pickNextBugAction(enemy, aiRecentRef.current, {
              phase: currentPhase,
              bugPressure: runtimeRail.filter((s) => s.type === 'BUG_ERROR').length,
              playerProgress,
            })
          );
        }
        if (enemy?.visualType === 'DEVELOPER') {
          setAiDeadline(prev => {
            const clock = prev - 1;
            if (clock <= 0) setShowDefeat(true); else addLog(`[WARNING] SYSTEM_CLOCK: ${clock} CYCLES_LEFT`);
            return clock;
          });
        }
        
        const noise = skillMode === 'script-kiddie' ? 3 : 5;
        setStress((prev) => Math.min(100, prev + noise));
        addLog(`[WARNING] BACKGROUND_NOISE: +${noise}% STRESS`);
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
      planningTurn, mulliganUsed, infraSlots, softSlots, hand, deck, discard,
      selectedCard, runtimeRail, enemy, nextBugAction, isPlayerTurn, log, canAdvancePhase, phaseIntro,
      lastAiAction,
      lastAiImpact, isAiResolving,
      mitigationBuffer,
      ramSlotsMax, filteredHand, codingPalette, scriptPool, isPipelineFull: runtimeRail.slice(0, ramSlotsMax).every(s => s.type !== 'EMPTY')
    },
    actions: {
      handleCardSelect,
      executeCardOnSlot,
      handleMulligan,
      handleOverclock,
      endTurn,
      advancePhase,
      setShowVictory,
      setShowDefeat,
      getEffectiveCost,
    }
  };
}

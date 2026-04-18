import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, type MutableRefObject } from 'react';
import type { CombatPhase } from '../combatPhases';
import {
  SDLC_COOP_PARALLEL_ALLOWED_TYPES,
  SDLC_PHASES,
  coopSkipsArchitecturePhase,
  coopUnifiedSprintCombat,
} from '../combatPhases';
import { isInfraDrawCard, isStabilizationDrawCard, isStaticCodeCardType } from '../combatFlow';
import { sortInfraCardsForAdminSupply } from '../adminInfraPipeline';
import type { CombatCard } from '../combatCards';
import { getCardById } from '../combatCards';
import { isOutplayCounter, problemTypeLabelRu } from '../combatCounterplay';
import type { TechnicalTask, TZStep } from '../combatTasks';
import { getStepCardIds } from '../combatTasks';

import type { Trait } from '../traits';
import { ALL_ENEMIES, BUGS, pickNextBugAction } from '../combatEnemies';
import type { BugEnemy, BugAction, BugProblemType, AiRecentEntry, AiSelectionContext } from '../combatEnemies';
import type { CoopRole, DevLanguageStack, SessionMode } from '../sessionMode';
import { getCoopRoleCatalogIds } from '../sessionMode';
import type { CoopSquadFill } from '../coopTeamFlow';
import { rollSyntheticSquadAssist } from '../coopTeamFlow';
import {
  coopAdjustAiDeltas,
  coopBackgroundNoise,
  coopBugClearSynergy,
  coopChainProgressBonus,
  coopLaneCodeProgressBump,
  coopOppositionOpeningLine,
  coopOutplayExtras,
  coopPmSoftSynergy,
  isCoopCombat,
} from '../coopCombatRole';
import {
  PM_RITUAL_SOFT_IDS,
  computeCoopLinkedRows,
  emptyCoopLinkedTrack,
  nextCoopLinkedAwards,
} from '../coopLinkedRoleObjectives';

/** Контекст выбора NEXT_INTENT: плотнее в коопе и в верификации соло. */
function bugIntentPickContext(
  phase: CombatPhase,
  bugPressure: number,
  playerProgress: number,
  coopActive: boolean
): AiSelectionContext {
  let eventDensity = 1;
  if (coopActive) {
    if (phase === 'VERIFICATION') eventDensity = 1.34;
    else if (phase === 'DEVELOPMENT') eventDensity = 1.14;
    else eventDensity = 1.06;
  } else if (phase === 'VERIFICATION') {
    eventDensity = 1.1;
  }
  return { phase, bugPressure, playerProgress, eventDensity };
}

/** Кооп-спринт: в DEVELOPMENT давление ИИ как на стабилизации (GDD — активный оппонент). */
function phaseForCoopAiIntent(phase: CombatPhase, coopUnified: boolean): CombatPhase {
  return coopUnified && phase === 'DEVELOPMENT' ? 'VERIFICATION' : phase;
}

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
  isFirstCombatQuestTutorial?: boolean;
  /** Кооп: роль влияет на входящий урон ИИ, прогресс и т.д. */
  sessionMode?: SessionMode;
  coopRole?: CoopRole | null;
  /** Кооп: пати людей — без симуляции ходов ботов на этом клиенте. */
  coopSquadFill?: CoopSquadFill;
  devLanguageStack?: DevLanguageStack | null;
  /**
   * live_party: ref на функцию, которая отправляет бонус связанных целей на сервер.
   * Обновляется родителем каждый рендер — читать только `.current` в момент вызова.
   */
  pushCoopLinkedProgressToServerRef?: MutableRefObject<
    ((args: { progressDelta: number; objectiveIds: readonly string[] }) => Promise<boolean>) | undefined
  >;
  /** live_party: id целей с сервера — подмешивать в awarded, чтобы не дублировать после рефреша. */
  coopLinkedServerAwardedIds?: readonly string[];
  /**
   * live_party: общий % спринта с матча (у dev на шине). PM локально не видит чужую шину —
   * без подмешивания PROJECT% залипает на 0 и не открывается VERIFICATION/DEPLOY.
   */
  coopSharedProjectProgress?: number | null;
}

function pickCombatCardForMissionStep(step: TZStep): CombatCard | null {
  for (const id of getStepCardIds(step)) {
    const c = getCardById(id);
    if (c) return c;
  }
  return null;
}

function ensureCoopDeveloperDeckCoversMission(
  deck: CombatCard[],
  mission: TechnicalTask,
  stack: DevLanguageStack | null
): CombatCard[] {
  if (mission.districtId !== 'coop_yard') return deck;
  const catalog = getCoopRoleCatalogIds('developer', stack);
  const have = new Set(deck.map((c) => c.id));
  const missing: string[] = [];
  for (const step of mission.steps) {
    const ids = getStepCardIds(step);
    if (ids.length === 0) continue;
    if (!ids.some((id) => have.has(id))) {
      const pick = ids.find((id) => catalog.has(id)) ?? ids[0];
      missing.push(pick);
    }
  }
  if (missing.length === 0) return deck;
  const out = [...deck];
  for (const id of missing) {
    if (have.has(id)) continue;
    const card = getCardById(id);
    if (!card) continue;
    if (!catalog.has(id)) continue;
    out.push(card);
    have.add(id);
  }
  return out;
}

interface AiImpactSummary {
  stressDelta: number;
  threatDelta: number;
  bugDelta: number;
  statusInjected: string | null;
  ts: number;
}

export function useCombatLogic(config: UseCombatLogicProps) {
  const {
    skillMode,
    playerTraits,
    activeDeck,
    missionTz,
    tier,
    deckCores,
    deckRamMb,
    isQuestCombat,
    isFirstCombatQuestTutorial,
    sessionMode = 'solo',
    coopRole = null,
    coopSquadFill = 'synthetic_bots',
    devLanguageStack = null,
    pushCoopLinkedProgressToServerRef,
    coopLinkedServerAwardedIds,
  } = config;
  /** Читаем с объекта аргумента: надёжнее длинной деструктуризации параметра для deps/progress sync. */
  const coopSharedProjectProgress = config.coopSharedProjectProgress ?? null;
  const coopActive = isCoopCombat(sessionMode, coopRole);
  const skipArchitecture = coopSkipsArchitecturePhase(sessionMode, coopRole ?? null);
  const coopUnified = coopUnifiedSprintCombat(sessionMode, coopRole ?? null);
  const START_HAND_SIZE = 6;
  /** QA/PM/Admin: шире рука и дро — комбо из 2–3 карт не опустошает темп хода. */
  const coopSupportComboTempo =
    coopActive && coopRole && coopRole !== 'developer';
  const effectiveStartHandSize = coopSupportComboTempo ? START_HAND_SIZE + 1 : START_HAND_SIZE;

  const coopDeckForLogic = useMemo(() => {
    if (!coopActive || coopRole !== 'developer') return activeDeck;
    return ensureCoopDeveloperDeckCoversMission(activeDeck, missionTz, devLanguageStack);
  }, [activeDeck, coopActive, coopRole, missionTz, devLanguageStack]);

  // --- CORE STATE ---
  const [currentPhase, setCurrentPhase] = useState<CombatPhase>(() =>
    skipArchitecture ? 'DEVELOPMENT' : 'ARCHITECTURE',
  );
  const [playerProgress, setPlayerProgress] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [bugPoints, setBugPoints] = useState(0);
  const [stress, setStress] = useState(0);
  const STRESS_MAX = 100;
  /** В коопе снижать стресс с карт могут только SOFT у PM; в соло — как раньше. */
  const stressReliefFromPlayerCards = !coopActive || coopRole === 'pm';
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
      return BUGS.find((b) => b.id === 'enemy_sysadmin') || BUGS[0];
    }
    const pool = ALL_ENEMIES.filter((b) => b.id !== 'enemy_sysadmin');
    return pool[Math.floor(Math.random() * pool.length)] ?? BUGS[0];
  });
  const turnPlaysRef = useRef<string[]>([]);
  const [nextBugAction, setNextBugAction] = useState<BugAction | null>(null);
  const [lastAiAction, setLastAiAction] = useState<BugAction | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAiResolving, setIsAiResolving] = useState(false);
  const [lastAiImpact, setLastAiImpact] = useState<AiImpactSummary | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [canAdvancePhase, setCanAdvancePhase] = useState(false);
  const [phaseIntro, setPhaseIntro] = useState<string | null>(() => (skipArchitecture ? 'DEVELOPMENT' : 'ARCHITECTURE'));

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
  /** Кооп non-dev: счётчики под цели, привязанные к длине ТЗ разработчика. */
  const coopLinkedTrackRef = useRef(emptyCoopLinkedTrack());
  const coopLinkedAwardedRef = useRef<Set<string>>(new Set());
  const [coopLinkedHudTick, setCoopLinkedHudTick] = useState(0);
  /** Снимок метрик после коммита стейта — для assist ботов в конце хода ИИ. */
  const combatCoopAssistRef = useRef({
    stress: 0,
    railBugCount: 0,
    playerProgress: 0,
    infraFilled: 0,
  });
  useLayoutEffect(() => {
    combatCoopAssistRef.current = {
      stress,
      railBugCount: runtimeRail.filter((s) => s.type === 'BUG_ERROR').length,
      playerProgress,
      infraFilled: infraSlots.filter(Boolean).length,
    };
  }, [stress, runtimeRail, playerProgress, infraSlots]);

  useEffect(() => {
    if (isPlayerTurn) turnPlaysRef.current = [];
  }, [isPlayerTurn]);

  // --- DERIVED ---
  const ramSlotsMax = useMemo(() => {
    const raw = Math.floor(ramMaxMb / 512);
    const stepCount = missionTz.steps?.length ?? 0;
    if (skillMode === 'script-kiddie') return Math.max(raw, Math.max(stepCount, 1));
    return raw;
  }, [ramMaxMb, skillMode, missionTz]);

  /** RAM/шаги миссии могут дать ramSlotsMax > длины шины (старт 10 слотов) — иначе VERIFICATION и ИИ падают на undefined.type. */
  useLayoutEffect(() => {
    setRuntimeRail((prev) => {
      if (prev.length >= ramSlotsMax) return prev;
      const pad: RailSlot[] = [];
      for (let i = prev.length; i < ramSlotsMax; i++) {
        pad.push({ type: 'EMPTY', content: null, integrity: 0 });
      }
      return [...prev, ...pad];
    });
  }, [ramSlotsMax]);

  const codingPalette = useMemo(
    () => coopDeckForLogic.filter((c) => isStaticCodeCardType(c.type)),
    [coopDeckForLogic]
  );

  const scriptPool = useMemo(
    () => coopDeckForLogic.filter((c) => c.type === 'SCRIPT' && !discard.some((d) => d.id === c.id)),
    [coopDeckForLogic, discard]
  );

  const filteredHand = useMemo(() => {
    /**
     * Кооп: в DEVELOPMENT — палитра + скрипты + рука параллельно.
     * В ARCHITECTURE только снабжение (и у админа — проводка SCRIPT из пула), иначе палитра «забивает» INFRA и ломает читаемость пайплайна.
     */
    if (coopActive) {
      if (currentPhase === 'ARCHITECTURE') {
        const h = hand.map((c, i) => ({ card: c, source: 'hand' as const, idx: i }));
        if (coopRole === 'admin') {
          const s = scriptPool.map((c, i) => ({ card: c, source: 'script_pool' as const, idx: i }));
          return [...h, ...s];
        }
        return h;
      }
      if (currentPhase === 'VERIFICATION') {
        const s = scriptPool.map((c, i) => ({ card: c, source: 'script_pool' as const, idx: i }));
        const h = hand.map((c, i) => ({ card: c, source: 'hand' as const, idx: i }));
        return [...s, ...h];
      }
      if (currentPhase === 'DEPLOYMENT') {
        return hand.map((c, i) => ({ card: c, source: 'hand' as const, idx: i }));
      }
      const p = codingPalette.map((c, i) => ({ card: c, source: 'palette' as const, idx: i }));
      const s = scriptPool.map((c, i) => ({ card: c, source: 'script_pool' as const, idx: i }));
      const h = hand.map((c, i) => ({ card: c, source: 'hand' as const, idx: i }));
      return [...p, ...s, ...h];
    }
    if (currentPhase === 'DEVELOPMENT') {
      const p = codingPalette.map((c, i) => ({ card: c, source: 'palette' as const, idx: i }));
      const s = scriptPool.map((c, i) => ({ card: c, source: 'script_pool' as const, idx: i }));
      return [...p, ...s];
    }
    if (currentPhase === 'ARCHITECTURE' || currentPhase === 'VERIFICATION') {
      return hand.map((c, i) => ({ card: c, source: 'hand' as const, idx: i }));
    }
    return [];
  }, [coopActive, currentPhase, hand, codingPalette, scriptPool, coopRole]);

  const addLog = useCallback((msg: string) => setLog(prev => [msg, ...prev].slice(0, 15)), []);

  const flushCoopLinkedObjectives = useCallback(() => {
    if (!coopActive || !coopRole || coopRole === 'developer') return;
    const res = nextCoopLinkedAwards(missionTz, coopRole, coopLinkedTrackRef.current, coopLinkedAwardedRef.current, {
      skipArchitecture,
    });
    if (res.newAwarded.length === 0) {
      setCoopLinkedHudTick((x) => x + 1);
      return;
    }
    const pushServer = pushCoopLinkedProgressToServerRef?.current;
    if (pushServer && res.progressDelta > 0) {
      void (async () => {
        const ok = await pushServer({ progressDelta: res.progressDelta, objectiveIds: res.newAwarded });
        if (ok) {
          for (const id of res.newAwarded) coopLinkedAwardedRef.current.add(id);
          res.rewardLines.forEach(addLog);
        } else {
          addLog('[СПРИНТ] Синк вклада с сервером не удался — цели остаются открытыми, попробуйте снова.');
        }
        setCoopLinkedHudTick((x) => x + 1);
      })();
      return;
    }
    for (const id of res.newAwarded) coopLinkedAwardedRef.current.add(id);
    if (res.progressDelta > 0) {
      setPlayerProgress((p) => Math.min(100, p + res.progressDelta));
      res.rewardLines.forEach(addLog);
    }
    setCoopLinkedHudTick((x) => x + 1);
  }, [coopActive, coopRole, missionTz, addLog, skipArchitecture, pushCoopLinkedProgressToServerRef]);

  const coopLinkedObjectiveRows = useMemo(() => {
    if (!coopActive || !coopRole || coopRole === 'developer') return [];
    return computeCoopLinkedRows(missionTz, coopRole, coopLinkedTrackRef.current, coopLinkedAwardedRef.current, {
      skipArchitecture,
    });
  }, [coopActive, coopRole, missionTz, coopLinkedHudTick, skipArchitecture]);

  useEffect(() => {
    coopLinkedTrackRef.current = emptyCoopLinkedTrack();
    coopLinkedAwardedRef.current = new Set();
    setCoopLinkedHudTick((x) => x + 1);
  }, [missionTz.id, coopActive, coopRole]);

  const coopLinkedServerAwardedJoin = coopLinkedServerAwardedIds?.length
    ? coopLinkedServerAwardedIds.join('|')
    : '';
  useEffect(() => {
    if (!coopLinkedServerAwardedJoin) return;
    const ids = coopLinkedServerAwardedJoin.split('|').filter(Boolean);
    let ch = false;
    for (const id of ids) {
      if (!coopLinkedAwardedRef.current.has(id)) {
        coopLinkedAwardedRef.current.add(id);
        ch = true;
      }
    }
    if (ch) setCoopLinkedHudTick((x) => x + 1);
  }, [coopLinkedServerAwardedJoin]);

  const registerPlayDiversity = useCallback(
    (card: CombatCard) => {
      if (skillMode === 'script-kiddie') return;
      if (cardFamiliesRef.current.has(card.type)) return;
      cardFamiliesRef.current.add(card.type);
      const n = cardFamiliesRef.current.size;
      if (n >= 3 && !familyMilestoneRef.current.t3) {
        familyMilestoneRef.current.t3 = true;
        if (stressReliefFromPlayerCards) {
          setStress((s) => Math.max(0, s - 4));
          addLog('[TOOLCHAIN] Разные классы карт в бою — −4 стресс.');
        } else {
          addLog('[TOOLCHAIN] Разные классы карт — без релифа стресса (в коопе только PM снимает стресс картами).');
        }
      }
      if (n >= 5 && !familyMilestoneRef.current.t5) {
        familyMilestoneRef.current.t5 = true;
        setCpu((prev) => Math.min(cpuMax, prev + 1));
        addLog('[TOOLCHAIN] Пять разных типов — +1 CPU (до максимума).');
      }
    },
    [addLog, cpuMax, skillMode, stressReliefFromPlayerCards]
  );

  // --- INIT ---
  useEffect(() => {
    aiRecentRef.current = [];
    weakPatchStackRef.current = {};
    cardFamiliesRef.current = new Set();
    familyMilestoneRef.current = { t3: false, t5: false };

    if (skipArchitecture && coopActive && (coopRole === 'qa' || coopRole === 'pm')) {
      const stab = [...activeDeck.filter(isStabilizationDrawCard)].sort(() => Math.random() - 0.5);
      const n = Math.min(effectiveStartHandSize, stab.length);
      setHand(stab.slice(0, n));
      setDeck(stab.slice(n));
      addLog('[SYSTEM] COOP: параллельный цикл — рука из стабилизации (роль QA/PM).');
    } else if (skipArchitecture && coopActive && coopRole === 'admin') {
      const rawInfra = [...activeDeck.filter(isInfraDrawCard)];
      const infraPile = sortInfraCardsForAdminSupply(rawInfra);
      if (infraPile.length === 0) {
        setCpuMax((p) => p + 1);
        setCpu((p) => p + 1);
        setRamMaxMb((p) => p + 512);
        addLog('[SYSTEM] EMERGENCY_INFRA_BOOT: +1 CPU, +512 MiB RAM');
      }
      const n = Math.min(effectiveStartHandSize, infraPile.length);
      setHand(infraPile.slice(0, n));
      setDeck(infraPile.slice(n));
      addLog('[SYSTEM] COOP_SPRINT: admin — старт с INFRA в общем спринте (без фазы снабжения).');
      if (infraPile.length > 0) {
        addLog(
          '[ADMIN:PIPE] Контур в том же бою, что и код: заполните INFRA-слоты; SSH/PING — проводка к узлам.',
        );
      }
    } else if (skipArchitecture) {
      setHand([]);
      setDeck([]);
      addLog('[SYSTEM] COOP: старт с ПАЗЗЛ КОДА (роль Developer).');
    } else {
      const rawInfra = [...activeDeck.filter(isInfraDrawCard)];
      const infraPile =
        coopActive && coopRole === 'admin'
          ? sortInfraCardsForAdminSupply(rawInfra)
          : rawInfra.sort(() => Math.random() - 0.5);
      if (infraPile.length === 0) {
        // Fail-safe: бой не должен разваливаться, если в деке случайно нет INFRA карт.
        setCpuMax((p) => p + 1);
        setCpu((p) => p + 1);
        setRamMaxMb((p) => p + 512);
        addLog('[SYSTEM] EMERGENCY_INFRA_BOOT: +1 CPU, +512 MiB RAM');
      }
      const n = Math.min(effectiveStartHandSize, infraPile.length);
      setHand(infraPile.slice(0, n));
      setDeck(infraPile.slice(n));
      addLog('[SYSTEM] PHASE_SUPPLY: infra draw only.');
      if (coopActive && coopRole === 'admin' && infraPile.length > 0) {
        addLog(
          '[ADMIN:PIPE] Сначала заполните INFRA-слоты (периметр → вычисление → данные → баланс/edge → CI/наблюдаемость). ' +
            'Затем COMPILE. SSH/PING — проводка к узлам, не замена слотов.',
        );
      }
    }

    stabilizationQueueRef.current = [...activeDeck.filter(isStabilizationDrawCard)].sort(() => Math.random() - 0.5);

    const bootPhase: CombatPhase = skipArchitecture ? 'DEVELOPMENT' : 'ARCHITECTURE';
    if (enemy)
      setNextBugAction(
        pickNextBugAction(
          enemy,
          [],
          bugIntentPickContext(phaseForCoopAiIntent(bootPhase, coopUnified), 0, 0, coopActive),
        ),
      );

    addLog('[SYSTEM] BOOT_SEQUENCE... [OK]');
    addLog(`[SYSTEM] PHASE_${bootPhase}_ACTIVE.`);
    if (coopUnified) {
      addLog('[SYSTEM] COOP_SPRINT: единый спринт — код, инфра, тест и SOFT параллельно; SHIP в релиз без отдельной фазы стабилизации.');
    }
    if (isFirstCombatQuestTutorial && skillMode === 'script-kiddie') {
      addLog('[TUTORIAL] Цель: PROJECT 100% до THREAT 100%.');
      addLog('[TUTORIAL] DEVELOPMENT: выкладывай код в шину и собирай прогресс.');
      addLog('[TUTORIAL] VERIFICATION: чисти BUG_ERROR реакциями/защитой.');
      addLog('[TUTORIAL] Смотри NEXT_INTENT: это следующее действие оппонента.');
    }

    if (coopActive && coopRole) {
      addLog(coopOppositionOpeningLine(coopRole));
    }

    if (playerTraits.some(t => t.id === 'hobby_comp_coding')) setRamMaxMb(prev => prev + 512);
    if (playerTraits.some(t => t.id === 'hardware_reclaimer')) setRamMaxMb(prev => prev + 512);
    if (playerTraits.some(t => t.id === 'overclocked')) {
      setCpuMax(prev => prev + 1);
      setCpu(prev => prev + 1);
    }

    /** Полигон coop_yard + synthetic_bots: общий пол RAM/CPU для всех ролей; цепочку кода на шину кладёт бот-DEV, если вы не developer. */
    if (
      coopActive &&
      coopSquadFill === 'synthetic_bots' &&
      missionTz.districtId === 'coop_yard' &&
      coopRole
    ) {
      const railSteps = Math.max(1, missionTz.steps?.length ?? 1);
      setRamMaxMb((prev) => Math.max(prev, 512 * railSteps));
      const wantCpu = Math.max(3, Math.ceil(railSteps * 0.55));
      setCpuMax((prev) => Math.max(prev, wantCpu));
      setCpu((prev) => Math.max(prev, wantCpu));
      addLog(
        `[КОМАНДА:ADMIN] Синтетический контур: RAM/CPU под ${railSteps} слотов шины (общая база команды).`,
      );
      /** PM: не заполняем шину кодом — иначе 100% PROJECT и пустая роль; код ведёт синтетический DEV вне вашего клика. */
      if (
        missionTz.isExecutionChain &&
        coopRole !== 'developer' &&
        coopRole !== 'pm' &&
        missionTz.steps?.length
      ) {
        setRuntimeRail((prev) => {
          const next = [...prev];
          for (let i = 0; i < missionTz.steps.length; i++) {
            if (i >= next.length) break;
            const card = pickCombatCardForMissionStep(missionTz.steps[i]);
            if (!card) continue;
            next[i] = { type: 'PLAYER_CODE', content: card, integrity: card.integrity ?? 10 };
          }
          return next;
        });
        addLog('[КОМАНДА:DEV] Синтетический разработчик выложил цепочку ТЗ на шину — играйте свою роль параллельно.');
      }
      if (coopRole === 'pm' && missionTz.isExecutionChain && missionTz.steps?.length) {
        addLog(
          '[PM:СПРИНТ] Цепочку кода на шине собирает синтетический DEV — ваша работа: SOFT (стресс/срок), сводка команды и блок «Вклад в релиз». ' +
            'Кнопка NEXT в разработке открывает верификацию, когда готовы проверить процесс.',
        );
      }
    }

    setPhaseIntro(bootPhase);
    setTimeout(() => setPhaseIntro(null), 2500);
  }, []);

  // --- PROGRESS LOGIC ---
  useEffect(() => {
    if (!missionTz.steps) return;
    const pmYardSynthetic =
      coopActive &&
      coopRole === 'pm' &&
      coopSquadFill === 'synthetic_bots' &&
      missionTz.districtId === 'coop_yard';
    const sharedProg =
      typeof coopSharedProjectProgress === 'number' && Number.isFinite(coopSharedProjectProgress)
        ? Math.min(100, Math.max(0, Math.round(coopSharedProjectProgress)))
        : null;
    const pmLiveShared =
      coopActive && coopRole === 'pm' && coopSquadFill === 'live_party' && sharedProg != null;

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
      let pct = Math.floor((matchedSteps / missionTz.steps.length) * 100);
      /** PM: код на шине собирает синт. DEV — не держать PROJECT% на нуле из-за пустой локальной шины. */
      if (pmYardSynthetic) pct = 100;
      else if (pmLiveShared) pct = Math.max(pct, sharedProg!);
      setPlayerProgress(pct);
    } else {
      const railIds = runtimeRail.filter((s) => s.type === 'PLAYER_CODE').map((s) => (s.content as CombatCard).id);
      const satisfiedSteps = missionTz.steps.filter((step) =>
        getStepCardIds(step).some((id) => railIds.includes(id))
      );
      let pct = Math.floor((satisfiedSteps.length / missionTz.steps.length) * 100);
      if (pmYardSynthetic) pct = 100;
      else if (pmLiveShared) pct = Math.max(pct, sharedProg!);
      setPlayerProgress(pct);
    }
  }, [runtimeRail, missionTz, coopActive, coopRole, coopSquadFill, coopSharedProjectProgress]);

  useEffect(() => {
    const rules = SDLC_PHASES[currentPhase];
    if (currentPhase === 'ARCHITECTURE') {
      // В коопе только admin ведёт снабжение; COMPILE после заполнения контура (не «в один клик»).
      if (coopActive && coopRole === 'admin') {
        const filled = infraSlots.filter(Boolean).length;
        setCanAdvancePhase(filled >= 6);
        return;
      }
      setCanAdvancePhase(true);
      return;
    }
    if (currentPhase === 'DEVELOPMENT') {
      /** GDD §4.2: один гейт к деплою «приложения» — без промежуточной VER. */
      if (coopUnified) {
        if (missionTz.isExecutionChain) {
          /** PM не валидирует чужую шину; SHIP — когда команда довела PROJECT (см. синт. dev / shared). */
          if (coopActive && coopRole === 'pm') {
            setCanAdvancePhase(true);
            return;
          }
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
          setCanAdvancePhase(ok && playerProgress >= 100);
          return;
        }
        setCanAdvancePhase(playerProgress >= 100);
        return;
      }
      if (missionTz.isExecutionChain) {
        /** PM не валидирует цепочку кода — иначе блок на пустой шине после отключения автозаполнения. */
        if (coopActive && coopRole === 'pm') {
          setCanAdvancePhase(true);
          return;
        }
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
  }, [currentPhase, playerProgress, missionTz, runtimeRail, infraSlots, coopActive, coopRole, coopUnified]);

  const drawCards = (count: number) => {
    if (currentPhase === 'DEVELOPMENT' && !coopActive) return;
    setHand((prevHand) => {
      const newHand = [...prevHand];
      let currentDeck = [...deck];
      let currentDiscard = [...discard];
      for (let i = 0; i < count; i++) {
        if (currentDeck.length === 0) {
          const recycle = currentDiscard.filter((c) =>
            coopActive
              ? isInfraDrawCard(c) || isStabilizationDrawCard(c)
              : currentPhase === 'VERIFICATION'
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
    if (!card) {
      addLog('[DENIED] CARD_NOT_FOUND (смена фазы или рассинхрон руки — выберите карту снова).');
      setSelectedCard(null);
      return;
    }

    if (coopActive && card.type === 'SOFT' && coopRole !== 'pm') {
      addLog('[DENIED] SOFT — только у класса PM (снятие стресса и командные буферы).');
      return;
    }

    const burnout = stress >= STRESS_MAX;
    if (burnout) {
      if (card.type === 'STATUS') {
        /* сброс мусора разрешён */
      } else if (card.type === 'SOFT' && stressReliefFromPlayerCards) {
        /* соло или PM */
      } else if (card.type === 'INFRASTRUCTURE') {
        addLog('[BURNOUT] Стресс 100%: INFRA недоступна — только PM (SOFT) или сброс STATUS.');
        return;
      } else if (
        card.type === 'REACTION' ||
        card.type === 'DEFENSIVE' ||
        card.type === 'SCRIPT' ||
        card.type === 'SYNTAX' ||
        card.type === 'FUNCTION'
      ) {
        /* снятие BUG_ERROR или код — фильтр в executeCardOnSlot */
      } else {
        addLog('[BURNOUT] Стресс 100%: игра карт заблокирована (PM·SOFT, STATUS, снятие ICE/бага).');
        return;
      }
    }

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
    const allowedList = coopActive ? SDLC_COOP_PARALLEL_ALLOWED_TYPES : rules.allowedTypes;
    if (!allowedList.includes(card.type)) {
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
        if (coopRole === 'admin') {
          setMitigationBuffer((b) => Math.min(30, b + 2));
          if (!coopActive) {
            setStress((s) => Math.max(0, s - 1));
            addLog('[ROLE:ADMIN] PERIMETER — +2 mitigation, −1 stress.');
          } else {
            addLog('[ROLE:ADMIN] PERIMETER — +2 mitigation (релиф стресса в коопе только у PM).');
          }
        }
        if (source === 'hand') setHand(prev => prev.filter((_, i) => i !== idx));
        addLog(`[SYSTEM] INFRA_DEPLOYED: ${card.name}`);
        turnPlaysRef.current.push(card.id);
        if (coopActive && coopRole === 'admin') {
          const tr = coopLinkedTrackRef.current;
          tr.adminInfra += 1;
          tr.adminInfraIds.add(card.id);
          flushCoopLinkedObjectives();
        }
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
          case 'soft_coffee':
            setStress((s) => Math.max(0, s - 8));
            setMitigationBuffer((b) => Math.min(30, b + 3));
            addLog('[SOFT] COFFEE: -8 stress, +3 mitigation');
            break;
          case 'soft_ai_ask':
            setAiProgress((p) => Math.max(0, p - 4));
            setBugPoints((p) => Math.max(0, p - 2));
            addLog('[SOFT] AI_ASK: threat/bugs reduced, next intent clearer');
            break;
          case 'soft_focus':
            setCpu((c) => Math.min(cpuMax + 1, c + 1));
            setMitigationBuffer((b) => Math.min(30, b + 4));
            addLog('[SOFT] FOCUS: +1 CPU, +4 mitigation');
            break;
          case 'soft_pair_programming':
            setPlayerProgress((p) => Math.min(100, p + 8));
            setBugPoints((p) => Math.max(0, p - 2));
            addLog('[SOFT] PAIR_PROG: +8 project, -2 bugs');
            break;
          case 'soft_critical_thinking':
            setCpu((c) => Math.min(cpuMax + 1, c + 1));
            setMitigationBuffer((b) => Math.min(30, b + 3));
            addLog('[SOFT] CRIT_THINKING: +1 CPU, +3 mitigation');
            break;
          case 'soft_buffer_flush':
            setHand([]);
            drawCards(3);
            setStress((s) => Math.max(0, s - 4));
            addLog('[SOFT] BUFFER_FLUSH: redraw 3, -4 stress');
            break;
          case 'soft_recursive_logic':
            setMitigationBuffer((b) => Math.min(30, b + 6));
            setPlayerProgress((p) => Math.min(100, p + 5));
            addLog('[SOFT] RECURSIVE_THINK: +6 mitigation, +5 project');
            break;
          case 'soft_async_request':
            setCpu((c) => Math.min(cpuMax + 2, c + 1));
            setMitigationBuffer((b) => Math.min(30, b + 2));
            addLog('[SOFT] ASYNC_AWAIT: +1 CPU, +2 mitigation');
            break;
          case 'soft_throw_ex':
            setAiProgress((p) => Math.max(0, p - 8));
            setBugPoints((p) => Math.max(0, p - 5));
            setStress((s) => Math.min(100, s + 3));
            addLog('[SOFT] THROW_EX: threat/bugs cut, +3 stress');
            break;
          case 'soft_finally':
            setMitigationBuffer((b) => Math.min(30, b + 10));
            setStress((s) => Math.max(0, s - 6));
            addLog('[SOFT] FINALLY_BLOCK: +10 mitigation, -6 stress');
            break;
          case 'reward_divine_debug':
            setStress((s) => Math.max(0, s - 30));
            setBugPoints(0);
            setHand((h) => h.filter((x) => x.type !== 'STATUS'));
            addLog('[SOFT] DIVINE_DEBUG: -30 stress, bugs reset, status hand cleaned');
            break;
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
          case 'soft_agile_ceremony':
          case 'soft_daily_sync':
          case 'soft_retro_action':
          case 'soft_backlog_refine':
          case 'soft_sprint_goal':
            setPlayerProgress((p) => Math.min(100, p + 6));
            setStress((s) => Math.max(0, s - 3));
            setMitigationBuffer((b) => Math.min(30, b + 2));
            addLog('[SOFT] FLOW_SYNC: +6 project, -3 stress, +2 mitigation');
            break;
          case 'soft_pizza_party':
          case 'soft_team_health':
            setStress((s) => Math.max(0, s - 12));
            setMitigationBuffer((b) => Math.min(30, b + 4));
            addLog('[SOFT] MORALE_BOOST: -12 stress, +4 mitigation');
            break;
          case 'soft_scope_cut':
          case 'soft_release_train':
          case 'soft_risk_register':
          case 'soft_kpi_dashboard':
            setAiDeadline((d) => Math.min(20, d + 1));
            setAiProgress((p) => Math.max(0, p - 4));
            addLog('[SOFT] TIMEBOX_DEFENSE: +1 deadline, -4 threat');
            break;
          case 'soft_stakeholder_alignment':
          case 'soft_priority_matrix':
          case 'soft_unblock_channel':
            drawCards(2);
            setCpu((c) => Math.min(cpuMax + 2, c + 1));
            setStress((s) => Math.max(0, s - 2));
            addLog('[SOFT] TEAM_SYNC: draw +2, +1 CPU, -2 stress');
            break;
          case 'soft_dev_pairing':
            setPlayerProgress((p) => Math.min(100, p + 10));
            setCpu((c) => Math.min(cpuMax + 2, c + 1));
            addLog('[SOFT] DEV_PAIRING: +10 project, +1 CPU');
            break;
          case 'soft_qa_handoff':
            setBugPoints((p) => Math.max(0, p - 7));
            setMitigationBuffer((b) => Math.min(30, b + 3));
            addLog('[SOFT] QA_HANDOFF: bugs -7, +3 mitigation');
            break;
          case 'soft_ops_priority':
            setMitigationBuffer((b) => Math.min(30, b + 8));
            setAiProgress((p) => Math.max(0, p - 4));
            addLog('[SOFT] OPS_PRIORITY: +8 mitigation, threat -4');
            break;
          case 'soft_cross_team_sync':
            setPlayerProgress((p) => Math.min(100, p + 6));
            setBugPoints((p) => Math.max(0, p - 4));
            setStress((s) => Math.max(0, s - 5));
            addLog('[SOFT] CROSS_TEAM_SYNC: +6 project, bugs -4, stress -5');
            break;
          case 'soft_release_freeze':
            setAiProgress((p) => Math.max(0, p - 9));
            setAiDeadline((d) => Math.min(20, d + 1));
            setStress((s) => Math.max(0, s - 3));
            addLog('[SOFT] RELEASE_FREEZE: threat -9, +1 deadline, stress -3');
            break;
          case 'soft_support_rotation':
            drawCards(2);
            setStress((s) => Math.max(0, s - 8));
            setMitigationBuffer((b) => Math.min(30, b + 2));
            addLog('[SOFT] SUPPORT_ROTATION: draw +2, stress -8, +2 mitigation');
            break;
          case 'soft_crisis_room':
            setAiProgress((p) => Math.max(0, p - 10));
            setBugPoints((p) => Math.max(0, p - 6));
            setStress((s) => Math.max(0, s - 6));
            addLog('[SOFT] CRISIS_ROOM: threat -10, bugs -6, stress -6');
            break;
          case 'soft_business_case':
            setAiProgress((p) => Math.max(0, p - 7));
            setPlayerProgress((p) => Math.min(100, p + 5));
            addLog('[SOFT] BUSINESS_CASE: threat -7, project +5');
            break;
          case 'soft_hard_tradeoff':
            setPlayerProgress((p) => Math.min(100, p + 12));
            setBugPoints((p) => Math.max(0, p - 2));
            setStress((s) => Math.min(100, s + 5));
            addLog('[SOFT] HARD_TRADEOFF: +12 project, -2 bugs, +5 stress');
            break;
          case 'soft_wip_limit':
            setBugPoints((p) => Math.max(0, p - 5));
            setStress((s) => Math.max(0, s - 6));
            setMitigationBuffer((b) => Math.min(30, b + 3));
            addLog('[SOFT] WIP_LIMIT: bugs -5, stress -6, +3 mitigation');
            break;
          default:
            break;
        }
        if (coopActive && coopRole === 'pm') {
          const pmSyn = coopPmSoftSynergy(card.id, turnPlaysRef.current);
          if (pmSyn.threatCut > 0) setAiProgress((p) => Math.max(0, p - pmSyn.threatCut));
          if (pmSyn.stressRelief > 0 && stressReliefFromPlayerCards) {
            setStress((s) => Math.max(0, s - pmSyn.stressRelief));
          }
          if (pmSyn.log) addLog(pmSyn.log);
          setPlayerProgress((p) => Math.min(100, p + 3));
          setStress((s) => Math.max(0, s - 2));
          addLog('[ROLE:PM] STAKEHOLDER_BUFFER — +3% progress, −2 stress.');
          const tr = coopLinkedTrackRef.current;
          if (!coopUnified && currentPhase === 'ARCHITECTURE') tr.pmSoftArch += 1;
          else if (currentPhase === 'DEVELOPMENT') tr.pmSoftDevPlaced += 1;
          if (PM_RITUAL_SOFT_IDS.has(card.id)) tr.pmRitualSoft += 1;
          flushCoopLinkedObjectives();
        }
        turnPlaysRef.current.push(card.id);
        registerPlayDiversity(card);
        if (source === 'hand') setHand(prev => prev.filter((_, i) => i !== idx));
        addLog(`[SYSTEM] SOFT_SKILL_ATTACHED: ${card.name}`);
      }
      return;
    }

    if (!coopActive && currentPhase === 'VERIFICATION' && (card.type === 'SYNTAX' || card.type === 'FUNCTION')) {
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
      case 'infra_lb_round_robin':
        setCpuMax((prev) => prev + 1);
        setCpu((cur) => cur + 1);
        setAiProgress((p) => Math.max(0, p - 5));
        setMitigationBuffer((b) => Math.min(30, b + 4));
        break;
      case 'infra_lb_parallel':
        setRamMaxMb((prev) => prev + 1024);
        setBugPoints((p) => Math.max(0, p - 2));
        setMitigationBuffer((b) => Math.min(30, b + 4));
        setCpuMax((prev) => prev + 1);
        setCpu((cur) => cur + 1);
        break;
      case 'infra_kafka_bridge':
        setAiProgress((p) => Math.max(0, p - 4));
        setMitigationBuffer((b) => Math.min(30, b + 2));
        drawCards(1);
        break;
      case 'infra_actions_ci':
        setCpuMax(prev => prev + 1);
        setCpu(cur => cur + 1);
        setMitigationBuffer((b) => Math.min(30, b + 2));
        break;
      case 'infra_prometheus':
        setAiProgress((p) => Math.max(0, p - 5));
        setBugPoints((p) => Math.max(0, p - 2));
        break;
      case 'infra_basic_pod': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 512); break;
      case 'infra_h_scaling':
        setCpuMax(prev => prev + 1);
        setCpu(cur => cur + 1);
        setRamMaxMb(prev => prev + 1024);
        setStress((s) => Math.min(100, s + 2));
        break;
      case 'infra_edge_cache':
        setMitigationBuffer((b) => Math.min(30, b + 4));
        if (!coopActive) setStress((s) => Math.max(0, s - 3));
        break;
      case 'infra_safe_proxy':
        setMitigationBuffer((b) => Math.min(30, b + 6));
        if (!coopActive) setStress((s) => Math.max(0, s - 4));
        break;
      case 'infra_mesh_relay': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 512); break;
      case 'infra_orbital_uplink': setCpuMax(prev => prev + 1); setCpu(cur => cur + 1); setRamMaxMb(prev => prev + 2048); break;
      case 'infra_quarantine_vm':
        if (!coopActive) setStress((prev) => Math.max(0, prev - 8));
        setRamMaxMb((prev) => prev + 512);
        break;
      case 'infra_street_fusion':
        setCpuMax(prev => prev + 2);
        setCpu(cur => cur + 2);
        setStress((s) => Math.min(100, s + 3));
        break;
      case 'infra_docker': setRamMaxMb(prev => prev + 512); break;
      case 'infra_old_hw': setRamMaxMb(prev => prev + 512); break;
      case 'infra_redis':
        drawCards(2);
        setBugPoints((p) => Math.max(0, p - 1));
        break;
      case 'infra_cicd':
        setCpuMax(prev => prev + 2);
        setCpu(cur => cur + 2);
        break;
      case 'infra_s3_bucket': setRamMaxMb(prev => prev + 1536); break;
      case 'infra_raid_array':
        if (!coopActive) setStress((prev) => Math.max(0, prev - 20));
        break;
      case 'infra_postgres': setCpuMax(prev => prev + 2); setCpu(cur => cur + 2); break;
      case 'infra_k8s_cluster':
        setCpuMax(prev => prev + 3);
        setCpu(cur => cur + 3);
        setRamMaxMb(prev => prev + 4096);
        break;
      case 'infra_cdn_edge':
        setAiProgress((p) => Math.max(0, p - 4));
        setMitigationBuffer((b) => Math.min(30, b + 3));
        break;
      case 'infra_log_aggregator':
        setRamMaxMb(prev => prev + 512);
        drawCards(1);
        break;
      case 'infra_vpc_network':
        setCpuMax(prev => prev + 1);
        setCpu(cur => cur + 1);
        setMitigationBuffer((b) => Math.min(30, b + 10));
        break;
      case 'infra_db_cluster':
        setRamMaxMb((prev) => prev + 3072);
        if (!coopActive) setStress((s) => Math.max(0, s - 6));
        break;
      default: setCpuMax(prev => prev + 1); setCpu(cur => cur + 1);
    }
  };

  const executeCardOnSlot = (idx: number) => {
    if (!selectedCard || !isPlayerTurn) return;
    if (idx >= ramSlotsMax) { addLog('[ERROR] RAM_LOCKED'); return; }
    const { card } = selectedCard;
    const slot = runtimeRail[idx];
    if (!slot) {
      addLog('[ERROR] BUS_SLOT_MISSING — шина ещё расширяется, повторите ход.');
      return;
    }
    const looksLikePatchPre =
      (currentPhase === 'VERIFICATION' || coopActive) && (card.type === 'REACTION' || card.type === 'DEFENSIVE');
    if (stress >= STRESS_MAX && slot.type !== 'BUG_ERROR') {
      if (slot.type === 'EMPTY') {
        if (looksLikePatchPre) {
          addLog('[BURNOUT] Стресс 100%: нельзя ставить патч-заготовку — снимите стресс (PM·SOFT).');
          return;
        }
        addLog('[BURNOUT] Стресс 100%: нельзя класть код на шину — снимите стресс (PM·SOFT).');
        return;
      }
    }

    if (slot.type === 'BUG_ERROR') {
      const canDestroyIce =
        card.type === 'DEFENSIVE' ||
        card.type === 'REACTION' ||
        (card.type === 'SCRIPT' && (card.id === 'script_ping' || card.id === 'script_auth')) ||
        (coopActive && coopRole === 'pm' && card.type === 'SOFT');
      if (canDestroyIce) {
        const bugPayload = slot.content as BugAction;
        const outplay = isOutplayCounter(card, bugPayload.problemType);
        const newRail = [...runtimeRail];
        newRail[idx] = { type: 'EMPTY', content: null, integrity: 0 };
        setRuntimeRail(newRail);
        let bugCut = outplay ? 3 : 1;
        let threatCut = outplay ? 14 : 6;
        if (coopActive) {
          const ex = coopOutplayExtras(coopRole!, outplay);
          bugCut += ex.bugExtra;
          threatCut += ex.threatExtra;
        }
        setBugPoints((p) => Math.max(0, p - bugCut));
        setAiProgress((p) => Math.max(0, p - threatCut));
        setStress((s) => Math.max(0, s - (outplay ? 10 : 4)));
        if (coopActive && coopRole) {
          const syn = coopBugClearSynergy(coopRole, card.id, turnPlaysRef.current);
          if (syn.threatExtra > 0) {
            setAiProgress((p) => Math.max(0, p - syn.threatExtra));
            setMitigationBuffer((b) => Math.min(30, b + syn.mitigationExtra));
            if (syn.log) addLog(syn.log);
          }
        }
        turnPlaysRef.current.push(card.id);
        if (outplay) {
          addLog(`[OUTPLAY] Попадание в тип сбоя — угроза и стресс срезаны.`);
          setMitigationBuffer((b) => Math.min(30, b + 5));
          addLog('[GUARD] OUTPLAY reinforced mitigation (+5).');
        } else {
          addLog(`[PATCH] ${card.name} снял блокировку (слабее оптимального инструмента).`);
        }
        setClearedBugsThisTurn((n) => n + 1);
        if (coopActive && coopRole === 'qa') {
          const tr = coopLinkedTrackRef.current;
          tr.qaIceClears += 1;
          tr.qaBugCutSum += bugCut;
          flushCoopLinkedObjectives();
        }
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
    const looksLikePatch =
      (currentPhase === 'VERIFICATION' || coopActive) && (card.type === 'REACTION' || card.type === 'DEFENSIVE');
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
      turnPlaysRef.current.push(card.id);
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

    const laneBump = coopActive ? coopLaneCodeProgressBump(coopRole!) : 0;
    if (laneBump > 0 && (card.type === 'SYNTAX' || card.type === 'FUNCTION')) {
      setPlayerProgress((p) => Math.min(100, p + laneBump));
      addLog(`[ROLE:DEV] LANE_COMMIT +${laneBump}% progress.`);
    }

    // --- EXTENDED CHAIN SYNERGIES ---
    const prevSlot1 = idx > 0 ? runtimeRail[idx - 1] : null;
    if (prevSlot1?.type === 'PLAYER_CODE' && prevSlot1.content) {
      const prev1 = (prevSlot1.content as CombatCard).id;
      const prevSlot2 = idx > 1 ? runtimeRail[idx - 2] : null;
      const prev2 =
        prevSlot2?.type === 'PLAYER_CODE' && prevSlot2.content
          ? (prevSlot2.content as CombatCard).id
          : null;

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
          if (progressBonus > 0) {
            const pb = coopActive ? coopChainProgressBonus(coopRole!, progressBonus) : progressBonus;
            setPlayerProgress((p) => Math.min(100, p + pb));
          }
          if (stressRelief > 0 && stressReliefFromPlayerCards) {
            setStress((s) => Math.max(0, s - stressRelief));
          } else if (stressRelief > 0 && coopActive) {
            addLog('[CHAIN] Релиф стресса от цепочки отключён в коопе (только PM снимает стресс SOFT-картами).');
          }
        }
      }
    }

    // --- SPECIAL REACTION CARD EFFECTS ---
    if (card.id === 'react_emergency_flush') {
      setHand([]);
      drawCards(4);
      if (stressReliefFromPlayerCards) {
        setStress((s) => Math.max(0, s - 8));
        addLog('[FLUSH] BUFFER_EMERGENCY_FLUSHED. Hand cleared, −8 stress.');
      } else {
        addLog('[FLUSH] BUFFER_EMERGENCY_FLUSHED. Hand cleared (релиф стресса в коопе только у PM).');
      }
    }
    if (card.id === 'react_null_packet') {
      setRuntimeRail(prev => {
        const next = [...prev];
        const bugIdx = next.findIndex(s => s.type === 'BUG_ERROR');
        if (bugIdx !== -1) {
          next[bugIdx] = { type: 'EMPTY', content: null, integrity: 0 };
          addLog('[NULL_PACKET] BUG_ERROR_NEUTRALIZED.');
          if (coopActive && coopRole === 'qa') {
            setBugPoints((p) => Math.max(0, p - 1));
            addLog('[ROLE:QA] TRIAGE — доп. −1 к счётчику багов.');
            const tr = coopLinkedTrackRef.current;
            tr.qaIceClears += 1;
            tr.qaBugCutSum += 1;
            queueMicrotask(() => flushCoopLinkedObjectives());
          }
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

    turnPlaysRef.current.push(card.id);

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
    const baseThreatDelta =
      skillMode === 'script-kiddie'
        ? Math.max(1, Math.floor(nextBugAction.progressPoints * 0.75))
        : nextBugAction.progressPoints;
    const verificationThreatMult =
      skillMode === 'script-kiddie' ? 1.25 : coopActive ? 1.44 : 1.35;
    const aiPressureAsVerify =
      currentPhase === 'VERIFICATION' || (coopUnified && currentPhase === 'DEVELOPMENT');
    const threatDelta = aiPressureAsVerify
      ? Math.max(2, Math.floor(baseThreatDelta * verificationThreatMult))
      : baseThreatDelta;
    const bugDelta = nextBugAction.bugPoints;
    const rawDamage = Math.floor(nextBugAction.damage * (1 + (tier - 1) * 0.25));
    const stressDelta =
      nextBugAction.damage > 0
        ? (skillMode === 'script-kiddie' ? Math.max(1, Math.floor(rawDamage * 0.65)) : rawDamage)
        : 0;
    let effThreat = threatDelta;
    let effBugs = bugDelta;
    let effStress = stressDelta;
    if (coopActive) {
      const adj = coopAdjustAiDeltas(coopRole!, effThreat, effBugs, effStress);
      effThreat = adj.threatDelta;
      effBugs = adj.bugDelta;
      effStress = adj.stressDelta;
    }
    effStress = Math.max(0, Math.floor(effStress * 1.14));
    setAiProgress((prev) => {
      const n = Math.min(100, prev + effThreat);
      if (n >= 100 && prev < 100) {
        queueMicrotask(() => {
          addLog('[CRITICAL] THREAT_MAX — снимай баги; сильный контрплей режет угрозу.');
          setStress((s) => Math.min(STRESS_MAX, s + 12));
        });
      }
      return n;
    });
    setBugPoints(prev => prev + effBugs);
    if (nextBugAction.spawnId) {
      setRuntimeRail((prev) => {
        const next = [...prev];
        const cap = Math.min(ramSlotsMax, next.length);
        const empty = next.findIndex((s, i) => s && s.type === 'EMPTY' && i < cap);
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
      const absorbed = Math.min(mitigationBuffer, effStress);
      const dmgAfterAbsorb = Math.max(0, effStress - absorbed);
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
    if (
      aiPressureAsVerify &&
      effThreat === 0 &&
      effBugs === 0 &&
      effStress === 0 &&
      !nextBugAction.spawnId &&
      !nextBugAction.injectStatusId
    ) {
      const passiveThreat = coopActive ? 6 : 5;
      setAiProgress((p) => Math.min(100, p + passiveThreat));
      addLog(`[AI] PASSIVE_SCAN: +${passiveThreat}% THREAT (verification pressure).`);
    }
    addLog(`[AI] ${nextBugAction.name} | threat +${effThreat}% | bugs +${effBugs}${effStress > 0 ? ` | stress +${effStress}` : ''}`);
    setLastAiAction(nextBugAction);
    setLastAiImpact({
      stressDelta: effStress,
      threatDelta: effThreat,
      bugDelta: effBugs,
      statusInjected: nextBugAction.injectStatusId ?? null,
      ts: Date.now(),
    });
  };

  const advancePhase = () => {
    const rules = SDLC_PHASES[currentPhase];
    if (rules.nextPhaseId) {
      let targetPhase = rules.nextPhaseId;
      if (coopUnified && currentPhase === 'DEVELOPMENT' && targetPhase === 'VERIFICATION') {
        targetPhase = 'DEPLOYMENT';
        addLog('[PHASE] COOP_SPRINT: пропуск VERIFICATION — финальный деплой «приложения».');
      }
      setSelectedCard(null);
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
             const cap = Math.min(ramSlotsMax, next.length);
             for (let i = 0; i < cap && injected < injectionCount; i++) {
               const cell = next[i];
               if (cell && cell.type === 'EMPTY') {
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
             const cap = Math.min(ramSlotsMax, next.length);
             const emptyIdx = next.findIndex((s, idx) => s && s.type === 'EMPTY' && idx < cap);
             const targetIdx = emptyIdx !== -1 ? emptyIdx : Math.floor(Math.random() * cap);
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
        const drawN = Math.min(effectiveStartHandSize, stabQ.length);
        let nextHand = stabQ.slice(0, drawN);
        const nextDeck = stabQ.slice(drawN);
        const hasPlayableCounter = nextHand.some((c) => c.type === 'REACTION' || c.type === 'DEFENSIVE' || c.type === 'SOFT');
        if (!hasPlayableCounter) {
          const emergencyIds = ['react_unit_test', 'react_firewall_patch', 'def_validator', 'react_trace_jam'];
          const emergencyCards = emergencyIds
            .map((id) => getCardById(id))
            .filter((c): c is CombatCard => Boolean(c))
            .slice(0, 2);
          nextHand = [...emergencyCards, ...nextHand].slice(0, effectiveStartHandSize);
          addLog('[SYSTEM] EMERGENCY_COUNTER_KIT loaded for VERIFICATION.');
        }
        setHand(nextHand);
        setDeck(nextDeck);
        addLog(`[SYSTEM] STABILIZATION_DRAW: ${nextHand.length} cards (react / soft / status)`);
        if (enemy) {
          setNextBugAction(
            pickNextBugAction(enemy, aiRecentRef.current, {
              phase: 'VERIFICATION',
              bugPressure: runtimeRail.filter((s) => s.type === 'BUG_ERROR').length,
              playerProgress,
            })
          );
        }
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
    const tracerCardCap = coopSupportComboTempo
      ? skillMode === 'script-kiddie'
        ? 4
        : 3
      : skillMode === 'script-kiddie'
        ? 3
        : 2;
    if (enemy?.personality === 'TRACER' && playedThisTurn > tracerCardCap) {
      setStress((s) => Math.min(STRESS_MAX, s + 22));
      addLog(`[TRACER] SIGNATURE_DETECTED! ${playedThisTurn} cards played. +22 stress penalty.`);
    }

    setCardsPlayedThisTurn(0);
    setClearedBugsThisTurn(0);
    const stallAsStabilization =
      currentPhase === 'VERIFICATION' || (coopUnified && currentPhase === 'DEVELOPMENT');
    if ((currentPhase === 'DEVELOPMENT' || currentPhase === 'VERIFICATION') && playedThisTurn === 0) {
      const noPlayableInVerification =
        stallAsStabilization &&
        !hand.some((c) => c.type === 'REACTION' || c.type === 'DEFENSIVE' || c.type === 'SOFT' || c.type === 'SCRIPT');
      if (noPlayableInVerification) {
        drawCards(2);
        addLog('[STALL] No playable counter cards. Auto-draw +2 for recovery.');
      } else {
        setIdleTurnStreak((n) => n + 1);
        const stallThreat = stallAsStabilization
          ? Math.min(14, 5 + idleTurnStreak * 3)
          : Math.min(16, 6 + idleTurnStreak * 3);
        const stallStress = stallAsStabilization
          ? Math.min(7, 2 + idleTurnStreak)
          : Math.min(12, 3 + idleTurnStreak * 2);
        setAiProgress((p) => Math.min(100, p + stallThreat));
        setStress((s) => Math.min(100, s + stallStress));
        addLog(`[STALL] Idle turn penalty: +${stallThreat}% threat, +${stallStress} stress.`);
      }
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
    if (
      enemy?.personality === 'AUDITOR' &&
      (currentPhase === 'VERIFICATION' || (coopUnified && currentPhase === 'DEVELOPMENT'))
    ) {
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
          const cap = Math.min(ramSlotsMax, next.length);
          const emptyIdx = next.findIndex((s, i) => s && s.type === 'EMPTY' && i < cap);
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
      if (!nextBugAction && enemy && currentPhase !== 'ARCHITECTURE') {
        const fallbackAction = pickNextBugAction(
          enemy,
          aiRecentRef.current,
          bugIntentPickContext(
            phaseForCoopAiIntent(currentPhase, coopUnified),
            runtimeRail.filter((s) => s.type === 'BUG_ERROR').length,
            playerProgress,
            coopActive,
          ),
        );
        setNextBugAction(fallbackAction);
        addLog('[AI] NEXT_INTENT synchronized before execution.');
      }
      const executed = nextBugAction;
      setIsAiResolving(true);
      handleAiStep();
      if (enemy && executed && currentPhase !== 'ARCHITECTURE') {
        aiRecentRef.current = [...aiRecentRef.current, { id: executed.id, problemType: executed.problemType }].slice(-10);
      }
      setTimeout(() => {
        setIsAiResolving(false);
        if (
          coopActive &&
          coopRole &&
          coopSquadFill === 'synthetic_bots' &&
          currentPhase !== 'ARCHITECTURE'
        ) {
          const snap = combatCoopAssistRef.current;
          const assist = rollSyntheticSquadAssist({
            playerRole: coopRole,
            bugSlotsOnRail: snap.railBugCount,
            stress: snap.stress,
            infraFilledSlots: snap.infraFilled,
            playerProgress: snap.playerProgress,
          });
          assist.logs.forEach((line) => addLog(line));
          if (assist.bugDelta) setBugPoints((p) => Math.max(0, p + assist.bugDelta));
          if (assist.stressDelta) setStress((s) => Math.min(100, Math.max(0, s + assist.stressDelta)));
          if (assist.mitigationDelta)
            setMitigationBuffer((b) => Math.max(0, b + assist.mitigationDelta));
          if (assist.progressDelta)
            setPlayerProgress((p) => Math.min(100, Math.max(0, p + assist.progressDelta)));
        }
        const turnDrawN = coopSupportComboTempo
          ? hadCleanCounterplay
            ? 3
            : 2
          : hadCleanCounterplay
            ? 2
            : 1;
        setIsPlayerTurn(true); setCpu(cpuMax); drawCards(turnDrawN);
        if (coopSupportComboTempo) {
          if (hadCleanCounterplay) addLog('[TEMPO:COOP] Снятие бага — усиленное дро поддержки (+3).');
          else addLog('[TEMPO:COOP] Поддержка: +2 карт/ход (комбо QA/PM/Admin).');
        } else if (hadCleanCounterplay) {
          addLog('[TEMPO] Clean counterplay last turn: +1 extra draw.');
        }
        if (enemy) {
          setNextBugAction(
            pickNextBugAction(
              enemy,
              aiRecentRef.current,
              bugIntentPickContext(
                phaseForCoopAiIntent(currentPhase, coopUnified),
                runtimeRail.filter((s) => s.type === 'BUG_ERROR').length,
                playerProgress,
                coopActive,
              ),
            ),
          );
        }
        if (enemy?.visualType === 'DEVELOPER') {
          setAiDeadline(prev => {
            const clock = prev - 1;
            if (clock <= 0) setShowDefeat(true); else addLog(`[WARNING] SYSTEM_CLOCK: ${clock} CYCLES_LEFT`);
            return clock;
          });
        }
        
        const noise = skillMode === 'script-kiddie' ? 6 : 9;
        const noiseAdj = coopActive ? coopBackgroundNoise(coopRole!, noise) : noise;
        setStress((prev) => Math.min(STRESS_MAX, prev + noiseAdj));
        addLog(`[WARNING] BACKGROUND_NOISE: +${noiseAdj}% STRESS`);
        if (currentPhase === 'ARCHITECTURE') {
          // Admin в коопе не уходит с INFRA по таймеру — только COMPILE после заполнения слотов.
          if (coopActive && coopRole === 'admin') return;
          const nextTurn = planningTurn + 1;
          if (nextTurn >= 2) {
            setPlanningTurn(0);
            advancePhase();
          } else setPlanningTurn(nextTurn);
        }
      }, 800);
    }, 500);
  };

  const handleMulligan = () => {
    if (stress >= STRESS_MAX) {
      addLog('[BURNOUT] Mulligan недоступен при стрессе 100%.');
      return;
    }
    if (mulliganUsed || currentPhase !== 'ARCHITECTURE' || planningTurn > 0) return;
    addLog(`[SYSTEM] REDRAW_BUFFER_INITIATED...`);
    const oldHand = [...hand];
    const pooled = [...deck, ...oldHand];
    const newDeck =
      coopActive && coopRole === 'admin'
        ? sortInfraCardsForAdminSupply(pooled.filter(isInfraDrawCard))
        : pooled.sort(() => Math.random() - 0.5);
    setHand(newDeck.slice(0, effectiveStartHandSize));
    setDeck(newDeck.slice(effectiveStartHandSize));
    setMulliganUsed(true);
  };

  const handleOverclock = () => {
    if (!isPlayerTurn || stress >= 90) return;
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
      ramSlotsMax, filteredHand, codingPalette, scriptPool, isPipelineFull: runtimeRail.slice(0, ramSlotsMax).every((s) => s && s.type !== 'EMPTY'),
      coopLinkedObjectiveRows,
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

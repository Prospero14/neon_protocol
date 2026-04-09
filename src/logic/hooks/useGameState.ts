import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { parseSkillMode, SKILL_MODE_STORAGE_KEY, type SkillMode } from '../skillMode';
import { NPC_PRESENCE_CONFIGS, isNpcAvailableInPhase } from '../npcPresence';
import type { Trait } from '../traits';
import { MAP_NODES, type CombatPack, type MapNodeData } from '../mapData';
import { PROFESSIONS, getProfessionById, type Profession } from '../professions';
import type { CombatCard } from '../combatCards';
import { CARD_LIBRARY, getCardById } from '../combatCards';
import { SPRING_CARD_LIBRARY } from '../springCards';
import type { QuestState } from '../questEngine';
import { getTrackedQuest, acceptQuest, completeQuest, markQuestReady } from '../questEngine';
import { useAuth } from '../AuthContext';
import { canUnlockClass } from '../preClassProgression';
import { QUEST_LIBRARY, type QuestDefinition } from '../questData';
import { applyBitModifiers, baseQuestBits } from '../economy';
import { rollLoot } from '../lootTables';
import { ITEM_LIBRARY, getItemById, type GameItem } from '../items';
import type { NpcDayPhase } from '../npcPresence';


export type ViewType = 'CREATION' | 'HUB' | 'MAP' | 'COMBAT' | 'CHARACTER' | 'DECK_BUILDER' | 'REFERENCE' | 'FIXER_BAR' | 'QUEST_LOG' | 'INTEL';
export interface MessengerMessage {
  id: string;
  from: string;
  text: string;
  isSpam?: boolean;
}

export function initialMergedInventory(): CombatCard[] {
  const starterInventoryIds = [
    'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix',
    'script_ls', 'script_cat', 'script_auth', 'script_rm',
    'soft_coffee', 'soft_ai_ask',
    'infra_old_hw', 'infra_edge_cache',
    'react_unit_test', 'react_emergency_flush', 'react_trace_jam', 'react_firewall_patch', 'def_validator'
  ];
  return starterInventoryIds.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
}

export const buildTraineeDeck = (): CombatCard[] => {
  const starterIds = [
    // SCRIPT — основа кодинга
    'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix',
    'script_ls', 'script_cat', 'script_auth',
    // SOFT — мягкие скиллы
    'soft_coffee', 'soft_ai_ask',
    // INFRA — первое железо
    'infra_old_hw', 'infra_edge_cache',
    // REACTION / DEF — покрывают типы сбоя в combatCounterplay (тест, рефакторинг, flush, трасса)
    'react_unit_test',
    'react_emergency_flush',
    'react_trace_jam',
    'react_firewall_patch',
    'react_refactoring',
    'def_validator',
  ];
  return starterIds.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
};

const BASELINE_SCRIPT_IDS = [
  'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix',
  'script_ls', 'script_cat', 'script_auth', 'script_rm',
  'soft_coffee', 'soft_ai_ask', 'infra_old_hw', 'infra_edge_cache'
];

export const MISSION_STARTER_PACKS: Record<string, string[]> = {
  'default': [
    'script_ls', 'script_cat', 'script_ping', 'script_grep', 'script_wash_logs', 
    'script_sudo_fix', 'script_auth', 'script_rm', 'script_scp', 'infra_old_hw'
  ],
  'q_kiddo_start': [
    'script_ls', 'script_cat', 'script_ping', 'script_grep', 'script_wash_logs', 'script_auth', 'script_rm', 'infra_old_hw'
  ],
  'q_kiddo_first_bits': [
    'script_ls', 'script_cat', 'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix', 'script_scp', 'infra_edge_cache'
  ],
  'local_lan': [
    'script_ls', 'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix',
    'script_auth', 'script_rm'
  ],
  'job_board_bibi': [
    'script_ls', 'script_ping', 'script_auth', 'script_sudo_fix', 'script_ssh'
  ],
  'job_board_tekstil': [
    'script_ls', 'script_grep', 'script_wash_logs', 'script_cat', 'script_rm'
  ],
  'job_board_perovo': [
    'script_ls', 'script_grep', 'script_auth', 'script_sudo_fix', 'script_curl'
  ],
  'rat_invasion': ['script_ping', 'script_ssh', 'script_auth', 'script_grep', 'script_wash_logs'],
  'trainee_exam': ['script_ls', 'script_auth', 'script_ssh', 'script_curl', 'script_chmod', 'script_cron', 'script_nc', 'script_sudo_fix']
};

export const getStarterPackForQuest = (questId?: string): string[] => {
  if (!questId) return MISSION_STARTER_PACKS['default'];
  if (MISSION_STARTER_PACKS[questId]) return MISSION_STARTER_PACKS[questId];
  
  if (questId.startsWith('q_kiddo_start_')) return MISSION_STARTER_PACKS['q_kiddo_start'];
  if (questId.startsWith('q_kiddo_first_bits_')) return MISSION_STARTER_PACKS['q_kiddo_first_bits'];
  
  const match = Object.keys(MISSION_STARTER_PACKS).find(key => questId.includes(key));
  return match ? MISSION_STARTER_PACKS[match] : MISSION_STARTER_PACKS['default'];
};

export function useGameState() {
  const { user, isLoading, syncGameState, logout } = useAuth();
  const [skillMode, setSkillMode] = useState<SkillMode>(() => parseSkillMode(localStorage.getItem(SKILL_MODE_STORAGE_KEY)));
  const [userIp, setUserIp] = useState<string>('ОПРЕДЕЛЕНИЕ...');
  const hasLoadedInitialState = useRef(false);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(() => setUserIp('127.0.0.1 (VPN_ACTIVE)'));
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>('CREATION');
  const [lastView, setLastView] = useState<ViewType>('HUB');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('ID_НЕИЗВЕСТЕН');
  const [homeDistrict, setHomeDistrict] = useState<MapNodeData | null>(null);
  const [homeDistrictId, setHomeDistrictId] = useState<string>('altufyevo');
  const [activeDistrictId, setActiveDistrictId] = useState('altufyevo');
  const [viewMode, setViewMode] = useState<'CITY' | 'DISTRICT'>('DISTRICT');
  const [isCityMapUnlocked, setIsCityMapUnlocked] = useState(false);
  const [reputation, setReputation] = useState<Record<string, number>>({
    'GIGABANK': 0, 'TELECON': 0, 'KRYLOVO_CORP': 0, 'REGULATORS': 0, 'NULLPOINTERS': 0,
    'RUST_VALLEY': 0, 'SILICON_HEDGE': 0, 'BIOSYNDICATE': 0, 'REDUNDANTS': 0, 'NET_DRIVERS': 0
  });

  const [discoveredIntel] = useState<Record<string, string[]>>({});
  const [activeBarNode, setActiveBarNode] = useState<string | null>(null);
  const [activeCombatPack, setActiveCombatPack] = useState<CombatPack>('java_core');

  const [profession, setProfession] = useState<Profession>(getProfessionById('trainee') ?? PROFESSIONS[0]);
  const [classUnlocked, setClassUnlocked] = useState(false);
  const [maxStress, setMaxStress] = useState(100);
  const [ramPool, setRamPool] = useState(1);
  const [stress, setStress] = useState(0);
  const [bits, setBits] = useState(150);
  const [solvedTaskCounts, setSolvedTaskCounts] = useState<Record<string, number>>({
    'script-kiddie': 0, 'junior': 0, 'mid': 0, 'senior': 0
  });
  const [solvedChains, setSolvedChains] = useState<Array<{ taskId: string, name: string, chain: string[] }>>([]);

  const [deckCores, setDeckCores] = useState(1.0);
  const [deckRamMb, setDeckRamMb] = useState(512);
  const [maxImplantSlots] = useState(4);
  const [installedImplants, setInstalledImplants] = useState<Array<{ id: string, battlesLeft: number }>>([]);

  const [traits, setTraits] = useState<Trait[]>([]);
  const [inventory, setInventory] = useState<CombatCard[]>(() => initialMergedInventory());
  const [activeDeck, setActiveDeck] = useState<CombatCard[]>(() => buildTraineeDeck());
  const [loot, setLoot] = useState<GameItem[]>([]);
  const [questStates, setQuestStates] = useState<QuestState[]>([]);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [bitsFromQuests, setBitsFromQuests] = useState(0);
  const [worldDay, setWorldDay] = useState(1);
  const [dayTick, setDayTick] = useState(0);
  
  const [isPetrovichHomeUnlocked, setIsPetrovichHomeUnlocked] = useState(false);
  const [npcPresenceMap, setNpcPresenceMap] = useState<Record<string, 'HOME' | 'AWAY'>>({});
  const [nodeCooldowns, setNodeCooldowns] = useState<Record<string, number>>({});
  const [trustedNpcContacts, setTrustedNpcContacts] = useState<string[]>([]);
  const [messengerFeed, setMessengerFeed] = useState<MessengerMessage[]>([]);

  const inventoryUnique = useMemo(() => {
    const map = new Map<string, CombatCard>();
    inventory.forEach((c) => { if (!map.has(c.id)) map.set(c.id, c); });
    return [...map.values()];
  }, [inventory]);

  const [discoveredCardIds, setDiscoveredCardIds] = useState<Set<string>>(new Set(activeDeck.map((c) => c.id)));
  const discoverCard = (id: string) => setDiscoveredCardIds((prev) => new Set(prev).add(id));
  const dayPhase = useMemo<NpcDayPhase>(() => {
    if (dayTick <= 1) return 'morning';
    if (dayTick <= 3) return 'day';
    if (dayTick <= 5) return 'evening';
    return 'night';
  }, [dayTick]);

  const advanceTime = useCallback((steps: number = 1) => {
    if (steps <= 0) return;
    setDayTick((prevTick) => {
      const total = prevTick + steps;
      const daysPassed = Math.floor(total / 8);
      const nextTick = total % 8;
      if (daysPassed > 0) setWorldDay((d) => d + daysPassed);
      return nextTick;
    });
  }, []);

  // --- PROGRESSION LOGIC ---
  const playerLevel = useMemo(() => {
    const exploits = solvedChains.length;
    if (exploits >= 50) return 5;
    if (exploits >= 40) return 4;
    if (exploits >= 30) return 3;
    if (exploits >= 20) return 2;
    if (exploits >= 10) return 1;
    return 0;
  }, [solvedChains]);
  const playerGrade = useMemo(() => {
    // Grade is derived from the official Profession. Exam bossfights unlock these.
    if (profession.id === 'trainee') return 'Script-Kiddo';
    return profession.grade;
  }, [profession]);

  const onRewardItem = (itemId: string, amount: number = 1) => {
    const item = ITEM_LIBRARY.find((i: GameItem) => i.id === itemId);
    if (item) {
      setLoot(prev => {
        const newItems = Array(amount).fill(item);
        return [...prev, ...newItems];
      });
    }
  };

  const onRemoveItem = (itemId: string) => {
    setLoot(prev => {
      const idx = prev.findIndex(i => i.id === itemId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const onUseLootItem = useCallback((itemId: string) => {
    const def = getItemById(itemId);
    if (!def?.onUse?.length) return;
    let removed = false;
    setLoot((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      if (idx === -1) return prev;
      removed = true;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    if (!removed) return;
    for (const e of def.onUse) {
      if (e.kind === 'stress_relief') setStress((s) => Math.max(0, s - e.amount));
      if (e.kind === 'grant_bits') setBits((b) => b + e.amount);
      if (e.kind === 'raise_max_stress') setMaxStress((m) => m + e.amount);
    }
  }, []);

  const saveSolvedChain = (taskId: string, name: string, chain: string[]) => {
    setSolvedChains(prev => {
      // Don't duplicate exactly the same chain for the same task
      const exists = prev.some(c => c.taskId === taskId && c.chain.join(',') === chain.join(','));
      if (exists) return prev;
      const next = [{ taskId, name, chain }, ...prev].slice(0, 50);
      localStorage.setItem(`neon_exploit_db_${user?.id || 'anon'}`, JSON.stringify(next));
      return next;
    });
  };

  const grantCardById = (cardId: string) => {
    const card = getCardById(cardId);
    if (!card) return;
    setInventory((prev) => (prev.some((c) => c.id === cardId) ? prev : [...prev, card]));
    setActiveDeck((prev) => (prev.length < 30 && !prev.some((c) => c.id === cardId) ? [...prev, card] : prev));
    discoverCard(cardId);
  };

  const rollNpcPresence = useCallback(() => {
    const newMap: Record<string, 'HOME' | 'AWAY'> = {};
    Object.values(NPC_PRESENCE_CONFIGS).forEach(config => {
      if (!isNpcAvailableInPhase(config, dayPhase)) {
        newMap[config.npcId] = 'HOME';
        return;
      }
      newMap[config.npcId] = Math.random() < config.awayChance ? 'AWAY' : 'HOME';
    });
    setNpcPresenceMap(newMap);
  }, [dayPhase]);

  useEffect(() => {
    rollNpcPresence();
  }, [rollNpcPresence]);

  const syncGame = async () => {
    if (!user) return;
    const state = {
      stress, maxStress, bits, solvedTaskCounts,
      activeDeck: activeDeck.map(c => ({ id: c.id })),
      inventory: inventoryUnique.map(c => ({ id: c.id })),
      completedQuests: questStates,
      ramPool: ramPool,
      homeDistrictId: homeDistrictId,
      activeBarNode: activeBarNode,
      viewMode: viewMode,
      traits: traits,
      installedImplants: installedImplants,
      reputation: reputation,
      playerName: playerName,
      isCityMapUnlocked: isCityMapUnlocked,
      isPetrovichHomeUnlocked: isPetrovichHomeUnlocked,
      professionId: profession.id,
      classUnlocked: classUnlocked,
      deckCores: deckCores,
      deckRamMb: deckRamMb,
      discoveredCardIds: Array.from(discoveredCardIds),
      worldDay,
      dayTick
    };
    await syncGameState(state);
  };

  useEffect(() => {
    if (user && user.gameState && !hasLoadedInitialState.current) {
      const gs = user.gameState;
      hasLoadedInitialState.current = true;
      if (gs.stress !== undefined) setStress(gs.stress);
      if (gs.maxStress !== undefined) setMaxStress(gs.maxStress);
      if (gs.bits !== undefined) setBits(gs.bits);
      if (gs.solvedTaskCounts !== undefined) setSolvedTaskCounts(gs.solvedTaskCounts);
      if (gs.ramPool !== undefined) setRamPool(gs.ramPool);
      if (gs.homeDistrictId !== undefined) setHomeDistrictId(gs.homeDistrictId);
      
      if (gs.completedQuests) {
        setQuestStates(gs.completedQuests);
        if (gs.completedQuests.length > 0 && currentView === 'CREATION') {
          setCurrentView('HUB');
        }
      }

      if (gs.activeDistrictId) {
        setActiveDistrictId(gs.activeDistrictId);
      } else if (gs.homeDistrictId) {
        setActiveDistrictId(gs.homeDistrictId);
      }

      if (gs.activeDeck) {
        const fullDeck = gs.activeDeck.map((c: any) => CARD_LIBRARY.find(l => l.id === c.id)).filter(Boolean) as CombatCard[];
        if (fullDeck.length > 0) setActiveDeck(fullDeck);
      }
      if (gs.inventory) {
        const fullInv = gs.inventory.map((c: any) => CARD_LIBRARY.find(l => l.id === c.id)).filter(Boolean) as CombatCard[];
        if (fullInv.length > 0) {
          const migrated = [...fullInv];
          const has = new Set(migrated.map((c) => c.id));
          // Save migration: old profiles may contain only 2-3 script cards.
          BASELINE_SCRIPT_IDS.forEach((id) => {
            if (!has.has(id)) {
              const card = getCardById(id);
              if (card) migrated.push(card);
            }
          });
          setInventory(migrated);
        }
      }

      if (gs.activeBarNode) setActiveBarNode(gs.activeBarNode);
      if (gs.viewMode) setViewMode(gs.viewMode);
      if (gs.currentView && gs.currentView !== 'CREATION') {
        setCurrentView(gs.currentView);
      } else if (gs.homeDistrictId) {
        setCurrentView('HUB');
      }

      if (gs.traits) setTraits(gs.traits);
      if (gs.installedImplants) setInstalledImplants(gs.installedImplants);
      if (gs.reputation) setReputation(gs.reputation);
      if (gs.playerName && gs.playerName !== 'ID_НЕИЗВЕСТЕН') setPlayerName(gs.playerName);
      if (gs.isCityMapUnlocked !== undefined) setIsCityMapUnlocked(gs.isCityMapUnlocked);
      if (gs.isPetrovichHomeUnlocked !== undefined) setIsPetrovichHomeUnlocked(gs.isPetrovichHomeUnlocked);
      if (gs.classUnlocked !== undefined) setClassUnlocked(gs.classUnlocked);
      if (gs.professionId) {
        const prof = getProfessionById(gs.professionId);
        if (prof) setProfession(prof);
      }
      if (gs.deckCores !== undefined) setDeckCores(gs.deckCores);
      if (gs.deckRamMb !== undefined) setDeckRamMb(gs.deckRamMb);
      if (gs.discoveredCardIds) setDiscoveredCardIds(new Set(gs.discoveredCardIds));
      if (gs.worldDay !== undefined) setWorldDay(gs.worldDay);
      if (gs.dayTick !== undefined) setDayTick(gs.dayTick);
      // Load exploits
      const saved = localStorage.getItem(`neon_exploit_db_${user?.id || 'anon'}`);
      if (saved) setSolvedChains(JSON.parse(saved));
    }
  }, [user]);

  useEffect(() => {
    if (currentView !== 'CREATION') syncGame();
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem(SKILL_MODE_STORAGE_KEY, skillMode);
  }, [skillMode]);

  // AUTO-SYNC ON CRITICAL CHANGES
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentView !== 'CREATION') syncGame();
    }, 1500); // 1.5s debounce to prevent spamming
    return () => clearTimeout(timer);
  }, [bits, stress, questStates, traits, reputation, activeDeck, installedImplants, activeDistrictId, isCityMapUnlocked, worldDay, dayTick]);

  const rewardForQuest = (q: QuestDefinition) => {
    const base = baseQuestBits(q.tier, q.difficulty);
    const gain = applyBitModifiers(base, traits, !classUnlocked);
    const source = q.type === 'combat' ? 'combat' : q.type === 'delivery' ? 'terminal' : 'npc_contract';
    const item = rollLoot(source, q.tier, traits);
    setBits((prev) => prev + gain);
    setLoot((prev) => [item, ...prev].slice(0, 120));
    setCompletedQuestCount((c) => c + 1);
    setBitsFromQuests((b) => b + gain);
  };

  const calculateStartingReputation = (districtId: string) => {
    const initial: Record<string, number> = { 
      'GIGABANK': 0, 'TELECON': 0, 'KRYLOVO_CORP': 0, 'FEDERAL_OVERSIGHT': 0, 'NULLPOINTERS': 0,
      'RUST_VALLEY': 0, 'SILICON_HEDGE': 0, 'BIOSYNDICATE': 0, 'REDUNDANTS': 0, 'NET_DRIVERS': 0 
    };
    switch(districtId) {
      case 'altufyevo': initial['NULLPOINTERS'] = 20; break;
      case 'maryino': initial['FEDERAL_OVERSIGHT'] = 20; initial['NULLPOINTERS'] = 10; break;
      case 'chertanovo': initial['NULLPOINTERS'] = 25; break;
      case 'south_west': initial['SILICON_HEDGE'] = 25; break;
      case 'tekstilschiki': initial['REDUNDANTS'] = 25; break;
      case 'sokol': initial['KRYLOVO_CORP'] = 20; break;
      case 'izmailovo': initial['SILICON_HEDGE'] = 20; break;
      case 'bibirevo': initial['REDUNDANTS'] = 10; break;
      case 'teply_stan': initial['BIOSYNDICATE'] = 20; break;
      case 'perovo': initial['NET_DRIVERS'] = 20; break;
    }
    return initial;
  };

  const handleCreationComplete = (data: { name: string; district: MapNodeData; hobby: Trait; ambition?: Profession }) => {
    setPlayerName(data.name); 
    setHomeDistrict(data.district); 
    setHomeDistrictId(data.district.id);
    setActiveDistrictId(data.district.id); 
    setTraits([data.hobby]);
    
    const startRep = calculateStartingReputation(data.district.id);
    if (data.hobby.id === 'corporate_contact') { 
      startRep['GIGA_BANK'] += 15; 
      startRep['EU_SYNTAX'] += 15; 
    }
    setReputation(startRep);

    let initialMaxStress = 100, initialRam = 1.0; 
    
    if (data.district.id === 'bibirevo') { initialMaxStress += 10; }
    if (data.district.id === 'chertanovo') { initialRam += 0.5; initialMaxStress -= 15; }
    if (data.district.id === 'maryino') { initialMaxStress += 10; initialRam += 0.25; }
    if (data.district.id === 'south_west') { initialRam += 1.0; initialMaxStress += 10; }
    if (data.district.id === 'tekstilschiki') { initialMaxStress += 10; }
    if (data.district.id === 'sokol') { initialMaxStress += 10; }
    if (data.district.id === 'vdnkh') { initialMaxStress += 10; initialRam += 0.5; }
    if (data.district.id === 'academy') { initialMaxStress += 10; }
    
    if (data.hobby.id === 'hardware_hoarder') initialRam += 1.0;
    
    setMaxStress(initialMaxStress); 
    setStress(0); 
    setRamPool(initialRam);
    
    const starterDeck = buildTraineeDeck(); 
    setActiveDeck(starterDeck);
    starterDeck.forEach((c) => discoverCard(c.id));
    setQuestStates(prev => acceptQuest(prev, `q_kiddo_start_${data.district.id}`));
    setWorldDay(1);
    setDayTick(0);
    setCurrentView('HUB');
    syncGame();
  };

  const handleCompleteTalkQuest = (questId: string) => {
    const q = QUEST_LIBRARY.find((x) => x.id === questId);
    if (!q) return;
    setQuestStates((prev) => {
      const existing = prev.find(s => s.questId === questId);
      if (existing && existing.status === 'completed') return prev;
      
      let nextStates = completeQuest(prev, questId);
      
      // AUTO-PROGRESS TUTORIAL
      if (questId.startsWith('q_kiddo_start_')) {
        const dist = questId.replace('q_kiddo_start_', '');
        nextStates = acceptQuest(nextStates, `q_kiddo_first_bits_${dist}`);
      } else if (questId.startsWith('q_kiddo_first_bits_')) {
        const dist = questId.replace('q_kiddo_first_bits_', '');
        nextStates = acceptQuest(nextStates, `q_kiddo_metro_access_${dist}`);
      }
      
      return nextStates;
    });
    rewardForQuest(q);
    if (questId.startsWith('q_kiddo_start_')) {
      grantCardById('script_scp');
      grantCardById('infra_safe_proxy');
    }
    if (questId.startsWith('q_kiddo_first_bits_')) {
      grantCardById('script_ssh');
      grantCardById('infra_edge_cache');
    }
    if (questId.startsWith('q_kiddo_metro_access_')) {
      grantCardById('script_curl');
      grantCardById('script_chmod');
    }
    advanceTime(1);
  };

  const handleTravel = (nodeId: string, type: string, cost?: number) => {
    rollNpcPresence();
    
    if (cost && cost > 0) {
      if (bits >= cost) {
        setBits((prev) => prev - cost);
      } else {
        const token = loot.find(i => i.id === 'itm_taxi_token' || i.id === 'art_monya_taxi_pass');
        if (token) {
          onRemoveItem(token.id);
          setLoot(prev => [{ id: 'msg_taxi', name: 'TAXI_TOKEN_USED', description: 'Вы использовали жетон для оплаты проезда.' } as any, ...prev]);
        } else {
          setLoot(prev => [{ id: 'msg_no_bits', name: 'INSUFFICIENT_FUNDS', description: 'Недостаточно бит или жетонов для проезда.' } as any, ...prev]);
          return;
        }
      }
    }

    if (nodeId === 'UNLOCK_CITY') {
      setIsCityMapUnlocked(true);
      setViewMode('CITY');
      return;
    }

    const currentDistrictId = activeDistrictId;
    const targetDistrict = MAP_NODES.find((n) => n.id === nodeId);

    if (type === 'district' && targetDistrict) {
      const rep = targetDistrict.dominantFactionId ? (reputation[targetDistrict.dominantFactionId] || 0) : 0;
      if (targetDistrict.dominantFactionId && rep <= -30) {
        setLoot(prev => [{ id: 'msg_blocked', name: 'ДОСТУП ЗАБЛОКИРОВАН', description: `Репутация слишком низкая.` } as any, ...prev]);
        return;
      }
      setActiveDistrictId(nodeId);
      setViewMode('DISTRICT');
      setActiveCombatPack(targetDistrict.combatPack ?? 'java_core');
      advanceTime(1);
      return;
    }


    const nodeOwnerDistrict = targetDistrict || MAP_NODES.find(n => n.id === currentDistrictId);
    if (['npc', 'shop', 'terminal', 'bar', 'story', 'combat'].includes(type) && nodeOwnerDistrict?.dominantFactionId) {
      const rep = reputation[nodeOwnerDistrict.dominantFactionId] || 0;
      if (rep <= -50 && Math.random() < 0.3) {
        setActiveBarNode('punitive_squad');
        setCurrentView('COMBAT');
        return;
      }
    }

    if (type === 'combat') {
      const cd = nodeCooldowns[nodeId] || 0;
      if (Date.now() < cd) {
         setLoot(prev => [{ id: 'msg_blocked', name: 'СИСТЕМА НЕДОСТУПНА', description: 'Узел временно отключился после инцидента. Ожидайте автоматической перезагрузки подсети.' } as any, ...prev]);
         return;
      }
      setNodeCooldowns(prev => ({ ...prev, [nodeId]: Date.now() + 5 * 60 * 1000 }));

      setActiveBarNode(nodeId);
      setCurrentView('COMBAT');
      advanceTime(1);
      return;
    }

    if (['npc', 'shop', 'terminal', 'bar', 'story'].includes(type)) {
      if (type === 'npc') {
        const district = MAP_NODES.find((d) => d.id === activeDistrictId);
        const rep = district?.dominantFactionId ? (reputation[district.dominantFactionId] || 0) : 0;
        if (rep >= 15) {
          setTrustedNpcContacts((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId]));
          setMessengerFeed((prev) => [
            { id: `msg_contact_${Date.now()}`, from: nodeId, text: 'Канал закреплен. Можешь писать в мессенджер.', isSpam: false },
            ...prev,
          ].slice(0, 80));
        }
      }
      setActiveBarNode(nodeId);
      setCurrentView('FIXER_BAR');
      advanceTime(1);
      const tracked = getTrackedQuest(questStates);
      const trackedDef = tracked ? QUEST_LIBRARY.find((q) => q.id === tracked.questId) : undefined;
      if (tracked && tracked.status === 'active' && trackedDef && (trackedDef.type === 'delivery' || trackedDef.type === 'diagnostics' || trackedDef.type === 'talk')) {
        if (trackedDef.objectiveNodeId === nodeId) {
          setQuestStates((prev) => markQuestReady(prev, trackedDef.id));
        }
      }
    }
  };

  const preClassState = {
    classUnlocked,
    completedQuestCount,
    bitsEarnedFromQuests: bitsFromQuests,
    exploitsCount: solvedChains.length,
    tutorialCompleted: questStates.some((q) => q.questId === 'q_trainee_exam_practice' && q.status === 'completed'),
  };
  const canUnlockNow = canUnlockClass(preClassState);

  const sendMessengerPing = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const now = Date.now();
    const next: MessengerMessage[] = [
      { id: `msg_out_${now}`, from: 'YOU', text: clean, isSpam: false },
    ];
    if (trustedNpcContacts.length > 0) {
      const contact = trustedNpcContacts[Math.floor(Math.random() * trustedNpcContacts.length)];
      next.push({
        id: `msg_in_${now + 1}`,
        from: contact,
        text: 'Принял. Канал живой, держи синхронизацию и не теряй ритм.',
        isSpam: false,
      });
    }
    if (Math.random() < 0.8) {
      const spamPool = [
        '[SPAM] BUY_FAST_CERT: junior in 24h',
        '[SPAM] crypto-airdrop://void_wallet_sync',
        '[SPAM] HOTFIX_MARKET: дешевые импланты без гарантии',
      ];
      next.push({
        id: `msg_spam_${now + 2}`,
        from: 'SPAM_BOT',
        text: spamPool[Math.floor(Math.random() * spamPool.length)],
        isSpam: true,
      });
    }
    setMessengerFeed((prev) => [...next, ...prev].slice(0, 80));
  };

  const trackedState = getTrackedQuest(questStates);
  const trackedQuest = QUEST_LIBRARY.find((q) => q.id === trackedState?.questId);
  const objectiveNodeId = trackedQuest?.objectiveNodeId || null;

  return {
    user, isLoading, logout,
    skillMode, setSkillMode, userIp,
    currentView, setCurrentView,
    lastView, setLastView,
    selectedDocId, setSelectedDocId,
    playerName, setPlayerName,
    homeDistrict, homeDistrictId,
    activeDistrictId, setActiveDistrictId,
    viewMode, setViewMode,
    isCityMapUnlocked, setIsCityMapUnlocked,
    reputation, setReputation,
    discoveredIntel,
    activeBarNode, setActiveBarNode,
    activeCombatPack, setActiveCombatPack,
    profession, setProfession,
    classUnlocked, setClassUnlocked,
    maxStress, setMaxStress,
    ramPool, setRamPool,
    stress, setStress,
    bits, setBits,
    worldDay, dayTick, dayPhase, advanceTime,
    solvedTaskCounts, setSolvedTaskCounts,
    solvedChains, saveSolvedChain,
    deckCores, setDeckCores,
    deckRamMb, setDeckRamMb,
    maxImplantSlots, installedImplants, setInstalledImplants,
    traits, setTraits,
    inventory, setInventory,
    inventoryUnique,
    activeDeck, setActiveDeck,
    loot, setLoot,
    questStates, setQuestStates,
    completedQuestCount, setCompletedQuestCount,
    bitsFromQuests, setBitsFromQuests,
    discoveredCardIds, setDiscoveredCardIds,
    isPetrovichHomeUnlocked, setIsPetrovichHomeUnlocked,
    npcPresenceMap, setNpcPresenceMap,
    trustedNpcContacts, messengerFeed, sendMessengerPing,
    playerLevel, playerGrade,
    handleCreationComplete, handleTravel, handleCompleteTalkQuest,
    discoverCard, canUnlockNow, objectiveNodeId,
    onRewardItem, onRemoveItem, onUseLootItem
  };
}

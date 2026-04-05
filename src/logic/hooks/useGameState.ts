import { useEffect, useMemo, useState } from 'react';
import { parseSkillMode, SKILL_MODE_STORAGE_KEY, type SkillMode } from '../skillMode';
import { NPC_PRESENCE_CONFIGS } from '../npcPresence';
import type { Trait } from '../traits';
import { MAP_NODES, type CombatPack, type MapNodeData } from '../mapData';
import { PROFESSIONS, getProfessionById, type Profession } from '../professions';
import type { CombatCard } from '../combatCards';
import { CARD_LIBRARY, getCardById } from '../combatCards';
import { SPRING_CARD_LIBRARY } from '../springCards';
import type { QuestState } from '../questEngine';
import { getTrackedQuest, acceptQuest, completeQuest, markQuestReady } from '../questEngine';
import { useAuth } from '../AuthContext';
import { canUnlockClass, PRECLASS_UNLOCK_BITS, PRECLASS_UNLOCK_QUESTS } from '../preClassProgression';
import { QUEST_LIBRARY, type QuestDefinition } from '../questData';
import { applyBitModifiers, baseQuestBits } from '../economy';
import { rollLoot } from '../lootTables';
import type { GameItem } from '../items';
import { IMPLANT_CATALOG } from '../hardware';

export type ViewType = 'CREATION' | 'HUB' | 'MAP' | 'COMBAT' | 'CHARACTER' | 'DECK_BUILDER' | 'REFERENCE' | 'FIXER_BAR' | 'QUEST_LOG' | 'INTEL';

export function initialMergedInventory(): CombatCard[] {
  const byId = new Map<string, CombatCard>();
  CARD_LIBRARY.forEach((c) => byId.set(c.id, c));
  SPRING_CARD_LIBRARY.forEach((c) => byId.set(c.id, c));
  return [...byId.values()];
}

export const buildTraineeDeck = (): CombatCard[] => {
  const starterIds = [
    'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix',
    'script_ls', 'script_cat', 'script_auth',
    'soft_coffee', 'soft_ai_ask', 'infra_old_hw'
  ];
  return starterIds.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
};

export const MISSION_STARTER_PACKS: Record<string, string[]> = {
  'default': ['script_ls', 'script_cat', 'script_ping', 'script_grep', 'script_wash_logs'],
  'q_kiddo_start': ['script_ls', 'script_cat', 'script_ping'],
  'q_kiddo_first_bits': ['script_ls', 'script_cat', 'script_ping', 'script_grep', 'script_wash_logs'],
  'local_lan': ['script_ls', 'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix'],
  'job_board_bibi': ['script_ls', 'script_ping', 'script_auth', 'script_sudo_fix'],
  'job_board_tekstil': ['script_ls', 'script_grep', 'script_wash_logs', 'script_cat'],
  'job_board_perovo': ['script_ls', 'script_grep', 'script_auth', 'script_sudo_fix'],
  'rat_invasion': ['script_ping', 'script_ssh', 'script_auth', 'script_grep', 'script_wash_logs'],
  'trainee_exam': ['script_ls', 'script_auth', 'script_ssh', 'script_curl', 'script_chmod', 'script_cron', 'script_nc', 'script_sudo_fix']
};

export const getStarterPackForQuest = (questId?: string): string[] => {
  if (!questId) return MISSION_STARTER_PACKS['default'];
  if (MISSION_STARTER_PACKS[questId]) return MISSION_STARTER_PACKS[questId];
  const match = Object.keys(MISSION_STARTER_PACKS).find(key => questId.includes(key));
  return match ? MISSION_STARTER_PACKS[match] : MISSION_STARTER_PACKS['default'];
};

export function useGameState() {
  const { user, isLoading, syncGameState, logout } = useAuth();
  const [skillMode, setSkillMode] = useState<SkillMode>(() => parseSkillMode(localStorage.getItem(SKILL_MODE_STORAGE_KEY)));
  const [userIp, setUserIp] = useState<string>('ОПРЕДЕЛЕНИЕ...');

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
    'GIGABANK': 0, 'TELECON': 0, 'KRYLOVO_CORP': 0, 'FEDERAL_OVERSIGHT': 0, 'NULLPOINTERS': 0,
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
  
  const [isPetrovichHomeUnlocked, setIsPetrovichHomeUnlocked] = useState(false);
  const [npcPresenceMap, setNpcPresenceMap] = useState<Record<string, 'HOME' | 'AWAY'>>({});

  const inventoryUnique = useMemo(() => {
    const map = new Map<string, CombatCard>();
    inventory.forEach((c) => { if (!map.has(c.id)) map.set(c.id, c); });
    return [...map.values()];
  }, [inventory]);

  const [discoveredCardIds, setDiscoveredCardIds] = useState<Set<string>>(new Set(activeDeck.map((c) => c.id)));
  const discoverCard = (id: string) => setDiscoveredCardIds((prev) => new Set(prev).add(id));

  const rollNpcPresence = () => {
    const newMap: Record<string, 'HOME' | 'AWAY'> = {};
    Object.values(NPC_PRESENCE_CONFIGS).forEach(config => {
      newMap[config.npcId] = Math.random() < config.awayChance ? 'AWAY' : 'HOME';
    });
    setNpcPresenceMap(newMap);
  };

  const syncGame = async () => {
    if (!user) return;
    const state = {
      stress, maxStress, bits, solvedTaskCounts,
      activeDeck: activeDeck.map(c => ({ id: c.id })),
      inventory: inventoryUnique.map(c => ({ id: c.id })),
      completedQuests: questStates,
      ramPool: ramPool,
      homeDistrictId: homeDistrictId
    };
    await syncGameState(state);
  };

  useEffect(() => {
    if (user && user.gameState) {
      const gs = user.gameState;
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
    }
  }, [user]);

  useEffect(() => {
    if (currentView !== 'CREATION') syncGame();
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem(SKILL_MODE_STORAGE_KEY, skillMode);
  }, [skillMode]);

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
    setQuestStates(prev => acceptQuest(prev, 'q_kiddo_start'));
    setCurrentView('HUB');
  };

  const handleCompleteTalkQuest = (questId: string) => {
    const q = QUEST_LIBRARY.find((x) => x.id === questId);
    if (!q) return;
    setQuestStates((prev) => {
      const existing = prev.find(s => s.questId === questId);
      if (existing && existing.status === 'completed') return prev;
      return completeQuest(prev, questId);
    });
    rewardForQuest(q);
  };

  const handleTravel = (nodeId: string, type: string, cost?: number) => {
    rollNpcPresence();
    if (cost && bits < cost) return;

    const targetDistrict = MAP_NODES.find((n) => n.id === nodeId);
    if (type === 'district' && targetDistrict && targetDistrict.dominantFactionId) {
       const rep = reputation[targetDistrict.dominantFactionId] || 0;
       if (rep <= -30) {
         setLoot(prev => [{ id: 'msg_blocked', name: 'ДОСТУП ЗАБЛОКИРОВАН', description: `Ваша репутация у ${targetDistrict.dominantFactionId} слишком низкая.` } as any, ...prev]);
         return; 
       }
    }

    if (cost) setBits((prev) => prev - cost);
    if (nodeId === 'UNLOCK_CITY') { setIsCityMapUnlocked(true); setViewMode('CITY'); return; }
    const district = MAP_NODES.find((n) => n.id === nodeId);
    if (type === 'district' && district) { setActiveDistrictId(nodeId); setViewMode('DISTRICT'); setActiveCombatPack(district.combatPack ?? 'java_core'); return; }
    
    if (['npc', 'shop', 'terminal', 'bar', 'story', 'combat'].includes(type) && targetDistrict?.dominantFactionId) {
       const rep = reputation[targetDistrict.dominantFactionId] || 0;
       if (rep <= -50 && Math.random() < 0.3) {
         setActiveBarNode('punitive_squad'); 
         setCurrentView('COMBAT'); 
         return; 
       }
    }

    if (type === 'combat') {
      setActiveBarNode(nodeId); setCurrentView('COMBAT'); return;
    }
    if (['npc', 'shop', 'terminal', 'bar', 'story'].includes(type)) {
      setActiveBarNode(nodeId); setCurrentView('FIXER_BAR');
      const tracked = getTrackedQuest(questStates);
      const trackedDef = tracked ? QUEST_LIBRARY.find((q) => q.id === tracked.questId) : undefined;
      if (tracked && tracked.status === 'active' && trackedDef && (trackedDef.type === 'delivery' || trackedDef.type === 'diagnostics')) {
        if (trackedDef.objectiveNodeId === nodeId) {
          setQuestStates((prev) => markQuestReady(prev, trackedDef.id));
        }
      }
    }
  };

  const preClassState = { 
    classUnlocked, completedQuestCount, bitsEarnedFromQuests: bitsFromQuests,
    tutorialCompleted: questStates.some((q) => q.questId === 'q_trainee_exam_practice' && q.status === 'completed')
  };
  const canUnlockNow = canUnlockClass(preClassState);

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
    solvedTaskCounts, setSolvedTaskCounts,
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
    handleCreationComplete, handleTravel, handleCompleteTalkQuest,
    discoverCard, canUnlockNow, objectiveNodeId
  };
}

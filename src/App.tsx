import { useEffect, useMemo, useState } from 'react';
import { NPC_PRESENCE_CONFIGS } from './logic/npcPresence';
import './App.css';
import './combat-hud.css';
import type { Trait } from './logic/traits';
import { MAP_NODES, type CombatPack, type MapNodeData } from './logic/mapData';
import { PROFESSIONS, getProfessionById, type Profession } from './logic/professions';
import type { CombatCard } from './logic/combatCards';
import { CARD_LIBRARY, getCardById } from './logic/combatCards';
import { SPRING_CARD_LIBRARY } from './logic/springCards';
import { TZ_LIBRARY } from './logic/combatTasks';
import { SPRING_TZ_LIBRARY } from './logic/springTasks';
import {
  parseSkillMode,
  SKILL_MODE_STORAGE_KEY,
  type SkillMode,
} from './logic/skillMode';
import { QUEST_LIBRARY, type QuestDefinition } from './logic/questData';
import {
  acceptQuest, 
  completeQuest, 
  markQuestReady,
  getTrackedQuest,
  type QuestState 
} from './logic/questEngine';
import { applyBitModifiers, baseQuestBits } from './logic/economy';
import { canUnlockClass, PRECLASS_UNLOCK_BITS, PRECLASS_UNLOCK_QUESTS } from './logic/preClassProgression';
import { rollLoot } from './logic/lootTables';
import type { GameItem } from './logic/items';
import MapView from './components/MapView';
import CombatBridge from './components/games/CombatBridge';
import CharacterCreation from './components/CharacterCreation';
import CharacterScreen from './components/CharacterScreen';
import DeckBuilder from './components/DeckBuilder';
import Documentation from './components/Documentation';
import ResponsiveNav from './components/ResponsiveNav';
import FixerBarScene from './components/FixerBarScene';
import QuestLog from './components/QuestLog';
import IntelView from './components/IntelView';
import { 
  MapPin, User, Shield, Zap, Layout, ChevronRight, Award, Database, Globe
} from 'lucide-react';
// import GoalHUD from './components/GoalHUD'; // Removed per v0.0947 protocol cleanup
import { useAuth } from './logic/AuthContext';
import { AuthForm } from './components/AuthForm';
import { IMPLANT_CATALOG } from './logic/hardware';

type ViewType = 'CREATION' | 'HUB' | 'MAP' | 'COMBAT' | 'CHARACTER' | 'DECK_BUILDER' | 'REFERENCE' | 'FIXER_BAR' | 'QUEST_LOG' | 'INTEL';

function initialMergedInventory(): CombatCard[] {
  const byId = new Map<string, CombatCard>();
  CARD_LIBRARY.forEach((c) => byId.set(c.id, c));
  SPRING_CARD_LIBRARY.forEach((c) => byId.set(c.id, c));
  return [...byId.values()];
}

const buildTraineeDeck = (): CombatCard[] => {
  const starterIds = [
    'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix',
    'script_ls', 'script_cat', 'script_auth',
    'soft_coffee', 'soft_ai_ask', 'infra_old_hw'
  ];
  return starterIds.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
};

const MISSION_STARTER_PACKS: Record<string, string[]> = {
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

const getStarterPackForQuest = (questId?: string): string[] => {
  if (!questId) return MISSION_STARTER_PACKS['default'];
  if (MISSION_STARTER_PACKS[questId]) return MISSION_STARTER_PACKS[questId];
  const match = Object.keys(MISSION_STARTER_PACKS).find(key => questId.includes(key));
  return match ? MISSION_STARTER_PACKS[match] : MISSION_STARTER_PACKS['default'];
};

function App() {
  const { user, isLoading } = useAuth();
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

  const [discoveredIntel] = useState<Record<string, string[]>>({}); // factionId -> loreNodes[]



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

  // v0.10: Deck Power & Implants
  const [deckCores, setDeckCores] = useState(1.0);
  const [deckRamMb, setDeckRamMb] = useState(512);
  const [maxImplantSlots] = useState(4);
  const [installedImplants, setInstalledImplants] = useState<Array<{ id: string, battlesLeft: number }>>([]);

  const [traits, setTraits] = useState<Trait[]>([]);
  const [inventory, setInventory] = useState<CombatCard[]>(() => initialMergedInventory());
  const [activeDeck, setActiveDeck] = useState<CombatCard[]>(() => buildTraineeDeck());
  const [/* loot */, setLoot] = useState<GameItem[]>([]);
  const [questStates, setQuestStates] = useState<QuestState[]>([]);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [bitsFromQuests, setBitsFromQuests] = useState(0);
  
  // v0.10: NPC Presence System
  const [isPetrovichHomeUnlocked, setIsPetrovichHomeUnlocked] = useState(false);
  const [npcPresenceMap, setNpcPresenceMap] = useState<Record<string, 'HOME' | 'AWAY'>>({});

  const rollNpcPresence = () => {
    const newMap: Record<string, 'HOME' | 'AWAY'> = {};
    Object.values(NPC_PRESENCE_CONFIGS).forEach(config => {
      newMap[config.npcId] = Math.random() < config.awayChance ? 'AWAY' : 'HOME';
    });
    setNpcPresenceMap(newMap);
    console.log("[PRESENCE] Re-rolled NPC locations:", newMap);
  };

  const { syncGameState, logout } = useAuth();
  
  const syncGame = async () => {
    if (!user) return;
    const state = {
      stress, maxStress, bits, solvedTaskCounts,
      activeDeck: activeDeck.map(c => ({ id: c.id })),
      inventory: inventoryUnique.map(c => ({ id: c.id })),
      completedQuests: questStates,
      ramPool: ramPool
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

  const inventoryUnique = useMemo(() => {
    const map = new Map<string, CombatCard>();
    inventory.forEach((c) => { if (!map.has(c.id)) map.set(c.id, c); });
    return [...map.values()];
  }, [inventory]);

  const [discoveredCardIds, setDiscoveredCardIds] = useState<Set<string>>(new Set(activeDeck.map((c) => c.id)));
  const discoverCard = (id: string) => setDiscoveredCardIds((prev) => new Set(prev).add(id));

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



  const preClassState = { 
    classUnlocked, completedQuestCount, bitsEarnedFromQuests: bitsFromQuests,
    tutorialCompleted: questStates.some((q) => q.questId === 'q_trainee_exam_practice' && q.status === 'completed')
  };
  const canUnlockNow = canUnlockClass(preClassState);

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
    
    // Balanced District Bonuses (v0.13: Max +10 Stress Cap)
    if (data.district.id === 'altufyevo') { /* Only Discount handled via homeDistrictId */ }
    if (data.district.id === 'bibirevo') { initialMaxStress += 10; } // Balanced from +40
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

  const handleTravel = (nodeId: string, type: string, cost?: number) => {
    console.group(`[APP_NAV] Transition: ${nodeId} (${type})`);
    console.trace();
    rollNpcPresence(); // Re-roll locations on every primary transition
    if (cost && bits < cost) { console.warn("LOCKED: INSUFFICIENT_BITS"); console.groupEnd(); return; }

    // v0.095 Reputation Check: Blocking transitions at -30
    const targetDistrict = MAP_NODES.find((n) => n.id === nodeId);
    if (type === 'district' && targetDistrict && targetDistrict.dominantFactionId) {
       const rep = reputation[targetDistrict.dominantFactionId] || 0;
       if (rep <= -30) {
         setLoot(prev => [{ id: 'msg_blocked', name: 'ДОСТУП ЗАБЛОКИРОВАН', description: `Ваша репутация у ${targetDistrict.dominantFactionId} слишком низкая. Пути перекрыты.` } as any, ...prev]);
         return; 
       }
    }

    if (cost) setBits((prev) => prev - cost);
    if (nodeId === 'UNLOCK_CITY') { setIsCityMapUnlocked(true); setViewMode('CITY'); return; }
    const district = MAP_NODES.find((n) => n.id === nodeId);
    if (type === 'district' && district) { setActiveDistrictId(nodeId); setViewMode('DISTRICT'); setActiveCombatPack(district.combatPack ?? 'java_core'); return; }
    
    // v0.095: Punitive Combat chance at -50
    if (['npc', 'shop', 'terminal', 'bar', 'story', 'combat'].includes(type) && targetDistrict?.dominantFactionId) {
       const rep = reputation[targetDistrict.dominantFactionId] || 0;
       if (rep <= -50 && Math.random() < 0.3) {
         // Force combat with punitive squad
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

  const trackedState = getTrackedQuest(questStates);
  const trackedQuest = QUEST_LIBRARY.find((q) => q.id === trackedState?.questId);
  const objectiveNodeId = trackedQuest?.objectiveNodeId || null;

  const renderAppView = () => {
    if (currentView === 'CREATION') return <CharacterCreation skillMode={skillMode} setSkillMode={setSkillMode} userIp={userIp} faction={'INDEPENDENT_ANON'} onComplete={handleCreationComplete} />;
    
    const isHubView = !['CREATION', 'MAP', 'COMBAT', 'CHARACTER', 'DECK_BUILDER', 'REFERENCE', 'FIXER_BAR', 'QUEST_LOG'].includes(currentView);
    
    if (currentView === 'MAP') {
      const district = MAP_NODES.find((n) => n.id === activeDistrictId) ?? MAP_NODES[0];
      const filteredNodes = district.subNodes.filter(node => {
        // Hide Petrovich if his home isn't unlocked yet
        if (node.id === 'npc_petrovich' && !isPetrovichHomeUnlocked) return false;
        return true;
      });

      return <MapView 
        viewMode={viewMode} 
        activeDistrictId={activeDistrictId} 
        isCityMapUnlocked={isCityMapUnlocked} 
        onNodeSelect={handleTravel} 
        onBack={() => setCurrentView('HUB')} 
        onToggleView={() => setViewMode((prev) => (prev === 'CITY' ? 'DISTRICT' : 'CITY'))} 
        objectiveNodeId={objectiveNodeId} 
        playerBits={bits} 
        customSubNodes={filteredNodes} // MapView will need to handle this or App needs to override MAP_NODES
      />;
    }
    if (currentView === 'COMBAT') {
      const district = MAP_NODES.find((n) => n.id === activeDistrictId) ?? MAP_NODES[0];
      const taskLibrary = activeCombatPack === 'java_spring' ? SPRING_TZ_LIBRARY : TZ_LIBRARY;
      
      let effectiveRank: SkillMode = 'script-kiddie';
      if (classUnlocked) {
        if (profession.grade === 'Junior') effectiveRank = 'junior';
        else if (profession.grade === 'Middle') effectiveRank = 'mid';
        else if (profession.grade === 'Senior') effectiveRank = 'senior';
      }

      const tierTasks = taskLibrary.filter((t) => t.rank === effectiveRank);
      const safeLibrary = tierTasks.length > 0 ? tierTasks : taskLibrary;
      const idx = Math.floor(Math.random() * safeLibrary.length);
      let combatDeck = activeDeck;
      if (!classUnlocked) {
        const tracked = getTrackedQuest(questStates);
        const pack = getStarterPackForQuest(tracked?.questId);
        combatDeck = pack.map((id: string) => CARD_LIBRARY.find((c: CombatCard) => c.id === id) || null).filter((c: CombatCard | null): c is CombatCard => c !== null);
      }
      return <CombatBridge 
        skillMode={effectiveRank} 
        playerTraits={traits} 
        activeDeck={combatDeck} 
        taskLibrary={safeLibrary} 
        initialTaskIndex={idx} 
        tier={district.tier} 
        deckCores={deckCores} 
        deckRamMb={deckRamMb} 
        homeDistrictId={homeDistrictId}
        onDiscoverCard={discoverCard} 
        onViewChange={(v: any) => { if (typeof v === 'string') setCurrentView(v as ViewType); else { setCurrentView(v.view as ViewType); if (v.cardId) setSelectedDocId(v.cardId); } }} 
        onWin={(earned, rank) => {
        setBits((prev) => Math.max(0, prev + earned));
        if (earned > 0) {
          setSolvedTaskCounts(prev => ({ ...prev, [rank]: (prev[rank] || 0) + 1 }));
          // Adaptation logic
          setInstalledImplants(prev => prev.map(imp => ({ ...imp, battlesLeft: Math.max(0, imp.battlesLeft - 1) })));
        }
        const tracked = getTrackedQuest(questStates);
        const trackedDef = tracked ? QUEST_LIBRARY.find((q) => q.id === tracked.questId) : undefined;
        if (trackedDef && trackedDef.type === 'combat' && ( !trackedDef.objectiveNodeId || trackedDef.objectiveNodeId === activeBarNode) && earned > 0) { setQuestStates((prev) => markQuestReady(prev, trackedDef.id)); }
        setCurrentView('MAP'); setViewMode('DISTRICT');
      }} />;
    }
    if (currentView === 'FIXER_BAR') {
      const activeQuests = questStates.filter(s => s.status === 'active').map(s => s.questId);
      const readyQuests = questStates.filter(s => s.status === 'ready_to_turn_in').map(s => s.questId);
      const completedQuests = questStates.filter(s => s.status === 'completed').map(s => s.questId);

      return <FixerBarScene 
        locationId={activeBarNode || 'altufyevo'} 
        playerBits={bits} 
        playerTraits={traits} 
        playerReputation={reputation} 
        canUnlockNow={classUnlocked} 
        homeDistrictId={activeDistrictId}
        onPay={(amount: number) => setBits((b) => Math.max(0, b - amount))} 
        onRewardCard={(id: string) => { const card = getCardById(id); if (card) { setInventory((inv) => [...inv, card]); setActiveDeck((deck) => (deck.length < 10 && !deck.some((c) => c.id === id) ? [...deck, card] : deck)); discoverCard(id); } }} 
        onRewardTrait={(id: string) => { if (!traits.some((t) => t.id === id)) setTraits((prev) => [...prev, { id, name: id.toUpperCase(), type: 'GENERAL', category: 'SOCIAL', description: 'Получено у фикcера.' }]); }} 
        onRestoreHp={(amount: number) => setStress((prev) => Math.max(0, prev - amount))} 
        onAwardQuest={(questId: string) => { 
        if (questId === 'UNLOCK_PETROVICH_HOME') {
          setIsPetrovichHomeUnlocked(true);
          return;
        }
        const q = QUEST_LIBRARY.find(item => item.id === questId); 
        if (q) setQuestStates(prev => acceptQuest(prev, q.id)); 
      }} 
        playerLevel={classUnlocked ? 5 : 1} 
        inventory={inventory} 
        onRewardBits={(amount: number) => setBits(b => b + amount)} 
        activeQuestIds={activeQuests} 
        readyQuestIds={readyQuests}
        completedQuestIds={completedQuests}
        onCompleteQuest={handleCompleteTalkQuest}  
        onUnlockCity={() => { setIsCityMapUnlocked(true); setViewMode('CITY'); setCurrentView('MAP'); }} 
        onSetProfession={(profId: string) => { const prof = getProfessionById(profId); if (prof) { setProfession(prof); setClassUnlocked(true); } }} 
        onStartCombat={(combatId: string) => { setActiveBarNode(combatId); setCurrentView('COMBAT'); }} 
        onTravel={handleTravel} 
        onLeave={() => setCurrentView('MAP')} 
        npcPresenceMap={npcPresenceMap}
        isPetrovichHomeUnlocked={isPetrovichHomeUnlocked}
      />;
    }
    if (currentView === 'CHARACTER') return <CharacterScreen player={{ 
      name: playerName, 
      district: homeDistrict?.name || 'НЕИЗВЕСТНО', 
      profession, 
      hp: stress, 
      bits, 
      solvedTaskCounts, 
      traits, 
      classUnlocked, 
      completedQuestCount, 
      reputation, 
      maxStress, 
      deckCores, 
      deckRamMb, 
      installedImplants, 
      maxImplantSlots 
    }} questStates={questStates} allQuests={QUEST_LIBRARY} onBack={() => setCurrentView('HUB')} onLogout={logout} onUpgradeHardware={(cores: number, ram: number) => { 
      if (bits >= 500) { 
        setDeckCores(cores); 
        setDeckRamMb(ram);
        setBits(b => b - 500);
      }
    }} onInstallImplant={(id: string) => { 
      const imp = IMPLANT_CATALOG.find(i => i.id === id);
      if (imp && bits >= imp.cost && installedImplants.length < maxImplantSlots) {
        setInstalledImplants(prev => [...prev, { id, battlesLeft: 10 }]); 
        setBits(b => b - imp.cost);
      }
    }} />;
    if (currentView === 'DECK_BUILDER') return <DeckBuilder skillMode={skillMode} inventoryUnique={inventoryUnique} activeDeck={activeDeck} onUpdateDeck={setActiveDeck} onViewChange={(v, id) => { setLastView(currentView); setCurrentView(v); if (id) setSelectedDocId(id); }} />;
    if (currentView === 'REFERENCE') return <Documentation discoveredCardIds={new Set([...Array.from(discoveredCardIds), ...activeDeck.map((c) => c.id)])} initialEntryId={selectedDocId} onBack={() => { setCurrentView(lastView); setSelectedDocId(null); }} />;
    if (currentView === 'QUEST_LOG') return <QuestLog questStates={questStates} onBack={() => setCurrentView('HUB')} />;
    if (currentView === 'INTEL') return <IntelView reputation={reputation} discoveredIntel={discoveredIntel} onBack={() => setCurrentView('HUB')} />;

    if (!isHubView) return null; // Fallback for safety, though renderAppView usually returns earlier
    
    return (
      <div className="hub-v4-view animate-float">
        <header className="hub-header-v4">
          <div className="brand-box">
            <h1 className="neon-text glow-green">MOSCOW_ZERO <span className="mvp-tag">[NEURAL_PROTO_0.09]</span></h1>
            <div className="meta-line mono-text">
              <span className="meta-item"><MapPin size={12} /> {homeDistrict?.name.split(':')[0] || 'SAFE_HOUSE_04'}</span>
              <span className="meta-divider">|</span>
              <span className="meta-item"><User size={12} /> {playerName}</span>
            </div>
          </div>
          <div className="hub-top-stats">
            <div className="top-stat arctic-monolith">
              <div className="hub-stat-v4">
                <span className="stat-label">NEURAL_STRESS</span>
                <div className="stat-bar-v4 large">
                  <div className="stat-fill-v4 stress" style={{width: `${Math.min(100, Math.round((stress/maxStress)*100))}%`}}></div>
                  <span className="stat-value">{Math.min(100, Math.round((stress/maxStress)*100))}%</span>
                </div>
              </div>
              <div className="hub-stat-v4" title="МОЩНОСТЬ ДЕКИ (ЦПУ)">
                <span className="stat-label">DECK_POWER (CPU)</span>
                <div className="stat-bar-v4">
                  <div className="stat-fill-v4 cpu" style={{width: `100%`}}></div>
                  <span className="stat-value">{deckCores.toFixed(1)} CORES</span>
                </div>
              </div>
              <div className="hub-stat-v4" title="МОЩНОСТЬ ДЕКИ (RAM)">
                <span className="stat-label">RAM_CAPACITY</span>
                <div className="stat-bar-v4">
                  <div className="stat-fill-v4 ram" style={{width: `${(deckRamMb/8192)*100}%`}}></div>
                  <span className="stat-value">{deckRamMb >= 1024 ? `${(deckRamMb/1024).toFixed(1)} GiB` : `${deckRamMb} MiB`}</span>
                </div>
              </div>
              <div className="val pulse-amber">ƀ{bits}</div>
            </div>
          </div>
        </header>

        <div className="hub-grid-v4">
          <div className="hub-col identity">
            <div className="col-header mono-text"><Shield size={14} /> IDENTITY_MODULE</div>
            <div className="neon-panel interactive arctic-monolith stat-card-v4" onClick={() => setCurrentView('CHARACTER')}>
              <div className="card-inner">
                <div className="prof-tag">{classUnlocked ? profession.name : "SCRIPT-KIDDO"}</div>
                 <div className="main-stat-row">
                    <div className="avatar-mini"><User size={32} /></div>
                    <div className="hp-ring">
                       <div className="hp-val">{Math.round((stress/maxStress)*100)}%</div>
                       <div className="hp-label">STRESS_LEVEL</div>
                    </div>
                 </div>
                 <div className="progress-mini">
                    <div className="prog-labels">
                      <span>SOLVED_TASKS_SUMMARY</span>
                      <span className="gold">[{Object.values(solvedTaskCounts).reduce((a, b) => a + b, 0)}]</span>
                    </div>
                    <div className="task-mini-grid">
                       <div className="task-mini-item">KIDDIE: {solvedTaskCounts['script-kiddie']}</div>
                       <div className="task-mini-item">JUNIOR: {solvedTaskCounts['junior']}</div>
                       <div className="task-mini-item">MIDDLE: {solvedTaskCounts['mid']}</div>
                       <div className="task-mini-item">SENIOR: {solvedTaskCounts['senior']}</div>
                    </div>
                 </div>
              </div>
            </div>
            {!classUnlocked && (
              <div className="progression-gate neon-panel">
                <div className="gate-label">ТРЕБОВАНИЯ_КЛАССА:</div>
                <div className="gate-stats">
                  <span>MISSIONS: {completedQuestCount}/{PRECLASS_UNLOCK_QUESTS}</span>
                  <span>BITS_EARNED: {bitsFromQuests}/{PRECLASS_UNLOCK_BITS}</span>
                </div>
                {canUnlockNow && (
                   <button className="neon-border-btn glow-cyan pulse" onClick={() => { setActiveBarNode('npc_professor'); setCurrentView('FIXER_BAR'); }}>SET_SPECIALIZATION</button>
                )}
              </div>
            )}
          </div>

          <div className="hub-col operations">
             <div className="col-header mono-text"><Zap size={14} /> OPERATIONS_HUB</div>
             <div className="neon-panel interactive op-card map-lnk glow-cyan" onClick={() => setCurrentView('MAP')}>
                <div className="op-icon"><Layout size={32} /></div>
                <div className="op-text">
                   <div className="op-title">NEURAL_MAP</div>
                   <div className="op-sub">Navigate Moscow Grid</div>
                </div>
                <ChevronRight className="op-arrow" />
             </div>
             <div className="neon-panel interactive op-card deck-lnk" onClick={() => setCurrentView('DECK_BUILDER')}>
                <div className="op-icon"><Database size={32} /></div>
                <div className="op-text">
                   <div className="op-title">DECK_CONSTRUCTOR</div>
                   <div className="op-sub">{activeDeck.length}/30 Modules Loaded</div>
                </div>
                <ChevronRight className="op-arrow" />
             </div>
             <div className="neon-panel interactive op-card intel-lnk glow-amber" onClick={() => setCurrentView('INTEL')}>
                <div className="op-icon"><Globe size={32} /></div>
                <div className="op-text">
                   <div className="op-title">INTEL_FEED [ИНФОСВОДКА]</div>
                   <div className="op-sub">Faction Lore & Recognition</div>
                </div>
                <ChevronRight className="op-arrow" />
             </div>
          </div>

          <div className="hub-col intel">
             <div className="active-quest-preview neon-panel">
                <div className="intel-header">
                   <div className="intel-title">CONTRACT_BACKLOG</div>
                   <Award size={14} color="var(--neon-amber)" />
                </div>
                <div className="hub-backlog-list mono-text">
                   {questStates.length === 0 && <div className="q-none opacity-50">NO_DATA_FOUND</div>}
                   {questStates.filter(s => s.status !== 'completed').slice(-2).reverse().map(s => {
                     const q = QUEST_LIBRARY.find(x => x.id === s.questId);
                     return (
                       <div key={s.questId} className="backlog-entry active">
                          <div className="b-header">
                             <span className="b-status pulse-cyan">[АКТИВЕН]</span>
                             <span className="b-title">{q?.title.split(']')[1] || q?.title}</span>
                          </div>
                          <div className="b-body">{q?.description}</div>
                       </div>
                     );
                   })}
                   {questStates.filter(s => s.status === 'completed').length > 0 && questStates.filter(s => s.status === 'active').length === 0 && (
                     (() => {
                        const s = questStates.filter(s => s.status === 'completed').slice(-1)[0];
                        const q = QUEST_LIBRARY.find(x => x.id === s.questId);
                        return (
                          <div className="backlog-entry completed">
                             <div className="b-header">
                                <span className="b-status">[ГОТОВО]</span>
                                <span className="b-title">{q?.title.split(']')[1] || q?.title}</span>
                             </div>
                          </div>
                        );
                     })()
                   )}
                </div>
             </div>
             <div className="neon-panel interactive intel-card" style={{ marginTop: '15px' }} onClick={() => setCurrentView('REFERENCE')}>
                <div className="intel-header">
                   <div className="intel-title">DOCUMENTATION</div>
                   <div className="intel-count gold">{inventoryUnique.length}</div>
                </div>
                <p className="intel-desc mono-text">LIBRARIES_OPENED / ARCHED_CONCEPTS</p>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const hideNav = ['CREATION', 'FIXER_BAR', 'COMBAT'].includes(currentView);

  if (isLoading) return <div className="loading-screen mono-text">[ LOADING_NEURAL_BUS... ]</div>;
  if (!user) return <AuthForm />;

  return (
    <div className="app-root main-crt">
      {!hideNav && (
        <ResponsiveNav currentView={currentView} onViewChange={(v) => setCurrentView(v)} hp={stress} level={classUnlocked ? 5 : 1} maxStress={maxStress} onLogout={logout} />
      )}
      {/* [PROTOCOL_CLEANUP] GoalHUD removed as requested */}
      <main className={`view-container ${hideNav ? 'fullscreen' : ''}`}>
        {renderAppView()}
      </main>
      <style>{`
        .hub-backlog-list { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; max-height: 200px; overflow-y: auto; padding-right: 5px; }
        .backlog-entry { border-left: 2px solid var(--neon-cyan); padding-left: 10px; background: rgba(0,255,255,0.02); padding-bottom: 8px; }
        .backlog-entry.completed { border-color: var(--neon-green); opacity: 0.5; background: none; }
        .b-header { display: flex; gap: 8px; font-size: 0.75rem; font-weight: bold; margin-bottom: 4px; }
        .b-status { color: var(--neon-cyan); min-width: 60px; }
        .completed .b-status { color: var(--neon-green); }
        .b-title { color: #fff; }
        .b-body { font-size: 0.65rem; color: #aaa; line-height: 1.4; }
        .task-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 0.6rem; color: var(--neon-cyan); margin-top: 5px; opacity: 0.8; }
        .task-mini-item { border-left: 1px solid rgba(0,255,255,0.2); padding-left: 4px; }
      `}</style>
    </div>
  );
}

export default App;

import { useEffect, useMemo, useState } from 'react';
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
  getTrackedQuest,
  isQuestRelevantForNpc, 
  trackQuest, 
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
import { 
  MapPin, User, Shield, Zap, Layout, ChevronRight, Award, Database 
} from 'lucide-react';
import GoalHUD from './components/GoalHUD';

type ViewType = 'CREATION' | 'HUB' | 'MAP' | 'COMBAT' | 'CHARACTER' | 'DECK_BUILDER' | 'REFERENCE' | 'FIXER_BAR' | 'QUEST_LOG';

function initialMergedInventory(): CombatCard[] {
  const byId = new Map<string, CombatCard>();
  CARD_LIBRARY.forEach((c) => byId.set(c.id, c));
  SPRING_CARD_LIBRARY.forEach((c) => byId.set(c.id, c));
  return [...byId.values()];
}

const buildTraineeDeck = (): CombatCard[] => {
  const starterIds = [
    'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix',
    'soft_coffee', 'soft_ai_ask', 'infra_old_hw'
  ];
  return starterIds.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
};

function App() {
  const [skillMode, setSkillMode] = useState<SkillMode>(() => parseSkillMode(localStorage.getItem(SKILL_MODE_STORAGE_KEY)));
  const [userIp, setUserIp] = useState<string>('LOCATING...');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(() => setUserIp('127.0.0.1 (VPN_ACTIVE)'));
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>('CREATION');
  const [lastView, setLastView] = useState<ViewType>('HUB');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('ID_UNKNOWN');
  const [homeDistrict, setHomeDistrict] = useState<MapNodeData | null>(null);
  const [activeDistrictId, setActiveDistrictId] = useState('altufyevo');
  const [viewMode, setViewMode] = useState<'CITY' | 'DISTRICT'>('DISTRICT');
  const [isCityMapUnlocked, setIsCityMapUnlocked] = useState(false);
  const [reputation, setReputation] = useState<Record<string, number>>({
    'GIGA_BANK': 0,
    'NEO_KYOTO': 0,
    'VOSKHOD_OFFICE': 0,
    'EU_SYNTAX': 0,
    'ANARCHO_VOID': 0
  });

  const factionConflictGroups = {
    'GIGA_BANK': ['ANARCHO_VOID', 'EU_SYNTAX'],
    'NEO_KYOTO': ['EU_SYNTAX', 'VOSKHOD_OFFICE'],
    'VOSKHOD_OFFICE': ['ANARCHO_VOID', 'GIGA_BANK'],
    'EU_SYNTAX': ['NEO_KYOTO', 'GIGA_BANK'],
    'ANARCHO_VOID': ['GIGA_BANK', 'VOSKHOD_OFFICE']
  };

  const applyReputationChange = (factionId: string, amount: number) => {
    setReputation(prev => {
      const next = { ...prev };
      next[factionId] = (next[factionId] || 0) + amount;
      
      const rivals = factionConflictGroups[factionId as keyof typeof factionConflictGroups] || [];
      rivals.forEach(rivalId => {
        if (amount > 0) {
          next[rivalId] = Math.max(-100, (next[rivalId] || 0) - Math.floor(amount / 2));
        }
      });
      
      return next;
    });
  };

  const [activeBarNode, setActiveBarNode] = useState<string | null>(null);
  const [activeCombatPack, setActiveCombatPack] = useState<CombatPack>('java_core');

  const [profession, setProfession] = useState<Profession>(getProfessionById('trainee') ?? PROFESSIONS[0]);
  const [classUnlocked, setClassUnlocked] = useState(false);
  const [maxIntegrity, setMaxIntegrity] = useState(100);
  const [ramPool, setRamPool] = useState(3);
  const [hp, setHp] = useState(100);
  const [bits, setBits] = useState(150);
  const [xp, setXp] = useState(0);
  const [level] = useState(1);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [inventory, setInventory] = useState<CombatCard[]>(() => initialMergedInventory());
  const [activeDeck, setActiveDeck] = useState<CombatCard[]>(() => buildTraineeDeck());
  const [/* loot */, setLoot] = useState<GameItem[]>([]);
  const [questStates, setQuestStates] = useState<QuestState[]>([]);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [bitsFromQuests, setBitsFromQuests] = useState(0);

  useEffect(() => {
    localStorage.setItem(SKILL_MODE_STORAGE_KEY, skillMode);
  }, [skillMode]);

  const inventoryUnique = useMemo(() => {
    const map = new Map<string, CombatCard>();
    inventory.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return [...map.values()];
  }, [inventory]);

  const [discoveredCardIds, setDiscoveredCardIds] = useState<Set<string>>(new Set(activeDeck.map((c) => c.id)));
  const discoverCard = (id: string) => {
    setDiscoveredCardIds((prev) => new Set(prev).add(id));
  };

  const getNpcQuests = (npcId: string) =>
    QUEST_LIBRARY.filter((q) => isQuestRelevantForNpc(q, npcId, !classUnlocked, questStates));

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
    classUnlocked, 
    completedQuestCount, 
    bitsEarnedFromQuests: bitsFromQuests,
    tutorialCompleted: questStates.some((q) => q.questId === 'q_trainee_exam_practice' && q.status === 'completed')
  };
  const canUnlockNow = canUnlockClass(preClassState);

  const handleTrackQuest = (questId: string) => {
    setQuestStates((prev) => trackQuest(prev, questId));
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
    console.log(`[QUEST_ENGINE] Quest ${questId} completed via dialogue/interaction.`);
  };

  const calculateStartingReputation = (districtId: string) => {
    const initial: Record<string, number> = {
      'GIGA_BANK': 0, 'NEO_KYOTO': 0, 'VOSKHOD_OFFICE': 0, 'EU_SYNTAX': 0, 'ANARCHO_VOID': 0
    };
    switch(districtId) {
      case 'vykhino': initial['GIGA_BANK'] = 20; break;
      case 'maryino': initial['VOSKHOD_OFFICE'] = 20; break;
      case 'chertanovo': initial['ANARCHO_VOID'] = 25; break;
      case 'south_west': initial['EU_SYNTAX'] = 25; break;
      case 'tekstilschiki': initial['VOSKHOD_OFFICE'] = 25; break;
      case 'sokol': initial['EU_SYNTAX'] = 15; initial['VOSKHOD_OFFICE'] = 15; break;
      case 'izmailovo': initial['NEO_KYOTO'] = 20; break;
      case 'bibirevo': initial['VOSKHOD_OFFICE'] = 10; break;
      case 'teply_stan': initial['ANARCHO_VOID'] = 10; break;
      case 'perovo': initial['NEO_KYOTO'] = 10; break;
    }
    return initial;
  };

  const handleCreationComplete = (data: { name: string; district: MapNodeData; hobby: Trait; ambition?: Profession }) => {
    setPlayerName(data.name);
    setHomeDistrict(data.district);
    setActiveDistrictId(data.district.id);
    setTraits([data.hobby]);
    
    // Initial Reputation based on Birth District
    const startRep = calculateStartingReputation(data.district.id);
    
    // Trait Bonus: Corporate Contact
    if (data.hobby.id === 'corporate_contact') {
      startRep['GIGA_BANK'] = (startRep['GIGA_BANK'] || 0) + 15;
      startRep['EU_SYNTAX'] = (startRep['EU_SYNTAX'] || 0) + 15;
    }

    setReputation(startRep);

    // Starting Stats from District/Trait
    let initialMaxIntegrity = 100;
    let initialRam = 3;

    // Apply District Stats (Hacky but matches current UI descriptions)
    if (data.district.id === 'maryino') { initialMaxIntegrity += 80; initialRam += 0.5; }
    if (data.district.id === 'bibirevo') { initialMaxIntegrity += 100; }
    if (data.district.id === 'chertanovo') { initialRam += 1; initialMaxIntegrity -= 20; }
    if (data.district.id === 'sokol') { initialMaxIntegrity += 150; }
    
    // Trait: Hardware Hoarder
    if (data.hobby.id === 'hardware_hoarder') {
       initialRam += 1; // +256 RAM internally
    }

    setMaxIntegrity(initialMaxIntegrity);
    setHp(initialMaxIntegrity); 
    setRamPool(initialRam);

    const starterDeck = buildTraineeDeck();
    setActiveDeck(starterDeck);
    starterDeck.forEach((c) => discoverCard(c.id));
    setCurrentView('HUB');
  };

  const handleAwardQuest = (questId: string) => {
    if (!questStates.some((qs) => qs.questId === questId)) {
      setQuestStates((prev) => acceptQuest(prev, questId));
    }
  };

  const handleTravel = (nodeId: string, type: string, cost?: number) => {
    if (cost && bits < cost) return;
    if (cost) setBits((prev) => prev - cost);
    if (nodeId === 'UNLOCK_CITY') {
      setIsCityMapUnlocked(true);
      setViewMode('CITY');
      return;
    }
    const district = MAP_NODES.find((n) => n.id === nodeId);
    if (type === 'district' && district) {
      setActiveDistrictId(nodeId);
      setViewMode('DISTRICT');
      setActiveCombatPack(district.combatPack ?? 'java_core');
      return;
    }
    if (type === 'combat') {
      setActiveBarNode(nodeId);
      setCurrentView('COMBAT');
      return;
    }
    if (type === 'npc' || type === 'shop' || type === 'terminal' || type === 'bar' || type === 'story') {
      setActiveBarNode(nodeId);
      setCurrentView('FIXER_BAR');

      // Auto-complete Talk/Inquiry Quests
      const tracked = getTrackedQuest(questStates);
      const trackedDef = tracked ? QUEST_LIBRARY.find((q) => q.id === tracked.questId) : undefined;
      if (tracked && tracked.status === 'active' && trackedDef && trackedDef.type === 'talk') {
        const isObjective = trackedDef.objectiveNodeId === nodeId;
        const isGiver = trackedDef.giverNpcId === nodeId && !trackedDef.objectiveNodeId;
        if (isObjective || isGiver) {
           console.log(`[QUEST_ENGINE] Auto-completing talk quest: ${trackedDef.id}`);
           handleCompleteTalkQuest(trackedDef.id);
        }
      }
    }
  };

  const handleMapAcceptQuest = (npcId: string, questId?: string) => {
    if (questId) {
      // Direct accept from Map
      setQuestStates(prev => acceptQuest(prev, questId));
      console.log(`[QUEST_ENGINE] Accepted quest ${questId} from MapView`);
    } else {
      // Just opening dialogue
      setActiveBarNode(npcId);
      setCurrentView('FIXER_BAR');
    }
  };

  const trackedState = getTrackedQuest(questStates);
  const trackedQuest = QUEST_LIBRARY.find((q) => q.id === trackedState?.questId);
  const objectiveNodeId = trackedQuest?.objectiveNodeId || null;

  const renderAppView = () => {
    if (currentView === 'CREATION') return (
      <CharacterCreation 
        skillMode={skillMode} 
        setSkillMode={setSkillMode} 
        userIp={userIp}
        faction={'INDEPENDENT_ANON'}
        onComplete={handleCreationComplete} 
      />
    );

    if (currentView === 'MAP') {
      return (
        <MapView
          viewMode={viewMode}
          activeDistrictId={activeDistrictId}
          isCityMapUnlocked={isCityMapUnlocked}
          onNodeSelect={handleTravel}
          onBack={() => setCurrentView('HUB')}
          onToggleView={() => setViewMode((prev) => (prev === 'CITY' ? 'DISTRICT' : 'CITY'))}
          getNpcQuests={getNpcQuests}
          questStates={questStates}
          onAcceptQuest={handleMapAcceptQuest}
          onTrackQuest={handleTrackQuest}
          onCompleteTalkQuest={handleCompleteTalkQuest}
          trackedQuestId={trackedState?.questId ?? null}
          objectiveNodeId={objectiveNodeId}
          playerBits={bits}
        />
      );
    }

    if (currentView === 'COMBAT') {
      const district = MAP_NODES.find((n) => n.id === activeDistrictId) ?? MAP_NODES[0];
      const taskLibrary = activeCombatPack === 'java_spring' ? SPRING_TZ_LIBRARY : TZ_LIBRARY;
      
      // NEW: Prioritize script-kiddie if no class, else filter by skillMode/tier
      const effectiveRank = !classUnlocked ? 'script-kiddie' : skillMode;
      const tierTasks = taskLibrary.filter((t) => t.rank === effectiveRank);
      
      const safeLibrary = tierTasks.length > 0 ? tierTasks : taskLibrary;
      const idx = Math.floor(Math.random() * safeLibrary.length);

      return (
        <CombatBridge
          skillMode={skillMode}
          playerTraits={traits}
          activeDeck={activeDeck}
          taskLibrary={safeLibrary}
          initialTaskIndex={idx}
          tier={district.tier}
          onDiscoverCard={discoverCard}
          onViewChange={(v: ViewType | { view: ViewType; cardId: string }) => {
            if (typeof v === 'string') setCurrentView(v);
            if (typeof v === 'object' && v?.view) {
              setCurrentView(v.view);
              if (v.cardId) setSelectedDocId(v.cardId);
            }
          }}
          onWin={(earned) => {
            setBits((prev) => Math.max(0, prev + earned));
            setXp((prev) => prev + (earned > 0 ? 45 : 10));
            const tracked = getTrackedQuest(questStates);
            const trackedDef = tracked ? QUEST_LIBRARY.find((q) => q.id === tracked.questId) : undefined;
            if (trackedDef && trackedDef.type === 'combat') {
              const objectiveOk = !trackedDef.objectiveNodeId || trackedDef.objectiveNodeId === activeBarNode;
              if (objectiveOk && earned > 0) {
                setQuestStates((prev) => completeQuest(prev, trackedDef.id));
                rewardForQuest(trackedDef);
              }
            }
            setCurrentView('MAP');
            setViewMode('DISTRICT');
          }}
        />
      );
    }

    if (currentView === 'FIXER_BAR') {
      return (
        <FixerBarScene
          locationId={activeBarNode || 'altufyevo'}
          playerBits={bits}
          playerTraits={traits}
          playerReputation={reputation}
          canUnlockNow={canUnlockNow}
          onRewardReputation={applyReputationChange}
          onPay={(amount) => setBits((b) => Math.max(0, b - amount))}
          onRewardCard={(id) => {
            const card = getCardById(id);
            if (!card) return;
            setInventory((inv) => [...inv, card]);
            setActiveDeck((deck) => (deck.length < 10 && !deck.some((c) => c.id === id) ? [...deck, card] : deck));
            discoverCard(id);
          }}
          onRewardTrait={(id) => {
            if (!traits.some((t) => t.id === id)) {
              setTraits((prev) => [...prev, { id, name: id.toUpperCase(), type: 'GENERAL', category: 'SOCIAL', description: 'Получено у фикcера.' }]);
            }
          }}
          onRewardBits={(amount) => setBits((prev) => prev + amount)}
          onRewardXp={(amount) => setXp((prev) => prev + amount)}
          onRestoreHp={(amount) => setHp((prev) => Math.min(100, prev + amount))}
          activeQuestIds={questStates.filter(s => s.status === 'active').map(s => s.questId)}
          onCompleteQuest={handleCompleteTalkQuest}
          onUnlockCity={() => {
            setIsCityMapUnlocked(true);
            setViewMode('CITY');
            setCurrentView('MAP');
          }}
          onSetProfession={(profId) => {
            const prof = getProfessionById(profId);
            if (prof) {
              setProfession(prof);
              setClassUnlocked(true);
            }
          }}
          onAwardQuest={handleAwardQuest}
          onStartCombat={(combatId) => {
            setActiveBarNode(combatId);
            setCurrentView('COMBAT');
          }}
          onLeave={() => setCurrentView('MAP')}
        />
      );
    }

    if (currentView === 'CHARACTER') {
      return (
        <CharacterScreen
          player={{ name: playerName, district: homeDistrict?.name || 'UNKNOWN', profession, hp, bits, xp, level, traits, classUnlocked, completedQuestCount, reputation }}
          questStates={questStates}
          allQuests={QUEST_LIBRARY}
          onBack={() => setCurrentView('HUB')}
        />
      );
    }

    if (currentView === 'DECK_BUILDER') {
      return (
        <DeckBuilder
          skillMode={skillMode}
          inventoryUnique={inventoryUnique}
          activeDeck={activeDeck}
          onUpdateDeck={setActiveDeck}
          onViewChange={(v, id) => {
            setLastView(currentView);
            setCurrentView(v);
            if (id) setSelectedDocId(id);
          }}
        />
      );
    }

    if (currentView === 'REFERENCE') {
      return (
        <Documentation
          skillMode={skillMode}
          discoveredCardIds={new Set([...Array.from(discoveredCardIds), ...activeDeck.map((c) => c.id)])}
          initialEntryId={selectedDocId}
          onBack={() => {
            setCurrentView(lastView);
            setSelectedDocId(null);
          }}
        />
      );
    }

    if (currentView === 'QUEST_LOG') {
      return (
        <QuestLog 
          questStates={questStates} 
          onBack={() => setCurrentView('HUB')} 
        />
      );
    }

    return (
      <div className="hub-v4-view animate-float">
        <header className="hub-header-v4">
          <div className="brand-box">
            <h1 className="neon-text glow-green">MOSCOW_ZERO <span className="mvp-tag">[PROTOTYPE_v0.09]</span></h1>
            <div className="meta-line mono-text">
              <span className="meta-item"><MapPin size={12} /> {homeDistrict?.name || 'SECURE_APARTMENT'}</span>
              <span className="meta-divider">|</span>
              <span className="meta-item"><User size={12} /> {playerName}</span>
            </div>
          </div>
          <div className="hub-top-stats">
            <div className="top-stat arctic-monolith">
                  <div className="hub-stat-v4 stress-priority">
                    <span className="stat-label">SYSTEM_STRESS [%]</span>
                    <div className="stat-bar-v4 large">
                      <div className="stat-fill-v4 stress" style={{width: `${Math.round((1 - hp/maxIntegrity)*100)}%`}}></div>
                      <span className="stat-value">{Math.round((1 - hp/maxIntegrity)*100)}%</span>
                    </div>
                  </div>
                  <div className="hub-stat-v4">
                    <span className="stat-label">CPU_CORES</span>
                    <div className="stat-bar-v4">
                      <div className="stat-fill-v4 cpu" style={{width: `100%`}}></div>
                      <span className="stat-value">1.0 Cores</span>
                    </div>
                  </div>
                  <div className="hub-stat-v4">
                    <span className="stat-label">NEURAL_RAM</span>
                    <div className="stat-bar-v4">
                      <div className="stat-fill-v4 ram" style={{width: `${(ramPool/8)*100}%`}}></div>
                      <span className="stat-value">{ramPool} UNITS</span>
                    </div>
                  </div>
               <span className="val pulse-amber">ƀ{bits}</span>
            </div>
          </div>
        </header>

        <div className="hub-grid-v4">
          {/* COLUMN 1: IDENTITY */}
          <div className="hub-col identity">
            <div className="col-header mono-text"><Shield size={14} /> IDENTITY_MODULE</div>
            <div className="neon-panel interactive arctic-monolith stat-card-v4" onClick={() => setCurrentView('CHARACTER')}>
              <div className="card-inner">
                <div className="prof-tag">{classUnlocked ? profession.name : "UNAUTHORIZED_USER"}</div>
                <div className="main-stat-row">
                   <div className="avatar-mini"><User size={32} /></div>
                   <div className="hp-ring">
                      <div className="hp-val">{hp}%</div>
                      <div className="hp-label">INTEGRITY</div>
                   </div>
                </div>
                <div className="progress-mini">
                   <div className="prog-labels"><span>XP_LEVEL_{level}</span> <span>{xp}u</span></div>
                   <div className="prog-bar"><div className="prog-fill" style={{width: `${(xp/(level*100))*100}%`}}></div></div>
                </div>
              </div>
            </div>
            
            {!classUnlocked && (
              <div className="progression-gate neon-panel">
                <div className="gate-label">CLASS_UNLOCK_REQ:</div>
                <div className="gate-stats">
                  <span>QUESTS: {completedQuestCount}/{PRECLASS_UNLOCK_QUESTS}</span>
                  <span>BITS: {bitsFromQuests}/{PRECLASS_UNLOCK_BITS}</span>
                </div>
                {canUnlockNow && (
                   <button className="neon-border-btn glow-cyan pulse" onClick={() => {
                     setActiveBarNode('npc_professor');
                     setCurrentView('FIXER_BAR');
                   }}>INITIATE_CLASS_SELECTION</button>
                )}
              </div>
            )}
          </div>

          {/* COLUMN 2: OPERATIONS */}
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
          </div>

          {/* COLUMN 3: INTEL */}
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
                             <span className="b-status pulse-cyan">[ACTIVE]</span>
                             <span className="b-title">{q?.title.split(']')[1] || q?.title}</span>
                          </div>
                          <div className="b-body">{q?.description}</div>
                       </div>
                     );
                   })}
                   {/* Show briefly last completed if no active */}
                   {questStates.filter(s => s.status === 'completed').length > 0 && questStates.filter(s => s.status === 'active').length === 0 && (
                     (() => {
                        const s = questStates.filter(s => s.status === 'completed').slice(-1)[0];
                        const q = QUEST_LIBRARY.find(x => x.id === s.questId);
                        return (
                          <div className="backlog-entry completed">
                             <div className="b-header">
                                <span className="b-status">[DONE]</span>
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
                   <div className="intel-count">{discoveredCardIds.size}</div>
                </div>
                <p className="intel-desc mono-text">Found concepts and library references.</p>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const hideNav = ['CREATION', 'FIXER_BAR', 'COMBAT'].includes(currentView);

  return (
    <div className="app-root main-crt">
      {!hideNav && <ResponsiveNav currentView={currentView} onViewChange={(v) => setCurrentView(v)} hp={hp} level={level} />}
      
      {/* Goal HUD Overlay - Hidden in focused scenes */}
      {trackedQuest && !hideNav && (
        <div style={{ position: 'fixed', top: '80px', left: '20px', zIndex: 1000, pointerEvents: 'none' }}>
          <GoalHUD 
            questName={trackedQuest.title}
            objectiveText={trackedQuest.description}
            hint={trackedQuest.objectiveNodeId ? `Цель: ${trackedQuest.objectiveNodeId}` : "Найдите контактное лицо в указанном районе."}
            progress={trackedState?.status === 'completed' ? 100 : 50}
          />
        </div>
      )}

      <main className={`view-container ${hideNav ? 'fullscreen' : ''}`}>
        {renderAppView()}
      </main>
      <style>{`
        .hub-backlog-list { 
          display: flex; 
          flex-direction: column; 
          gap: 12px; 
          margin-top: 10px;
          max-height: 200px;
          overflow-y: auto;
          padding-right: 5px;
        }
        .backlog-entry {
          border-left: 2px solid var(--neon-cyan);
          padding-left: 10px;
          background: rgba(0,255,255,0.02);
          padding-bottom: 8px;
        }
        .backlog-entry.completed {
          border-color: var(--neon-green);
          opacity: 0.5;
          background: none;
        }
        .b-header { display: flex; gap: 8px; font-size: 0.75rem; font-weight: bold; margin-bottom: 4px; }
        .b-status { color: var(--neon-cyan); min-width: 60px; }
        .completed .b-status { color: var(--neon-green); }
        .b-title { color: #fff; }
        .b-body { font-size: 0.65rem; color: #aaa; line-height: 1.4; }
      `}</style>
    </div>
  );
}

export default App;

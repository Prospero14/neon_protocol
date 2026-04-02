import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import './App.css';
import './combat-hud.css';

// Логика и Данные
import type { Trait } from './logic/traits';
import type { CombatPack, MapNodeData } from './logic/mapData';
import { MAP_NODES } from './logic/mapData';
import { PROFESSIONS, getProfessionById } from './logic/professions';
import type { Profession } from './logic/professions';

// Компоненты
import MapView from './components/MapView';
import CombatBridge from './components/games/CombatBridge';
import CharacterScreen from './components/CharacterScreen';
import DeckBuilder from './components/DeckBuilder';
import ResponsiveNav from './components/ResponsiveNav';
import Documentation from './components/Documentation';
import CharacterCreation from './components/CharacterCreation';
import FixerBarScene from './components/FixerBarScene';
import { AuthForm } from './components/AuthForm';

// Auth & Persistence
import { useAuth } from './logic/AuthContext';

// CCG Ресурсы
import type { CombatCard } from './logic/combatCards';
import { CARD_LIBRARY, getCardById } from './logic/combatCards';
import { TZ_LIBRARY } from './logic/combatTasks';
import { SPRING_CARD_LIBRARY } from './logic/springCards';
import { SPRING_TZ_LIBRARY } from './logic/springTasks';
import {
  DEFAULT_SKILL_MODE,
  parseSkillMode,
  SKILL_MODE_STORAGE_KEY,
  type SkillMode,
} from './logic/skillMode';

function initialMergedInventory(): CombatCard[] {
  const m = new Map<string, CombatCard>();
  CARD_LIBRARY.forEach((c) => m.set(c.id, c));
  SPRING_CARD_LIBRARY.forEach((c) => m.set(c.id, c));
  return [...m.values()];
}

/** Собираем стартовую колоду выживания для Трейни (Скрипты) */
const buildBeginnerDeck = (): CombatCard[] => {
  const scriptIds = ['script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix'];
  return scriptIds.map(id => getCardById(id)).filter(Boolean) as CombatCard[];
};

/** Собираем стартовый набор для выбранного класса */
const buildClassStarterPack = (profId: string): CombatCard[] => {
  let ids: string[] = [];
  if (profId === 'java_jun') ids = ['syntax_package', 'syntax_class_decl', 'syntax_main_method', 'syntax_if', 'fn_sysout_print'];
  else if (profId === 'python_jun') ids = ['syntax_if', 'syntax_foreach', 'fn_sysout_print', 'syntax_try_catch']; 
  else if (profId === 'kotlin_jun') ids = ['syntax_if', 'syntax_foreach', 'fn_sysout_print', 'syntax_try_catch', 'mid_stream_init'];
  else if (profId === 'go_jun') ids = ['syntax_if', 'fn_sysout_print', 'syntax_try_catch']; 
  else if (profId === 'js_jun') ids = ['syntax_if', 'fn_sysout_print', 'syntax_try_catch', 'react_state']; 
  
  return ids.map(id => getCardById(id)).filter(Boolean) as CombatCard[];
};

export interface Artifact {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const TOTAL_CARD_CONCEPTS = CARD_LIBRARY.length + SPRING_CARD_LIBRARY.length;

type ViewType =
  | 'AUTHENTICATION'
  | 'CREATION'
  | 'HUB'
  | 'MAP'
  | 'TAXI'
  | 'COFFEE'
  | 'COMBAT'
  | 'CHARACTER'
  | 'DECK_BUILDER'
  | 'REFERENCE'
  | 'DISTRICT_EXPLORE'
  | 'FIXER_BAR';

function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('HUB');
  const [lastView, setLastView] = useState<ViewType>('HUB');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const [playerName, setPlayerName] = useState('ID_UNKNOWN');
  const [homeDistrict, setHomeDistrict] = useState<MapNodeData | null>(null);
  const [profession, setProfession] = useState<Profession>(PROFESSIONS[0]);

  const [hp, setHp] = useState(100);
  const [bits, setBits] = useState(100);
  const [xp, setXp] = useState(0);
  const [level] = useState(1);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [inventory, setInventory] = useState<CombatCard[]>(() => initialMergedInventory());
  const [activeDeck, setActiveDeck] = useState<CombatCard[]>([]);
  
  const [activeCombatPack, setActiveCombatPack] = useState<CombatPack>('java_core');
  const [activeBarNode, setActiveBarNode] = useState<string | null>(null);
  const [isCombatBlockedByIce] = useState(false);

  // --- NEW WORLD STATE ---
  const [activeDistrictId, setActiveDistrictId] = useState<string>('altufyevo');
  const [viewMode, setViewMode] = useState<'CITY' | 'DISTRICT'>('DISTRICT');
  const [isCityMapUnlocked, setIsCityMapUnlocked] = useState(false);
  
  const [stress, setStress] = useState(0);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const inventoryUnique = useMemo(() => {
    const map = new Map<string, CombatCard>();
    inventory.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return [...map.values()];
  }, [inventory]);

  const [skillMode] = useState<SkillMode>(() => {
    if (typeof window === 'undefined') return DEFAULT_SKILL_MODE;
    return parseSkillMode(localStorage.getItem(SKILL_MODE_STORAGE_KEY));
  });

  console.log('SkillMode active:', skillMode);

  useEffect(() => {
    localStorage.setItem(SKILL_MODE_STORAGE_KEY, skillMode);
  }, [skillMode]);

  const [discoveredCardIds, setDiscoveredCardIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('neon_discovered_cards');
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setDiscoveredCardIds(new Set(ids));
      } catch (e) {
        console.error('Failed to parse discovered cards', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('neon_discovered_cards', JSON.stringify(Array.from(discoveredCardIds)));
  }, [discoveredCardIds]);

  const discoverCard = (id: string) => {
    if (!discoveredCardIds.has(id)) {
      setDiscoveredCardIds((prev) => new Set(prev).add(id));
    }
  };

  const { user, token, logout, syncGameState, isLoading: isAuthLoading } = useAuth();

  // Load state from User on Login
  useEffect(() => {
    if (user?.gameState) {
      const s = user.gameState;
      if (s.hp !== undefined) setHp(s.hp);
      if (s.bits !== undefined) setBits(s.bits);
      if (s.xp !== undefined) setXp(s.xp);
      if (s.activeDeck) {
        try {
          const deckIds = typeof s.activeDeck === 'string' ? JSON.parse(s.activeDeck) : s.activeDeck;
          const cards = deckIds.map((id: string) => getCardById(id)).filter(Boolean);
          setActiveDeck(cards);
        } catch (e) { console.error("Failed to load deck", e); }
      }
      if (s.inventory) {
        try {
          const invIds = typeof s.inventory === 'string' ? JSON.parse(s.inventory) : s.inventory;
          const cards = invIds.map((id: string) => getCardById(id)).filter(Boolean);
          if (cards.length > 0) setInventory(cards);
        } catch (e) { }
      }
      if (s.artifacts) {
        try {
          setArtifacts(typeof s.artifacts === 'string' ? JSON.parse(s.artifacts) : s.artifacts);
        } catch (e) { }
      }
    }
  }, [user]);

  // Sync state helper
  const triggerSync = (overrides = {}) => {
    if (!token) return;
    const currentState = {
      hp, bits, xp, level,
      activeDeck: activeDeck.map(c => c.id),
      inventory: inventory.map(c => c.id),
      artifacts,
      ...overrides
    };
    syncGameState(currentState);
  };

  const [bootHistory, setBootHistory] = useState<string[]>([]);
  const [loadingText, setLoadingText] = useState('AUTHENTICATING...');

  useEffect(() => {
    const messages = [
      'SCANNING_UPLINK...', 
      'ESTABLISHING_VPN_HANDSHAKE...', 
      'BYPASSING_MOSCOW_ZERO_FIREWALL...', 
      'DECRYPTING_NEURAL_STREAMS...', 
      'READY.'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length) {
        setBootHistory(prev => [...prev.slice(-3), messages[i]]);
        setLoadingText(messages[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    setIsBooted(false);
    setCurrentView('HUB');
  };

  const handleBoot = () => {
    setIsBooted(true);
    setCurrentView('CREATION');
  };

  const handleCreationComplete = (data: {
    name: string;
    district: MapNodeData;
    hobby: Trait;
    ambition?: Profession;
  }) => {
    setPlayerName(data.name);
    setHomeDistrict(data.district);
    // Force ENFORCE TRAINEE START
    const startProf = getProfessionById('trainee')!;
    setProfession(startProf);
    
    // START WITH SCRIPTS ONLY
    const starterDeck = buildBeginnerDeck();
    setActiveDeck(starterDeck);
    
    // SYNC TO INVENTORY
    setInventory(prev => {
      const combined = [...prev, ...starterDeck];
      const unique = new Map<string, CombatCard>();
      combined.forEach(c => unique.set(c.id, c));
      return Array.from(unique.values());
    });
    
    starterDeck.forEach(c => discoverCard(c.id));

    // Base Modifiers
    let startingHp = 100;
    let startingBits = data.hobby.id === 'hobby_retro_gaming' ? 200 : 100;
    let startingXp = data.hobby.id === 'hobby_blogging' ? 50 : 0;
    let starterTraits: Trait[] = [data.hobby];

    // District Buffs Modifiers - Arguments provided per lore/mechanics
    const dId = data.district.id;
    if (dId === 'kitay_gorod') {
      startingBits += 75; // Market Hub: High liquidity
    } else if (dId === 'vdnkh') {
      startingHp += 150; // Medical/Sanatorium ruins: Advanced biocare
    } else if (dId === 'preobrazhenka' || dId === 'preobrazhenskaya_ploshchad') {
      startingXp += 50; // History Archives: Core knowledge
    } else if (dId === 'oktyabrskoe_pole' || dId === 'oktiabrskoe_pole') {
      starterTraits.push({ id: 'buff_energy', name: 'Милитех Связи', type: 'GENERAL', category: 'TECH', description: '+1 Max Energy' });
    } else if (dId === 'komsomolskaya') {
      discoverCard('syntax_while_loop'); // Transport Hub: Faster iterations
    } else if (dId === 'tushino') {
      startingHp += 50; 
    } else if (dId === 'mitino') {
      startingBits += 100;
    } else if (dId === 'sokol') {
      startingHp += 150;
    } else if (dId === 'maryino') {
      startingBits += 30; startingHp += 50;
    } else if (dId === 'babushkinskaya') {
      startingXp += 50;
    } else if (dId === 'fili') {
      starterTraits.push({ id: 'buff_energy_fili', name: 'Фили Серверы', type: 'GENERAL', category: 'TECH', description: '+1 Max Energy' });
    } else if (dId === 'taganka') {
      starterTraits.push({ id: 'buff_discount_taganka', name: 'Таганский Бункер', type: 'GENERAL', category: 'SOCIAL', description: 'Скидка 20% в магазинах' });
    } else if (dId === 'vykhino') {
      startingBits += 100; // Trade Hub: Maximum starting capital
    } else if (dId === 'chertanovo') {
      startingHp -= 20; 
      startingBits += 50;
      discoverCard('react_unit_test'); // Hacker ghetto: quick fixing
    } else {
      startingBits += 30;
      startingHp += 20;
    }

    setHp(startingHp);
    setBits(startingBits);
    setXp(startingXp);
    setTraits(starterTraits);
    
    // Set starting position
    setActiveDistrictId(data.district.id);
    setViewMode('DISTRICT');
    
    // START NEURAL BOOT SEQUENCE (AI Assistant Dialogue)
    setActiveBarNode('npc_deck_ai');
    setCurrentView('FIXER_BAR');
  };


  const renderAppView = () => {
    if (currentView === 'CREATION') {
      return <CharacterCreation onComplete={handleCreationComplete} />;
    }

    switch (currentView) {
      case 'MAP':
        return (
          <MapView 
            viewMode={viewMode}
            activeDistrictId={activeDistrictId}
            isCityMapUnlocked={isCityMapUnlocked}
            onNodeSelect={handleTravel} 
            onBack={() => setCurrentView('HUB')} 
            onToggleView={() => setViewMode(prev => prev === 'CITY' ? 'DISTRICT' : 'CITY')}
          />
        );
      case 'COMBAT': {
        const activeDistrict = MAP_NODES.find(n => n.id === activeDistrictId) || MAP_NODES[0];
        const fullLibrary = activeCombatPack === 'java_core' ? TZ_LIBRARY : SPRING_TZ_LIBRARY;
        
        // ICE PROTECTION CHECK
        const TRAINEE_ALLOWED_QUESTS = ['job_board_alt', 'job_board_bibi', 'job_board_tekstil', 'job_board_perovo', 'combat_local_lan'];
        const isTrainee = profession.id === 'trainee';
        
        if (isTrainee && !TRAINEE_ALLOWED_QUESTS.includes(activeBarNode || '') && !isCombatBlockedByIce) {
             // Block access
             return (
               <div className="hub-container main-crt ice-block-screen" style={{ textAlign: 'center', paddingTop: '10vh' }}>
                 <div className="scanline-overlay v2"></div>
                 <div className="ice-glitch-badge neon-border-pink">
                    <AlertTriangle size={64} color="var(--neon-pink)" className="animate-pulse" />
                 </div>
                 <h1 className="neon-text red-shadow premium-title" style={{ fontSize: '4rem' }}>[ ACCESS_DENIED ]</h1>
                 <div className="ice-warning-message">
                    <p className="neon-text accent-red" style={{ fontSize: '1.4rem', marginTop: '1rem' }}>
                       NEURAL_ICE_SYSTEM_ACTIVE
                    </p>
                    <p className="opacity-50" style={{ maxWidth: '600px', margin: '1rem auto' }}>
                       Твой текущий допуск (СТАЖЕР) недостаточен для прохода через этот узел. 
                       Кибердека блокирует подключение из соображений безопасности.
                    </p>
                 </div>
                 <div className="ice-terminal-footer">
                    <span className="opacity-30">ERR_BIO_MISMATCH: {playerName} // LV_01_TRAINEE</span>
                 </div>
                 <button className="neon-border-btn vibrancy" onClick={() => setCurrentView('MAP')} style={{ marginTop: '3rem' }}>
                   [ EMERGENCY_DISCONNECT ]
                 </button>
               </div>
             );
        }

        let targetRank: 'junior' | 'mid' | 'senior' = 'junior';
        if (activeDistrict.tier >= 4) targetRank = 'senior';
        else if (activeDistrict.tier >= 2) targetRank = 'mid';

        // QUEST DECK OVERRIDE: Give trainees tools for specific missions
        let effectiveDeck = activeDeck;
        if (isTrainee && TRAINEE_ALLOWED_QUESTS.includes(activeBarNode || '')) {
            const tempPack = buildClassStarterPack('java_jun');
            effectiveDeck = [...activeDeck, ...tempPack];
        }

        const tierTasks = fullLibrary.filter(t => t.rank === targetRank);
        const solvableTasks = tierTasks.filter(task => 
          task.steps.every(step => effectiveDeck.some(card => card.id === step.requiredCardId))
        );
        const safeLibrary = solvableTasks.length > 0 ? solvableTasks : [fullLibrary[0]];
        const randTaskIndex = Math.floor(Math.random() * safeLibrary.length);

        return (
          <CombatBridge
            skillMode={skillMode}
            playerTraits={traits}
            activeDeck={effectiveDeck}
            taskLibrary={safeLibrary}
            initialTaskIndex={randTaskIndex}
            tier={activeDistrict.tier}
            onViewChange={(v: any) => {
              if (typeof v === 'string') {
                setCurrentView(v as ViewType);
                setSelectedDocId(null);
              } else if (v && v.view) {
                setCurrentView(v.view as ViewType);
                if (v.cardId) setSelectedDocId(v.cardId);
              }
            }}
            onDiscoverCard={discoverCard}
            onWin={(earned: number) => {
              let bonus = 0;
              let finalBitsChange = earned;
              
              if (earned > 0) {
                if (traits.some((t) => t.id === 'hobby_investing')) bonus = Math.floor(earned * 0.2);
                setXp((prev) => prev + 50);
              } else {
                // LOSE/ABORT PENALTY
                finalBitsChange = -50;
              }
              
              setBits((prev) => Math.max(0, prev + finalBitsChange + bonus));
              
              // Increment stress on victory (mental fatigue), Necron reduces it
              const hasNecron = artifacts.some(a => a.id === 'artifact_necron');
              setStress(prev => Math.min(100, prev + (hasNecron ? 5 : 10)));

              // QUEST REWARD: Magnus Toilet
              if (activeBarNode === 'combat_magnus_toilet') {
                 const necron: Artifact = {
                    id: 'artifact_necron',
                    name: 'Некрон Магнуса',
                    description: 'Древний пластиковый воин. Снижает стресс на 50% при победах.',
                    icon: '💀'
                 };
                 if (!artifacts.some(a => a.id === 'artifact_necron')) {
                    setArtifacts(prev => [...prev, necron]);
                 triggerSync({ artifacts: [...artifacts, necron] });
               }
              }

              // QUEST REWARD: Nixanna Ritual
              if (activeBarNode === 'combat_nixanna_ritual') {
                 setStress(0); // Full purification
                 const card = getCardById('reward_divine_debug');
                 if (card) {
                    setInventory(inv => [...inv, card]);
                    discoverCard('reward_divine_debug');
                    triggerSync({ inventory: [...inventory.map(c => c.id), 'reward_divine_debug'] });
                 }
              }

              // Back to the district
              setCurrentView('MAP');
              setViewMode('DISTRICT');
              triggerSync(); 
            }}
          />
        );
      }
      case 'FIXER_BAR':
        return (
          <FixerBarScene
            locationId={activeBarNode || 'kitay_gorod'}
            playerBits={bits}
            playerTraits={traits}
            onPay={(amount) => setBits(b => Math.max(0, b - amount))}
            onRewardCard={(id) => {
               const card = getCardById(id);
               if (card) {
                  setInventory(inv => [...inv, card]);
                  setActiveDeck(deck => deck.length < 10 && !deck.some(c => c.id === card.id) ? [...deck, card] : deck);
                  discoverCard(id);
               }
            }}
            onRewardTrait={(id) => {
               if (!traits.some(t => t.id === id)) {
                 setTraits(t => [...t, { id, name: id.replace('perk_', '').toUpperCase(), type: 'GENERAL', category: 'SOCIAL', description: 'Специальный навык полученный в ходе приключения.' }]);
               }
            }}
            onRewardBits={(amount) => {
               setBits(prev => prev + amount);
            }}
            onRestoreHp={(amount) => {
               setHp(prev => Math.min(100, prev + amount));
            }}
            onUnlockCity={() => {
               setIsCityMapUnlocked(true);
               setViewMode('CITY');
               setCurrentView('MAP');
            }}
            onSetProfession={(profId) => {
               const newProf = getProfessionById(profId);
               if (newProf) {
                 setProfession(newProf);
                 // Grant starter pack for the class
                 const pack = buildClassStarterPack(profId);
                 setInventory(inv => [...inv, ...pack]);
                 setActiveDeck(deck => [...deck, ...pack].slice(-10)); // Auto-add some to deck
                 pack.forEach(c => discoverCard(c.id));
               }
            }}
            onStartCombat={(combatId) => {
               // Map node ID to task library
               setActiveBarNode(combatId);
               setCurrentView('COMBAT');
            }}
            onRewardXp={(amount) => {
               setXp(prev => prev + amount);
            }}
            onLeave={() => setCurrentView('MAP')} 
          />
        );
      case 'CHARACTER':
        return (
          <CharacterScreen
            player={{
              name: playerName,
              district: homeDistrict?.name || 'UNKNOWN',
              profession: profession,
              hp,
              bits,
              xp,
              level,
              traits,
            }}
            onBack={() => setCurrentView('HUB')}
          />
        );
      case 'DECK_BUILDER':
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
      case 'REFERENCE':
        return (
          <Documentation
            skillMode={skillMode}
            discoveredCardIds={new Set([
              ...Array.from(discoveredCardIds), 
              ...activeDeck.map(c => c.id),
              ...inventoryUnique.map(c => c.id)
            ])}
            initialEntryId={selectedDocId}
            onBack={() => {
              setCurrentView(lastView);
              setSelectedDocId(null);
            }}
          />
        );
      case 'HUB':
      default:
        return (
          <div className="hub-container animate-float">
            <header className="hub-header">
              <h1 className="neon-text">MOSCOW_ZERO [early-alpha 0.07]</h1>
              <div className="location-tag">
                LOCATION: {homeDistrict?.name || 'SECURE_APARTMENT'} | USER: {playerName}
              </div>
            </header>

            <div className="hub-main-grid">
              <div className="neon-panel interactive" onClick={() => setCurrentView('CHARACTER')}>
                <div className="panel-profession-tag">
                  {profession.path}: {profession.name}
                </div>
                <h3>NEURAL_LINK</h3>
                <div className="stat-line">SYSTEM_HEALTH: {hp}%</div>
                <div className="stat-line">EXPERIENCE_XP: {xp}</div>
              </div>

              <div className="neon-panel interactive" onClick={() => setCurrentView('DECK_BUILDER')}>
                <h3>DECK_CONSTRUCTOR</h3>
                <div className="stat-line">ACTIVE_LOADOUT: {activeDeck.length} CARDS</div>
                <div className="stat-line">BIT_CURRENCY: {bits}</div>
              </div>

              <div className="neon-panel interactive" onClick={() => setCurrentView('REFERENCE')}>
                <h3>DOCUMENTATION</h3>
                <div className="stat-line">
                  CONCEPTS_FOUND: {discoveredCardIds.size}/{TOTAL_CARD_CONCEPTS}
                </div>
                <div className="stat-line opacity-50">KNOWLEDGE_IS_POWER</div>
              </div>
            </div>

            <div className="hub-stats">
              <div className="hub-stat-item">
                <span className="hub-stat-label">BITS</span>
                <span className="hub-stat-value gold">{bits}</span>
              </div>
              <div className="hub-stat-item">
                <span className="hub-stat-label">STRESS</span>
                <div className="stress-bar" style={{ width: '100px', marginLeft: '10px' }}>
                  <div className="stress-fill" style={{ width: `${stress}%` }} />
                </div>
              </div>
            </div>

            <div className="inventory-section">
              <div className="hub-stat-label">ARTIFACTS</div>
              <div className="artifact-grid">
                {artifacts.map(a => (
                  <div key={a.id} className="artifact-slot" title={`${a.name}: ${a.description}`}>
                    <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                  </div>
                ))}
                {artifacts.length === 0 && <div className="artifact-slot" style={{opacity: 0.2}}>∅</div>}
              </div>
            </div>

            <div className="hub-actions">
              <button className="neon-border-btn" onClick={() => setCurrentView('MAP')}>
                [ INITIALIZE_MAP_RADAR ]
              </button>
              <button 
                className="neon-border-btn" 
                onClick={logout} 
                style={{ marginLeft: '1rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}
              >
                [ TERMINATE_SESSION ]
              </button>
            </div>
          </div>
        );
    }
  };

  const handleTravel = (nodeId: string, type: string, cost?: number) => {
    if (cost && bits < cost) {
      alert('INSUFFICIENT_BIT_CREDITS for travel.');
      return;
    }
    if (cost) setBits(prev => prev - cost);

    const fullNode = MAP_NODES.find(n => n.id === nodeId);
    const isSubNode = type === 'npc' || type === 'shop' || type === 'combat' || type === 'bar' || type === 'story' || type === 'terminal' || type === 'subnode';
    if (!fullNode && !isSubNode && nodeId !== 'UNLOCK_CITY') return;

    if (type === 'district') {
      setActiveDistrictId(nodeId);
      setViewMode('DISTRICT');
      setActiveCombatPack(fullNode?.combatPack || 'java_core');
      setCurrentView('MAP');
    } else if (type === 'combat') {
      setActiveBarNode(nodeId); // Store node ID for quest checks in onWin
      setCurrentView('COMBAT');
    } else if (type === 'bar' || type === 'story' || type === 'npc' || type === 'shop' || type === 'terminal') {
      setActiveBarNode(nodeId);
      setCurrentView('FIXER_BAR');
    } else if (nodeId === 'UNLOCK_CITY') {
      setIsCityMapUnlocked(true);
      setViewMode('CITY');
    }
  };

  if (isAuthLoading) {
    return <div className="boot-view app-root main-crt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="neon-text animate-pulse">CONNECTING_TO_IDENTITY_SERVER...</div>
    </div>;
  }

  if (!token) {
    return <AuthForm />;
  }

  if (!isBooted) {
    return (
      <div className="boot-view app-root main-crt">
        <div className="boot-container">
          <div className="boot-terminal-header">
            <div className="boot-term-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="boot-term-title">SYSTEM_PRE_BOOT_V0.08</div>
          </div>

          <div className="boot-main-panel">
            <div className="boot-terminal-block">
              <div className="boot-log-header">NETWORK_SCAN // UPLINK_ESTABLISHED</div>
              {bootHistory.map((log, i) => (
                <div key={i} className="boot-log-entry">{log}</div>
              ))}
              <div className="boot-cursor-row">
                <span className="boot-cursor">_</span>
                <span className="boot-status-msg">{loadingText === 'READY.' ? "BYPASS_READY" : "ACQUIRING_HANDSHAKE"}</span>
              </div>
            </div>

            <div className="boot-content">
              <h1 className="boot-headline-logo">PROTO_NEON</h1>
              <button 
                className="boot-action-btn vibrancy" 
                onClick={handleBoot}
              >
                [ BYPASS_FIREWALL_&_BOOT ]
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hideNav = currentView === 'CREATION' || currentView === 'COMBAT';

  return (
    <div className="app-root main-crt">
      {!hideNav && (
        <ResponsiveNav
          currentView={currentView}
          onViewChange={(v) => setCurrentView(v)}
          hp={hp}
          level={level}
          onLogout={handleLogout}
        />
      )}
      <main className={`view-container ${hideNav ? 'fullscreen' : ''}`}>{renderAppView()}</main>
    </div>
  );
}

export default App;

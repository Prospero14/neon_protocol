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
  DEFAULT_SKILL_MODE,
  parseSkillMode,
  SKILL_MODE_STORAGE_KEY,
  type SkillMode,
} from './logic/skillMode';
import { NPC_LIBRARY } from './logic/npcData';
import { QUEST_LIBRARY, type QuestDefinition } from './logic/questData';
import { acceptQuest, completeQuest, getTrackedQuest, isQuestAvailableForNpc, type QuestState } from './logic/questEngine';
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

type ViewType = 'CREATION' | 'HUB' | 'MAP' | 'COMBAT' | 'CHARACTER' | 'DECK_BUILDER' | 'REFERENCE' | 'FIXER_BAR';

function initialMergedInventory(): CombatCard[] {
  const byId = new Map<string, CombatCard>();
  CARD_LIBRARY.forEach((c) => byId.set(c.id, c));
  SPRING_CARD_LIBRARY.forEach((c) => byId.set(c.id, c));
  return [...byId.values()];
}

const buildTraineeDeck = (): CombatCard[] => {
  const starterIds = ['script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix'];
  return starterIds.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
};

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('CREATION');
  const [lastView, setLastView] = useState<ViewType>('HUB');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('ID_UNKNOWN');
  const [homeDistrict, setHomeDistrict] = useState<MapNodeData | null>(null);
  const [activeDistrictId, setActiveDistrictId] = useState('altufyevo');
  const [viewMode, setViewMode] = useState<'CITY' | 'DISTRICT'>('DISTRICT');
  const [isCityMapUnlocked, setIsCityMapUnlocked] = useState(false);
  const [activeBarNode, setActiveBarNode] = useState<string | null>(null);
  const [activeCombatPack, setActiveCombatPack] = useState<CombatPack>('java_core');

  const [profession, setProfession] = useState<Profession>(getProfessionById('trainee') ?? PROFESSIONS[0]);
  const [classUnlocked, setClassUnlocked] = useState(false);
  const [hp, setHp] = useState(100);
  const [bits, setBits] = useState(100);
  const [xp, setXp] = useState(0);
  const [level] = useState(1);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [inventory, setInventory] = useState<CombatCard[]>(() => initialMergedInventory());
  const [activeDeck, setActiveDeck] = useState<CombatCard[]>(() => buildTraineeDeck());
  const [loot, setLoot] = useState<GameItem[]>([]);
  const [questStates, setQuestStates] = useState<QuestState[]>([]);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [bitsFromQuests, setBitsFromQuests] = useState(0);

  const [skillMode, setSkillMode] = useState<SkillMode>(() => parseSkillMode(localStorage.getItem(SKILL_MODE_STORAGE_KEY)));
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

  const preClassState = { classUnlocked, completedQuestCount, bitsEarnedFromQuests: bitsFromQuests };
  const canUnlockNow = canUnlockClass(preClassState);

  const getNpcQuests = (npcId: string) =>
    QUEST_LIBRARY.filter((q) => isQuestAvailableForNpc(q, npcId, !classUnlocked, questStates));

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

  const handleAcceptQuest = (questId: string) => {
    setQuestStates((prev) => acceptQuest(prev, questId));
  };
  const handleTrackQuest = (questId: string) => {
    setQuestStates((prev) => prev.map((s) => ({ ...s, tracked: s.questId === questId && s.status === 'active' })));
  };
  const handleCompleteTalkQuest = (questId: string) => {
    const q = QUEST_LIBRARY.find((x) => x.id === questId);
    if (!q) return;
    setQuestStates((prev) => completeQuest(prev, questId));
    rewardForQuest(q);
  };

  const handleCreationComplete = (data: { name: string; district: MapNodeData; hobby: Trait; ambition?: Profession }) => {
    setPlayerName(data.name);
    setHomeDistrict(data.district);
    setActiveDistrictId(data.district.id);
    setTraits([data.hobby]);
    const starterDeck = buildTraineeDeck();
    setActiveDeck(starterDeck);
    starterDeck.forEach((c) => discoverCard(c.id));
    setCurrentView('HUB');
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
    }
  };

  const renderAppView = () => {
    if (currentView === 'CREATION') return <CharacterCreation onComplete={handleCreationComplete} />;

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
          onAcceptQuest={handleAcceptQuest}
          onTrackQuest={handleTrackQuest}
          onCompleteTalkQuest={handleCompleteTalkQuest}
          trackedQuestId={getTrackedQuest(questStates)?.questId ?? null}
        />
      );
    }

    if (currentView === 'COMBAT') {
      const district = MAP_NODES.find((n) => n.id === activeDistrictId) ?? MAP_NODES[0];
      const taskLibrary = activeCombatPack === 'java_spring' ? SPRING_TZ_LIBRARY : TZ_LIBRARY;
      const tierTasks = taskLibrary.filter((t) => (district.tier >= 4 ? t.rank === 'senior' : district.tier >= 2 ? t.rank === 'mid' : t.rank === 'junior'));
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
          onViewChange={(v: any) => {
            if (typeof v === 'string') setCurrentView(v);
            if (v?.view) {
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
          player={{ name: playerName, district: homeDistrict?.name || 'UNKNOWN', profession, hp, bits, xp, level, traits, classUnlocked, completedQuestCount }}
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

    return (
      <div className="hub-container animate-float">
        <header className="hub-header">
          <h1 className="neon-text">MOSCOW_ZERO [MVP]</h1>
          <div className="location-tag">LOCATION: {homeDistrict?.name || 'SECURE_APARTMENT'} | USER: {playerName}</div>
        </header>

        <div className="hub-skill-mode neon-panel">
          <span className="skill-mode-label mono-text">SKILL_MODE</span>
          <div className="skill-mode-buttons">
            <button className={`skill-mode-btn ${skillMode === 'junior' ? 'active' : ''}`} onClick={() => setSkillMode('junior')}>Новичок</button>
            <button className={`skill-mode-btn ${skillMode === 'mid' ? 'active' : ''}`} onClick={() => setSkillMode('mid')}>Мидл</button>
            <button className={`skill-mode-btn ${skillMode === 'senior' ? 'active' : ''}`} onClick={() => setSkillMode('senior')}>Сеньор</button>
          </div>
          <p className="skill-mode-hint mono-text">
            {skillMode === 'junior'
              ? 'Подсказки и пайплайны включены.'
              : 'Описание задач сохранено, но детальный туториал в библиотеке скрыт.'}
          </p>
        </div>

        <div className="hub-main-grid">
          <div className="neon-panel interactive" onClick={() => setCurrentView('CHARACTER')}>
            <div className="panel-profession-tag">{profession.path}: {profession.name}</div>
            <h3>NEURAL_LINK</h3>
            <div className="stat-line">SYSTEM_HEALTH: {hp}%</div>
            <div className="stat-line">EXPERIENCE_XP: {xp}</div>
            <div className="stat-line">
              CLASS_STATUS: {classUnlocked ? 'UNLOCKED' : `UNASSIGNED (${completedQuestCount}/${PRECLASS_UNLOCK_QUESTS} quests)`}
            </div>
          </div>
          <div className="neon-panel interactive" onClick={() => setCurrentView('DECK_BUILDER')}>
            <h3>DECK_CONSTRUCTOR</h3>
            <div className="stat-line">ACTIVE_LOADOUT: {activeDeck.length}/10</div>
            <div className="stat-line">FILTER BY LANGUAGE + LIBS</div>
          </div>
          <div className="neon-panel interactive" onClick={() => setCurrentView('REFERENCE')}>
            <h3>DOCUMENTATION</h3>
            <div className="stat-line">CONCEPTS_FOUND: {discoveredCardIds.size}</div>
            <div className="stat-line opacity-50">{skillMode === 'junior' ? 'WITH_GUIDES' : 'NO_STEP_BY_STEP_GUIDES'}</div>
          </div>
        </div>

        <div className="hub-stats">
          <div className="hub-stat-item"><span className="hub-stat-label">BITS</span><span className="hub-stat-value gold">{bits}</span></div>
          <div className="hub-stat-item"><span className="hub-stat-label">QUEST_BITS</span><span className="hub-stat-value">{bitsFromQuests}</span></div>
          <div className="hub-stat-item"><span className="hub-stat-label">LOOT</span><span className="hub-stat-value">{loot.length}</span></div>
          {!classUnlocked && canUnlockNow && (
            <div className="hub-stat-item">
              <button
                className="neon-border-btn"
                onClick={() => {
                  setClassUnlocked(true);
                  setProfession(getProfessionById('java_jun') ?? profession);
                }}
              >
                [ UNLOCK_CLASS_PROTOCOL ]
              </button>
            </div>
          )}
          {!classUnlocked && (
            <div className="hub-stat-item opacity-50">
              <span className="hub-stat-label">NEED {PRECLASS_UNLOCK_BITS} quest bits OR {PRECLASS_UNLOCK_QUESTS} quests</span>
            </div>
          )}
        </div>

        <div className="hub-actions">
          <button className="neon-border-btn" onClick={() => setCurrentView('MAP')}>[ INITIALIZE_MAP_RADAR ]</button>
        </div>
      </div>
    );
  };

  const hideNav = currentView === 'CREATION' || currentView === 'COMBAT';

  return (
    <div className="app-root main-crt">
      {!hideNav && <ResponsiveNav currentView={currentView} onViewChange={(v) => setCurrentView(v)} hp={hp} level={level} />}
      <main className={`view-container ${hideNav ? 'fullscreen' : ''}`}>{renderAppView()}</main>
    </div>
  );
}

export default App;

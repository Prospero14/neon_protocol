import { useCallback } from 'react';
import { useGameState } from './logic/hooks/useGameState';
import { useAuth } from './logic/AuthContext';
import { readNeonAuthToken } from './logic/authTokenStorage';
import './App.css';
import './combat-hud.css';
import { MAP_NODES } from './logic/mapData';
import { getProfessionById } from './logic/professions';
import { getCardById } from './logic/combatCards';
import { TZ_LIBRARY } from './logic/combatTasks';
import { SPRING_TZ_LIBRARY } from './logic/springTasks';
import { QUEST_LIBRARY } from './logic/questData';
import { acceptQuest, markQuestReady, getTrackedQuest } from './logic/questEngine';
import MapView from './components/MapView';
import CombatBridge from './components/games/CombatBridge';
import { shouldLiquidateStartup } from './logic/coopSprint';
import CharacterCreation from './components/CharacterCreation';
import SessionGateView from './components/SessionGateView';
import CharacterScreen from './components/CharacterScreen';
import DeckBuilder from './components/DeckBuilder';
import Documentation from './components/Documentation';
import ResponsiveNav from './components/ResponsiveNav';
import FixerBarScene from './components/FixerBarScene';
import QuestLog from './components/QuestLog';
import IntelView from './components/IntelView';
import { HubView } from './components/views/HubView';
import { CoopLobbyView } from './components/CoopLobbyView';
import { AuthForm } from './components/AuthForm';
import { NeonServicesHub } from './components/services/NeonServicesHub';
import { NriLobbyView } from './components/NriLobbyView';
import './components/services/neon-services.css';
import { IMPLANT_CATALOG } from './logic/hardware';
import type { ViewType } from './logic/hooks/useGameState';
import type { SkillMode } from './logic/skillMode';
import { COOP_ROLES } from './logic/sessionMode';
import {
  resolveCoopYardTaskIndexInLibrary,
  isCoopBossUnlocked,
  countCoopTierMissionsCleared,
  coopMissionsRequiredForBoss,
} from './logic/coopYardRuntime';
import { coopThemeForWorldDay } from './logic/coopWeeklySeason';
import { buildMergedStartupLeaderboard } from './logic/coopStartupLeaderboard';
import { refreshCoopStartupLeaderboardFromServer } from './logic/coopStartupRankingsApi';
import { NPC_PRESENCE_CONFIGS, isNpcHomeAccessible } from './logic/npcPresence';
import type { Profession } from './logic/professions';

/** Стабильный индекс 0..modulo-1 от строки (без Math.random в рендере — иначе ТЗ в бою «прыгает» каждый тик часов). */
function stableIndexFromSeed(seed: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % modulo;
}

function App() {
  const gs = useGameState();
  const { token, user: authUser } = useAuth();

  const refreshCoopStartupLb = useCallback(async () => {
    const authT = readNeonAuthToken() ?? token;
    if (!authT || !authUser?.id) return null;
    if (gs.sessionMode !== 'coop') return null;
    const cleared = countCoopTierMissionsCleared(gs.coopYardCompletedMissionIds, gs.coopTierRank);
    return refreshCoopStartupLeaderboardFromServer({
      token: authT,
      userId: authUser.id,
      startupName: gs.coopStartupName?.trim() || gs.playerName || 'STARTUP',
      clearedTierMissions: cleared,
      bits: gs.bits,
      tierRank: gs.coopTierRank,
    });
  }, [
    token,
    authUser?.id,
    gs.sessionMode,
    gs.coopYardCompletedMissionIds,
    gs.coopTierRank,
    gs.coopStartupName,
    gs.playerName,
    gs.bits,
  ]);

  const grantProfessionCards = (prof: Profession) => {
    const byProfession: Record<string, string[]> = {
      java_jun: ['syntax_class_decl', 'syntax_main_method', 'syntax_list_init', 'syntax_try_catch', 'mid_stream_init'],
      kotlin_jun: ['script_auth', 'script_ssh'],
      python_jun: ['script_grep', 'script_scp'],
      js_jun: ['script_curl', 'script_auth'],
      go_jun: ['script_ping', 'script_sudo_fix'],
    };
    const ids = byProfession[prof.id] ?? [];
    ids.forEach((id) => {
      const card = getCardById(id);
      if (!card) return;
      gs.setInventory((inv) => (inv.some((c) => c.id === id) ? inv : [...inv, card]));
      gs.setActiveDeck((deck) => (deck.length < 30 && !deck.some((c) => c.id === id) ? [...deck, card] : deck));
      gs.discoverCard(id);
    });
  };

  const renderAppView = () => {
    if (gs.currentView === 'SESSION_GATE') {
      return (
        <SessionGateView
          creationResume={gs.creationResume}
          playerName={gs.playerName}
          homeDistrictId={gs.homeDistrictId}
          coopClassProfiles={gs.coopClassProfiles}
          pendingNriInvite={gs.pendingNriInvite}
          nriGuestInviteCode={gs.nriGuestInviteCode}
          onEnterSolo={() => gs.resumeEnterSoloHub()}
          onEnterCoop={(role) => gs.resumeEnterCoopLobby(role)}
          onCreateNri={(title) => void gs.createNriTable(title)}
          onJoinNri={(code) => void gs.enterNriLobby(code)}
          onOpenWizard={(mode) => gs.openCharacterWizard(mode)}
        />
      );
    }
    if (gs.currentView === 'CREATION') {
      const coopRolesTaken = COOP_ROLES.filter((r) => (gs.coopClassProfiles[r]?.deckIds?.length ?? 0) > 0);
      return (
        <CharacterCreation 
          skillMode={gs.skillMode} 
          setSkillMode={gs.setSkillMode} 
          userIp={gs.userIp} 
          faction={'INDEPENDENT_ANON'} 
          onComplete={gs.handleCreationComplete}
          lockedSessionMode={gs.creationWizardLockedMode ?? undefined}
          onCancelWizard={gs.creationWizardLockedMode ? gs.cancelCharacterWizard : undefined}
          coopRolesTaken={coopRolesTaken}
          creationGate={
            gs.creationWizardLockedMode === 'coop' && gs.creationResume?.soloOnlyNeedsCoop ? 'solo_needs_coop' : 'none'
          }
          savedPlayerName={gs.playerName !== 'ID_НЕИЗВЕСТЕН' ? gs.playerName : ''}
        />
      );
    }

    if (gs.currentView === 'NRI_LOBBY' && gs.sessionMode === 'nri' && gs.nriInviteCode) {
      return (
        <NriLobbyView
          inviteCode={gs.nriInviteCode}
          onLeave={gs.leaveNriLobby}
          onIceReward={(bits) => gs.setBits((b) => b + bits)}
        />
      );
    }

    if (gs.currentView === 'COOP_LOBBY' && gs.sessionMode === 'coop' && gs.coopRole) {
      return (
        <CoopLobbyView
          playerDisplayName={gs.playerName}
          coopRole={gs.coopRole}
          onLaunchSprint={(startupName, tierRank, opts) =>
            gs.completeCoopSprintLaunch(startupName, tierRank, opts)
          }
          onSwitchCoopClass={gs.switchCoopClass}
        />
      );
    }
    
    if (gs.currentView === 'MAP') {
      const district = MAP_NODES.find((n) => n.id === gs.activeDistrictId) ?? MAP_NODES[0];
      const filteredNodes = district.subNodes.filter(node => {
        if (node.id === 'coop_cp_boss' && !isCoopBossUnlocked(gs.coopYardCompletedMissionIds, gs.coopTierRank)) {
          return false;
        }
        if (node.id === 'npc_petrovich' && !gs.isPetrovichHomeUnlocked) return false;
        const presenceCfg = Object.values(NPC_PRESENCE_CONFIGS).find((cfg) => cfg.homeNodeId === node.id);
        if (presenceCfg && !isNpcHomeAccessible(presenceCfg, gs.dayPhase, gs.npcPresenceMap)) return false;
        return true;
      });

      const coopYardCombatHi =
        gs.sessionMode === 'coop' && gs.activeDistrictId === 'coop_yard'
          ? [
              'coop_cp_light',
              'coop_cp_medium',
              'coop_cp_heavy',
              'coop_cp_elite',
              ...(isCoopBossUnlocked(gs.coopYardCompletedMissionIds, gs.coopTierRank) ? (['coop_cp_boss'] as const) : []),
            ]
          : null;

      return (
        <MapView 
          viewMode={gs.viewMode} 
          activeDistrictId={gs.activeDistrictId} 
          isCityMapUnlocked={gs.isCityMapUnlocked} 
          onNodeSelect={gs.handleTravel} 
          onBack={() => gs.setCurrentView('HUB')} 
          onToggleView={() => gs.setViewMode((prev) => (prev === 'CITY' ? 'DISTRICT' : 'CITY'))} 
          objectiveNodeId={gs.objectiveNodeId} 
          playerBits={gs.bits} 
          customSubNodes={filteredNodes}
          gameClock={gs.gameClock}
          coopCombatHighlightIds={coopYardCombatHi}
        />
      );
    }

    if (gs.currentView === 'COMBAT') {
      if (gs.sessionMode === 'coop' && gs.coopStartupLiquidated) {
        return (
          <div className="v007-creation-context main-crt" style={{ padding: '48px 24px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
            <h2 className="cc-headline" style={{ marginBottom: 16 }}>СТАРТАП ЛИКВИДИРОВАН</h2>
            <p className="cc-hint" style={{ marginBottom: 24 }}>
              Три провальных релиза подряд. Продукт закрыт — начните новый профиль или играйте в соло.
            </p>
            <button type="button" className="cc-skill-btn active" onClick={() => gs.setCurrentView('HUB')}>
              [ В ХАБ ]
            </button>
          </div>
        );
      }
      const district = MAP_NODES.find((n) => n.id === gs.activeDistrictId) ?? MAP_NODES[0];
      /** Полигон коопа: ТЗ только в основной библиотеке; Spring-пак не содержит coop_yard → иначе пустой safeLibrary и «вход в бой» ломается. */
      const taskLibrary =
        gs.sessionMode === 'coop' && gs.activeDistrictId === 'coop_yard'
          ? TZ_LIBRARY
          : gs.activeCombatPack === 'java_spring'
            ? SPRING_TZ_LIBRARY
            : TZ_LIBRARY;
      
      let effectiveRank: SkillMode = 'script-kiddie';
      if (gs.sessionMode === 'coop') {
        effectiveRank = gs.coopTierRank;
      } else if (gs.classUnlocked) {
        if (gs.profession.grade === 'Junior') effectiveRank = 'junior';
        else if (gs.profession.grade === 'Middle') effectiveRank = 'mid';
        else if (gs.profession.grade === 'Senior') effectiveRank = 'senior';
      }

      const safeLibrary = taskLibrary.filter((t) => {
        const matchesRank = t.rank === effectiveRank;
        const matchesDistrict = !t.districtId || t.districtId === gs.activeDistrictId;
        return matchesRank && matchesDistrict;
      });
      
      // Поиск конкретной задачи по активной ноде (фикчеру/квесту)
      let idx = safeLibrary.findIndex(t => t.id === gs.activeBarNode);
      if (idx === -1 && safeLibrary.length > 0) {
        if (gs.sessionMode === 'coop' && gs.activeDistrictId === 'coop_yard') {
          idx = resolveCoopYardTaskIndexInLibrary(
            safeLibrary,
            gs.activeBarNode,
            gs.coopYardCompletedMissionIds,
            gs.coopTierRank
          );
        } else {
          idx = stableIndexFromSeed(
            `${gs.activeBarNode ?? 'none'}|${gs.activeDistrictId}|${gs.worldDay}|${effectiveRank}`,
            safeLibrary.length
          );
        }
      }
      
      let combatDeck = gs.activeDeck;


      const trackedCombat = getTrackedQuest(gs.questStates);
      const trackedCombatDef = trackedCombat ? QUEST_LIBRARY.find(q => q.id === trackedCombat.questId) : undefined;
      const isQuestCombat = !!(
        trackedCombatDef &&
        trackedCombatDef.type === 'combat' &&
        (!trackedCombatDef.objectiveNodeId || trackedCombatDef.objectiveNodeId === gs.activeBarNode)
      );
      const isFirstCombatQuestTutorial = Boolean(trackedCombatDef?.id.startsWith('q_kiddo_first_bits_'));

      return (
        <CombatBridge 
          skillMode={effectiveRank} 
          playerTraits={gs.traits} 
          activeDeck={combatDeck} 
          taskLibrary={safeLibrary} 
          initialTaskIndex={idx} 
          tier={district.tier} 
          deckCores={gs.deckCores} 
          deckRamMb={gs.deckRamMb} 
          homeDistrictId={gs.homeDistrictId}
          sessionMode={gs.sessionMode}
          coopRole={gs.coopRole}
          fieldWorldDay={gs.worldDay}
          fieldDistrictId={gs.activeDistrictId || gs.homeDistrictId}
          fieldBarNode={gs.activeBarNode}
          coopStartupName={gs.coopStartupName}
          devLanguageStack={gs.devLanguageStack}
          coopSprintLossesBeforeBattle={gs.coopSprintConsecutiveLosses}
          coopSquadFill={gs.coopSquadFill}
          coopMatchId={gs.coopMatchId}
          isQuestCombat={isQuestCombat}
          isFirstCombatQuestTutorial={isFirstCombatQuestTutorial}
          onWin={(earned, rank, chain, missionName, updatedDeck, missionTaskId) => {
            if (gs.sessionMode === 'coop') {
              if (earned > 0) {
                gs.setCoopSprintConsecutiveLosses(0);
                if (gs.activeDistrictId === 'coop_yard' && missionTaskId) {
                  gs.registerCoopYardMissionClear(missionTaskId);
                }
              } else {
                gs.setCoopSprintConsecutiveLosses((prev) => {
                  const n = prev + 1;
                  if (shouldLiquidateStartup(n)) gs.setCoopStartupLiquidated(true);
                  return n;
                });
              }
            }
            if (updatedDeck) gs.setActiveDeck(updatedDeck);
            gs.saveSolvedChain(missionTaskId || gs.activeBarNode || 'unknown', missionName, chain);
            gs.setBits((prev) => Math.max(0, prev + earned));
            gs.reportCombatRumor(missionName, earned > 0);
            if (earned > 0) {
              gs.setSolvedTaskCounts(prev => ({ ...prev, [rank]: (prev[rank] || 0) + 1 }));
              gs.setInstalledImplants(prev => prev.map(imp => ({ ...imp, battlesLeft: Math.max(0, imp.battlesLeft - 1) })));
            }
            const tracked = getTrackedQuest(gs.questStates);
            const trackedDef = tracked ? QUEST_LIBRARY.find((q) => q.id === tracked.questId) : undefined;
            if (trackedDef && trackedDef.type === 'combat' && ( !trackedDef.objectiveNodeId || trackedDef.objectiveNodeId === gs.activeBarNode) && earned > 0) { 
              gs.setQuestStates((prev) => markQuestReady(prev, trackedDef.id)); 
            }
            gs.setCurrentView('MAP'); 
            gs.setViewMode('DISTRICT');
          }} 
        />
      );
    }

    if (gs.currentView === 'FIXER_BAR') {
      const activeQuests = gs.questStates.filter(s => s.status === 'active').map(s => s.questId);
      const readyQuests = gs.questStates.filter(s => s.status === 'ready_to_turn_in').map(s => s.questId);
      const completedQuests = gs.questStates.filter(s => s.status === 'completed').map(s => s.questId);

      return (
        <FixerBarScene 
          locationId={gs.activeBarNode || 'altufyevo'} 
          playerBits={gs.bits} 
          playerTraits={gs.traits} 
          playerReputation={gs.reputation} 
          canUnlockNow={gs.classUnlocked} 
          homeDistrictId={gs.activeDistrictId}
          onPay={(amount: number) => gs.setBits((b) => Math.max(0, b - amount))} 
          onRewardCard={(id: string) => { 
            const card = getCardById(id); 
            if (card) { 
              gs.setInventory((inv) => [...inv, card]); 
              gs.setActiveDeck((deck) => (deck.length < 10 && !deck.some((c) => c.id === id) ? [...deck, card] : deck)); 
              gs.discoverCard(id); 
            } 
          }} 
          onRewardTrait={(id: string) => { 
            if (Array.isArray(gs.traits) && !gs.traits.some((t) => t.id === id)) {
              gs.setTraits((prev) => [...prev, { id, name: id.toUpperCase(), type: 'GENERAL', category: 'SOCIAL', description: 'Получено у фикcера.' }]);
            }
          }} 
          onRestoreHp={(amount: number) => gs.setStress((prev) => Math.max(0, prev - amount))} 
          onAwardQuest={(questId: string) => { 
            if (questId === 'UNLOCK_PETROVICH_HOME') {
              gs.setIsPetrovichHomeUnlocked(true);
              return;
            }
            const q = QUEST_LIBRARY.find(item => item.id === questId); 
            if (q) gs.setQuestStates(prev => acceptQuest(prev, q.id)); 
          }} 
          playerLevel={gs.playerLevel}
          inventory={gs.inventory}
          activeDeck={gs.activeDeck}
          onRewardBits={(amount: number) => gs.setBits(b => b + amount)} 
          onRewardItem={gs.onRewardItem}
          onRemoveItem={gs.onRemoveItem}
          playerLoot={gs.loot}
          onUseLootItem={gs.onUseLootItem}
          currentDay={gs.worldDay}
          dayPhase={gs.dayPhase}
          activeQuestIds={activeQuests} 
          readyQuestIds={readyQuests}
          completedQuestIds={completedQuests}
          onCompleteQuest={gs.handleCompleteTalkQuest}  
          onUnlockCity={() => { gs.setIsCityMapUnlocked(true); gs.setViewMode('CITY'); gs.setCurrentView('MAP'); }} 
          onSetProfession={(profId: string) => { 
            const prof = getProfessionById(profId); 
            if (prof) {
              gs.setProfession(prof);
              gs.setClassUnlocked(true);
              grantProfessionCards(prof);
            } 
          }} 
          onStartCombat={(combatId: string) => { gs.setActiveBarNode(combatId); gs.setCurrentView('COMBAT'); }} 
          onTravel={gs.handleTravel} 
          onLeave={() => gs.setCurrentView('MAP')} 
          npcPresenceMap={gs.npcPresenceMap}
          isPetrovichHomeUnlocked={gs.isPetrovichHomeUnlocked}
        />
      );
    }

    if (gs.currentView === 'CHARACTER') {
      return (
        <CharacterScreen 
          player={{ 
            name: gs.playerName, 
            district: gs.homeDistrict?.name || 'НЕИЗВЕСТНО', 
            profession: gs.profession, 
            hp: gs.stress, 
            bits: gs.bits, 
            solvedTaskCounts: gs.solvedTaskCounts, 
            traits: gs.traits, 
            classUnlocked: gs.classUnlocked, 
            completedQuestCount: gs.completedQuestCount, 
            reputation: gs.reputation, 
            maxStress: gs.maxStress, 
            deckCores: gs.deckCores, 
            deckRamMb: gs.deckRamMb, 
            installedImplants: gs.installedImplants, 
            maxImplantSlots: gs.maxImplantSlots 
          }} 
          onBack={() => gs.setCurrentView('HUB')} 
          onLogout={gs.logout} 
          onUpgradeHardware={(hw) => {
            if (gs.bits < hw.cost) return;
            const cores = (hw.baseCores ?? 0) + (hw.bonusCores ?? 0);
            const ramMb = (hw.baseRamMb ?? 0) + (hw.bonusRamMb ?? 0);
            if (hw.type === 'CPU') gs.setDeckCores(cores);
            if (hw.type === 'RAM') gs.setDeckRamMb(ramMb);
            gs.setBits((b) => b - hw.cost);
          }}
          onInstallImplant={(id: string) => { 
            const imp = IMPLANT_CATALOG.find(i => i.id === id);
            if (imp && gs.bits >= imp.cost && gs.installedImplants.length < gs.maxImplantSlots) {
              gs.setInstalledImplants(prev => [...prev, { id, battlesLeft: 10 }]); 
              gs.setBits(b => b - imp.cost);
            }
          }} 
        />
      );
    }

    if (gs.currentView === 'DECK_BUILDER') {
      return (
        <DeckBuilder 
          skillMode={gs.skillMode} 
          inventoryUnique={gs.inventoryUnique} 
          activeDeck={gs.activeDeck} 
          sessionMode={gs.sessionMode}
          coopRole={gs.coopRole}
          devLanguageStack={gs.devLanguageStack}
          onUpdateDeck={gs.setActiveDeck} 
          onViewChange={(v, id) => { 
            gs.setLastView(gs.currentView); 
            gs.setCurrentView(v); 
            if (id) gs.setSelectedDocId(id); 
          }} 
        />
      );
    }

    if (gs.currentView === 'REFERENCE') {
      return (
        <Documentation 
          discoveredCardIds={new Set([...Array.from(gs.discoveredCardIds), ...gs.activeDeck.map((c) => c.id)])} 
          initialEntryId={gs.selectedDocId} 
          onBack={() => { gs.setCurrentView(gs.lastView); gs.setSelectedDocId(null); }} 
          solvedChains={gs.solvedChains}
          sessionMode={gs.sessionMode}
          coopRole={gs.coopRole}
          devLanguageStack={gs.devLanguageStack}
        />
      );
    }

    if (gs.currentView === 'QUEST_LOG') {
      return (
        <QuestLog 
          questStates={gs.questStates} 
          onBack={() => gs.setCurrentView('HUB')} 
        />
      );
    }

    if (gs.currentView === 'INTEL') {
      return (
        <IntelView 
          reputation={gs.reputation} 
          discoveredIntel={gs.discoveredIntel} 
          onBack={() => gs.setCurrentView('HUB')} 
        />
      );
    }

    if (gs.currentView === 'NEON_SERVICES') {
      return (
        <NeonServicesHub
          onIceReward={(bits) => gs.setBits((b) => b + bits)}
          onBack={() => {
            window.location.hash = '';
            gs.setCurrentView('HUB');
          }}
        />
      );
    }

    // Default: Return Hub View
    const coopWeek = gs.sessionMode === 'coop' ? coopThemeForWorldDay(gs.worldDay) : null;
    const coopTierCleared =
      gs.sessionMode === 'coop'
        ? countCoopTierMissionsCleared(gs.coopYardCompletedMissionIds, gs.coopTierRank)
        : 0;
    const coopTierNeed =
      gs.sessionMode === 'coop' ? coopMissionsRequiredForBoss(gs.coopTierRank) : 0;
    const startupLbRows =
      gs.sessionMode === 'coop'
        ? buildMergedStartupLeaderboard({
            startupName: gs.coopStartupName?.trim() || gs.playerName || 'STARTUP',
            clearedTierMissions: coopTierCleared,
            bits: gs.bits,
            tierRank: gs.coopTierRank,
          })
        : [];

    return (
      <HubView
        playerName={gs.playerName}
        homeDistrict={gs.homeDistrict}
        stress={gs.stress}
        maxStress={gs.maxStress}
        deckCores={gs.deckCores}
        deckRamMb={gs.deckRamMb}
        bits={gs.bits}
        classUnlocked={gs.classUnlocked}
        profession={gs.profession}
        solvedTaskCounts={gs.solvedTaskCounts}
        completedQuestCount={gs.completedQuestCount}
        bitsFromQuests={gs.bitsFromQuests}
        canUnlockNow={gs.canUnlockNow}
        activeDeck={gs.activeDeck}
        inventoryUnique={gs.inventoryUnique}
        questStates={gs.questStates}
        exploitCount={gs.solvedChains.length}
        tutorialCompleted={gs.questStates.some((q) => q.questId === 'q_trainee_exam_practice' && q.status === 'completed')}
        worldDay={gs.worldDay}
        dayPhase={gs.dayPhase}
        gameTimeLabel={gs.gameClock.timeLabel}
        phaseLabelRu={gs.gameClock.phaseLabelRu}
        trustedNpcContacts={gs.trustedNpcContacts}
        messengerFeed={gs.messengerFeed}
        knownDistrictChannels={gs.knownDistrictChannels}
        unlockedDistrictChannels={gs.unlockedDistrictChannels}
        activeMessengerChannel={gs.activeMessengerChannel}
        barContactDistricts={gs.barContactDistricts}
        onSendMessengerPing={gs.sendMessengerPing}
        onSelectMessengerChannel={gs.setActiveMessengerChannel}
        onUnlockChannelByBits={(districtId: string) => { gs.unlockDistrictChannel(districtId, 'buy'); }}
        onUnlockChannelByQuest={(districtId: string) => { gs.unlockDistrictChannel(districtId, 'quest'); }}
        canUnlockChannelByQuest={gs.canUnlockDistrictChannelByQuest}
        onNavigateToView={(view: string) => gs.setCurrentView(view as ViewType)}
        onNavigateToBarNode={(nodeId: string) => { gs.setActiveBarNode(nodeId); gs.setCurrentView('FIXER_BAR'); }}
        sessionMode={gs.sessionMode}
        coopRole={gs.coopRole}
        onSwitchCoopClass={gs.switchCoopClass}
        onSwitchSessionMode={gs.switchSessionMode}
        onReturnToSessionGate={gs.returnToSessionGate}
        coopWeekTheme={coopWeek}
        coopYardProgress={
          gs.sessionMode === 'coop'
            ? { cleared: coopTierCleared, required: coopTierNeed, tierLabel: gs.coopTierRank }
            : null
        }
        coopStartupLeaderboard={startupLbRows}
        onRefreshCoopStartupLeaderboard={refreshCoopStartupLb}
      />
    );
  };

  const navigateView = (view: ViewType) => {
    if (view === 'NEON_SERVICES') {
      window.location.hash = 'services';
    } else if (window.location.hash.replace(/^#/, '').startsWith('services')) {
      window.location.hash = '';
    }
    gs.setCurrentView(view);
  };

  const hideNav = ['SESSION_GATE', 'CREATION', 'COOP_LOBBY', 'NRI_LOBBY', 'FIXER_BAR', 'COMBAT'].includes(gs.currentView);

  if (gs.isLoading) return <div className="loading-screen mono-text">[ LOADING_NEURAL_BUS... ]</div>;
  if (!gs.user) return <AuthForm />;

  return (
    <div className="app-root main-crt">
      {!hideNav && (
        <ResponsiveNav 
          currentView={gs.currentView} 
          onViewChange={(v) => navigateView(v as ViewType)} 
          hp={gs.stress} 
          level={gs.classUnlocked ? 5 : 1} 
          maxStress={gs.maxStress} 
          onLogout={gs.logout}
          gameClockLine={`${gs.gameClock.timeLabel} · ${gs.gameClock.phaseLabelRu} · Д${gs.worldDay}`}
        />
      )}
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

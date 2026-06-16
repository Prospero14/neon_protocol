import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { parseSkillMode, SKILL_MODE_STORAGE_KEY, type SkillMode } from '../skillMode';
import { NPC_PRESENCE_CONFIGS, isNpcAvailableInPhase } from '../npcPresence';
import type { Trait } from '../traits';
import { MAP_NODES, type CombatPack, type MapNodeData } from '../mapData';
import { publicChatNickForSeed, randomPublicChatNick, sanitizeMessengerFeed } from '../messengerDisplay';
import { getDistrictChatterPools } from '../messengerChatterPools';
import { PROFESSIONS, getProfessionById, type Profession } from '../professions';
import type { CombatCard } from '../combatCards';
import { CARD_LIBRARY, getCardById } from '../combatCards';
import { buildTraineeDeck } from '../traineeDeck';
import { SPRING_CARD_LIBRARY } from '../springCards';
import type { QuestState } from '../questEngine';
import { getTrackedQuest, acceptQuest, completeQuest, markQuestReady } from '../questEngine';
import { useAuth } from '../AuthContext';
import { readNeonAuthToken } from '../authTokenStorage';
import { nriCreateSession, nriJoinSession, parseNriInviteFromHash } from '../nriApi';
import {
  isSoloCoopBlockedForUser,
  markNriInviteGuestFromLanding,
  readLandingNriInviteCode,
  readNriGuestInviteCode,
} from '../nriFeatureFlags';
import { canUnlockClass } from '../preClassProgression';
import { QUEST_LIBRARY, type QuestDefinition } from '../questData';
import { applyBitModifiers, baseQuestBits } from '../economy';
import { rollLoot } from '../lootTables';
import { ITEM_LIBRARY, getItemById, type GameItem } from '../items';
import type { NpcDayPhase } from '../npcPresence';
import { getGameClockSnapshot, MS_PER_GAME_HOUR, type GameClockSnapshot } from '../gameClock';
import type { SessionMode, CoopRole, DevLanguageStack } from '../sessionMode';
import { buildStarterDeckForSession, COOP_ROLES } from '../sessionMode';
import { bossTaskIdForTier, nextCoopTierRank } from '../coopYardRuntime';
import {
  coopRewardCardIdsForSegment,
  coopSegmentBitsBonus,
  shouldGrantCoopSegmentReward,
} from '../coopLobbyRewards';
import {
  COOP_PROFILES_STORAGE_KEY,
  applyCoopClassSave,
  defaultCoopClassSave,
  migrateLegacyCoopToProfiles,
  serializeCoopClassSave,
  hydrateDeckFromIds,
  hydrateInventoryFromIds,
  type CoopClassSave,
} from '../coopClassProfiles';
import type { CoopSquadFill } from '../coopTeamFlow';
import { isCoopSquadFill } from '../coopTeamFlow';


export type ViewType =
  | 'SESSION_GATE'
  | 'CREATION'
  | 'COOP_LOBBY'
  | 'HUB'
  | 'MAP'
  | 'COMBAT'
  | 'CHARACTER'
  | 'DECK_BUILDER'
  | 'REFERENCE'
  | 'FIXER_BAR'
  | 'QUEST_LOG'
  | 'INTEL'
  | 'NEON_SERVICES'
  | 'NRI_LOBBY';

/** Флаги «соло / кооп персонаж» для экрана входа и мастера создания. */
export type CreationResumeInfo = {
  /** Есть сохранённый соло-персонаж (имя + дом, флаг или снимок колоды). */
  soloPersonaExists: boolean;
  /** @deprecated используйте soloPersonaExists */
  soloEstablished: boolean;
  coopEstablished: boolean;
  existingCoopRoles: CoopRole[];
  soloOnlyNeedsCoop: boolean;
  coopOnlyNeedsSolo: boolean;
  bothEstablished: boolean;
};

/** Снимок соло-колоды/инвентаря, пока активна сессия коопа (корневые activeDeck перезаписываются). */
export type SoloRuntimeCache = {
  deckIds: string[];
  inventoryIds: string[];
  discoveredCardIds: string[];
};

function parseSoloRuntimeCache(raw: unknown): SoloRuntimeCache | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.deckIds) || !Array.isArray(o.inventoryIds)) return null;
  return {
    deckIds: o.deckIds.filter((x): x is string => typeof x === 'string'),
    inventoryIds: o.inventoryIds.filter((x): x is string => typeof x === 'string'),
    discoveredCardIds: Array.isArray(o.discoveredCardIds)
      ? o.discoveredCardIds.filter((x): x is string => typeof x === 'string')
      : [],
  };
}

function serializeSoloRuntimeCache(params: {
  activeDeck: CombatCard[];
  inventoryUnique: CombatCard[];
  discoveredCardIds: Set<string>;
}): SoloRuntimeCache {
  return {
    deckIds: params.activeDeck.map((c) => c.id),
    inventoryIds: params.inventoryUnique.map((c) => c.id),
    discoveredCardIds: [...params.discoveredCardIds].sort(),
  };
}

function snapshotCoopProfilesFromSave(
  gs: Record<string, unknown>,
  userId: string | undefined,
): Partial<Record<CoopRole, CoopClassSave>> {
  try {
    const fromGs = gs.coopClassProfiles as Partial<Record<CoopRole, CoopClassSave>> | undefined;
    if (fromGs && typeof fromGs === 'object' && !Array.isArray(fromGs) && Object.keys(fromGs).length > 0) {
      return fromGs;
    }
    if (userId) {
      const raw = localStorage.getItem(COOP_PROFILES_STORAGE_KEY(userId));
      if (raw) return JSON.parse(raw) as Partial<Record<CoopRole, CoopClassSave>>;
    }
  } catch {
    /* ignore */
  }
  const mig = migrateLegacyCoopToProfiles(gs as never);
  return mig && Object.keys(mig).length > 0 ? mig : {};
}

function coopProfilesHaveDecks(p: Partial<Record<CoopRole, CoopClassSave>>): boolean {
  return COOP_ROLES.some((r) => (p[r]?.deckIds?.length ?? 0) > 0);
}

export interface MessengerMessage {
  id: string;
  from: string;
  text: string;
  channelId?: string;
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

export { buildTraineeDeck } from '../traineeDeck';

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
  /** Анти-повтор для автосообщений публичного чата (последние тексты). */
  const recentPublicChatterTextsRef = useRef<string[]>([]);
  /** Анти-повтор по каждому району отдельно (чтобы один и тот же шаблон не спамился подряд). */
  const recentPublicChatterByChannelRef = useRef<Record<string, string[]>>({});

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(() => setUserIp('127.0.0.1 (VPN_ACTIVE)'));
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>('SESSION_GATE');
  const [creationResume, setCreationResume] = useState<CreationResumeInfo | null>(null);
  const [creationWizardLockedMode, setCreationWizardLockedMode] = useState<SessionMode | null>(null);
  const [hasSoloPersona, setHasSoloPersona] = useState(false);
  const soloRuntimeCacheRef = useRef<SoloRuntimeCache | null>(null);
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
  /** Соло или кооп; в коопе выбранная роль задаёт стартовую колоду. */
  const [sessionMode, setSessionMode] = useState<SessionMode>('solo');
  const [coopRole, setCoopRole] = useState<CoopRole | null>(null);
  const [devLanguageStack, setDevLanguageStack] = useState<DevLanguageStack | null>(null);
  const [coopStartupName, setCoopStartupName] = useState<string | null>(null);
  /** Ранг миссий полигона (задаёт PM при старте коопа). */
  const [coopTierRank, setCoopTierRank] = useState<SkillMode>('junior');
  /** Id завершённых ТЗ coop_yard (включая боссов). */
  const [coopYardCompletedMissionIds, setCoopYardCompletedMissionIds] = useState<string[]>([]);
  /** Подряд неудачных кооп-боёв (релизов); победа сбрасывает. */
  const [coopSprintConsecutiveLosses, setCoopSprintConsecutiveLosses] = useState(0);
  const [coopStartupLiquidated, setCoopStartupLiquidated] = useState(false);
  /** Пати из людей vs симуляция союзников-ботов на одном клиенте. */
  const [coopSquadFill, setCoopSquadFill] = useState<CoopSquadFill>('synthetic_bots');
  /** ID общего матча пати (сетевой кооп), если создан хостом. */
  const [coopMatchId, setCoopMatchId] = useState<string | null>(null);
  const [nriInviteCode, setNriInviteCode] = useState<string | null>(null);
  const [pendingNriInvite, setPendingNriInvite] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    markNriInviteGuestFromLanding();
    return readLandingNriInviteCode() ?? parseNriInviteFromHash(window.location.hash);
  });
  /** Снимки по классам коопа: колода, инвентарь, прогресс полигона (соло не использует). */
  const [coopClassProfiles, setCoopClassProfiles] = useState<Partial<Record<CoopRole, CoopClassSave>>>({});
  const coopClassProfilesRef = useRef<Partial<Record<CoopRole, CoopClassSave>>>({});
  useEffect(() => {
    coopClassProfilesRef.current = coopClassProfiles;
  }, [coopClassProfiles]);

  const openCharacterWizard = useCallback((mode: SessionMode) => {
    if ((mode === 'solo' || mode === 'coop') && isSoloCoopBlockedForUser(user?.username)) {
      setCurrentView('SESSION_GATE');
      return;
    }
    setCreationWizardLockedMode(mode);
    setCurrentView('CREATION');
  }, [user?.username]);

  const cancelCharacterWizard = useCallback(() => {
    setCreationWizardLockedMode(null);
    setCurrentView('SESSION_GATE');
  }, []);
  const coopTierRankRef = useRef(coopTierRank);
  const coopRoleRef = useRef(coopRole);
  useEffect(() => {
    coopTierRankRef.current = coopTierRank;
  }, [coopTierRank]);
  useEffect(() => {
    coopRoleRef.current = coopRole;
  }, [coopRole]);
  const [inventory, setInventory] = useState<CombatCard[]>(() => initialMergedInventory());
  const [activeDeck, setActiveDeck] = useState<CombatCard[]>(() => buildTraineeDeck());
  const [loot, setLoot] = useState<GameItem[]>([]);
  const [questStates, setQuestStates] = useState<QuestState[]>([]);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [bitsFromQuests, setBitsFromQuests] = useState(0);
  /** Реальное время, когда игрок был на 00:00 игрового дня 1. Сохраняется в синк. */
  const [clockAnchorMs, setClockAnchorMs] = useState<number | null>(null);
  /** Тик раз в секунду для обновления часов. */
  const [clockTick, setClockTick] = useState(0);
  
  const [isPetrovichHomeUnlocked, setIsPetrovichHomeUnlocked] = useState(false);
  const [npcPresenceMap, setNpcPresenceMap] = useState<Record<string, 'HOME' | 'AWAY'>>({});
  const [nodeCooldowns, setNodeCooldowns] = useState<Record<string, number>>({});
  const [trustedNpcContacts, setTrustedNpcContacts] = useState<string[]>([]);
  const [messengerFeed, setMessengerFeed] = useState<MessengerMessage[]>([]);
  const [knownDistrictChannels, setKnownDistrictChannels] = useState<string[]>([]);
  const [unlockedDistrictChannels, setUnlockedDistrictChannels] = useState<string[]>([]);
  const [activeMessengerChannel, setActiveMessengerChannel] = useState<string>('altufyevo');
  const [barContactDistricts, setBarContactDistricts] = useState<string[]>([]);

  const inventoryUnique = useMemo(() => {
    const map = new Map<string, CombatCard>();
    inventory.forEach((c) => { if (!map.has(c.id)) map.set(c.id, c); });
    return [...map.values()];
  }, [inventory]);

  const [discoveredCardIds, setDiscoveredCardIds] = useState<Set<string>>(new Set(activeDeck.map((c) => c.id)));
  const discoverCard = (id: string) => setDiscoveredCardIds((prev) => new Set(prev).add(id));

  const getDistrictByNodeId = useCallback((nodeId: string): string | null => {
    const district = MAP_NODES.find((d) => d.id === nodeId);
    if (district) return district.id;
    for (const d of MAP_NODES) {
      if (d.subNodes?.some((s) => s.id === nodeId)) return d.id;
    }
    return null;
  }, []);

  const ensureKnownDistrictChannel = useCallback((districtId: string) => {
    if (!districtId) return;
    setKnownDistrictChannels((prev) => (prev.includes(districtId) ? prev : [...prev, districtId]));
  }, []);

  const postMessengerMessages = useCallback((messages: MessengerMessage[]) => {
    if (!messages.length) return;
    setMessengerFeed((prev) => sanitizeMessengerFeed([...messages, ...prev]).slice(0, 240));
  }, []);

  const postSystemMessage = useCallback((channelId: string, text: string) => {
    postMessengerMessages([
      { id: `msg_sys_${Date.now()}_${Math.random()}`, from: 'SYSTEM', text, channelId, isSpam: false }
    ]);
  }, [postMessengerMessages]);

  const postDistrictRumor = useCallback((params: {
    districtId?: string;
    outcome: 'quest_completed' | 'combat_win' | 'combat_fail';
    subject?: string;
  }) => {
    const districtId = params.districtId && unlockedDistrictChannels.includes(params.districtId)
      ? params.districtId
      : (unlockedDistrictChannels[0] || homeDistrictId);
    if (!districtId) return;

    const localKnown = trustedNpcContacts.length > 0;
    const playerAlias = localKnown ? playerName : 'кто-то';
    const byKnownNpc = localKnown && Math.random() < 0.7;
    const contactId = byKnownNpc
      ? trustedNpcContacts[Math.floor(Math.random() * trustedNpcContacts.length)]
      : '';
    const from = contactId ? publicChatNickForSeed(contactId) : randomPublicChatNick();
    const districtMeta = MAP_NODES.find((d) => d.id === districtId);
    const factionTag = (districtMeta?.dominantFactionId || 'LOCAL_NET').replaceAll('_', ' ');

    const rumorPools: Record<'quest_completed' | 'combat_win' | 'combat_fail', string[]> = {
      quest_completed: [
        `Кто-то писал, что ${playerAlias} закрыл "${params.subject || 'местный заказ'}" без шума.`,
        `${playerAlias} вроде дожал "${params.subject || 'эту работу'}" — логи чистые, говорят.`,
        `В ленте мелькало: ${playerAlias} аккуратно сдал "${params.subject || 'контракт'}".`,
      ],
      combat_win: [
        `Пишут, ${playerAlias} вышел из "${params.subject || 'стычки'}" целым.`,
        `${playerAlias} разобрался в "${params.subject || 'этой миссии'}" — кому-то не повезло.`,
        `Кто-то видел, как ${playerAlias} после "${params.subject || 'боя'}" снова в сети.`,
      ],
      combat_fail: [
        `Говорят, ${playerAlias} не вывез "${params.subject || 'эту попытку'}" и откатился.`,
        `Кто-то видел, как ${playerAlias} сорвал "${params.subject || 'узел'}" и смылся.`,
        `В чате шутят, что ${playerAlias} то ли провалил "${params.subject || 'операцию'}", то ли сам отвалился.`,
      ],
    };
    const factionActionRumors = [
      `[FACTION] ${factionTag}: запускают ночной фильтр трафика, часть узлов уже в серой зоне.`,
      `[FACTION] ${factionTag}: подняли проверку ключей на входе, случайные ники режут первыми.`,
      `[FACTION] ${factionTag}: спорят о переделе маршрутов, локальные шлюзы дергает каждые 10 минут.`,
      `[FACTION] ${factionTag}: зачистка витрин от нелегальных лотов, продавцы ушли в приват.`,
      `[FACTION] ${factionTag}: временная квота на исходящие пакеты, готовьте обход.`,
      `[FACTION] ${factionTag}: усиливают контроль в районе, лишние сканы могут триггерить ICE.`,
      `[FACTION] ${factionTag}: слухи о точечной рейд-проверке терминалов этой ночью.`,
      `[FACTION] ${factionTag}: кто-то протолкнул новый регламент, трафик сжимают жёстче.`,
    ];

    const baseText = rumorPools[params.outcome][Math.floor(Math.random() * rumorPools[params.outcome].length)];
    const text = Math.random() < 0.45
      ? factionActionRumors[Math.floor(Math.random() * factionActionRumors.length)]
      : baseText;
    postMessengerMessages([{
      id: `msg_rumor_${Date.now()}_${Math.random()}`,
      from,
      text,
      channelId: districtId,
      isSpam: false,
    }]);
  }, [unlockedDistrictChannels, homeDistrictId, trustedNpcContacts, playerName, postMessengerMessages]);

  const tryAutopostNpcChatter = useCallback((channelId: string) => {
    if (!unlockedDistrictChannels.includes(channelId)) return;
    if (Math.random() > 0.78) return;
    const districtMeta = MAP_NODES.find((d) => d.id === channelId);
    const factionName = (districtMeta?.dominantFactionId || 'LOCAL_NET').replaceAll('_', ' ');
    const tag = `#${channelId.replaceAll('_', '-').toUpperCase()}`;
    const { casual, vendor, spam } = getDistrictChatterPools(factionName, tag);
    const normalizeChatterSignature = (value: string): string => value
      .toLowerCase()
      .replace(/\[реклама\]\s*/gi, '')
      .replace(/\d+/g, '#')
      .replace(/[^\p{L}\p{N}\s#]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const recent = recentPublicChatterTextsRef.current;
    const recentWindow = recent.slice(-20);
    const channelRecent = recentPublicChatterByChannelRef.current[channelId] ?? [];
    const globalSignatures = new Set(recentWindow.map(normalizeChatterSignature));
    const channelSignatures = new Set(channelRecent.map(normalizeChatterSignature));
    let text = casual[0];
    for (let attempt = 0; attempt < 24; attempt++) {
      const useSpam = Math.random() < 0.18;
      const useVendor = !useSpam && Math.random() < 0.11;
      const pool = useSpam ? spam : (useVendor ? vendor : casual);
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      const signature = normalizeChatterSignature(candidate);
      if ((!globalSignatures.has(signature) && !channelSignatures.has(signature)) || attempt >= 20) {
        text = candidate;
        break;
      }
    }
    recentPublicChatterTextsRef.current = [...recent.slice(-72), text];
    recentPublicChatterByChannelRef.current[channelId] = [...channelRecent.slice(-24), text];
    postMessengerMessages([
      {
        id: `msg_chatter_${Date.now()}_${Math.random()}`,
        from: randomPublicChatNick(),
        text,
        channelId,
        isSpam: text.startsWith('[РЕКЛАМА]'),
      }
    ]);
  }, [postMessengerMessages, unlockedDistrictChannels]);

  const canUnlockDistrictChannelByQuest = useCallback((districtId: string) => {
    return questStates.some((qs) => {
      if (qs.status !== 'completed') return false;
      const q = QUEST_LIBRARY.find((def) => def.id === qs.questId);
      return q?.districtId === districtId;
    });
  }, [questStates]);

  const unlockDistrictChannel = useCallback((districtId: string, source: 'buy' | 'quest') => {
    if (!districtId) return false;
    if (!barContactDistricts.includes(districtId)) return false;
    if (unlockedDistrictChannels.includes(districtId)) return true;
    if (source === 'buy') {
      const unlockCost = 120;
      if (bits < unlockCost) return false;
      setBits((prev) => prev - unlockCost);
    } else if (!canUnlockDistrictChannelByQuest(districtId)) {
      return false;
    }
    setUnlockedDistrictChannels((prev) => [...prev, districtId]);
    setActiveMessengerChannel(districtId);
    postSystemMessage(districtId, source === 'buy'
      ? 'BARMAN: доступ к районному каналу активирован через платный шлюз.'
      : 'BARMAN: доступ к районному каналу активирован за локальный контракт.');
    tryAutopostNpcChatter(districtId);
    return true;
  }, [barContactDistricts, unlockedDistrictChannels, bits, canUnlockDistrictChannelByQuest, postSystemMessage, tryAutopostNpcChatter]);
  useEffect(() => {
    const id = window.setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const gameClock = useMemo<GameClockSnapshot>(
    () => getGameClockSnapshot(clockAnchorMs, Date.now()),
    [clockAnchorMs, clockTick]
  );
  const worldDay = gameClock.worldDay;
  const dayPhase: NpcDayPhase = gameClock.phase;

  useEffect(() => {
    if (!homeDistrictId) return;
    setKnownDistrictChannels((prev) => {
      if (prev.length === 0) return [homeDistrictId];
      if (!prev.includes(homeDistrictId)) return [homeDistrictId, ...prev];
      if (prev[0] === homeDistrictId) return prev;
      return [homeDistrictId, ...prev.filter((id) => id !== homeDistrictId)];
    });
    setUnlockedDistrictChannels((prev) => {
      if (prev.length === 0) return [homeDistrictId];
      if (!prev.includes(homeDistrictId)) return [homeDistrictId, ...prev];
      return prev;
    });
    setActiveMessengerChannel((prev) => {
      if (!prev || !MAP_NODES.some((n) => n.id === prev)) return homeDistrictId;
      return prev;
    });
  }, [homeDistrictId]);

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

  const syncGame = async (overrides: Record<string, unknown> = {}) => {
    if (!user) return;
    const nextSoloRuntimeCache =
      sessionMode === 'solo'
        ? serializeSoloRuntimeCache({
            activeDeck,
            inventoryUnique,
            discoveredCardIds,
          })
        : soloRuntimeCacheRef.current;
    if (sessionMode === 'solo') {
      soloRuntimeCacheRef.current = nextSoloRuntimeCache;
    }
    const state = {
      stress, maxStress, bits, solvedTaskCounts,
      activeDeck: activeDeck.map(c => ({ id: c.id })),
      inventory: inventoryUnique.map(c => ({ id: c.id })),
      completedQuests: questStates,
      ramPool: ramPool,
      homeDistrictId: homeDistrictId,
      activeDistrictId: activeDistrictId,
      activeBarNode: activeBarNode,
      viewMode: viewMode,
      traits: traits,
      installedImplants: installedImplants,
      reputation: reputation,
      sessionMode,
      coopRole,
      devLanguageStack,
      coopStartupName,
      coopTierRank,
      coopYardCompletedMissionIds,
      coopSprintConsecutiveLosses,
      coopStartupLiquidated,
      coopSquadFill: sessionMode === 'coop' ? coopSquadFill : undefined,
      coopMatchId: sessionMode === 'coop' ? coopMatchId : undefined,
      nriInviteCode: sessionMode === 'nri' ? nriInviteCode : undefined,
      coopClassProfiles: sessionMode === 'coop' ? coopClassProfiles : undefined,
      playerName: playerName,
      isCityMapUnlocked: isCityMapUnlocked,
      isPetrovichHomeUnlocked: isPetrovichHomeUnlocked,
      professionId: profession.id,
      classUnlocked: classUnlocked,
      deckCores: deckCores,
      deckRamMb: deckRamMb,
      discoveredCardIds: Array.from(discoveredCardIds),
      worldDay: gameClock.worldDay,
      clockAnchorMs,
      trustedNpcContacts,
      messengerFeed,
      knownDistrictChannels,
      unlockedDistrictChannels,
      activeMessengerChannel,
      barContactDistricts,
      currentView,
      hasSoloPersona,
      soloRuntimeCache: nextSoloRuntimeCache ?? undefined,
      ...overrides
    };
    await syncGameState(state);
  };

  useEffect(() => {
    if (!user?.id) {
      setCreationResume(null);
      setCreationWizardLockedMode(null);
      soloRuntimeCacheRef.current = null;
      setHasSoloPersona(false);
      return;
    }
    if (!user.gameState) {
      setCreationResume(null);
      setCurrentView('SESSION_GATE');
      return;
    }
    const gs = user.gameState;
    const soloRtcParsed = parseSoloRuntimeCache((gs as Record<string, unknown>).soloRuntimeCache);
    if (soloRtcParsed && soloRtcParsed.deckIds.length > 0) {
      soloRuntimeCacheRef.current = soloRtcParsed;
    }
    const resumeProfiles = snapshotCoopProfilesFromSave(gs as Record<string, unknown>, user.id);
    if (Object.keys(resumeProfiles).length > 0) {
      setCoopClassProfiles(resumeProfiles);
    }
    if (gs.stress !== undefined) setStress(gs.stress);
      if (gs.maxStress !== undefined) setMaxStress(gs.maxStress);
      if (gs.bits !== undefined) setBits(gs.bits);
      if (gs.solvedTaskCounts !== undefined) setSolvedTaskCounts(gs.solvedTaskCounts);
      if (gs.ramPool !== undefined) setRamPool(gs.ramPool);
      if (gs.homeDistrictId !== undefined) {
        const validHome = MAP_NODES.find((n) => n.id === gs.homeDistrictId)?.id;
        if (validHome) {
          setHomeDistrictId(validHome);
          setHomeDistrict(MAP_NODES.find((n) => n.id === validHome) ?? null);
        }
      }
      
      if (gs.completedQuests) {
        setQuestStates(gs.completedQuests);
      }

      if (gs.activeDistrictId && MAP_NODES.some((n) => n.id === gs.activeDistrictId)) {
        setActiveDistrictId(gs.activeDistrictId);
      } else if (gs.homeDistrictId && MAP_NODES.some((n) => n.id === gs.homeDistrictId)) {
        setActiveDistrictId(gs.homeDistrictId);
      }

      const crEarly =
        gs.coopRole === 'devops'
          ? 'admin'
          : (gs.coopRole as CoopRole | undefined);
      let skipLegacyDeck = false;
      if (
        gs.sessionMode === 'coop' &&
        crEarly &&
        ['developer', 'qa', 'admin', 'pm'].includes(crEarly) &&
        Object.keys(resumeProfiles).length > 0
      ) {
        const save = resumeProfiles[crEarly];
        if (save) {
          const applied = applyCoopClassSave(save);
          setActiveDeck(applied.activeDeck);
          setInventory(applied.inventory);
          setCoopTierRank(applied.coopTierRank);
          setCoopYardCompletedMissionIds(applied.coopYardCompletedMissionIds);
          setDiscoveredCardIds(applied.discoveredCardIds);
          setDevLanguageStack(applied.devLanguageStack);
          setCoopSprintConsecutiveLosses(applied.coopSprintConsecutiveLosses);
          skipLegacyDeck = true;
        }
      }

      if (gs.activeDeck && !skipLegacyDeck) {
        const fullDeck = gs.activeDeck.map((c: any) => CARD_LIBRARY.find(l => l.id === c.id)).filter(Boolean) as CombatCard[];
        if (fullDeck.length > 0) setActiveDeck(fullDeck);
      }
      if (gs.inventory && !skipLegacyDeck) {
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

      const hasHome = Boolean(gs.homeDistrictId && MAP_NODES.some((n) => n.id === gs.homeDistrictId));
      const named = Boolean(gs.playerName && gs.playerName !== 'ID_НЕИЗВЕСТЕН');
      const smRaw = gs.sessionMode as SessionMode | undefined;
      const coopEstablished = coopProfilesHaveDecks(resumeProfiles);
      const soloRtc = soloRuntimeCacheRef.current;
      const soloPersonaExists =
        Boolean((gs as Record<string, unknown>).hasSoloPersona) ||
        (hasHome && named && smRaw !== 'coop') ||
        Boolean(soloRtc && soloRtc.deckIds.length > 0);
      const soloEstablished = soloPersonaExists;
      const soloOnlyNeedsCoop = soloPersonaExists && !coopEstablished;
      const coopOnlyNeedsSolo = coopEstablished && !soloPersonaExists;
      const bothEstablished = soloPersonaExists && coopEstablished;
      const existingCoopRoles = COOP_ROLES.filter((r) => (resumeProfiles[r]?.deckIds?.length ?? 0) > 0);

      setHasSoloPersona(soloPersonaExists);

      const deepViews: ViewType[] = [
        'MAP',
        'COMBAT',
        'DECK_BUILDER',
        'FIXER_BAR',
        'QUEST_LOG',
        'INTEL',
        'REFERENCE',
        'NRI_LOBBY',
        'NEON_SERVICES',
      ];
      const savedView = gs.currentView as ViewType | undefined;
      const nriCodeRaw = (gs as { nriInviteCode?: unknown }).nriInviteCode;
      const nriCode = typeof nriCodeRaw === 'string' && nriCodeRaw.startsWith('NRI-') ? nriCodeRaw : null;
      const resumeNri = savedView === 'NRI_LOBBY' && nriCode;
      const blockedSoloCoop = isSoloCoopBlockedForUser(user.username);
      const viewsAllowedWhenBlocked: ViewType[] = ['NRI_LOBBY', 'NEON_SERVICES'];
      if (savedView && deepViews.includes(savedView)) {
        if (blockedSoloCoop && !viewsAllowedWhenBlocked.includes(savedView)) {
          setCurrentView('SESSION_GATE');
        } else {
          setCurrentView(savedView);
        }
      } else {
        setCurrentView('SESSION_GATE');
      }

      setCreationResume({
        soloPersonaExists,
        soloEstablished,
        coopEstablished,
        existingCoopRoles,
        soloOnlyNeedsCoop,
        coopOnlyNeedsSolo,
        bothEstablished,
      });

      if (gs.traits) setTraits(gs.traits);
      if (resumeNri) {
        setSessionMode('nri');
        setNriInviteCode(nriCode);
      } else if (!blockedSoloCoop && gs.sessionMode === 'coop') {
        setSessionMode('coop');
        setNriInviteCode(null);
      } else if (!blockedSoloCoop && gs.sessionMode === 'solo') {
        setSessionMode('solo');
        setNriInviteCode(null);
      } else {
        setSessionMode('solo');
        setNriInviteCode(null);
      }
      const crRaw = gs.coopRole as string | undefined;
      const cr =
        crRaw === 'devops'
          ? 'admin'
          : (crRaw as CoopRole | undefined);
      if (cr && ['developer', 'qa', 'admin', 'pm'].includes(cr)) setCoopRole(cr);
      if (!skipLegacyDeck) {
        const ds = gs.devLanguageStack as DevLanguageStack | undefined;
        if (ds === 'java' || ds === 'kotlin' || ds === 'python' || ds === 'go') setDevLanguageStack(ds);
      }
      if (typeof gs.coopStartupName === 'string' && gs.coopStartupName.length > 0) setCoopStartupName(gs.coopStartupName);
      const csf = (gs as { coopSquadFill?: unknown }).coopSquadFill;
      if (isCoopSquadFill(csf)) setCoopSquadFill(csf);
      const cmid = (gs as { coopMatchId?: unknown }).coopMatchId;
      if (typeof cmid === 'string' && cmid.length > 0) setCoopMatchId(cmid);
      if (!skipLegacyDeck) {
        const tr = gs.coopTierRank as SkillMode | undefined;
        if (tr === 'script-kiddie' || tr === 'junior' || tr === 'mid' || tr === 'senior') setCoopTierRank(tr);
        if (Array.isArray(gs.coopYardCompletedMissionIds)) {
          setCoopYardCompletedMissionIds(gs.coopYardCompletedMissionIds.filter((x: unknown) => typeof x === 'string'));
        }
        if (typeof gs.coopSprintConsecutiveLosses === 'number' && gs.coopSprintConsecutiveLosses >= 0) {
          setCoopSprintConsecutiveLosses(gs.coopSprintConsecutiveLosses);
        }
      }
      if (gs.coopStartupLiquidated === true) setCoopStartupLiquidated(true);
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
      if (gs.discoveredCardIds && !skipLegacyDeck) setDiscoveredCardIds(new Set(gs.discoveredCardIds));
      if (typeof gs.clockAnchorMs === 'number' && !Number.isNaN(gs.clockAnchorMs)) {
        setClockAnchorMs(gs.clockAnchorMs);
      } else {
        const wd = typeof gs.worldDay === 'number' ? gs.worldDay : 1;
        const tick = typeof gs.dayTick === 'number' ? gs.dayTick : 0;
        const hoursIntoCampaign = (wd - 1) * 24 + (tick / 8) * 24;
        setClockAnchorMs(Date.now() - hoursIntoCampaign * MS_PER_GAME_HOUR);
      }
      if (gs.trustedNpcContacts) setTrustedNpcContacts(gs.trustedNpcContacts);
      if (gs.messengerFeed) setMessengerFeed(sanitizeMessengerFeed(gs.messengerFeed as MessengerMessage[]));
      if (gs.barContactDistricts) setBarContactDistricts(gs.barContactDistricts);

      // Self-heal: older/corrupted saves may keep fallback district.
      const healedHome = (gs.homeDistrictId && MAP_NODES.some((n) => n.id === gs.homeDistrictId))
        ? gs.homeDistrictId
        : (gs.activeDistrictId && MAP_NODES.some((n) => n.id === gs.activeDistrictId))
          ? gs.activeDistrictId
          : homeDistrictId;
      if (healedHome && healedHome !== homeDistrictId) {
        setHomeDistrictId(healedHome);
        setHomeDistrict(MAP_NODES.find((n) => n.id === healedHome) ?? null);
      }
      if (healedHome && (!gs.activeDistrictId || !MAP_NODES.some((n) => n.id === gs.activeDistrictId))) {
        setActiveDistrictId(healedHome);
      }

      const isValidDistrictId = (id: unknown): id is string =>
        typeof id === 'string' && MAP_NODES.some((n) => n.id === id);
      const homeForMessenger = isValidDistrictId(gs.homeDistrictId)
        ? gs.homeDistrictId
        : isValidDistrictId(gs.activeDistrictId)
          ? gs.activeDistrictId
          : healedHome;
      const knownRaw = Array.isArray(gs.knownDistrictChannels)
        ? (gs.knownDistrictChannels as unknown[]).filter(isValidDistrictId)
        : [];
      const known =
        knownRaw.length === 0
          ? [homeForMessenger]
          : knownRaw.includes(homeForMessenger)
            ? [homeForMessenger, ...knownRaw.filter((id) => id !== homeForMessenger)]
            : [homeForMessenger, ...knownRaw];
      const unlockedRaw = Array.isArray(gs.unlockedDistrictChannels)
        ? (gs.unlockedDistrictChannels as unknown[]).filter(isValidDistrictId)
        : [];
      const unlocked =
        unlockedRaw.length === 0
          ? [homeForMessenger]
          : unlockedRaw.includes(homeForMessenger)
            ? unlockedRaw
            : [homeForMessenger, ...unlockedRaw];
      let nextActive: string = homeForMessenger;
      if (
        isValidDistrictId(gs.activeMessengerChannel) &&
        unlocked.includes(gs.activeMessengerChannel) &&
        knownRaw.includes(homeForMessenger)
      ) {
        nextActive = gs.activeMessengerChannel;
      }
      if (!knownRaw.includes(homeForMessenger)) {
        nextActive = homeForMessenger;
      }
      setKnownDistrictChannels(known);
      setUnlockedDistrictChannels(unlocked);
      setActiveMessengerChannel(nextActive);
      // Load exploits
      const exploitKey = `neon_exploit_db_${user?.id || 'anon'}`;
      const saved = localStorage.getItem(exploitKey);
      if (saved) {
        try {
          setSolvedChains(JSON.parse(saved));
        } catch {
          try {
            localStorage.removeItem(exploitKey);
          } catch {
            /* ignore */
          }
        }
      }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const h = window.location.hash.replace(/^#/, '').toLowerCase();
    if (h === 'services' || h.startsWith('services/')) {
      setCurrentView('NEON_SERVICES');
      return;
    }
    const nriCode = parseNriInviteFromHash(window.location.hash);
    if (nriCode) {
      setPendingNriInvite(nriCode);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const nriCode = parseNriInviteFromHash(window.location.hash);
    if (!nriCode) return;
    const authToken = readNeonAuthToken();
    if (!authToken) return;
    void (async () => {
      const data = await nriJoinSession(authToken, nriCode);
      if (!data) return;
      setSessionMode('nri');
      setNriInviteCode(nriCode);
      setCurrentView('NRI_LOBBY');
      void syncGameState({
        sessionMode: 'nri',
        nriInviteCode: nriCode,
        currentView: 'NRI_LOBBY',
      });
    })();
  }, [user?.id, syncGameState]);

  useEffect(() => {
    if (currentView !== 'CREATION' && currentView !== 'SESSION_GATE') syncGame();
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem(SKILL_MODE_STORAGE_KEY, skillMode);
  }, [skillMode]);

  // AUTO-SYNC ON CRITICAL CHANGES
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentView !== 'CREATION' && currentView !== 'SESSION_GATE') syncGame();
    }, 1500); // 1.5s debounce to prevent spamming
    return () => clearTimeout(timer);
  }, [
    bits, stress, questStates, traits, reputation, activeDeck, installedImplants, activeDistrictId,
    isCityMapUnlocked, clockAnchorMs, gameClock.worldDay, trustedNpcContacts, messengerFeed, knownDistrictChannels,
    unlockedDistrictChannels, activeMessengerChannel, barContactDistricts,
    sessionMode, coopRole, devLanguageStack, coopStartupName, coopTierRank, coopYardCompletedMissionIds,
    coopSprintConsecutiveLosses, coopStartupLiquidated, coopSquadFill, coopMatchId
  ]);

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

  const registerCoopYardMissionClear = useCallback(
    (missionTaskId: string) => {
      setCoopYardCompletedMissionIds((prev) => {
        if (prev.includes(missionTaskId)) return prev;
        const next = [...prev, missionTaskId];
        const tier = coopTierRankRef.current;
        const role = coopRoleRef.current;
        if (missionTaskId === bossTaskIdForTier(tier)) {
          const nxt = nextCoopTierRank(tier);
          if (nxt) setCoopTierRank(nxt);
        } else if (role) {
          const grant = shouldGrantCoopSegmentReward(missionTaskId, prev, next, tier);
          if (grant) {
            const bitBonus = coopSegmentBitsBonus(tier, grant.segmentIndex);
            setBits((b) => b + bitBonus);
            for (const id of coopRewardCardIdsForSegment(role, grant.segmentIndex)) {
              grantCardById(id);
            }
          }
        }
        return next;
      });
    },
    []
  );

  const completeCoopSprintLaunch = useCallback(
    (
      startupName: string,
      tierRank: SkillMode,
      opts?: { coopSquadFill?: CoopSquadFill; coopMatchId?: string | null }
    ) => {
      const trimmed = startupName.trim() || `SQUAD_${playerName.replace(/\s+/g, '_').slice(0, 24)}`;
      setCoopStartupName(trimmed);
      const fill: CoopSquadFill = opts?.coopSquadFill === 'live_party' ? 'live_party' : 'synthetic_bots';
      setCoopSquadFill(fill);
      const matchId = typeof opts?.coopMatchId === 'string' && opts.coopMatchId.trim() ? opts.coopMatchId : null;
      setCoopMatchId(matchId);
      if (tierRank === 'script-kiddie' || tierRank === 'junior' || tierRank === 'mid' || tierRank === 'senior') {
        setCoopTierRank(tierRank);
      }
      setActiveDistrictId('coop_yard');
      setActiveCombatPack('java_core');
      setActiveMessengerChannel('coop_yard');
      setCurrentView('MAP');
      syncGame({
        coopStartupName: trimmed,
        coopTierRank: tierRank,
        activeDistrictId: 'coop_yard',
        currentView: 'MAP',
        activeMessengerChannel: 'coop_yard',
        coopSquadFill: fill,
        coopMatchId: matchId,
      });
    },
    [playerName, syncGame]
  );

  const switchCoopClass = useCallback(
    (next: CoopRole) => {
      if (sessionMode !== 'coop' || next === coopRole) return;
      const merged: Partial<Record<CoopRole, CoopClassSave>> = { ...coopClassProfilesRef.current };
      if (coopRole) {
        merged[coopRole] = serializeCoopClassSave({
          activeDeck,
          inventoryUnique,
          coopTierRank,
          coopYardCompletedMissionIds,
          discoveredCardIds,
          devLanguageStack,
          coopSprintConsecutiveLosses,
        });
      }
      const fallbackStack =
        next === 'developer'
          ? merged.developer?.devLanguageStack ?? devLanguageStack ?? 'java'
          : null;
      const loaded = merged[next] ?? defaultCoopClassSave(next, fallbackStack);
      setCoopClassProfiles({ ...merged, [next]: loaded });
      setCoopRole(next);
      const applied = applyCoopClassSave(loaded);
      setActiveDeck(applied.activeDeck);
      setInventory(applied.inventory);
      setCoopTierRank(applied.coopTierRank);
      setCoopYardCompletedMissionIds(applied.coopYardCompletedMissionIds);
      setDiscoveredCardIds(applied.discoveredCardIds);
      setDevLanguageStack(applied.devLanguageStack);
      setCoopSprintConsecutiveLosses(applied.coopSprintConsecutiveLosses);
      syncGame({
        coopRole: next,
        devLanguageStack: applied.devLanguageStack,
        coopTierRank: applied.coopTierRank,
        coopYardCompletedMissionIds: applied.coopYardCompletedMissionIds,
        coopClassProfiles: { ...merged, [next]: loaded },
      });
    },
    [
      sessionMode,
      coopRole,
      activeDeck,
      inventoryUnique,
      coopTierRank,
      coopYardCompletedMissionIds,
      discoveredCardIds,
      devLanguageStack,
      coopSprintConsecutiveLosses,
      syncGame,
    ]
  );

  /** Переключение соло/кооп из хаба без перелогина; профили коопа сохраняются в coopClassProfiles. */
  const switchSessionMode = useCallback(
    (next: SessionMode, coopPick?: CoopRole) => {
      if (next === 'solo') {
        let mergedProfiles = coopClassProfilesRef.current;
        if (sessionMode === 'coop' && coopRole) {
          const snap = serializeCoopClassSave({
            activeDeck,
            inventoryUnique,
            coopTierRank,
            coopYardCompletedMissionIds,
            discoveredCardIds,
            devLanguageStack,
            coopSprintConsecutiveLosses,
          });
          mergedProfiles = { ...coopClassProfilesRef.current, [coopRole]: snap };
          setCoopClassProfiles(mergedProfiles);
        }
        setSessionMode('solo');
        setCoopRole(null);
        setNriInviteCode(null);
        setDevLanguageStack(null);
        setCoopStartupName(null);
        setCoopSquadFill('synthetic_bots');
        setCoopMatchId(null);
        const cached = soloRuntimeCacheRef.current;
        if (cached && cached.deckIds.length > 0) {
          const deck = hydrateDeckFromIds(cached.deckIds);
          const invUnique = hydrateInventoryFromIds(cached.inventoryIds);
          setActiveDeck(deck);
          setInventory(invUnique);
          setDiscoveredCardIds(new Set(cached.discoveredCardIds));
          deck.forEach((c) => discoverCard(c.id));
        } else {
          const deck = buildStarterDeckForSession('solo', null, null);
          setActiveDeck(deck);
          const invUnique = deck.filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
          setInventory(invUnique);
          setDiscoveredCardIds(new Set(invUnique.map((c) => c.id)));
          invUnique.forEach((c) => discoverCard(c.id));
        }
        setCurrentView('HUB');
        setActiveDistrictId(homeDistrictId);
        setActiveMessengerChannel(homeDistrictId);
        syncGame({
          sessionMode: 'solo',
          coopRole: null,
          nriInviteCode: undefined,
          devLanguageStack: null,
          coopStartupName: null,
          coopSquadFill: undefined,
          coopMatchId: undefined,
          currentView: 'HUB',
          activeDistrictId: homeDistrictId,
          coopClassProfiles: mergedProfiles,
        });
        return;
      }

      if (next === 'coop' && sessionMode === 'coop' && !coopPick) return;

      if (sessionMode === 'solo') {
        const soloSnap = serializeSoloRuntimeCache({
          activeDeck,
          inventoryUnique,
          discoveredCardIds,
        });
        soloRuntimeCacheRef.current = soloSnap;
        setHasSoloPersona(true);
      }

      const role = coopPick ?? coopRole ?? 'developer';
      const stackForNew = role === 'developer' ? devLanguageStack ?? 'java' : null;
      const merged = coopClassProfilesRef.current;
      const loaded = merged[role] ?? defaultCoopClassSave(role, stackForNew);
      setSessionMode('coop');
      setCoopRole(role);
      setCoopClassProfiles({ ...merged, [role]: loaded });
      const applied = applyCoopClassSave(loaded);
      setActiveDeck(applied.activeDeck);
      setInventory(applied.inventory);
      setCoopTierRank(applied.coopTierRank);
      setCoopYardCompletedMissionIds(applied.coopYardCompletedMissionIds);
      setDiscoveredCardIds(applied.discoveredCardIds);
      if (role === 'developer') setDevLanguageStack(applied.devLanguageStack);
      else setDevLanguageStack(null);
      setCoopSprintConsecutiveLosses(applied.coopSprintConsecutiveLosses);
      applied.activeDeck.forEach((c) => discoverCard(c.id));
      setCurrentView('COOP_LOBBY');
      setActiveDistrictId(homeDistrictId);
      setKnownDistrictChannels((ch) => (ch.includes('coop_yard') ? ch : [...ch, 'coop_yard']));
      setUnlockedDistrictChannels((ch) => (ch.includes('coop_yard') ? ch : [...ch, 'coop_yard']));
      syncGame({
        sessionMode: 'coop',
        coopRole: role,
        devLanguageStack: applied.devLanguageStack,
        coopStartupName: coopStartupName ?? undefined,
        currentView: 'COOP_LOBBY',
        activeDistrictId: homeDistrictId,
        activeMessengerChannel: homeDistrictId,
        coopTierRank: applied.coopTierRank,
        coopYardCompletedMissionIds: applied.coopYardCompletedMissionIds,
        coopSprintConsecutiveLosses: applied.coopSprintConsecutiveLosses,
        coopSquadFill,
        coopClassProfiles: { ...merged, [role]: loaded },
      });
    },
    [
      sessionMode,
      coopRole,
      activeDeck,
      inventoryUnique,
      coopTierRank,
      coopYardCompletedMissionIds,
      discoveredCardIds,
      devLanguageStack,
      coopSprintConsecutiveLosses,
      homeDistrictId,
      coopStartupName,
      coopSquadFill,
      syncGame,
    ]
  );

  const resumeEnterSoloHub = useCallback(() => {
    if (isSoloCoopBlockedForUser(user?.username)) {
      setCurrentView('SESSION_GATE');
      return;
    }
    if (sessionMode === 'coop') {
      switchSessionMode('solo');
      return;
    }
    if (sessionMode === 'nri') {
      setSessionMode('solo');
      setNriInviteCode(null);
    }
    setCurrentView('HUB');
    void syncGame({
      currentView: 'HUB',
      sessionMode: 'solo',
      nriInviteCode: undefined,
    });
  }, [sessionMode, switchSessionMode, syncGame, user?.username]);

  const returnToSessionGate = useCallback(() => {
    setSessionMode('solo');
    setNriInviteCode(null);
    setPendingNriInvite(null);
    setCurrentView('SESSION_GATE');
    window.location.hash = '';
    void syncGame({
      sessionMode: 'solo',
      nriInviteCode: undefined,
      currentView: 'SESSION_GATE',
    });
  }, [syncGame]);

  const resumeEnterCoopLobby = useCallback(
    (preferred?: CoopRole) => {
      if (isSoloCoopBlockedForUser(user?.username)) {
        setCurrentView('SESSION_GATE');
        return;
      }
      const merged = coopClassProfilesRef.current;
      const pick =
        preferred && (merged[preferred]?.deckIds?.length ?? 0) > 0
          ? preferred
          : COOP_ROLES.find((r) => (merged[r]?.deckIds?.length ?? 0) > 0) ?? coopRole ?? 'developer';
      switchSessionMode('coop', pick);
    },
    [switchSessionMode, coopRole, user?.username],
  );

  const enterNriLobby = useCallback(
    async (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized.startsWith('NRI-')) return false;
      const authToken = readNeonAuthToken();
      if (!authToken) return false;
      const data = await nriJoinSession(authToken, normalized);
      if (!data) return false;
      setSessionMode('nri');
      setNriInviteCode(normalized);
      setPendingNriInvite(null);
      setCurrentView('NRI_LOBBY');
      window.location.hash = `nri/join/${normalized}`;
      void syncGame({
        sessionMode: 'nri',
        nriInviteCode: normalized,
        currentView: 'NRI_LOBBY',
      });
      return true;
    },
    [syncGame],
  );

  const createNriTable = useCallback(
    async (title?: string) => {
      const authToken = readNeonAuthToken();
      if (!authToken) return false;
      const session = await nriCreateSession(authToken, title);
      if (!session) return false;
      return enterNriLobby(session.inviteCode);
    },
    [enterNriLobby],
  );

  const leaveNriLobby = useCallback(() => {
    setSessionMode('solo');
    setNriInviteCode(null);
    setCurrentView('SESSION_GATE');
    window.location.hash = '';
    void syncGame({
      sessionMode: 'solo',
      nriInviteCode: undefined,
      currentView: 'SESSION_GATE',
    });
  }, [syncGame]);

  const soloCoopBlocked = isSoloCoopBlockedForUser(user?.username);
  const nriGuestInviteCode = readNriGuestInviteCode();

  useEffect(() => {
    if (sessionMode !== 'coop' || !coopRole) return;
    const t = window.setTimeout(() => {
      setCoopClassProfiles((prev) => ({
        ...prev,
        [coopRole]: serializeCoopClassSave({
          activeDeck,
          inventoryUnique,
          coopTierRank,
          coopYardCompletedMissionIds,
          discoveredCardIds,
          devLanguageStack,
          coopSprintConsecutiveLosses,
        }),
      }));
    }, 400);
    return () => clearTimeout(t);
  }, [
    sessionMode,
    coopRole,
    activeDeck,
    inventoryUnique,
    coopTierRank,
    coopYardCompletedMissionIds,
    discoveredCardIds,
    devLanguageStack,
    coopSprintConsecutiveLosses,
  ]);

  useEffect(() => {
    if (!user?.id || sessionMode !== 'coop') return;
    try {
      localStorage.setItem(COOP_PROFILES_STORAGE_KEY(user.id), JSON.stringify(coopClassProfiles));
    } catch {
      /* ignore */
    }
  }, [user?.id, sessionMode, coopClassProfiles]);

  const handleCreationComplete = (data: {
    name: string;
    district: MapNodeData;
    hobby: Trait;
    ambition?: Profession;
    sessionMode: SessionMode;
    coopRole: CoopRole | null;
    devLanguageStack: DevLanguageStack | null;
    coopStartupName: string | null;
    /** Ранг миссий полигона (PM); в соло не используется. */
    coopTierRank?: SkillMode | null;
    /** Кооп: после профиля — зона ожидания (чат + пати), не карта. */
    enterCoopLobby?: boolean;
  }) => {
    setCreationWizardLockedMode(null);
    setPlayerName(data.name);
    setHomeDistrict(data.district);
    setHomeDistrictId(data.district.id);
    const coopStart = data.sessionMode === 'coop';
    const enterLobby = coopStart && data.enterCoopLobby === true;
    setActiveDistrictId(coopStart && !enterLobby ? 'coop_yard' : data.district.id);
    setTraits([data.hobby]);
    setSessionMode(data.sessionMode);
    setCoopRole(data.sessionMode === 'coop' ? data.coopRole : null);
    setDevLanguageStack(data.sessionMode === 'coop' && data.devLanguageStack ? data.devLanguageStack : null);
    setCoopStartupName(
      data.sessionMode === 'coop' && data.coopStartupName && !enterLobby ? data.coopStartupName : null
    );
    if (data.sessionMode === 'coop') {
      const tr = data.coopTierRank;
      if (tr === 'script-kiddie' || tr === 'junior' || tr === 'mid' || tr === 'senior') setCoopTierRank(tr);
      else setCoopTierRank('junior');
      setCoopYardCompletedMissionIds([]);
    } else {
      setCoopTierRank('junior');
      setCoopYardCompletedMissionIds([]);
    }
    setCoopSprintConsecutiveLosses(0);
    setCoopStartupLiquidated(false);
    setCoopSquadFill('synthetic_bots');
    setCoopMatchId(null);

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
    
    const starterDeck = buildStarterDeckForSession(
      data.sessionMode,
      data.coopRole,
      data.sessionMode === 'coop' ? data.devLanguageStack : null
    );
    setActiveDeck(starterDeck);
    starterDeck.forEach((c) => discoverCard(c.id));
    let coopProfilesForSync: Partial<Record<CoopRole, CoopClassSave>> | undefined;
    if (coopStart && data.coopRole) {
      const invUnique = starterDeck.filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
      setInventory(invUnique);
      setDiscoveredCardIds(new Set(invUnique.map((c) => c.id)));
      const initialSave = serializeCoopClassSave({
        activeDeck: starterDeck,
        inventoryUnique: invUnique,
        coopTierRank: 'junior',
        coopYardCompletedMissionIds: [],
        discoveredCardIds: new Set(invUnique.map((c) => c.id)),
        devLanguageStack: data.devLanguageStack ?? null,
        coopSprintConsecutiveLosses: 0,
      });
      coopProfilesForSync = { ...coopClassProfilesRef.current, [data.coopRole]: initialSave };
      setCoopClassProfiles(coopProfilesForSync);
    } else {
      setHasSoloPersona(true);
      const invUnique = starterDeck.filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
      setInventory(invUnique);
      setDiscoveredCardIds(new Set(invUnique.map((c) => c.id)));
      const soloSnap = serializeSoloRuntimeCache({
        activeDeck: starterDeck,
        inventoryUnique: invUnique,
        discoveredCardIds: new Set(invUnique.map((c) => c.id)),
      });
      soloRuntimeCacheRef.current = soloSnap;
    }
    setQuestStates(prev => acceptQuest(prev, `q_kiddo_start_${data.district.id}`));
    setKnownDistrictChannels(coopStart ? [data.district.id, 'coop_yard'] : [data.district.id]);
    setUnlockedDistrictChannels(coopStart ? [data.district.id, 'coop_yard'] : [data.district.id]);
    setActiveMessengerChannel(coopStart && enterLobby ? data.district.id : coopStart ? 'coop_yard' : data.district.id);
    setBarContactDistricts([]);
    setMessengerFeed(
      coopStart
        ? [
            {
              id: `msg_boot_${Date.now()}_home`,
              from: 'SYSTEM',
              text: `Канал #${data.district.id.toUpperCase()} в резерве — домашний район сохранён.`,
              channelId: data.district.id
            },
            {
              id: `msg_boot_${Date.now()}_yard`,
              from: 'SYSTEM',
              text: 'Полигон CO-OP YARD активен: точки боя по сложности и снабжение на карте района.',
              channelId: 'coop_yard'
            }
          ]
        : [
            {
              id: `msg_boot_${Date.now()}`,
              from: 'SYSTEM',
              text: `Канал #${data.district.id.toUpperCase()} подключен. Это ваш домашний район.`,
              channelId: data.district.id
            }
          ]
    );
    const anchor = Date.now();
    setClockAnchorMs(anchor);
    setCurrentView(enterLobby ? 'COOP_LOBBY' : coopStart ? 'MAP' : 'HUB');
    // Force-write canonical district state to backend to avoid race with async setState.
    syncGame({
      homeDistrictId: data.district.id,
      activeDistrictId: enterLobby ? data.district.id : coopStart ? 'coop_yard' : data.district.id,
      currentView: enterLobby ? 'COOP_LOBBY' : coopStart ? 'MAP' : 'HUB',
      viewMode: 'DISTRICT',
      worldDay: 1,
      clockAnchorMs: anchor,
      sessionMode: data.sessionMode,
      coopRole: data.sessionMode === 'coop' ? data.coopRole : null,
      devLanguageStack: data.sessionMode === 'coop' ? data.devLanguageStack : null,
      coopStartupName: data.sessionMode === 'coop' ? data.coopStartupName : null,
      coopTierRank:
        data.sessionMode === 'coop' &&
        (data.coopTierRank === 'script-kiddie' ||
          data.coopTierRank === 'junior' ||
          data.coopTierRank === 'mid' ||
          data.coopTierRank === 'senior')
          ? data.coopTierRank
          : 'junior',
      coopYardCompletedMissionIds: [],
      coopSprintConsecutiveLosses: 0,
      coopStartupLiquidated: false,
      coopSquadFill: data.sessionMode === 'coop' ? 'synthetic_bots' : undefined,
      coopMatchId: data.sessionMode === 'coop' ? null : undefined,
      coopClassProfiles: coopProfilesForSync ?? coopClassProfilesRef.current,
      hasSoloPersona: data.sessionMode === 'solo' ? true : hasSoloPersona,
      soloRuntimeCache: soloRuntimeCacheRef.current ?? undefined,
    });
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
    postDistrictRumor({
      districtId: q.districtId || activeDistrictId,
      outcome: 'quest_completed',
      subject: q.title,
    });
  };

  const reportCombatRumor = useCallback((missionName: string, success: boolean) => {
    postDistrictRumor({
      districtId: activeDistrictId,
      outcome: success ? 'combat_win' : 'combat_fail',
      subject: missionName,
    });
  }, [postDistrictRumor, activeDistrictId]);

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
      ensureKnownDistrictChannel(nodeId);
      setViewMode('DISTRICT');
      setActiveCombatPack(targetDistrict.combatPack ?? 'java_core');
      if (unlockedDistrictChannels.includes(nodeId)) {
        setActiveMessengerChannel(nodeId);
        tryAutopostNpcChatter(nodeId);
      }
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

      if (sessionMode === 'coop' && currentDistrictId === 'coop_yard') {
        setActiveCombatPack('java_core');
      }
      setActiveBarNode(nodeId);
      setCurrentView('COMBAT');
      return;
    }

    if (['npc', 'shop', 'terminal', 'bar', 'story'].includes(type)) {
      const districtId = getDistrictByNodeId(nodeId) || activeDistrictId;
      ensureKnownDistrictChannel(districtId);
      if (type === 'npc') {
        const district = MAP_NODES.find((d) => d.id === activeDistrictId);
        const rep = district?.dominantFactionId ? (reputation[district.dominantFactionId] || 0) : 0;
        if (rep >= 15) {
          setTrustedNpcContacts((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId]));
          setMessengerFeed((prev) =>
            sanitizeMessengerFeed([
              { id: `msg_contact_${Date.now()}`, from: nodeId, text: 'Канал закреплен. Можешь писать в мессенджер.', channelId: districtId, isSpam: false },
              ...prev,
            ]).slice(0, 80)
          );
        }
      } else if (type === 'bar') {
        setBarContactDistricts((prev) => (prev.includes(districtId) ? prev : [...prev, districtId]));
        if (!unlockedDistrictChannels.includes(districtId)) {
          postSystemMessage(districtId, 'BARMAN: могу открыть районный чат. Либо 120 ƀ, либо закрой местный контракт.');
        } else {
          tryAutopostNpcChatter(districtId);
        }
      }
      setActiveBarNode(nodeId);
      setCurrentView('FIXER_BAR');
      const tracked = getTrackedQuest(questStates);
      const trackedDef = tracked ? QUEST_LIBRARY.find((q) => q.id === tracked.questId) : undefined;
      if (tracked && tracked.status === 'active' && trackedDef && (trackedDef.type === 'delivery' || trackedDef.type === 'diagnostics' || trackedDef.type === 'talk')) {
        let objectiveHit = trackedDef.objectiveNodeId === nodeId;
        if (!objectiveHit && trackedDef.id.startsWith('q_kiddo_start_') && type === 'bar') {
          const questDistrict = MAP_NODES.find((n) => n.id === trackedDef.districtId);
          const barIds = questDistrict?.subNodes?.filter((s) => s.type === 'bar').map((s) => s.id) ?? [];
          objectiveHit = barIds.includes(nodeId);
        }
        if (
          !objectiveHit &&
          trackedDef.id.startsWith('q_kiddo_start_') &&
          trackedDef.objectiveNodeId === districtId &&
          districtId === nodeOwnerDistrict?.id
        ) {
          objectiveHit = ['bar', 'npc', 'terminal', 'shop', 'story'].includes(type);
        }
        if (objectiveHit) {
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
    const channelId = activeMessengerChannel;
    if (!unlockedDistrictChannels.includes(channelId)) {
      postSystemMessage(channelId, 'Сначала подключите канал у бармена этого района.');
      return;
    }
    const now = Date.now();
    const next: MessengerMessage[] = [
      { id: `msg_out_${now}`, from: 'YOU', text: clean, channelId, isSpam: false },
    ];
    const lower = clean.toLowerCase();
    const keywordReactions: Array<{ key: string; line: string }> = [
      { key: 'привет', line: 'Канал видит тебя. Не шуми и держи линию чистой.' },
      { key: 'прив', line: 'Йо. Канал живой, сигнал принят.' },
      { key: 'здар', line: 'Здарова. Что по делу?' },
      { key: 'здрав', line: 'Приветствую. Сеть слушает.' },
      { key: 'hello', line: 'Hello accepted. Keep your packets tidy.' },
      { key: 'hi', line: 'Hi. Channel sync is stable.' },
      { key: 'квест', line: 'Если ищешь контракт — загляни к бармену и проверь local backlog.' },
      { key: 'бит', line: 'Bits любят тишину. Меньше шума в канале — выше шансы на жирный заказ.' },
      { key: 'ice', line: 'ICE не прощает лобовых — держи запасной ответ в колоде, не лезь в лоб.' },
      { key: 'метро', line: 'По метро сегодня нестабильно. Если есть токен — лучше не трать зря.' },
      { key: 'баг', line: 'Логи не врут: сначала локализуй, потом фикси. Не наоборот.' },
      { key: 'работа', line: 'Работа есть. Вопрос — какую цену заплатишь за быстрый вход?' },
      { key: 'купить', line: 'По покупкам спроси в баре про закрытую витрину — иногда там нормальные лоты.' },
      { key: 'продать', line: 'Если хочешь продать лишнее — не неси всё в открытую, используй знакомые каналы.' },
      { key: 'магаз', line: 'Магазины ротируют ассортимент по дням. Проверяй утром и ночью.' },
      { key: 'торг', line: 'Торг уместен, но только если тебя знают на районе.' }
    ];
    const looksLikeDirectAddress = /(^|\s)@([a-zA-Z0-9_]+)/.test(clean) || lower.includes('эй ') || lower.includes('слышь');
    const mentionMatch = clean.match(/@([a-zA-Z0-9_]+)/);
    const mentionedNick = mentionMatch?.[1] || '';
    const knownByMention = trustedNpcContacts.find((c) => c.toLowerCase().includes(mentionedNick.toLowerCase()));
    if (looksLikeDirectAddress) {
      if (knownByMention || trustedNpcContacts.length > 0) {
        const knownNpc = knownByMention || trustedNpcContacts[Math.floor(Math.random() * trustedNpcContacts.length)];
        next.push({
          id: `msg_friend_dm_${now + 1}`,
          from: publicChatNickForSeed(knownNpc),
          text: 'Вижу обращение. Если тема не публичная — пиши в личку, тут слишком шумно.',
          channelId,
        });
      } else {
        const strangerReplies = [
          'Кому ты тут машешь? Канал общий, не личка.',
          'Ха, смелый заход. Незнакомцев тут обычно сначала проверяют.',
          'Эй-эй, полегче. Либо по делу, либо мимо.',
          'Весело зашел, но доверия пока ноль.',
        ];
        next.push({
          id: `msg_stranger_addr_${now + 1}`,
          from: randomPublicChatNick(),
          text: strangerReplies[Math.floor(Math.random() * strangerReplies.length)],
          channelId,
        });
      }
    }
    const keywordHit = keywordReactions.find((r) => lower.includes(r.key));
    if (keywordHit) {
      next.push({
        id: `msg_stranger_kw_${now + 2}`,
        from: randomPublicChatNick(),
        text: keywordHit.line,
        channelId,
      });
    }
    if (trustedNpcContacts.length > 0) {
      const contact = trustedNpcContacts[Math.floor(Math.random() * trustedNpcContacts.length)];
      next.push({
        id: `msg_in_${now + 3}`,
        from: publicChatNickForSeed(contact),
        text: 'Принял. Канал живой, держи синхронизацию и не теряй ритм.',
        channelId,
        isSpam: false,
      });
    }
    if (Math.random() < 0.8) {
      const spamPool = [
        'КУПИ СЕРТ ДЖУНА ЗА СУТКИ — 100% ГАРАНТИЯ!!! писать в /dev/null',
        'AIRDROP КРИПТЫ НА ПУСТОЙ КОШЕЛЁК — жми пока не забанили',
        'Импланты без гарантии, зато дёшево. Самовывоз из подвала.',
        'Набор в команду: нужен человек с чистыми логами. Оплата битами.',
      ];
      next.push({
        id: `msg_spam_${now + 4}`,
        from: randomPublicChatNick(),
        text: spamPool[Math.floor(Math.random() * spamPool.length)],
        channelId,
        isSpam: true,
      });
    }
    setMessengerFeed((prev) => sanitizeMessengerFeed([...next, ...prev]).slice(0, 240));
    tryAutopostNpcChatter(channelId);
  };

  useEffect(() => {
    if (!activeMessengerChannel || !unlockedDistrictChannels.includes(activeMessengerChannel)) return;
    const timer = setInterval(() => {
      tryAutopostNpcChatter(activeMessengerChannel);
    }, 32000);
    return () => clearInterval(timer);
  }, [activeMessengerChannel, unlockedDistrictChannels, tryAutopostNpcChatter]);

  const trackedState = getTrackedQuest(questStates);
  const trackedQuest = QUEST_LIBRARY.find((q) => q.id === trackedState?.questId);
  const objectiveNodeId = trackedQuest?.objectiveNodeId || null;

  return {
    user, isLoading, logout,
    skillMode, setSkillMode, userIp,
    currentView, setCurrentView,
    creationResume,
    creationWizardLockedMode,
    openCharacterWizard,
    cancelCharacterWizard,
    coopClassProfiles,
    resumeEnterSoloHub,
    resumeEnterCoopLobby,
    createNriTable,
    enterNriLobby,
    leaveNriLobby,
    soloCoopBlocked,
    nriGuestInviteCode,
    returnToSessionGate,
    nriInviteCode,
    pendingNriInvite,
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
    worldDay, gameClock, dayPhase,
    solvedTaskCounts, setSolvedTaskCounts,
    solvedChains, saveSolvedChain,
    deckCores, setDeckCores,
    deckRamMb, setDeckRamMb,
    maxImplantSlots, installedImplants, setInstalledImplants,
    traits, setTraits,
    sessionMode, setSessionMode,
    coopRole, setCoopRole,
    devLanguageStack, setDevLanguageStack,
    coopStartupName, setCoopStartupName,
    coopTierRank, setCoopTierRank,
    coopYardCompletedMissionIds, registerCoopYardMissionClear, completeCoopSprintLaunch, switchCoopClass, switchSessionMode,
    coopSprintConsecutiveLosses, setCoopSprintConsecutiveLosses,
    coopStartupLiquidated, setCoopStartupLiquidated,
    coopSquadFill,
    coopMatchId,
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
    knownDistrictChannels, unlockedDistrictChannels, activeMessengerChannel, barContactDistricts,
    setActiveMessengerChannel, unlockDistrictChannel, canUnlockDistrictChannelByQuest,
    reportCombatRumor,
    playerLevel, playerGrade,
    handleCreationComplete, handleTravel, handleCompleteTalkQuest,
    discoverCard, canUnlockNow, objectiveNodeId,
    onRewardItem, onRemoveItem, onUseLootItem
  };
}

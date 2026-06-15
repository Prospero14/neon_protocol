import React from 'react';
import { Shield, Zap, Layout, ChevronRight, Database, Globe, MapPin, User, Trophy, X } from 'lucide-react';
import type { MapNodeData } from '../../logic/mapData';
import type { Profession } from '../../logic/professions';
import type { QuestState } from '../../logic/questEngine';
import type { CombatCard } from '../../logic/combatCards';
import { PRECLASS_UNLOCK_BITS } from '../../logic/preClassProgression';
import type { MessengerMessage } from '../../logic/hooks/useGameState';
import { sanitizeMessengerFeed } from '../../logic/messengerDisplay';
import { COOP_DECK_MAX_CARDS, COOP_ROLES, COOP_ROLE_LABELS, type CoopRole } from '../../logic/sessionMode';
import { OCTOBERLINE_HUB_BRACKET_LABEL } from '../../buildInfo';
import type { CoopWeeklyTheme } from '../../logic/coopWeeklySeason';
import type { StartupLeaderRow } from '../../logic/coopStartupLeaderboard';

interface HubViewProps {
  playerName: string;
  homeDistrict: MapNodeData | null;
  stress: number;
  maxStress: number;
  deckCores: number;
  deckRamMb: number;
  bits: number;
  classUnlocked: boolean;
  profession: Profession;
  solvedTaskCounts: Record<string, number>;
  completedQuestCount: number;
  bitsFromQuests: number;
  canUnlockNow: boolean;
  activeDeck: CombatCard[];
  inventoryUnique: CombatCard[];
  questStates: QuestState[];
  /** Число завершённых цепочек (эксплойтов) — порог разблокировки класса. */
  exploitCount: number;
  tutorialCompleted: boolean;
  worldDay: number;
  dayPhase: string;
  /** Игровое время «ЧЧ:ММ» (ускоренное). */
  gameTimeLabel: string;
  /** Короткая метка фазы суток (УТРО/ДЕНЬ/…). */
  phaseLabelRu: string;
  trustedNpcContacts: string[];
  messengerFeed: MessengerMessage[];
  knownDistrictChannels: string[];
  unlockedDistrictChannels: string[];
  activeMessengerChannel: string;
  barContactDistricts: string[];
  onSendMessengerPing: (text: string) => void;
  onSelectMessengerChannel: (districtId: string) => void;
  onUnlockChannelByBits: (districtId: string) => void;
  onUnlockChannelByQuest: (districtId: string) => void;
  canUnlockChannelByQuest: (districtId: string) => boolean;
  onNavigateToView: (view: string) => void;
  onNavigateToBarNode: (nodeId: string) => void;
  /** Кооп: смена класса (отдельные колоды и прогресс на роль). */
  sessionMode?: 'solo' | 'coop';
  coopRole?: CoopRole | null;
  onSwitchCoopClass?: (role: CoopRole) => void;
  /** Переключение соло/кооп без перелогина. */
  onSwitchSessionMode?: (mode: 'solo' | 'coop') => void;
  /** Вернуться к выбору Solo / Co-op / НРИ. */
  onReturnToSessionGate?: () => void;
  /** Кооп: тема «недели» и прогресс полигона */
  coopWeekTheme?: CoopWeeklyTheme | null;
  coopYardProgress?: { cleared: number; required: number; tierLabel: string } | null;
  coopStartupLeaderboard?: StartupLeaderRow[];
  /** При открытии модалки — подтянуть топ с сервера (после submit лучшего счёта). */
  onRefreshCoopStartupLeaderboard?: () => Promise<StartupLeaderRow[] | null>;
}

export const HubView: React.FC<HubViewProps> = ({
  playerName,
  homeDistrict,
  stress,
  maxStress,
  deckCores,
  deckRamMb,
  bits,
  classUnlocked,
  profession,
  solvedTaskCounts,
  bitsFromQuests,
  canUnlockNow,
  activeDeck,
  inventoryUnique,
  exploitCount,
  tutorialCompleted,
  worldDay,
  dayPhase,
  gameTimeLabel,
  phaseLabelRu,
  trustedNpcContacts,
  messengerFeed,
  knownDistrictChannels,
  unlockedDistrictChannels,
  activeMessengerChannel,
  barContactDistricts,
  onSendMessengerPing,
  onSelectMessengerChannel,
  onUnlockChannelByBits,
  onUnlockChannelByQuest,
  canUnlockChannelByQuest,
  onNavigateToView,
  onNavigateToBarNode,
  sessionMode = 'solo',
  coopRole = null,
  onSwitchCoopClass,
  onSwitchSessionMode,
  onReturnToSessionGate,
  coopWeekTheme = null,
  coopYardProgress = null,
  coopStartupLeaderboard = [],
  onRefreshCoopStartupLeaderboard,
}) => {
  const [messageDraft, setMessageDraft] = React.useState('');
  const [startupLbOpen, setStartupLbOpen] = React.useState(false);
  const [startupLbDisplay, setStartupLbDisplay] = React.useState<StartupLeaderRow[]>(coopStartupLeaderboard);
  React.useEffect(() => {
    setStartupLbDisplay(coopStartupLeaderboard);
  }, [coopStartupLeaderboard]);
  React.useEffect(() => {
    if (!startupLbOpen || !onRefreshCoopStartupLeaderboard) return undefined;
    let cancelled = false;
    onRefreshCoopStartupLeaderboard().then((next) => {
      if (!cancelled && next && next.length > 0) setStartupLbDisplay(next);
    });
    return () => {
      cancelled = true;
    };
  }, [startupLbOpen, onRefreshCoopStartupLeaderboard]);
  const messengerFeedRef = React.useRef<HTMLDivElement | null>(null);
  const profilePopupRef = React.useRef<HTMLDivElement | null>(null);
  const [selectedChatProfile, setSelectedChatProfile] = React.useState<{
    nick: string;
    genderNoun: string;
    district: string;
    about?: string;
    x: number;
    y: number;
  } | null>(null);
  const channelFeed = React.useMemo(
    () => messengerFeed.filter((m) => !m.channelId || m.channelId === activeMessengerChannel),
    [messengerFeed, activeMessengerChannel]
  );
  const displayChannelFeed = React.useMemo(
    () => sanitizeMessengerFeed(channelFeed),
    [channelFeed]
  );
  const orderedChannelFeed = React.useMemo(
    () => displayChannelFeed.slice(0, 160).reverse(),
    [displayChannelFeed]
  );
  const knownDistrictOptions = React.useMemo(
    () => (knownDistrictChannels.length > 0 ? knownDistrictChannels : ['altufyevo']),
    [knownDistrictChannels]
  );
  const hashNick = React.useCallback((value: string) => {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }, []);
  const buildProfileByNick = React.useCallback((nick: string, x: number, y: number) => {
    const seed = hashNick(nick.toLowerCase());
    const nouns = [
      'оператор',
      'курьер',
      'наблюдатель',
      'скиталец',
      'медиатор',
      'компилятор',
      'проводник',
      'архивариус',
      'диспетчер',
      'ремесленник',
      'рейнджер',
      'инквизитор',
      'контролёр',
      'перехватчик',
    ];
    const aboutPool = [
      'Держу зеркала логов для ночной смены.',
      'Работаю тихо, вопросы задаю редко.',
      'Ищу стабильный uplink без лишнего шума.',
      'Предпочитаю короткие сессии и чистые выходы.',
      'Проверяю маршруты перед рассветом.',
      'Собираю слухи, фильтрую шум.',
      'Торгую временем, не железом.',
      'Смотрю на сеть как на погоду.',
    ];
    const district = knownDistrictOptions[seed % knownDistrictOptions.length] || activeMessengerChannel;
    const genderNoun = nouns[(seed >>> 3) % nouns.length] || 'оператор';
    const withAbout = ((seed >>> 7) % 100) < 62;
    return {
      nick,
      genderNoun,
      district,
      about: withAbout ? aboutPool[(seed >>> 11) % aboutPool.length] : undefined,
      x,
      y,
    };
  }, [activeMessengerChannel, hashNick, knownDistrictOptions]);
  const handleSendMessage = React.useCallback(() => {
    const clean = messageDraft.trim();
    if (!clean) return;
    onSendMessengerPing(clean);
    setMessageDraft('');
  }, [messageDraft, onSendMessengerPing]);
  React.useEffect(() => {
    const node = messengerFeedRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [activeMessengerChannel, orderedChannelFeed.length]);
  React.useEffect(() => {
    const onPointerDown = (evt: MouseEvent) => {
      if (!selectedChatProfile) return;
      const target = evt.target as Node;
      if (profilePopupRef.current && !profilePopupRef.current.contains(target)) {
        setSelectedChatProfile(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [selectedChatProfile]);
  const isActiveChannelUnlocked = unlockedDistrictChannels.includes(activeMessengerChannel);
  const channelVisitedBar = barContactDistricts.includes(activeMessengerChannel);
  const formatChannelName = (districtId: string) => `#${districtId.replaceAll('_', '-').toUpperCase()}`;
  return (
    <div className="hub-v4-view animate-float">
      <header className="hub-header-v4">
        <div className="brand-box">
          <h1 className="neon-text glow-green">
            OCTOBERLINE{' '}
            <span className="mvp-tag" title={OCTOBERLINE_HUB_BRACKET_LABEL}>
              [{OCTOBERLINE_HUB_BRACKET_LABEL}]
            </span>
          </h1>
          <div className="meta-line mono-text">
            <span className="meta-item"><MapPin size={12} /> {homeDistrict?.name.split(':')[0] || 'SAFE_HOUSE_04'}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item"><User size={12} /> {playerName}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item" title="Игровые сутки: 12 ч игры ≈ 4 ч реального времени">
              ДЕНЬ {worldDay} · {gameTimeLabel} · {phaseLabelRu}
            </span>
            {onReturnToSessionGate && (
              <>
                <span className="meta-divider">|</span>
                <button
                  type="button"
                  className="meta-item"
                  onClick={onReturnToSessionGate}
                  style={{
                    fontSize: '0.58rem',
                    padding: '2px 8px',
                    border: '1px solid #567',
                    background: 'rgba(0,0,0,0.35)',
                    color: '#aab',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  РЕЖИМЫ
                </button>
              </>
            )}
            {onSwitchSessionMode && (
              <span className="meta-divider">|</span>
            )}
            {onSwitchSessionMode && (
              <span className="meta-item hub-session-toggle" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.58rem', color: '#6a7a8a', letterSpacing: '0.1em' }}>СЕССИЯ</span>
                <button
                  type="button"
                  onClick={() => onSwitchSessionMode('solo')}
                  style={{
                    fontSize: '0.58rem',
                    padding: '2px 8px',
                    border:
                      sessionMode === 'solo' ? '1px solid rgba(0, 255, 180, 0.5)' : '1px solid #456',
                    background: sessionMode === 'solo' ? 'rgba(0, 255, 180, 0.1)' : 'rgba(0,0,0,0.35)',
                    color: sessionMode === 'solo' ? '#9ff' : '#889',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  SOLO
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchSessionMode('coop')}
                  style={{
                    fontSize: '0.58rem',
                    padding: '2px 8px',
                    border:
                      sessionMode === 'coop' ? '1px solid rgba(0, 212, 255, 0.55)' : '1px solid #456',
                    background: sessionMode === 'coop' ? 'rgba(0, 212, 255, 0.12)' : 'rgba(0,0,0,0.35)',
                    color: sessionMode === 'coop' ? 'var(--neon-cyan)' : '#889',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  CO-OP
                </button>
              </span>
            )}
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

      {sessionMode === 'coop' && coopWeekTheme && (
        <div className="neon-panel arctic-monolith" style={{ margin: '0 0 14px', padding: '14px 18px' }}>
          <div className="mono-text" style={{ fontSize: '0.62rem', color: 'var(--neon-cyan)', letterSpacing: '0.14em' }}>
            {coopWeekTheme.title}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: '0.78rem', lineHeight: 1.5, color: '#c5d8e8' }}>{coopWeekTheme.lore}</p>
          {coopWeekTheme.accent && (
            <p className="mono-text" style={{ margin: '10px 0 0', fontSize: '0.62rem', opacity: 0.8 }}>
              {coopWeekTheme.accent}
            </p>
          )}
          {coopYardProgress && (
            <div className="mono-text" style={{ marginTop: 12, fontSize: '0.65rem', color: '#8ac' }}>
              ПОЛИГОН · {coopYardProgress.tierLabel.toUpperCase()}: закрыто миссий {coopYardProgress.cleared} /{' '}
              {coopYardProgress.required} до ворот босса (релизный гейт)
            </div>
          )}
        </div>
      )}

      <div className="hub-grid-v4">
        <div className="hub-col identity">
          <div className="col-header mono-text"><Shield size={14} /> IDENTITY_MODULE</div>
          {sessionMode === 'coop' && coopRole && onSwitchCoopClass && (
            <div className="coop-class-strip mono-text" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: '#789', marginBottom: 6 }}>CO-OP КЛАСС</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COOP_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onSwitchCoopClass(r)}
                    style={{
                      fontSize: '0.62rem',
                      padding: '4px 8px',
                      border:
                        r === coopRole ? '1px solid rgba(0, 212, 255, 0.55)' : '1px solid #456',
                      background: r === coopRole ? 'rgba(0, 212, 255, 0.12)' : 'rgba(0,0,0,0.35)',
                      color: r === coopRole ? 'var(--neon-cyan)' : '#aab',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {COOP_ROLE_LABELS[r].title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="neon-panel interactive arctic-monolith stat-card-v4" onClick={() => onNavigateToView('CHARACTER')}>
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
                <span>EXPLOITS: {exploitCount}/5</span>
                <span>TUTORIAL: {tutorialCompleted ? 'OK' : '⋯'}</span>
                <span>BITS (квесты): {bitsFromQuests}/{PRECLASS_UNLOCK_BITS}</span>
              </div>
              {canUnlockNow && (
                 <button className="neon-border-btn glow-cyan pulse" onClick={() => onNavigateToBarNode('npc_professor')}>SET_SPECIALIZATION</button>
              )}
            </div>
          )}
        </div>

        <div className="hub-col operations">
           <div className="col-header mono-text"><Zap size={14} /> OPERATIONS_HUB</div>
           <div className="neon-panel interactive op-card map-lnk glow-cyan" onClick={() => onNavigateToView('MAP')}>
              <div className="op-icon"><Layout size={32} /></div>
              <div className="op-text">
                 <div className="op-title">NEURAL_MAP</div>
                 <div className="op-sub">Navigate Moscow Grid</div>
              </div>
              <ChevronRight className="op-arrow" />
           </div>
           <div className="neon-panel interactive op-card deck-lnk" onClick={() => onNavigateToView('DECK_BUILDER')}>
              <div className="op-icon"><Database size={32} /></div>
              <div className="op-text">
                 <div className="op-title">DECK_CONSTRUCTOR</div>
                 <div className="op-sub">
                   {activeDeck.length}/{sessionMode === 'coop' && coopRole ? COOP_DECK_MAX_CARDS : 30} Modules Loaded
                 </div>
              </div>
              <ChevronRight className="op-arrow" />
           </div>
           <div className="neon-panel interactive op-card intel-lnk glow-amber" onClick={() => onNavigateToView('INTEL')}>
              <div className="op-icon"><Globe size={32} /></div>
              <div className="op-text">
                 <div className="op-title">INTEL_FEED [ИНФОСВОДКА]</div>
                 <div className="op-sub">Faction Lore & Recognition</div>
              </div>
              <ChevronRight className="op-arrow" />
           </div>
           <div className="neon-panel interactive intel-card" onClick={() => onNavigateToView('REFERENCE')}>
              <div className="intel-header">
                 <div className="intel-title">DOCUMENTATION</div>
                 <div className="intel-count gold">{inventoryUnique.length}</div>
              </div>
              <p className="intel-desc mono-text">LIBRARIES_OPENED / ARCHED_CONCEPTS</p>
           </div>
           {sessionMode === 'coop' && (
             <div
               className="neon-panel interactive op-card"
               onClick={() => setStartupLbOpen(true)}
               style={{ borderColor: 'rgba(255, 200, 80, 0.35)' }}
             >
               <div className="op-icon">
                 <Trophy size={32} color="var(--neon-amber)" />
               </div>
               <div className="op-text">
                 <div className="op-title">РЕЙТИНГ СТАРТАПОВ</div>
                 <div className="op-sub">NPC + игроки; при открытии — синхронизация с сервером</div>
               </div>
               <ChevronRight className="op-arrow" />
             </div>
           )}
        </div>

      </div>

      <aside className="right-rail">
        <div className="right-rail-col">
          <div className="messenger-dock neon-panel">
            <div className="messenger-body-scroll">
            <div className="intel-header">
              <div className="intel-title">MESSENGER_LINK</div>
              <div className="intel-count gold">{displayChannelFeed.length}</div>
            </div>
            <div className="mono-text messenger-meta-row">
              Активный канал: {formatChannelName(activeMessengerChannel)} · Контакты: {trustedNpcContacts.length}
            </div>
            <div className="messenger-channel-list">
              {knownDistrictChannels.map((districtId) => {
                const unlocked = unlockedDistrictChannels.includes(districtId);
                return (
                  <button
                    key={districtId}
                    className={`messenger-channel-chip ${districtId === activeMessengerChannel ? 'active' : ''} ${unlocked ? 'unlocked' : 'locked'}`}
                    onClick={() => onSelectMessengerChannel(districtId)}
                  >
                    {formatChannelName(districtId)} {unlocked ? '' : '[LOCK]'}
                  </button>
                );
              })}
            </div>
            {!isActiveChannelUnlocked && (
              <div className="messenger-unlock-box">
                <div className="mono-text messenger-unlock-note">
                  {channelVisitedBar
                    ? 'Бармен района готов открыть доступ: покупка или квест.'
                    : 'Сначала посетите бар этого района и поговорите с барменом.'}
                </div>
                <div className="messenger-unlock-actions">
                  <button
                    className="neon-border-btn glow-cyan"
                    disabled={!channelVisitedBar || bits < 120}
                    onClick={() => onUnlockChannelByBits(activeMessengerChannel)}
                  >
                    BUY ACCESS [120 ƀ]
                  </button>
                  <button
                    className="neon-border-btn glow-green"
                    disabled={!channelVisitedBar || !canUnlockChannelByQuest(activeMessengerChannel)}
                    onClick={() => onUnlockChannelByQuest(activeMessengerChannel)}
                  >
                    QUEST ACCESS
                  </button>
                </div>
              </div>
            )}
            <div className="messenger-feed" ref={messengerFeedRef}>
              {orderedChannelFeed.map((m) => (
                <div key={m.id} className={`mono-text messenger-line ${m.isSpam ? 'spam' : ''}`}>
                  <button
                    type="button"
                    className="messenger-from"
                    style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      setSelectedChatProfile(buildProfileByNick(m.from, rect.left + 6, rect.bottom + 6));
                    }}
                    title="Открыть профиль"
                  >
                    [{m.from}]
                  </button>{' '}
                  {m.text}
                </div>
              ))}
            </div>
            {selectedChatProfile && (
              <div
                ref={profilePopupRef}
                className="neon-panel"
                style={{
                  position: 'fixed',
                  left: Math.max(16, Math.min(window.innerWidth - 320, selectedChatProfile.x)),
                  top: Math.max(16, Math.min(window.innerHeight - 220, selectedChatProfile.y)),
                  width: 300,
                  zIndex: 70,
                  padding: 10,
                  border: '1px solid rgba(0, 255, 255, 0.28)',
                  boxShadow: '0 0 18px rgba(0, 255, 255, 0.15)',
                  background: 'rgba(7, 10, 26, 0.98)',
                }}
              >
                <div className="mono-text" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>USER_INFO</strong>
                  <button
                    type="button"
                    onClick={() => setSelectedChatProfile(null)}
                    style={{ background: 'transparent', color: '#8ab4ff', border: 0, cursor: 'pointer' }}
                  >
                    [x]
                  </button>
                </div>
                <div className="mono-text" style={{ lineHeight: 1.45 }}>
                  <div><span style={{ opacity: 0.7 }}>НИК:</span> {selectedChatProfile.nick}</div>
                  <div><span style={{ opacity: 0.7 }}>ПОЛ:</span> {selectedChatProfile.genderNoun}</div>
                  <div><span style={{ opacity: 0.7 }}>РАЙОН:</span> {formatChannelName(selectedChatProfile.district)}</div>
                  {selectedChatProfile.about && (
                    <div style={{ marginTop: 6 }}><span style={{ opacity: 0.7 }}>О СЕБЕ:</span> {selectedChatProfile.about}</div>
                  )}
                </div>
              </div>
            )}
            </div>
            <div className="messenger-composer">
              <div className="messenger-input-row">
                <input
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="написать в районный канал..."
                  className="messenger-input"
                  disabled={!isActiveChannelUnlocked}
                />
                <button
                  type="button"
                  className="neon-border-btn glow-cyan messenger-send-btn"
                  onClick={handleSendMessage}
                  disabled={!isActiveChannelUnlocked}
                >
                  SEND
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {startupLbOpen && sessionMode === 'coop' && (
        <div
          className="map-rail-hint-overlay"
          style={{ zIndex: 400 }}
          onClick={() => setStartupLbOpen(false)}
          role="presentation"
        >
          <div
            className="neon-panel arctic-monolith"
            style={{
              maxWidth: 480,
              margin: '48px auto',
              padding: 20,
              position: 'relative',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Рейтинг стартапов"
          >
            <button
              type="button"
              onClick={() => setStartupLbOpen(false)}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: '#889',
              }}
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>
            <h3 className="mono-text" style={{ margin: '0 0 12px', letterSpacing: '0.12em', color: 'var(--neon-amber)' }}>
              РЕЙТИНГ СТАРТАПОВ
            </h3>
            <p className="mono-text" style={{ fontSize: '0.65rem', color: '#8ab', marginBottom: 14, lineHeight: 1.45 }}>
              Список смешивает лоровые проекты сети и игроков. Очки: миссии полигона, биты, ранг. При входе в окно
              лучший счёт отправляется на сервер и таблица подтягивается с API (если сессия авторизована).
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
              <thead>
                <tr style={{ color: '#8ac', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px' }}>#</th>
                  <th style={{ padding: '6px 4px' }}>СТАРТАП</th>
                  <th style={{ padding: '6px 4px' }}>ОЧКИ</th>
                  <th style={{ padding: '6px 4px' }}></th>
                </tr>
              </thead>
              <tbody>
                {startupLbDisplay.map((row) => (
                  <tr
                    key={`${row.rank}-${row.name}`}
                    style={{
                      borderTop: '1px solid rgba(0,212,255,0.12)',
                      background: row.isPlayer ? 'rgba(0, 212, 255, 0.08)' : undefined,
                    }}
                  >
                    <td style={{ padding: '8px 4px', color: '#9ab' }}>{row.rank}</td>
                    <td style={{ padding: '8px 4px', color: row.isPlayer ? 'var(--neon-cyan)' : '#cde' }}>{row.name}</td>
                    <td style={{ padding: '8px 4px' }}>{row.score}</td>
                    <td className="mono-text" style={{ padding: '8px 4px', fontSize: '0.58rem', color: '#789' }}>
                      {row.tag ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

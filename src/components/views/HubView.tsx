import React from 'react';
import { Shield, Zap, Layout, ChevronRight, Award, Database, Globe, MapPin, User } from 'lucide-react';
import type { MapNodeData } from '../../logic/mapData';
import type { Profession } from '../../logic/professions';
import { QUEST_LIBRARY } from '../../logic/questData';
import type { QuestState } from '../../logic/questEngine';
import type { CombatCard } from '../../logic/combatCards';
import { PRECLASS_UNLOCK_BITS } from '../../logic/preClassProgression';
import type { MessengerMessage } from '../../logic/hooks/useGameState';

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
  completedQuestCount,
  bitsFromQuests,
  canUnlockNow,
  activeDeck,
  inventoryUnique,
  questStates,
  exploitCount,
  tutorialCompleted,
  worldDay,
  dayPhase,
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
  onNavigateToBarNode
}) => {
  const [messageDraft, setMessageDraft] = React.useState('');
  const channelFeed = React.useMemo(
    () => messengerFeed.filter((m) => !m.channelId || m.channelId === activeMessengerChannel),
    [messengerFeed, activeMessengerChannel]
  );
  const isActiveChannelUnlocked = unlockedDistrictChannels.includes(activeMessengerChannel);
  const channelVisitedBar = barContactDistricts.includes(activeMessengerChannel);
  const formatChannelName = (districtId: string) => `#${districtId.replaceAll('_', '-').toUpperCase()}`;
  return (
    <div className="hub-v4-view animate-float">
      <header className="hub-header-v4">
        <div className="brand-box">
          <h1 className="neon-text glow-green">OCTOBERLINE <span className="mvp-tag">[ОКТЯБРЬСКАЯ_ЛИНИЯ_0.11 | BUILD_7A_LAYOUT]</span></h1>
          <div className="meta-line mono-text">
            <span className="meta-item"><MapPin size={12} /> {homeDistrict?.name.split(':')[0] || 'SAFE_HOUSE_04'}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item"><User size={12} /> {playerName}</span>
            <span className="meta-divider">|</span>
            <span className="meta-item">DAY {worldDay} / {dayPhase.toUpperCase()}</span>
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
                 <div className="op-sub">{activeDeck.length}/30 Modules Loaded</div>
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
        </div>

      </div>

      <aside className="right-rail">
        <div className="right-rail-col">
          <div className="col-header mono-text"><Award size={14} /> CONTRACT_CHANNEL</div>
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
            </div>
          </div>
        </div>

        <div className="right-rail-col">
          <div className="col-header mono-text"><Zap size={14} /> MESSENGER_CHANNEL</div>
          <div className="messenger-dock neon-panel">
            <div className="intel-header">
              <div className="intel-title">MESSENGER_LINK</div>
              <div className="intel-count gold">{channelFeed.length}</div>
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
            <div className="messenger-input-row">
              <input
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder="написать в районный канал..."
                className="messenger-input"
                disabled={!isActiveChannelUnlocked}
              />
              <button
                className="neon-border-btn glow-cyan"
                onClick={() => { onSendMessengerPing(messageDraft); setMessageDraft(''); }}
                disabled={!isActiveChannelUnlocked}
              >
                SEND
              </button>
            </div>
            <div className="messenger-feed">
              {channelFeed.slice(0, 160).map((m) => (
                <div key={m.id} className={`mono-text messenger-line ${m.isSpam ? 'spam' : ''}`}>
                  <span className="messenger-from">[{m.from}]</span> {m.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

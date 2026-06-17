import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Copy, FileArchive, LogOut, Map as MapIcon, Megaphone, Package, Skull, User, Users, UserCircle, XCircle, Coins, Car, ScrollText, StickyNote, Wrench } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import {
  buildNriInviteUrl,
  nriCloseSession,
  nriCreateVaultFile,
  nriFetchPlayer,
  nriFetchRoster,
  nriFetchState,
  nriFetchVault,
  nriFetchNpcs,
  nriSavePlayer,
  nriSetSpamBot,
  nriFetchWallet,
  nriPayAntispam,
  vaultDeleteFile,
  type NriMember,
  type NriPlayerProfile,
  type NriSessionInfo,
  type NriVaultFile,
  type NriNpc,
  type NriRosterPlayer,
  type NriWalletInfo,
} from '../logic/nriApi';
import { chatFetchParticipants } from '../logic/chatApi';
import { NeonChatPanel } from './services/NeonChatPanel';
import { NriIceRunPanel } from './NriIceRunPanel';
import { NriJoinProfileModal } from './NriJoinProfileModal';
import { NriCharacterSheet } from './NriCharacterSheet';
import { NriPeopleHub, type PeopleSection } from './NriPeopleHub';
import { NriVaultTab, type VaultRecipient } from './NriVaultTab';
import { NriRulesPanel } from './NriRulesPanel';
import { NriCyberPanel } from './NriCyberPanel';
import { NriInventoryPanel } from './NriInventoryPanel';
import { NriWalletPanel } from './NriWalletPanel';
import { NriCityMapPanel } from './NriCityMapPanel';
import { NriTransportPanel } from './NriTransportPanel';
import { NriScenarioHub } from './NriScenarioHub';
import { NriPlayerNotesPanel } from './NriPlayerNotesPanel';
import { NriMasterToolsHub } from './NriMasterToolsHub';
import { NriTattooPickModal } from './NriTattooPickModal';

import { parseNriSheet } from '../logic/nriNpcGenerator';
import { SPAM_BOT_USERNAME } from '../logic/spamBotMeta';

type Tab = 'chat' | 'ice' | 'inventory' | 'wallet' | 'vault' | 'people' | 'cyber' | 'map' | 'transport' | 'scenario' | 'notes' | 'tools';

type Props = {
  inviteCode: string;
  onLeave: () => void;
  onIceReward: (bits: number) => void;
};

export const NriLobbyView: React.FC<Props> = ({ inviteCode, onLeave, onIceReward: _onIceReward }) => {
  const { token, user } = useAuth();
  const [session, setSession] = useState<NriSessionInfo | null>(null);
  const [members, setMembers] = useState<NriMember[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('chat');
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<NriPlayerProfile | null | undefined>(undefined);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [speakAsNpc, setSpeakAsNpc] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
    archetype?: string;
  } | null>(null);
  const [vaultFiles, setVaultFiles] = useState<NriVaultFile[]>([]);
  const [vaultRecipients, setVaultRecipients] = useState<VaultRecipient[]>([]);
  const [tableNpcs, setTableNpcs] = useState<NriNpc[]>([]);
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [walletInfo, setWalletInfo] = useState<NriWalletInfo | null>(null);
  const [antispamBusy, setAntispamBusy] = useState(false);
  const [peopleSection, setPeopleSection] = useState<PeopleSection>('chars');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authToken = readNeonAuthToken() ?? token;

  const loadVault = useCallback(async () => {
    if (!authToken) return;
    const files = await nriFetchVault(authToken, inviteCode);
    setVaultFiles(files);
  }, [authToken, inviteCode]);

  const loadRecipients = useCallback(async () => {
    if (!authToken || !session?.chatRoomId) return;
    const [parts, roster] = await Promise.all([
      chatFetchParticipants(authToken, session.chatRoomId),
      nriFetchRoster(authToken, inviteCode),
    ]);
    const byId = new Map<string, VaultRecipient>();
    for (const p of parts?.participants ?? []) {
      if (p.isBot) continue;
      const rp = roster?.find((r) => r.userId === p.userId);
      byId.set(p.userId, {
        userId: p.userId,
        label: rp ? `${rp.displayName} (@${p.username})` : `@${p.username}`,
      });
    }
    for (const r of roster ?? []) {
      if (!byId.has(r.userId)) {
        byId.set(r.userId, { userId: r.userId, label: `${r.displayName} (@${r.username})` });
      }
    }
    for (const m of members) {
      if (!byId.has(m.userId)) {
        byId.set(m.userId, { userId: m.userId, label: `@${m.username}` });
      }
    }
    setVaultRecipients([...byId.values()]);
  }, [authToken, session?.chatRoomId, inviteCode, members]);

  const loadRoster = useCallback(async () => {
    if (!authToken || !(session?.isHost || session?.isAdmin)) return;
    const data = await nriFetchRoster(authToken, inviteCode);
    if (data) setRoster(data);
  }, [authToken, inviteCode, session?.isHost, session?.isAdmin]);

  const loadTableNpcs = useCallback(async () => {
    if (!authToken || !(session?.isHost || session?.isAdmin)) return;
    const list = await nriFetchNpcs(authToken, inviteCode);
    if (list) setTableNpcs(list);
  }, [authToken, inviteCode, session?.isHost, session?.isAdmin]);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const data = await nriFetchState(authToken, inviteCode);
    if (!data) {
      setErr('Стол недоступен или закрыт.');
      return;
    }
    setErr(null);
    setSession(data.session);
    setMembers(data.members);
    if (data.session.status === 'closed') {
      setErr('Мастер закрыл стол.');
    }
    if (data.session.isHost || data.session.isAdmin) {
      await loadVault();
      await loadTableNpcs();
    }
  }, [authToken, inviteCode, loadVault, loadTableNpcs]);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    if (!authToken) return;
    nriFetchPlayer(authToken, inviteCode).then(setProfile);
  }, [authToken, inviteCode]);

  const loadWalletHint = useCallback(async () => {
    if (!authToken || session?.isHost || !session?.spamBotEnabled) {
      setWalletInfo(null);
      return;
    }
    const w = await nriFetchWallet(authToken, inviteCode);
    if (w) setWalletInfo(w);
  }, [authToken, inviteCode, session?.isHost, session?.spamBotEnabled]);

  useEffect(() => {
    if (tab !== 'chat') return;
    loadWalletHint();
    const t = setInterval(loadWalletHint, 8000);
    return () => clearInterval(t);
  }, [tab, loadWalletHint]);

  const payAntispamFromChat = async () => {
    if (!authToken || antispamBusy) return;
    setAntispamBusy(true);
    const res = await nriPayAntispam(authToken, inviteCode);
    setAntispamBusy(false);
    if (res.ok) {
      if (profile) {
        setProfile({
          ...profile,
          sheet: { ...(parseNriSheet(profile.sheet) ?? {}), wonlongs: res.wonlongs },
        });
      }
      await refresh();
      await loadWalletHint();
    }
  };

  const needsProfile = profile === null && session && !session.isHost;

  const saveProfile = async (
    displayName: string,
    opts: { presetId?: string; sheet?: unknown }
  ) => {
    if (!authToken) return;
    if (!opts.presetId) {
      setProfileErr('Выберите персонажа из списка мастера.');
      return;
    }
    setProfileBusy(true);
    setProfileErr(null);
    const saved = await nriSavePlayer(authToken, inviteCode, displayName, opts);
    setProfileBusy(false);
    if (saved.ok) setProfile(saved.player);
    else setProfileErr(saved.error);
  };

  const copyLink = async () => {
    const url = buildNriInviteUrl(inviteCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Скопируйте ссылку:', url);
    }
  };

  const closeTable = async () => {
    if (!authToken || !session?.isHost) return;
    if (!window.confirm('Закрыть стол для всех игроков?')) return;
    const ok = await nriCloseSession(authToken, inviteCode);
    if (ok) await refresh();
  };

  const toggleSpamBot = async () => {
    if (!authToken || !session?.isHost) return;
    const next = !session.spamBotEnabled;
    const ok = await nriSetSpamBot(authToken, inviteCode, next);
    if (ok) await refresh();
  };

  useEffect(() => {
    if (tab === 'vault' && (session?.isHost || session?.isAdmin)) {
      loadVault();
      loadRecipients();
    }
    if (tab === 'chat' && session?.chatRoomId) {
      loadRecipients();
      if (session?.isHost || session?.isAdmin) loadTableNpcs();
      const t = setInterval(loadRecipients, 5000);
      return () => clearInterval(t);
    }
    if (tab === 'inventory' && authToken) {
      nriFetchPlayer(authToken, inviteCode).then((p) => {
        if (p) setProfile(p);
      });
      if (session?.isHost || session?.isAdmin) loadRoster();
    }
    if (tab === 'transport' && authToken && (session?.isHost || session?.isAdmin)) {
      loadRoster();
    }
    if (tab === 'tools' && authToken && (session?.isHost || session?.isAdmin)) {
      loadRoster();
      loadRecipients();
    }
  }, [
    tab,
    authToken,
    inviteCode,
    session?.chatRoomId,
    session?.isHost,
    session?.isAdmin,
    loadVault,
    loadRecipients,
    loadTableNpcs,
    loadRoster,
  ]);

  const createVaultFile = async (payload: {
    title: string;
    body: string;
    usePassword?: boolean;
    useIce?: boolean;
    password?: string;
    gameId?: string;
    difficulty?: string;
  }) => {
    if (!authToken) return { ok: false as const, error: 'Нет авторизации' };
    const result = await nriCreateVaultFile(authToken, inviteCode, payload);
    if (result.ok) {
      setVaultFiles((prev) => [result.file, ...prev.filter((f) => f.id !== result.file.id)]);
    }
    return result;
  };

  const hostTools = session?.isHost ? (
    <div className="nri-host-tools">
      <span className="mono-text nri-host-tools__label">Инструменты мастера</span>
      <button
        type="button"
        className={`nri-host-tools__btn ${session.spamBotEnabled ? 'active' : ''}`}
        onClick={toggleSpamBot}
      >
        <Megaphone size={14} />
        {session.spamBotEnabled ? '■ SPAM-бот (стоп)' : '▶ SPAM-бот (реклама)'}
      </button>
      <span className="mono-text nri-host-tools__hint">
        Участник @{SPAM_BOT_USERNAME} появится в чате и шлёт [РЕКЛАМА] ~каждые 18–30 сек.
      </span>
    </div>
  ) : null;

  if (needsProfile) {
    return (
      <NriJoinProfileModal
        inviteCode={inviteCode}
        onSubmit={saveProfile}
        loading={profileBusy}
        submitError={profileErr}
      />
    );
  }

  return (
    <div className="nri-lobby main-crt">
      <header className="nri-lobby__head">
        <div>
          <div className="nri-lobby__kicker">NEON_PROTOCOL // НРИ</div>
          <h1 className="nri-lobby__title">{session?.title ?? 'Стол…'}</h1>
          <p className="mono-text nri-lobby__meta">
            Мастер: {session?.hostUsername ?? '—'} · код {inviteCode}
            {profile && ` · вы: ${profile.displayName}`}
          </p>
        </div>
        <div className="nri-lobby__head-actions">
          <button type="button" className="nri-lobby__copy" onClick={() => setShowRules(true)}>
            <BookOpen size={14} /> Правила
          </button>
          {profile && (
            <button type="button" className="nri-lobby__copy" onClick={() => setShowSheet(true)}>
              <User size={14} /> Лист персонажа
            </button>
          )}
          <button type="button" className="nri-lobby__leave" onClick={onLeave}>
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </header>

      <div className="nri-lobby__invite">
        <code className="nri-lobby__link">{buildNriInviteUrl(inviteCode)}</code>
        <button type="button" className="nri-lobby__copy" onClick={copyLink}>
          <Copy size={14} /> {copied ? 'OK' : 'Ссылка'}
        </button>
        {session?.isHost && (
          <button type="button" className="nri-lobby__close" onClick={closeTable}>
            <XCircle size={14} /> Закрыть стол
          </button>
        )}
      </div>

      <div className="nri-lobby__members">
        <Users size={14} />
        <span className="mono-text">
          {members.map((m) => {
            const label = m.displayName ? `${m.displayName} (@${m.username})` : m.username;
            return `${m.isHost ? '★' : ''}${label}`;
          }).join(' · ')}
          {session?.spamBotEnabled && (
            <>
              {members.length > 0 ? ' · ' : ''}
              <span className="nri-lobby__spam-bot">📢 @{SPAM_BOT_USERNAME}</span>
            </>
          )}
          {!members.length && !session?.spamBotEnabled && 'ожидание игроков…'}
        </span>
      </div>

      <nav className="neon-services-tabs nri-lobby__tabs">
        <button type="button" className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
          ЧАТ СТОЛА
        </button>
        <button type="button" className={tab === 'ice' ? 'active' : ''} onClick={() => setTab('ice')}>
          <Skull size={14} /> ICE RUN
        </button>
        {session && (
          <button type="button" className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>
            <MapIcon size={14} /> КАРТА
          </button>
        )}
        {(profile || session?.isHost) && (
          <button type="button" className={tab === 'wallet' ? 'active' : ''} onClick={() => setTab('wallet')}>
            <Coins size={14} /> КОШЕЛЁК
          </button>
        )}
        {(profile || session?.isHost) && (
          <button type="button" className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>
            <Package size={14} /> ИНВЕНТАРЬ
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'vault' ? 'active' : ''} onClick={() => setTab('vault')}>
            <FileArchive size={14} /> ФАЙЛОХРАНИЛИЩЕ
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button
            type="button"
            className={tab === 'people' ? 'active' : ''}
            onClick={() => setTab('people')}
          >
            <UserCircle size={14} /> ПЕРСОНАЖИ
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'cyber' ? 'active' : ''} onClick={() => setTab('cyber')}>
            КИБЕР
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'scenario' ? 'active' : ''} onClick={() => setTab('scenario')}>
            <ScrollText size={14} /> СЦЕНАРИЙ
          </button>
        )}
        {session && (
          <button type="button" className={tab === 'transport' ? 'active' : ''} onClick={() => setTab('transport')}>
            <Car size={14} /> ТРАНСПОРТ
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'tools' ? 'active' : ''} onClick={() => setTab('tools')}>
            <Wrench size={14} /> МАСТЕР
          </button>
        )}
        {profile && !session?.isHost && (
          <button type="button" className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>
            <StickyNote size={14} /> ЗАМЕТКИ
          </button>
        )}
      </nav>

      <div className="nri-lobby__body">
        {tab === 'chat' && session?.chatRoomId && (
          <NeonChatPanel
            fixedRoomId={session.chatRoomId}
            hideSidebar
            roomTitle={`#${session.title}`}
            hostTools={hostTools}
            vaultFiles={session.isHost || session.isAdmin ? vaultFiles : []}
            roomSpamEnabled={session.spamBotEnabled}
            onRoomSpamToggle={session.isHost ? toggleSpamBot : undefined}
            canToggleRoomSpam={!!session.isHost}
            speakAsNpc={speakAsNpc}
            onSpeakAsNpcChange={session.isHost ? setSpeakAsNpc : undefined}
            isTableHost={!!session.isHost}
            hostLabel={user?.username ? `@${user.username} (мастер)` : 'Мастер'}
            npcSpeakers={tableNpcs.map((n) => ({
              id: n.id,
              name: n.name,
              imageUrl: n.imageUrl,
              archetype: parseNriSheet(n.sheet)?.npcArchetype,
            }))}
            dmRecipients={vaultRecipients.filter((r) => r.userId !== user?.id)}
            nriInviteCode={inviteCode}
            nriProfile={profile ?? null}
            tableNpcs={tableNpcs}
            tableRoster={roster}
            onNriProfileUpdate={(p) => setProfile(p)}
            roomSpamPaused={!!session.spamPausedActive}
            spamPausedUntil={session.spamPausedUntil ?? walletInfo?.spamPausedUntil}
            antispamPrice={walletInfo?.antispamPrice}
            playerWonlongs={walletInfo?.wonlongs}
            onPayAntispam={!session.isHost && session.spamBotEnabled ? payAntispamFromChat : undefined}
            antispamBusy={antispamBusy}
            onOpenWallet={() => setTab('wallet')}
          />
        )}
        {tab === 'ice' && (
          <NriIceRunPanel inviteCode={inviteCode} onOpenInventory={() => setTab('inventory')} />
        )}
        {tab === 'map' && session && user && (
          <NriCityMapPanel inviteCode={inviteCode} isHost={!!session.isHost} currentUserId={user.id} />
        )}
        {tab === 'wallet' && session && (
          <NriWalletPanel
            inviteCode={inviteCode}
            profile={
              profile ?? {
                displayName: session.hostUsername ?? 'Мастер',
                classId: 'fixer',
              }
            }
            session={session}
            isHost={!!session.isHost}
            onProfileUpdate={(p) => setProfile(p)}
            onSessionRefresh={refresh}
          />
        )}
        {tab === 'inventory' && (profile || session?.isHost) && (
          <NriInventoryPanel
            inviteCode={inviteCode}
            profile={
              profile ?? {
                displayName: session?.hostUsername ?? 'Мастер',
                classId: 'fixer',
                inventory: [],
              }
            }
            isHost={!!session?.isHost}
            roster={roster}
            onProfileUpdate={(p) => setProfile(p)}
          />
        )}
        {tab === 'vault' && (session?.isHost || session?.isAdmin) && session.chatRoomId && (
          <NriVaultTab
            files={vaultFiles}
            onCreate={createVaultFile}
            onDelete={(fileId) => vaultDeleteFile(authToken!, fileId)}
            sendTarget={{ roomId: session.chatRoomId, roomLabel: 'чат стола' }}
            recipients={vaultRecipients}
          />
        )}
        {tab === 'people' && (session?.isHost || session?.isAdmin) && (
          <NriPeopleHub
            inviteCode={inviteCode}
            section={peopleSection}
            onSectionChange={setPeopleSection}
            selectedNpcId={speakAsNpc?.id ?? null}
            onSelectNpc={setSpeakAsNpc}
            onOpenChat={() => setTab('chat')}
          />
        )}
        {tab === 'cyber' && (session?.isHost || session?.isAdmin) && (
          <NriCyberPanel inviteCode={inviteCode} recipients={vaultRecipients} />
        )}
        {tab === 'transport' && session && (
          <NriTransportPanel
            inviteCode={inviteCode}
            isHost={!!session.isHost}
            roster={roster}
          />
        )}
        {tab === 'scenario' && (session?.isHost || session?.isAdmin) && (
          <NriScenarioHub inviteCode={inviteCode} />
        )}
        {tab === 'tools' && (session?.isHost || session?.isAdmin) && session.chatRoomId && authToken && (
          <NriMasterToolsHub
            inviteCode={inviteCode}
            authToken={authToken}
            roomId={session.chatRoomId}
            roster={roster.filter((r) => members.some((m) => m.userId === r.userId && !m.isHost))}
            recipients={vaultRecipients}
            currentUserId={user?.id}
            onVaultCreated={loadVault}
          />
        )}
        {tab === 'notes' && profile && !session?.isHost && (
          <NriPlayerNotesPanel
            inviteCode={inviteCode}
            profile={profile}
            onNotesUpdate={(privateNotes) => setProfile({ ...profile, privateNotes })}
          />
        )}
      </div>

      {err && <p className="nri-lobby__err mono-text">{err}</p>}
      {showRules && <NriRulesPanel onClose={() => setShowRules(false)} />}
      {showSheet && profile && (
        <NriCharacterSheet profile={profile} onClose={() => setShowSheet(false)} />
      )}
      {profile && authToken && !session?.isHost && (
        <NriTattooPickModal
          inviteCode={inviteCode}
          authToken={authToken}
          profile={profile}
          onProfileUpdate={setProfile}
        />
      )}
    </div>
  );
};

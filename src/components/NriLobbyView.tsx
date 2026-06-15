import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Copy, FileArchive, LogOut, Megaphone, Skull, User, Users, UserCircle, XCircle, ScrollText } from 'lucide-react';
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
  nriSavePlayer,
  nriSetSpamBot,
  type NriMember,
  type NriPlayerProfile,
  type NriSessionInfo,
  type NriVaultFile,
} from '../logic/nriApi';
import { chatFetchParticipants } from '../logic/chatApi';
import { NeonChatPanel } from './services/NeonChatPanel';
import GibsonIceHack from './games/GibsonIceHack';
import { NriJoinProfileModal } from './NriJoinProfileModal';
import { NriCharacterSheet } from './NriCharacterSheet';
import { NriCharactersPanel } from './NriCharactersPanel';
import { NriVaultTab, type VaultRecipient } from './NriVaultTab';
import { NriRulesPanel } from './NriRulesPanel';
import { NriPresetsPanel } from './NriPresetsPanel';
import { NriNpcsPanel } from './NriNpcsPanel';
import { NriCyberPanel } from './NriCyberPanel';

import { SPAM_BOT_USERNAME } from '../logic/spamBotMeta';

type Tab = 'chat' | 'ice' | 'vault' | 'presets' | 'chars' | 'npcs' | 'cyber';

type Props = {
  inviteCode: string;
  onLeave: () => void;
  onIceReward: (bits: number) => void;
};

export const NriLobbyView: React.FC<Props> = ({ inviteCode, onLeave, onIceReward }) => {
  const { token } = useAuth();
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
  } | null>(null);
  const [vaultFiles, setVaultFiles] = useState<NriVaultFile[]>([]);
  const [vaultRecipients, setVaultRecipients] = useState<VaultRecipient[]>([]);
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
    }
  }, [authToken, inviteCode, loadVault]);

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

  const needsProfile = profile === null && session && !session.isHost;

  const saveProfile = async (
    displayName: string,
    opts: { presetId?: string; classId?: string }
  ) => {
    if (!authToken) return;
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
    if (tab === 'chat' && (session?.isHost || session?.isAdmin)) {
      loadRecipients();
    }
  }, [tab, session?.isHost, session?.isAdmin, loadVault, loadRecipients]);

  const createVaultFile = async (payload: {
    title: string;
    body: string;
    protected: boolean;
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
        Участник @{SPAM_BOT_USERNAME} появится в чате и шлёт [РЕКЛАМА] ~каждые 9–16 сек.
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
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'vault' ? 'active' : ''} onClick={() => setTab('vault')}>
            <FileArchive size={14} /> ФАЙЛОХРАНИЛИЩЕ
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'presets' ? 'active' : ''} onClick={() => setTab('presets')}>
            <UserCircle size={14} /> ПЕРСОНАЖИ
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'chars' ? 'active' : ''} onClick={() => setTab('chars')}>
            <ScrollText size={14} /> ЧАРНИКИ
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'npcs' ? 'active' : ''} onClick={() => setTab('npcs')}>
            <Users size={14} /> НПС
          </button>
        )}
        {(session?.isHost || session?.isAdmin) && (
          <button type="button" className={tab === 'cyber' ? 'active' : ''} onClick={() => setTab('cyber')}>
            КИБЕР
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
            dmRecipients={vaultRecipients}
            nriInviteCode={inviteCode}
          />
        )}
        {tab === 'ice' && <GibsonIceHack onFinish={onIceReward} />}
        {tab === 'vault' && (session?.isHost || session?.isAdmin) && session.chatRoomId && (
          <NriVaultTab
            files={vaultFiles}
            onCreate={createVaultFile}
            sendTarget={{ roomId: session.chatRoomId, roomLabel: 'чат стола' }}
            recipients={vaultRecipients}
          />
        )}
        {tab === 'presets' && (session?.isHost || session?.isAdmin) && (
          <NriPresetsPanel inviteCode={inviteCode} />
        )}
        {tab === 'chars' && (session?.isHost || session?.isAdmin) && (
          <NriCharactersPanel inviteCode={inviteCode} />
        )}
        {tab === 'npcs' && (session?.isHost || session?.isAdmin) && (
          <NriNpcsPanel
            inviteCode={inviteCode}
            selectedNpcId={speakAsNpc?.id ?? null}
            onSelectNpc={setSpeakAsNpc}
            onOpenChat={() => setTab('chat')}
          />
        )}
        {tab === 'cyber' && (session?.isHost || session?.isAdmin) && (
          <NriCyberPanel inviteCode={inviteCode} recipients={vaultRecipients} />
        )}
      </div>

      {err && <p className="nri-lobby__err mono-text">{err}</p>}
      {showRules && <NriRulesPanel onClose={() => setShowRules(false)} />}
      {showSheet && profile && (
        <NriCharacterSheet profile={profile} onClose={() => setShowSheet(false)} />
      )}
    </div>
  );
};

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, FileText, Megaphone, Send, MessageSquare, Shield, Users } from 'lucide-react';
import { useAuth } from '../../logic/AuthContext';
import { readNeonAuthToken } from '../../logic/authTokenStorage';
import {
  chatFetchMessages,
  chatFetchParticipants,
  chatFetchRooms,
  chatFetchUsers,
  chatGetSpamBot,
  chatOpenDm,
  chatSendFile,
  chatSendMessage,
  chatSetSpamBot,
  type ChatMessage,
  type ChatParticipant,
  type ChatRoomSummary,
  type ChatUser,
} from '../../logic/chatApi';
import type { NriNpc, NriPlayerProfile, NriRosterPlayer, NriVaultFile } from '../../logic/nriApi';
import { nriBroadcastItemTransfer } from '../../logic/nriApi';
import { parseItemTransferPayload, nriItemStatsLine } from '../../logic/nriItemDisplay';
import { SPAM_BOT_LABEL, SPAM_BOT_USERNAME, spamMessageVariant } from '../../logic/spamBotMeta';
import { NriFilePopup } from '../NriFilePopup';
import { NriDmItemTransfer } from '../NriDmItemTransfer';
import { NriHostAlertsStrip } from '../NriHostAlertsStrip';
import { NriCharacterSheet } from '../NriCharacterSheet';
import { NriDispositionDashboard } from '../NriDispositionDashboard';

type TableChannel = 'table' | 'dm' | 'service' | 'tools' | 'disposition';

type Props = {
  className?: string;
  fixedRoomId?: string;
  hideSidebar?: boolean;
  roomTitle?: string;
  hostTools?: React.ReactNode;
  vaultFiles?: NriVaultFile[];
  showGeneralSpamToggle?: boolean;
  roomSpamEnabled?: boolean;
  /** Мастер НРИ: клик по SPAM-боту вкл/выкл */
  onRoomSpamToggle?: () => void;
  canToggleRoomSpam?: boolean;
  speakAsNpc?: { id: string; name: string; imageUrl?: string | null; archetype?: string } | null;
  onSpeakAsNpcChange?: (npc: { id: string; name: string; imageUrl?: string | null; archetype?: string } | null) => void;
  isTableHost?: boolean;
  hostLabel?: string;
  npcSpeakers?: { id: string; name: string; imageUrl?: string | null; archetype?: string }[];
  dmRecipients?: { userId: string; label: string }[];
  nriInviteCode?: string;
  roomSpamPaused?: boolean;
  spamPausedUntil?: number | null;
  antispamPrice?: number;
  playerWonlongs?: number;
  onPayAntispam?: () => void;
  antispamBusy?: boolean;
  onOpenWallet?: () => void;
  nriProfile?: NriPlayerProfile | null;
  tableNpcs?: NriNpc[];
  tableRoster?: NriRosterPlayer[];
  onNriProfileUpdate?: (p: NriPlayerProfile) => void;
};

function ItemTransferMessage({
  m,
  inviteCode,
  authToken,
  canBroadcast,
  onBroadcast,
}: {
  m: ChatMessage;
  inviteCode?: string;
  authToken: string | null;
  canBroadcast: boolean;
  onBroadcast?: () => void;
}) {
  const payload = parseItemTransferPayload(m.payload);
  const [busy, setBusy] = useState(false);
  if (!payload?.item) {
    return (
      <div className="neon-chat-msg neon-chat-msg--item-transfer">
        <span className="neon-chat-text">{m.text}</span>
      </div>
    );
  }
  const stats = payload.statsLine ?? nriItemStatsLine(payload.item);
  const broadcast = async () => {
    if (!authToken || !inviteCode || payload.broadcasted) return;
    setBusy(true);
    await nriBroadcastItemTransfer(authToken, inviteCode, m.id);
    setBusy(false);
    onBroadcast?.();
  };
  return (
    <div className="neon-chat-msg neon-chat-msg--item-transfer">
      {payload.fromNpcId && m.npcName ? (
        <span className="neon-chat-author">{m.npcName ?? payload.fromDisplayName}</span>
      ) : (
        <span className="neon-chat-author">{payload.fromDisplayName ?? m.username}</span>
      )}
      <p className="neon-chat-text">{m.text}</p>
      <div className="nri-dm-transfer__card">
        <strong>{payload.item.name}</strong>
        <p className="mono-text opacity-70">{stats}</p>
        {payload.item.blurb && <p className="mono-text opacity-60">{payload.item.blurb}</p>}
      </div>
      {canBroadcast && inviteCode && !payload.broadcasted && (
        <button type="button" className="nri-lobby__copy" disabled={busy} onClick={broadcast}>
          Показать за столом
        </button>
      )}
      {payload.broadcasted && <span className="mono-text opacity-50">Уже показано за столом</span>}
    </div>
  );
}

function ParticipantChip({
  p,
  onBotClick,
}: {
  p: ChatParticipant;
  onBotClick?: () => void;
}) {
  if (p.isBot) {
    const inner = (
      <>
        <Bot size={12} />
        @{SPAM_BOT_USERNAME}
        <span className="neon-chat-participant__tag">BOT</span>
      </>
    );
    if (onBotClick) {
      return (
        <button
          type="button"
          className="neon-chat-participant neon-chat-participant--bot neon-chat-participant--clickable"
          title={`${SPAM_BOT_LABEL} — нажми для вкл/выкл спама`}
          onClick={onBotClick}
        >
          {inner}
        </button>
      );
    }
    return (
      <span className="neon-chat-participant neon-chat-participant--bot" title={SPAM_BOT_LABEL}>
        {inner}
      </span>
    );
  }
  return (
    <span className="neon-chat-participant">
      {p.isHost && '★ '}
      {p.isAdmin && !p.isHost && '◆ '}
      @{p.username}
    </span>
  );
}

function BotMessage({ m }: { m: ChatMessage }) {
  const variant = spamMessageVariant(m.text);
  return (
    <div className={`neon-chat-msg neon-chat-msg--bot spam bot neon-chat-msg--spam-v${variant}`}>
      <div className="neon-chat-bot-row">
        <span className="neon-chat-bot-avatar" aria-hidden>
          <Bot size={16} />
        </span>
        <div className="neon-chat-bot-body">
          <span className="neon-chat-author">
            @{SPAM_BOT_USERNAME}
            <span className="neon-chat-bot-badge">{SPAM_BOT_LABEL}</span>
          </span>
          <span className="neon-chat-text">{m.text}</span>
        </div>
      </div>
    </div>
  );
}

function NpcMessage({
  m,
  archetypeFallback,
}: {
  m: ChatMessage;
  archetypeFallback?: string;
}) {
  const typeLabel = m.npcArchetype ?? archetypeFallback;
  return (
    <div className="neon-chat-msg neon-chat-msg--npc">
      <div className="neon-chat-bot-row">
        {m.npcImageUrl ? (
          <img src={m.npcImageUrl} alt="" className="neon-chat-npc-avatar" />
        ) : (
          <span className="neon-chat-npc-avatar neon-chat-npc-avatar--ph">
            {typeLabel ? typeLabel.slice(0, 1).toUpperCase() : 'N'}
          </span>
        )}
        <div className="neon-chat-bot-body">
          <span className="neon-chat-author">
            {m.npcName ?? 'NPC'}
            {typeLabel ? <span className="neon-chat-bot-badge">{typeLabel}</span> : null}
          </span>
          <span className="neon-chat-text">{m.text}</span>
        </div>
      </div>
    </div>
  );
}

export const NeonChatPanel: React.FC<Props> = ({
  className,
  fixedRoomId,
  hideSidebar,
  roomTitle,
  hostTools,
  vaultFiles = [],
  showGeneralSpamToggle,
  roomSpamEnabled,
  onRoomSpamToggle,
  canToggleRoomSpam,
  speakAsNpc,
  onSpeakAsNpcChange,
  isTableHost,
  hostLabel,
  npcSpeakers = [],
  dmRecipients = [],
  nriInviteCode,
  roomSpamPaused,
  spamPausedUntil,
  antispamPrice,
  playerWonlongs,
  onPayAntispam,
  antispamBusy,
  onOpenWallet,
  nriProfile,
  tableNpcs = [],
  tableRoster = [],
  onNriProfileUpdate,
}) => {
  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [tableChannel, setTableChannel] = useState<TableChannel>('table');
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [input, setInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showDmList, setShowDmList] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  const [openFileMeta, setOpenFileMeta] = useState<{ title?: string; protected?: boolean } | null>(null);
  const [generalSpam, setGeneralSpam] = useState(false);
  const [composeToUserId, setComposeToUserId] = useState<string | null>(null);
  const [showSpeakerSheet, setShowSpeakerSheet] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const lastTsRef = useRef(0);

  const authToken = readNeonAuthToken() ?? token;
  const canSendFiles = vaultFiles.length > 0;
  const spamActive = showGeneralSpamToggle ? generalSpam : roomSpamEnabled === true;

  const refreshParticipants = useCallback(async () => {
    if (!authToken || !activeRoomId) return;
    const data = await chatFetchParticipants(authToken, activeRoomId);
    if (data) setParticipants(data.participants);
  }, [authToken, activeRoomId]);

  const refreshRooms = useCallback(async () => {
    if (!authToken) return;
    const data = await chatFetchRooms(authToken);
    if (!data) {
      setErr('Не удалось загрузить чат');
      return;
    }
    setErr(null);
    setRooms(data.rooms);
    setIsAdmin(data.me.isAdmin);
    setActiveRoomId((prev) => {
      if (fixedRoomId && tableChannel === 'table') return fixedRoomId;
      if (prev && data.rooms.some((r) => r.id === prev)) return prev;
      if (fixedRoomId) return fixedRoomId;
      const general = data.rooms.find((r) => r.kind === 'public');
      return general?.id ?? data.rooms[0]?.id ?? null;
    });
  }, [authToken, fixedRoomId, tableChannel]);

  const refreshMessages = useCallback(async () => {
    if (!authToken || !activeRoomId) return;
    const since = lastTsRef.current;
    const batch = await chatFetchMessages(authToken, activeRoomId, since > 0 ? since : 0);
    if (batch.length === 0) return;
    if (since === 0) {
      setMessages(batch);
    } else {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...batch.filter((m) => !ids.has(m.id))];
      });
    }
    lastTsRef.current = Math.max(...batch.map((m) => m.ts), lastTsRef.current);
  }, [authToken, activeRoomId]);

  useEffect(() => {
    if (fixedRoomId && tableChannel === 'table') {
      setActiveRoomId(fixedRoomId);
      return;
    }
    if (!fixedRoomId) {
      refreshRooms();
      const t = setInterval(refreshRooms, 8000);
      return () => clearInterval(t);
    }
    refreshRooms();
  }, [refreshRooms, fixedRoomId, tableChannel]);

  useEffect(() => {
    if (!authToken || !showGeneralSpamToggle) return;
    chatGetSpamBot(authToken).then((s) => {
      if (s) setGeneralSpam(s.enabled);
    });
  }, [authToken, showGeneralSpamToggle]);

  useEffect(() => {
    if (!authToken) return;
    chatFetchUsers(authToken).then(setUsers);
  }, [authToken]);

  useEffect(() => {
    lastTsRef.current = 0;
    setMessages([]);
    setParticipants([]);
    if (activeRoomId) {
      refreshMessages();
      refreshParticipants();
    }
  }, [activeRoomId, refreshMessages, refreshParticipants]);

  useEffect(() => {
    if (!activeRoomId) return;
    const t = setInterval(() => {
      refreshMessages();
      refreshParticipants();
    }, 2500);
    return () => clearInterval(t);
  }, [activeRoomId, refreshMessages, refreshParticipants]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!authToken || !input.trim()) return;
    let roomId = activeRoomId;
    if (isTableHost && tableChannel === 'table' && composeToUserId && !activeDmUserId) {
      const room = await chatOpenDm(authToken, composeToUserId);
      if (!room) {
        setErr('Не удалось открыть личку');
        return;
      }
      roomId = room.id;
    }
    if (!roomId) return;
    const msg = await chatSendMessage(authToken, roomId, input, {
      asNpcId: speakAsNpc?.id,
      nriCode: nriInviteCode,
    });
    if (msg) {
      if (roomId === activeRoomId) {
        setMessages((prev) => [...prev, msg]);
        lastTsRef.current = Math.max(lastTsRef.current, msg.ts);
      }
      setInput('');
      refreshRooms();
      refreshParticipants();
    } else {
      setErr('Не удалось отправить');
    }
  };

  const sendFile = async (fileId: string) => {
    if (!authToken || !activeRoomId) return;
    const msg = await chatSendFile(authToken, activeRoomId, fileId);
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      lastTsRef.current = Math.max(lastTsRef.current, msg.ts);
      setShowFilePicker(false);
      refreshRooms();
    } else {
      setErr('Не удалось отправить файл');
    }
  };

  const toggleGeneralSpam = async () => {
    if (!authToken) return;
    const next = !generalSpam;
    const ok = await chatSetSpamBot(authToken, next);
    if (ok) {
      setGeneralSpam(next);
      refreshParticipants();
    }
  };

  const openDm = async (targetUserId: string) => {
    if (!authToken) return;
    const room = await chatOpenDm(authToken, targetUserId);
    if (!room) return;
    setShowDmList(false);
    setTableChannel('dm');
    setActiveDmUserId(targetUserId);
    setActiveRoomId(room.id);
    await refreshRooms();
  };

  const switchToTable = () => {
    setTableChannel('table');
    setActiveDmUserId(null);
    setComposeToUserId(null);
    if (fixedRoomId) setActiveRoomId(fixedRoomId);
  };

  const speakerNpcProfile = useMemo(() => {
    if (!speakAsNpc) return null;
    const n = tableNpcs.find((x) => x.id === speakAsNpc.id);
    if (!n) return null;
    return {
      displayName: n.name,
      classId: n.classId ?? 'merc',
      sheet: n.sheet,
      inventory: n.inventory ?? [],
      portraitUrl: n.imageUrl,
    };
  }, [speakAsNpc, tableNpcs]);

  const speakerSelectValue = speakAsNpc?.id ?? '';
  const handleSpeakerChange = (npcId: string) => {
    if (!onSpeakAsNpcChange) return;
    if (!npcId) {
      onSpeakAsNpcChange(null);
      setShowSpeakerSheet(false);
      return;
    }
    const npc = npcSpeakers.find((n) => n.id === npcId);
    if (npc) onSpeakAsNpcChange(npc);
  };

  const isNriTableChat = !!(fixedRoomId && nriInviteCode);

  const showHostServiceLog = !!(isTableHost && isNriTableChat);
  const showHostToolsTab = showHostServiceLog;

  const effectiveDmRecipients = useMemo(() => {
    const byId = new Map<string, { userId: string; label: string }>();
    for (const r of dmRecipients) byId.set(r.userId, r);
    for (const p of participants) {
      if (p.isBot || !p.userId || p.userId === user?.id) continue;
      if (!byId.has(p.userId)) {
        byId.set(p.userId, { userId: p.userId, label: `@${p.username}` });
      }
    }
    return [...byId.values()];
  }, [dmRecipients, participants, user?.id]);

  const activeDmLabel = activeDmUserId
    ? effectiveDmRecipients.find((r) => r.userId === activeDmUserId)?.label ??
      participants.find((p) => p.userId === activeDmUserId)?.username ??
      null
    : null;

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  const npcArchetypeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of npcSpeakers) {
      if (n.archetype) map.set(n.id, n.archetype);
    }
    return map;
  }, [npcSpeakers]);

  const npcArchetypeFor = (m: ChatMessage) =>
    m.npcArchetype ??
    (m.npcId ? npcArchetypeById.get(m.npcId) : undefined) ??
    (typeof m.payload?.npcId === 'string' ? npcArchetypeById.get(m.payload.npcId) : undefined);

  const sharedFiles = useMemo(() => {
    const map = new Map<string, { fileId: string; title: string; protected?: boolean }>();
    for (const m of messages) {
      if (m.isFile && m.fileId) {
        map.set(m.fileId, {
          fileId: m.fileId,
          title: m.fileTitle ?? m.text.replace(/^📄\s*/, ''),
          protected: m.fileProtected,
        });
      }
    }
    return [...map.values()];
  }, [messages]);

  const sharedFilesBar =
    sharedFiles.length > 0 ? (
      <div className="neon-chat-shared-files">
        <FileText size={13} />
        <span className="mono-text neon-chat-shared-files__label">Файлы в чате ({sharedFiles.length})</span>
        <div className="neon-chat-shared-files__list">
          {sharedFiles.map((f) => (
            <button
              key={f.fileId}
              type="button"
              className="neon-chat-file-btn"
              onClick={() => {
                setOpenFileId(f.fileId);
                setOpenFileMeta({ title: f.title, protected: f.protected });
              }}
            >
              {f.protected ? '🔒' : '📄'} {f.title}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const adminTools =
    showGeneralSpamToggle && isAdmin ? (
      <div className="nri-host-tools">
        <span className="mono-text nri-host-tools__label">#general · админ</span>
        <button
          type="button"
          className={`nri-host-tools__btn ${generalSpam ? 'active' : ''}`}
          onClick={toggleGeneralSpam}
        >
          <Megaphone size={14} />
          {generalSpam ? '■ SPAM-бот (стоп)' : '▶ SPAM-бот (реклама)'}
        </button>
        <span className="mono-text nri-host-tools__hint">
          В канал добавится участник @{SPAM_BOT_USERNAME} — он шлёт [РЕКЛАМА] ~каждые 18–30 сек.
        </span>
      </div>
    ) : null;

  const renderChatMessage = (m: ChatMessage) => {
    const mine = m.userId === user?.id;
    if (parseItemTransferPayload(m.payload)) {
      return (
        <ItemTransferMessage
          key={m.id}
          m={m}
          inviteCode={nriInviteCode}
          authToken={authToken}
          canBroadcast={mine || !!isTableHost}
          onBroadcast={refreshMessages}
        />
      );
    }
    if (m.isBot || m.username === SPAM_BOT_USERNAME) {
      return <BotMessage key={m.id} m={m} />;
    }
    if (m.isNpc) {
      return <NpcMessage key={m.id} m={m} archetypeFallback={npcArchetypeFor(m)} />;
    }
    if (m.isFile && m.fileId) {
      return (
        <div key={m.id} className={`neon-chat-msg neon-chat-msg--file ${mine ? 'mine' : ''}`}>
          <span className="neon-chat-author">
            {m.isAdmin && '★ '}
            {m.username}
          </span>
          <button
            type="button"
            className="neon-chat-file-btn"
            onClick={() => {
              setOpenFileId(m.fileId!);
              setOpenFileMeta({ title: m.fileTitle, protected: m.fileProtected });
            }}
          >
            <FileText size={14} />
            {m.fileTitle ?? m.text}
            {m.fileProtected ? ' 🔒' : ''}
          </button>
        </div>
      );
    }
    if (m.payload?.type === 'item_show') {
      return (
        <div key={m.id} className="neon-chat-msg neon-chat-msg--item-show">
          <span className="neon-chat-author">{m.isAdmin && '★ '}{m.username}</span>
          <span className="neon-chat-text">{m.text}</span>
        </div>
      );
    }
    return (
      <div key={m.id} className={`neon-chat-msg ${mine ? 'mine' : ''} ${m.isSpam ? 'spam' : ''}`}>
        <span className="neon-chat-author">
          {m.isAdmin && '★ '}
          {m.username}
        </span>
        <span className="neon-chat-text">{m.text}</span>
      </div>
    );
  };

  const dmTransferBar =
    tableChannel === 'dm' && activeDmUserId && nriInviteCode && authToken ? (
      <NriDmItemTransfer
        inviteCode={nriInviteCode}
        authToken={authToken}
        toUserId={activeDmUserId}
        isHost={!!isTableHost}
        profile={nriProfile ?? null}
        npcs={tableNpcs}
        speakAsNpcId={speakAsNpc?.id ?? null}
        onProfileUpdate={onNriProfileUpdate}
        onDone={refreshMessages}
        onErr={setErr}
      />
    ) : null;

  const canPayAntispam =
    !!onPayAntispam &&
    roomSpamEnabled &&
    !roomSpamPaused &&
    !isTableHost &&
    typeof antispamPrice === 'number' &&
    typeof playerWonlongs === 'number' &&
    playerWonlongs >= antispamPrice;

  const antispamBar =
    roomSpamEnabled && !isTableHost && nriInviteCode ? (
      <div className="nri-antispam-bar">
        {roomSpamPaused ? (
          <span className="mono-text nri-antispam-bar__ok">
            SPAM приглушён
            {spamPausedUntil && spamPausedUntil > Date.now()
              ? ` · ещё ~${Math.ceil((spamPausedUntil - Date.now()) / 60000)} мин`
              : ''}
          </span>
        ) : (
          <>
            <span className="mono-text nri-antispam-bar__hint">
              Реклама в чате · антиспам ₩{antispamPrice ?? '…'} на 1 ч
            </span>
            {onPayAntispam && (
              <button
                type="button"
                className="nri-antispam-bar__btn"
                disabled={antispamBusy || !canPayAntispam}
                onClick={onPayAntispam}
              >
                {antispamBusy ? '…' : `Оплатить ₩${antispamPrice ?? '…'}`}
              </button>
            )}
            {onOpenWallet && (
              <button type="button" className="nri-antispam-bar__link" onClick={onOpenWallet}>
                Кошелёк
              </button>
            )}
          </>
        )}
      </div>
    ) : null;

  const participantsPanel =
    participants.length > 0 || canToggleRoomSpam ? (
      <div className="neon-chat-participants">
        <Users size={13} />
        <span className="mono-text neon-chat-participants__label">Участники:</span>
        <div className="neon-chat-participants__list">
          {participants.map((p) => (
            <ParticipantChip
              key={p.userId}
              p={p}
              onBotClick={p.isBot && canToggleRoomSpam ? onRoomSpamToggle : undefined}
            />
          ))}
          {canToggleRoomSpam && !participants.some((p) => p.isBot) && (
            <ParticipantChip
              p={{
                userId: SPAM_BOT_USERNAME,
                username: SPAM_BOT_USERNAME,
                isBot: true,
                isHost: false,
                isAdmin: false,
              }}
              onBotClick={onRoomSpamToggle}
            />
          )}
        </div>
        {spamActive && <span className="mono-text neon-chat-participants__live">● SPAM live</span>}
      </div>
    ) : (
      <p className="mono-text opacity-50 neon-chat-host-tools-panel__empty">Участников пока нет.</p>
    );

  const hostToolsPanel = (
    <div className="neon-chat-host-tools-panel">
      {hostTools ?? (
        <p className="mono-text opacity-50 neon-chat-host-tools-panel__empty">Доступно только мастеру стола.</p>
      )}
      {participantsPanel}
      {sharedFilesBar ?? (
        <p className="mono-text opacity-50 neon-chat-host-tools-panel__empty">Файлов в чате пока нет.</p>
      )}
    </div>
  );

  const showComposeTargets =
    !!isTableHost && !!onSpeakAsNpcChange && tableChannel === 'table' && isNriTableChat;

  const composeBar = (
    <div className="neon-chat-compose">
      {showComposeTargets && (
        <div className="neon-chat-compose__targets">
          <label className="neon-chat-speaker-select mono-text">
            <span className="neon-chat-speaker-select__label">Пишете как</span>
            <select
              className="neon-chat-npc-dm-select"
              value={speakerSelectValue}
              onChange={(e) => handleSpeakerChange(e.target.value)}
            >
              <option value="">{hostLabel ?? user?.username ?? 'Мастер'} (вы)</option>
              {npcSpeakers.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} (НПС)
                </option>
              ))}
            </select>
          </label>
          <label className="neon-chat-speaker-select mono-text">
            <span className="neon-chat-speaker-select__label">Кому</span>
            <select
              className="neon-chat-npc-dm-select"
              value={composeToUserId ?? ''}
              onChange={(e) => setComposeToUserId(e.target.value || null)}
            >
              <option value="">Стол (все)</option>
              {effectiveDmRecipients.map((r) => (
                <option key={r.userId} value={r.userId}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {speakerNpcProfile && (
            <button
              type="button"
              className={`neon-chat-sheet-btn ${showSpeakerSheet ? 'active' : ''}`}
              onClick={() => setShowSpeakerSheet((v) => !v)}
              title={showSpeakerSheet ? 'Скрыть лист' : 'Лист персонажа'}
              aria-label="Лист персонажа"
            >
              <FileText size={18} />
            </button>
          )}
        </div>
      )}
      {isTableHost && onSpeakAsNpcChange && !showComposeTargets && (
        <label className="neon-chat-speaker-select mono-text">
          <span className="neon-chat-speaker-select__label">Пишете как</span>
          <select
            className="neon-chat-npc-dm-select"
            value={speakerSelectValue}
            onChange={(e) => handleSpeakerChange(e.target.value)}
          >
            <option value="">{hostLabel ?? user?.username ?? 'Мастер'} (вы)</option>
            {npcSpeakers.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} (НПС)
              </option>
            ))}
          </select>
        </label>
      )}
      {canSendFiles && (
        <button
          type="button"
          className="neon-chat-file-send"
          onClick={() => setShowFilePicker((v) => !v)}
          aria-label="Отправить файл"
        >
          <FileText size={18} />
        </button>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && send()}
        placeholder={composeToUserId && tableChannel === 'table' ? 'Личное сообщение…' : 'Сообщение…'}
        maxLength={500}
      />
      <button type="button" onClick={send} aria-label="Отправить">
        <Send size={18} />
      </button>
    </div>
  );

  return (
    <div className={`neon-chat ${className ?? ''}`}>
      {!hideSidebar && (
      <div className="neon-chat-sidebar">
        <button
          type="button"
          className={`neon-chat-room ${showDmList ? 'active' : ''}`}
          onClick={() => setShowDmList((v) => !v)}
        >
          + ЛИЧКА
        </button>
        {rooms.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`neon-chat-room ${activeRoomId === r.id && !showDmList ? 'active' : ''}`}
            onClick={() => {
              setShowDmList(false);
              setActiveRoomId(r.id);
            }}
          >
            {r.title}
          </button>
        ))}
      </div>
      )}

      <div className="neon-chat-main">
        <div className="neon-chat-head">
          <MessageSquare size={16} />
          <span>
            {showDmList
              ? 'Выбери собеседника'
              : tableChannel === 'service'
                ? 'Служебные уведомления'
                : tableChannel === 'disposition'
                  ? 'Отношения НПС'
                : tableChannel === 'tools'
                  ? 'Инструментарий мастера'
                  : tableChannel === 'dm' && activeDmLabel
                  ? `Личка · ${activeDmLabel}`
                  : roomTitle ?? activeRoom?.title ?? '#general'}
          </span>
          {isAdmin && (
            <span className="neon-chat-admin" title="Админ">
              <Shield size={14} /> ADMIN
            </span>
          )}
        </div>

        {showDmList ? (
          <div className="neon-chat-dm-list">
            {users.map((u) => (
              <button key={u.id} type="button" className="neon-chat-dm-user" onClick={() => openDm(u.id)}>
                @{u.username}
                {u.isAdmin && ' ★'}
              </button>
            ))}
            {users.length === 0 && <p className="mono-text opacity-50">Нет других пользователей</p>}
          </div>
        ) : isNriTableChat ? (
          <>
            <nav className="neon-chat-channel-tabs">
              <button
                type="button"
                className={tableChannel === 'table' ? 'active' : ''}
                onClick={switchToTable}
              >
                Стол
              </button>
              <button
                type="button"
                className={`neon-chat-channel-tabs__dm ${tableChannel === 'dm' ? 'active' : ''}`}
                onClick={() => setTableChannel('dm')}
              >
                Личка
              </button>
              {showHostToolsTab && (
                <button
                  type="button"
                  className={`neon-chat-channel-tabs__tools ${tableChannel === 'tools' ? 'active' : ''}`}
                  onClick={() => {
                    setTableChannel('tools');
                    setActiveDmUserId(null);
                    if (fixedRoomId) setActiveRoomId(fixedRoomId);
                  }}
                >
                  Инструментарий
                </button>
              )}
              {showHostServiceLog && (
                <button
                  type="button"
                  className={`neon-chat-channel-tabs__service ${tableChannel === 'service' ? 'active' : ''}`}
                  onClick={() => {
                    setTableChannel('service');
                    setActiveDmUserId(null);
                    if (fixedRoomId) setActiveRoomId(fixedRoomId);
                  }}
                >
                  Служебные
                </button>
              )}
              {showHostServiceLog && authToken && (
                <button
                  type="button"
                  className={`neon-chat-channel-tabs__disposition ${tableChannel === 'disposition' ? 'active' : ''}`}
                  onClick={() => {
                    setTableChannel('disposition');
                    setActiveDmUserId(null);
                    if (fixedRoomId) setActiveRoomId(fixedRoomId);
                  }}
                >
                  Отношения
                </button>
              )}
            </nav>
            {tableChannel === 'tools' && hostToolsPanel}
            {tableChannel === 'service' && nriInviteCode && (
              <div className="neon-chat-service-log">
                <NriHostAlertsStrip inviteCode={nriInviteCode} variant="chat" />
              </div>
            )}
            {tableChannel === 'disposition' && nriInviteCode && authToken && (
              <div className="neon-chat-disposition-log">
                <NriDispositionDashboard
                  inviteCode={nriInviteCode}
                  authToken={authToken}
                  roster={tableRoster}
                  npcs={tableNpcs}
                />
              </div>
            )}
            {tableChannel === 'dm' && !activeDmUserId && (
              <div className="neon-chat-dm-list neon-chat-dm-list--table">
                <p className="mono-text opacity-70">Выберите игрока стола:</p>
                {effectiveDmRecipients.length === 0 ? (
                  <p className="mono-text opacity-50">Игроки ещё не за столом — личка появится после входа.</p>
                ) : (
                  effectiveDmRecipients.map((r) => (
                    <button key={r.userId} type="button" className="neon-chat-dm-user" onClick={() => openDm(r.userId)}>
                      {r.label}
                    </button>
                  ))
                )}
              </div>
            )}
            {tableChannel === 'dm' && activeDmUserId && (
              <div className="neon-chat-dm-bar mono-text">
                <button type="button" className="nri-lobby__copy" onClick={() => setActiveDmUserId(null)}>
                  ← К списку
                </button>
                <span>{activeDmLabel}</span>
              </div>
            )}
            {dmTransferBar}
            {(tableChannel === 'table' || (tableChannel === 'dm' && activeDmUserId)) && (
              <>
            {adminTools}
            {antispamBar}
            {!showHostToolsTab && hostTools}
            {!showHostToolsTab && participantsPanel}
            {!showHostToolsTab && sharedFilesBar}
            <div className="neon-chat-feed" ref={feedRef}>
              {messages.map(renderChatMessage)}
              {messages.length === 0 && (
                <p className="mono-text opacity-50 neon-chat-empty">
                  {spamActive
                    ? `@${SPAM_BOT_USERNAME} в канале — жди первый спам…`
                    : tableChannel === 'dm'
                      ? 'Личка пуста. Можно передать предмет кнопкой выше.'
                      : 'Тишина в эфире. Напиши первым.'}
                </p>
              )}
            </div>
            {showFilePicker && (
              <div className="neon-chat-file-picker">
                {vaultFiles.map((f) => (
                  <button key={f.id} type="button" onClick={() => sendFile(f.id)}>
                    {f.protected ? '🔒' : '📄'} {f.title}
                  </button>
                ))}
              </div>
            )}
            {composeBar}
              </>
            )}
          </>
        ) : (
          <>
            {adminTools}
            {antispamBar}
            {!isTableHost && hostTools}
            {!isTableHost && participantsPanel}
            {!isTableHost && sharedFilesBar}
            <div className="neon-chat-feed" ref={feedRef}>
              {messages.map(renderChatMessage)}
              {messages.length === 0 && (
                <p className="mono-text opacity-50 neon-chat-empty">
                  {spamActive
                    ? `@${SPAM_BOT_USERNAME} в канале — жди первый спам…`
                    : tableChannel === 'dm'
                      ? 'Личка пуста. Можно передать предмет кнопкой выше.'
                      : 'Тишина в эфире. Напиши первым.'}
                </p>
              )}
            </div>
            {showFilePicker && (
              <div className="neon-chat-file-picker">
                {vaultFiles.map((f) => (
                  <button key={f.id} type="button" onClick={() => sendFile(f.id)}>
                    {f.protected ? '🔒' : '📄'} {f.title}
                  </button>
                ))}
              </div>
            )}
            {composeBar}
          </>
        )}

        {err && <p className="neon-chat-err mono-text">{err}</p>}
      </div>

      {showSpeakerSheet && speakerNpcProfile && (
        <NriCharacterSheet
          title={speakerNpcProfile.displayName}
          profile={speakerNpcProfile}
          onClose={() => setShowSpeakerSheet(false)}
        />
      )}

      {openFileId && (
        <NriFilePopup
          fileId={openFileId}
          fileTitle={openFileMeta?.title}
          fileProtected={openFileMeta?.protected}
          onClose={() => {
            setOpenFileId(null);
            setOpenFileMeta(null);
          }}
        />
      )}
    </div>
  );
};

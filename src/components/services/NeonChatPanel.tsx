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
import type { NriVaultFile } from '../../logic/nriApi';
import { SPAM_BOT_LABEL, SPAM_BOT_USERNAME, spamMessageVariant } from '../../logic/spamBotMeta';
import { NriFilePopup } from '../NriFilePopup';

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
};

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
}) => {
  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [tableChannel, setTableChannel] = useState<'table' | 'dm'>('table');
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
    if (!authToken || !activeRoomId || !input.trim()) return;
    const msg = await chatSendMessage(authToken, activeRoomId, input, {
      asNpcId: speakAsNpc?.id,
      nriCode: nriInviteCode,
    });
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      lastTsRef.current = Math.max(lastTsRef.current, msg.ts);
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
    if (fixedRoomId) setActiveRoomId(fixedRoomId);
  };

  const speakerSelectValue = speakAsNpc?.id ?? '';
  const handleSpeakerChange = (npcId: string) => {
    if (!onSpeakAsNpcChange) return;
    if (!npcId) {
      onSpeakAsNpcChange(null);
      return;
    }
    const npc = npcSpeakers.find((n) => n.id === npcId);
    if (npc) onSpeakAsNpcChange(npc);
  };

  const activeDmLabel = activeDmUserId
    ? dmRecipients.find((r) => r.userId === activeDmUserId)?.label
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
        ) : fixedRoomId && dmRecipients.length > 0 ? (
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
            </nav>
            {tableChannel === 'dm' && !activeDmUserId && (
              <div className="neon-chat-dm-list neon-chat-dm-list--table">
                <p className="mono-text opacity-70">Выберите игрока стола:</p>
                {dmRecipients.map((r) => (
                  <button key={r.userId} type="button" className="neon-chat-dm-user" onClick={() => openDm(r.userId)}>
                    {r.label}
                  </button>
                ))}
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
            {(tableChannel === 'table' || (tableChannel === 'dm' && activeDmUserId)) && (
              <>
            {adminTools}
            {antispamBar}
            {hostTools}
            {participants.length > 0 && (
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
                {spamActive && (
                  <span className="mono-text neon-chat-participants__live">● SPAM live</span>
                )}
              </div>
            )}
            {sharedFilesBar}
            <div className="neon-chat-feed" ref={feedRef}>
              {messages.map((m) => {
                const mine = m.userId === user?.id;
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
                return (
                  <div
                    key={m.id}
                    className={`neon-chat-msg ${mine ? 'mine' : ''} ${m.isSpam ? 'spam' : ''}`}
                  >
                    <span className="neon-chat-author">
                      {m.isAdmin && '★ '}
                      {m.username}
                    </span>
                    <span className="neon-chat-text">{m.text}</span>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="mono-text opacity-50 neon-chat-empty">
                  {spamActive
                    ? `@${SPAM_BOT_USERNAME} в канале — жди первый спам…`
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
            <div className="neon-chat-compose">
              {isTableHost && onSpeakAsNpcChange && (
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
                placeholder="Сообщение…"
                maxLength={500}
              />
              <button type="button" onClick={send} aria-label="Отправить">
                <Send size={18} />
              </button>
            </div>
              </>
            )}
          </>
        ) : (
          <>
            {adminTools}
            {antispamBar}
            {hostTools}
            {participants.length > 0 && (
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
                {spamActive && (
                  <span className="mono-text neon-chat-participants__live">● SPAM live</span>
                )}
              </div>
            )}
            {sharedFilesBar}
            <div className="neon-chat-feed" ref={feedRef}>
              {messages.map((m) => {
                const mine = m.userId === user?.id;
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
                return (
                  <div
                    key={m.id}
                    className={`neon-chat-msg ${mine ? 'mine' : ''} ${m.isSpam ? 'spam' : ''}`}
                  >
                    <span className="neon-chat-author">
                      {m.isAdmin && '★ '}
                      {m.username}
                    </span>
                    <span className="neon-chat-text">{m.text}</span>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="mono-text opacity-50 neon-chat-empty">
                  {spamActive
                    ? `@${SPAM_BOT_USERNAME} в канале — жди первый спам…`
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
            <div className="neon-chat-compose">
              {isTableHost && onSpeakAsNpcChange && (
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
                placeholder="Сообщение…"
                maxLength={500}
              />
              <button type="button" onClick={send} aria-label="Отправить">
                <Send size={18} />
              </button>
            </div>
          </>
        )}

        {err && <p className="neon-chat-err mono-text">{err}</p>}
      </div>

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

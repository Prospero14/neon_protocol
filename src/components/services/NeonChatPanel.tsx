import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { SPAM_BOT_LABEL, SPAM_BOT_USERNAME } from '../../logic/spamBotMeta';
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
  speakAsNpc?: { id: string; name: string; imageUrl?: string | null } | null;
  dmRecipients?: { userId: string; label: string }[];
  nriInviteCode?: string;
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
  return (
    <div className="neon-chat-msg neon-chat-msg--bot spam bot">
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

function NpcMessage({ m }: { m: ChatMessage }) {
  return (
    <div className="neon-chat-msg neon-chat-msg--npc">
      <div className="neon-chat-bot-row">
        {m.npcImageUrl ? (
          <img src={m.npcImageUrl} alt="" className="neon-chat-npc-avatar" />
        ) : (
          <span className="neon-chat-npc-avatar neon-chat-npc-avatar--ph">NPC</span>
        )}
        <div className="neon-chat-bot-body">
          <span className="neon-chat-author">
            {m.npcName ?? 'NPC'}
            <span className="neon-chat-bot-badge">НПС</span>
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
  dmRecipients = [],
  nriInviteCode,
}) => {
  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
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
  const [dmTargetUserId, setDmTargetUserId] = useState('');
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
      if (fixedRoomId) return fixedRoomId;
      if (prev && data.rooms.some((r) => r.id === prev)) return prev;
      const general = data.rooms.find((r) => r.kind === 'public');
      return general?.id ?? data.rooms[0]?.id ?? null;
    });
  }, [authToken, fixedRoomId]);

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
    if (fixedRoomId) {
      setActiveRoomId(fixedRoomId);
      return;
    }
    refreshRooms();
    const t = setInterval(refreshRooms, 8000);
    return () => clearInterval(t);
  }, [refreshRooms, fixedRoomId]);

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
      dmTargetUserId: dmTargetUserId || undefined,
      nriCode: nriInviteCode,
    });
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      lastTsRef.current = Math.max(lastTsRef.current, msg.ts);
      setInput('');
      if (dmTargetUserId) {
        setErr(`Отправлено в личку (${speakAsNpc?.name ?? 'НПС'})`);
        setTimeout(() => setErr(null), 3000);
      }
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
    await refreshRooms();
    setActiveRoomId(room.id);
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

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
          В канал добавится участник @{SPAM_BOT_USERNAME} — он шлёт [РЕКЛАМА] ~каждые 9–16 сек.
        </span>
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
          <span>{showDmList ? 'Выбери собеседника' : roomTitle ?? activeRoom?.title ?? '#general'}</span>
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
        ) : (
          <>
            {adminTools}
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
            <div className="neon-chat-feed" ref={feedRef}>
              {messages.map((m) => {
                const mine = m.userId === user?.id;
                if (m.isBot || m.username === SPAM_BOT_USERNAME) {
                  return <BotMessage key={m.id} m={m} />;
                }
                if (m.isNpc) {
                  return <NpcMessage key={m.id} m={m} />;
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
              {speakAsNpc && (
                <div className="neon-chat-npc-compose mono-text">
                  <span>
                    Пишете как <strong>{speakAsNpc.name}</strong>
                    {speakAsNpc.imageUrl && (
                      <img src={speakAsNpc.imageUrl} alt="" className="neon-chat-npc-compose__thumb" />
                    )}
                  </span>
                  <select
                    className="neon-chat-npc-dm-select"
                    value={dmTargetUserId}
                    onChange={(e) => setDmTargetUserId(e.target.value)}
                  >
                    <option value="">→ общий чат стола</option>
                    {dmRecipients.map((r) => (
                      <option key={r.userId} value={r.userId}>
                        → личка: {r.label}
                      </option>
                    ))}
                  </select>
                </div>
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

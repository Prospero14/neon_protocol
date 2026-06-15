import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import type { SkillMode } from '../logic/skillMode';
import type { CoopRole } from '../logic/sessionMode';
import { COOP_ROLES, COOP_ROLE_LABELS } from '../logic/sessionMode';
import {
  coopLobbyHeartbeat,
  coopLobbyInvite,
  coopLobbyLeaveParty,
  coopLobbySendChat,
  coopMatchCreate,
  coopMatchJoin,
  type CoopLobbyChatMessage,
  type CoopLobbyOnlineUser,
  type CoopLobbyParty,
} from '../logic/coopLobbyApi';
import { CoopRoleBadge } from './CoopRoleBadge';
import type { CoopSquadFill } from '../logic/coopTeamFlow';
import { Radio, Users, Send, Play, LogOut, Bot } from 'lucide-react';

type Props = {
  playerDisplayName: string;
  coopRole: CoopRole;
  onLaunchSprint: (
    startupName: string,
    tierRank: SkillMode,
    opts?: { coopSquadFill: CoopSquadFill; coopMatchId?: string | null }
  ) => void;
  onSwitchCoopClass: (role: CoopRole) => void;
};

export const CoopLobbyView: React.FC<Props> = ({ playerDisplayName, coopRole, onLaunchSprint, onSwitchCoopClass }) => {
  const { token, user } = useAuth();
  const [online, setOnline] = useState<CoopLobbyOnlineUser[]>([]);
  const [party, setParty] = useState<CoopLobbyParty | null>(null);
  const [chat, setChat] = useState<CoopLobbyChatMessage[]>([]);
  const [inviteName, setInviteName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [startupName, setStartupName] = useState('');
  const [tierRank, setTierRank] = useState<SkillMode>('junior');
  /** Локально: подсветка «союзники-боты» (один клиент); при живой пати сбрасывается. */
  const [syntheticSquad, setSyntheticSquad] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (party) setSyntheticSquad(false);
  }, [party]);

  const beat = useCallback(async () => {
    const authToken = readNeonAuthToken() ?? token;
    if (!authToken) return;
    const data = await coopLobbyHeartbeat(authToken, {
      displayName: playerDisplayName,
      coopRole,
      clientUsername: user?.username ?? '',
    });
    if (data) {
      setOnline(data.online);
      setParty(data.party);
      setActiveMatchId(data.activeMatchId);
      setChat(data.chat);
    }
  }, [token, playerDisplayName, coopRole, user?.username]);

  useEffect(() => {
    beat();
    pollRef.current = setInterval(beat, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [beat]);

  const sendChat = async () => {
    const authToken = readNeonAuthToken() ?? token;
    if (!authToken || !chatInput.trim()) return;
    const ok = await coopLobbySendChat(authToken, chatInput);
    if (ok) {
      setChatInput('');
      beat();
    }
  };

  const invite = async () => {
    const authToken = readNeonAuthToken() ?? token;
    if (!authToken || !inviteName.trim()) return;
    setErr(null);
    const p = await coopLobbyInvite(authToken, inviteName.trim());
    if (!p) {
      setErr('Не удалось пригласить: ник не в сети или занят другой пати.');
      return;
    }
    setParty(p);
    beat();
  };

  const leave = async () => {
    const authToken = readNeonAuthToken() ?? token;
    if (!authToken) return;
    await coopLobbyLeaveParty(authToken);
    setParty(null);
    beat();
  };

  const partyHasPm = party?.members.some((m) => m.coopRole === 'pm');
  const iAmPm = coopRole === 'pm';

  const launch = async () => {
    if (iAmPm && !startupName.trim()) {
      setErr('Введите название стартапа (роль PM).');
      return;
    }
    const name =
      iAmPm && startupName.trim()
        ? startupName.trim().slice(0, 48)
        : `SQUAD_${playerDisplayName.replace(/\s+/g, '_').slice(0, 24)}`;
    const coopSquadFill: CoopSquadFill =
      party && party.members.length > 1 ? 'live_party' : 'synthetic_bots';
    let coopMatchId: string | null = null;
    const authToken = readNeonAuthToken() ?? token;
    if (authToken && coopSquadFill === 'live_party' && party) {
      const iAmHost = party.hostId === user?.id;
      if (iAmHost) {
        const m = await coopMatchCreate(authToken);
        if (!m) {
          setErr('Не удалось создать общий матч для пати.');
          return;
        }
        coopMatchId = m.id;
      } else if (activeMatchId) {
        const joined = await coopMatchJoin(authToken, activeMatchId);
        if (!joined) {
          setErr('Хост ещё не открыл общий матч. Повторите через пару секунд.');
          return;
        }
        coopMatchId = joined.id;
      }
    }
    onLaunchSprint(name, tierRank, { coopSquadFill, coopMatchId });
  };

  return (
    <div className="coop-lobby-view main-crt">
      <div className="coop-lobby-inner">
        <header className="coop-lobby-header">
          <Radio size={28} strokeWidth={0.5} className="coop-lobby-icon" />
          <div>
            <div className="coop-lobby-kicker">CO-OP // WAITING_ZONE</div>
            <h1 className="coop-lobby-title">Сбор пати и общий канал</h1>
            <div className="coop-lobby-class-row" style={{ marginTop: 12 }}>
              {COOP_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`coop-rank-chip ${coopRole === r ? 'active' : ''}`}
                  onClick={() => onSwitchCoopClass(r)}
                >
                  {COOP_ROLE_LABELS[r].title}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="coop-lobby-grid">
          <div className="coop-lobby-main-col">
            <section className="coop-lobby-panel">
              <div className="coop-lobby-panel-head">ONLINE</div>
              <ul className="coop-lobby-list">
                {online.map((u) => (
                  <li key={u.userId} className="coop-lobby-list-item">
                    <CoopRoleBadge role={u.coopRole} size={14} />
                    <span>{u.displayName}</span>
                    <span className="coop-lobby-dim">{u.clientUsername ? `@${u.clientUsername}` : ''}</span>
                  </li>
                ))}
                {online.length === 0 && <li className="coop-lobby-empty">Пока никого, кроме вас.</li>}
              </ul>

              <div className="coop-lobby-panel-head" style={{ marginTop: 16 }}>
                <Users size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                ПАТИ
              </div>
              {party ? (
                <>
                  <ul className="coop-lobby-list">
                    {party.members.map((m) => (
                      <li key={m.userId} className="coop-lobby-list-item">
                        <CoopRoleBadge role={m.coopRole} size={14} />
                        <span>{m.displayName}</span>
                        {m.userId === party.hostId && <span className="coop-lobby-tag">HOST</span>}
                        <span className="coop-lobby-dim">{COOP_ROLE_LABELS[m.coopRole as CoopRole]?.title ?? m.coopRole}</span>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="coop-lobby-secondary" onClick={leave}>
                    <LogOut size={16} style={{ marginRight: 6 }} />
                    Выйти из пати
                  </button>
                </>
              ) : syntheticSquad ? (
                <>
                  <p className="coop-lobby-hint">
                    Слоты заполнены ботами: на полигоне вы один за клиент, ИИ — оппонент; в ретро спринта подмешиваются синтетические оценки остальных ролей.
                  </p>
                  <ul className="coop-lobby-list">
                    <li className="coop-lobby-list-item">
                      <CoopRoleBadge role={coopRole} size={14} />
                      <span>{playerDisplayName}</span>
                      <span className="coop-lobby-tag">HOST</span>
                      <span className="coop-lobby-dim">{COOP_ROLE_LABELS[coopRole].title}</span>
                    </li>
                    {COOP_ROLES.filter((r) => r !== coopRole).map((r) => (
                      <li key={r} className="coop-lobby-list-item coop-lobby-bot-row">
                        <CoopRoleBadge role={r} size={14} />
                        <span>SYN_{COOP_ROLE_LABELS[r].title}</span>
                        <span className="coop-lobby-tag coop-lobby-tag--bot">
                          <Bot size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                          BOT
                        </span>
                        <span className="coop-lobby-dim">{COOP_ROLE_LABELS[r].title}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="coop-lobby-hint">
                  Пати пуста: пригласите игрока по игровому имени (точное совпадение) или включите ботов ниже.
                </p>
              )}

              {!party && (
                <label className="coop-lobby-bot-toggle">
                  <input
                    type="checkbox"
                    checked={syntheticSquad}
                    onChange={(e) => {
                      setSyntheticSquad(e.target.checked);
                      setErr(null);
                    }}
                  />
                  <span>Играть с ботами вместо живых игроков</span>
                </label>
              )}

              <div className="coop-lobby-invite">
                <input
                  className="coop-lobby-input"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Игровой ник в сети"
                  maxLength={48}
                  disabled={syntheticSquad}
                />
                <button type="button" className="coop-lobby-primary" onClick={invite} disabled={syntheticSquad}>
                  Пригласить
                </button>
              </div>
              {err && <div className="coop-lobby-err">{err}</div>}
            </section>

            <section className="coop-lobby-panel coop-lobby-launch">
            <div className="coop-lobby-panel-head">СПРИНТ (ведёт PM)</div>
            {iAmPm ? (
              <>
                <label className="coop-lobby-label">STARTUP_DISPLAY_NAME</label>
                <input
                  className="coop-lobby-input"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value.slice(0, 48))}
                  placeholder="NEON_LABS_0x01"
                />
              </>
            ) : (
              <p className="coop-lobby-hint">
                Роль PM задаёт название и ранг. {partyHasPm ? 'PM в пати — дождитесь ввода или запустите соло-полигон.' : 'В пати нет PM — вы можете запустить полигон с авто-именем.'}
              </p>
            )}
            <label className="coop-lobby-label" style={{ marginTop: 12 }}>
              MISSION_RANK
            </label>
            <div className="coop-lobby-rank-row">
              {(
                [
                  ['script-kiddie', 'CADET'],
                  ['junior', 'JUNIOR'],
                  ['mid', 'MIDDLE'],
                  ['senior', 'SENIOR'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`coop-rank-chip ${tierRank === val ? 'active' : ''}`}
                  onClick={() => setTierRank(val)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="coop-lobby-launch-btn" onClick={launch}>
              <Play size={18} style={{ marginRight: 8 }} />
              На полигон CO-OP YARD
            </button>
            <p className="coop-lobby-micro">
              Каждые 5 миссий ранга — пак карт для вашей роли (в т.ч. Spring-ветка для dev). После 25 — BOSS, затем следующий ранг.
              {syntheticSquad && !party && ' Боты не ходят в общий чат — только вы.'}
            </p>
          </section>
          </div>

          <section className="coop-lobby-panel coop-lobby-chat coop-lobby-chat--aside">
            <div className="coop-lobby-panel-head">GLOBAL // CHAT</div>
            <div className="coop-lobby-chat-log">
              {chat.map((m) => (
                <div key={m.id} className="coop-lobby-chat-line">
                  <CoopRoleBadge role={m.coopRole} size={12} />
                  <span className="coop-lobby-chat-name">{m.displayName}</span>
                  <span className="coop-lobby-chat-text">{m.text}</span>
                </div>
              ))}
              {chat.length === 0 && <div className="coop-lobby-empty">Нет сообщений. Напишите что-нибудь.</div>}
            </div>
            <div className="coop-lobby-chat-input-row">
              <input
                className="coop-lobby-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Сообщение в общий канал..."
                maxLength={500}
              />
              <button type="button" className="coop-lobby-send" onClick={sendChat}>
                <Send size={18} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

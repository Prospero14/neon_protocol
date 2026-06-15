import React, { useEffect, useState } from 'react';
import { MoreHorizontal, Send } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { chatSendFile, chatSendFileToUser } from '../logic/chatApi';
import { NRI_GAME_CATALOG, type IceDifficulty } from '../logic/nriGameCatalog';
import type { NriVaultFile, VaultCreateResult } from '../logic/nriApi';

export type VaultSendTarget = {
  roomId: string;
  roomLabel: string;
};

export type VaultRecipient = {
  userId: string;
  label: string;
};

type Props = {
  files: NriVaultFile[];
  onCreate: (payload: {
    title: string;
    body: string;
    protected: boolean;
    gameId?: string;
    difficulty?: string;
  }) => Promise<VaultCreateResult>;
  sendTarget?: VaultSendTarget;
  recipients?: VaultRecipient[];
};

export const NriVaultTab: React.FC<Props> = ({
  files,
  onCreate,
  sendTarget,
  recipients = [],
}) => {
  const { token, user } = useAuth();
  const authToken = readNeonAuthToken() ?? token;

  const [list, setList] = useState<NriVaultFile[]>(files);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [protectedFlag, setProtectedFlag] = useState(false);
  const [gameId, setGameId] = useState(NRI_GAME_CATALOG[0]?.id ?? 'gibson_ice');
  const [difficulty, setDifficulty] = useState<IceDifficulty>('medium');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sendBusyId, setSendBusyId] = useState<string | null>(null);

  useEffect(() => {
    setList(files);
  }, [files]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    const result = await onCreate({
      title: title.trim(),
      body,
      protected: protectedFlag,
      gameId: protectedFlag ? gameId : undefined,
      difficulty: protectedFlag ? difficulty : undefined,
    });
    setBusy(false);
    if (result.ok) {
      setList((prev) => {
        const ids = new Set(prev.map((f) => f.id));
        if (ids.has(result.file.id)) return prev;
        return [result.file, ...prev];
      });
      setTitle('');
      setBody('');
      setNotice(`Файл «${result.file.title}» создан`);
    } else {
      setErr(result.error);
    }
  };

  const sendToRoom = async (fileId: string) => {
    if (!authToken || !sendTarget) return;
    setSendBusyId(fileId);
    setOpenMenuId(null);
    const msg = await chatSendFile(authToken, sendTarget.roomId, fileId);
    setSendBusyId(null);
    if (msg) setNotice(`Отправлено в ${sendTarget.roomLabel}`);
    else setErr('Не удалось отправить в чат');
  };

  const sendToUser = async (fileId: string, userId: string, label: string) => {
    if (!authToken) return;
    setSendBusyId(fileId);
    setOpenMenuId(null);
    const msg = await chatSendFileToUser(authToken, fileId, userId);
    setSendBusyId(null);
    if (msg) setNotice(`Отправлено в личку ${label}`);
    else setErr('Не удалось отправить в личку');
  };

  const dmRecipients = recipients.filter((r) => r.userId !== user?.id);

  return (
    <div className="nri-vault">
      <h3 className="mono-text">Файлохранилище</h3>
      <p className="mono-text opacity-70">
        Создайте файл — он появится в списке. Отправляйте в общий чат или в личку участнику.
      </p>

      <div className="nri-vault__form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название файла" maxLength={80} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Содержимое…" rows={6} maxLength={8000} />
        <label className="nri-vault__toggle">
          <input type="checkbox" checked={protectedFlag} onChange={(e) => setProtectedFlag(e.target.checked)} />
          Защищённый (icebreaker)
        </label>
        {protectedFlag && (
          <div className="nri-vault__game-pick">
            <select value={gameId} onChange={(e) => setGameId(e.target.value)}>
              {NRI_GAME_CATALOG.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as IceDifficulty)}>
              <option value="easy">Лёгкий</option>
              <option value="medium">Средний</option>
              <option value="hard">Сложный</option>
            </select>
          </div>
        )}
        <button type="button" onClick={submit} disabled={busy || !title.trim()}>
          {busy ? '…' : 'Создать файл'}
        </button>
      </div>

      {notice && <p className="nri-vault__notice mono-text">{notice}</p>}
      {err && <p className="nri-vault__err mono-text">{err}</p>}

      <div className="nri-vault__list-head mono-text">Файлы ({list.length})</div>
      <ul className="nri-vault__list">
        {list.map((f) => {
          const menuOpen = openMenuId === f.id;
          const sending = sendBusyId === f.id;
          return (
            <li key={f.id} className="nri-vault__item">
              <div className="nri-vault__item-main">
                <span className="nri-vault__item-title">
                  {f.protected ? '🔒' : '📄'} {f.title}
                </span>
                {f.protected && f.gameId && (
                  <span className="mono-text opacity-60 nri-vault__item-meta">
                    {NRI_GAME_CATALOG.find((g) => g.id === f.gameId)?.title ?? f.gameId} · {f.difficulty}
                  </span>
                )}
              </div>
              {sendTarget && (
                <div className="nri-vault__item-actions">
                  <button
                    type="button"
                    className="nri-vault__send-btn"
                    disabled={sending}
                    onClick={() => setOpenMenuId(menuOpen ? null : f.id)}
                    aria-label="Отправить файл"
                  >
                    {sending ? '…' : <MoreHorizontal size={16} />}
                  </button>
                  {menuOpen && (
                    <div className="nri-vault__menu">
                      <button type="button" onClick={() => sendToRoom(f.id)}>
                        <Send size={12} /> В {sendTarget.roomLabel}
                      </button>
                      {dmRecipients.length > 0 && (
                        <>
                          <span className="nri-vault__menu-divider mono-text">Личка</span>
                          {dmRecipients.map((r) => (
                            <button key={r.userId} type="button" onClick={() => sendToUser(f.id, r.userId, r.label)}>
                              <Send size={12} /> {r.label}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {list.length === 0 && <li className="mono-text opacity-50 nri-vault__empty">Пока нет файлов</li>}
      </ul>
    </div>
  );
};

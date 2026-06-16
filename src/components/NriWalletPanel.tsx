import React, { useCallback, useEffect, useState } from 'react';
import { Coins, ShieldOff, Send } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import {
  nriFetchRoster,
  nriFetchWallet,
  nriGrantWonlongs,
  nriPayAntispam,
  nriTransferWonlongs,
  type NriPlayerProfile,
  type NriRosterPlayer,
  type NriSessionInfo,
  type NriWalletInfo,
} from '../logic/nriApi';
import { readWonlongs } from '../logic/nriWallet';
import { parseNriSheet } from '../logic/nriNpcGenerator';

type Props = {
  inviteCode: string;
  profile: NriPlayerProfile;
  session: NriSessionInfo;
  isHost: boolean;
  onProfileUpdate: (p: NriPlayerProfile) => void;
  onSessionRefresh: () => void;
};

function fmtPause(until: number | null | undefined): string {
  if (!until || until <= Date.now()) return '';
  const min = Math.ceil((until - Date.now()) / 60000);
  return `~${min} мин`;
}

export const NriWalletPanel: React.FC<Props> = ({
  inviteCode,
  profile,
  session,
  isHost,
  onProfileUpdate,
  onSessionRefresh,
}) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [wallet, setWallet] = useState<NriWalletInfo | null>(null);
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('50');
  const [transferTarget, setTransferTarget] = useState('');
  const [memo, setMemo] = useState('');
  const [grantPlayer, setGrantPlayer] = useState('');
  const [grantNpc, setGrantNpc] = useState('');
  const [grantAmount, setGrantAmount] = useState('100');

  const load = useCallback(async () => {
    if (!authToken) return;
    const w = await nriFetchWallet(authToken, inviteCode);
    if (w) setWallet(w);
    if (isHost) {
      const r = await nriFetchRoster(authToken, inviteCode);
      if (r) setRoster(r);
    }
  }, [authToken, inviteCode, isHost]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const balance = wallet?.wonlongs ?? readWonlongs(parseNriSheet(profile.sheet));
  const targets = wallet?.transferTargets;

  const payAntispam = async () => {
    if (!authToken || !wallet) return;
    setBusy(true);
    setErr(null);
    const res = await nriPayAntispam(authToken, inviteCode);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onProfileUpdate({
      ...profile,
      sheet: { ...(parseNriSheet(profile.sheet) ?? {}), wonlongs: res.wonlongs },
    });
    onSessionRefresh();
    await load();
  };

  const transfer = async () => {
    if (!authToken) return;
    const amt = Math.floor(Number(amount));
    if (!amt || amt <= 0) {
      setErr('Укажите сумму.');
      return;
    }
    if (!transferTarget) {
      setErr('Выберите получателя.');
      return;
    }
    const isNpc = transferTarget.startsWith('npc:');
    setBusy(true);
    setErr(null);
    const res = await nriTransferWonlongs(authToken, inviteCode, {
      amount: amt,
      ...(isNpc ? { toNpcId: transferTarget.slice(4) } : { toPlayerUserId: transferTarget }),
      memo: memo.trim() || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onProfileUpdate({
      ...profile,
      sheet: { ...(parseNriSheet(profile.sheet) ?? {}), wonlongs: res.wonlongs },
    });
    setMemo('');
    await load();
  };

  const grant = async () => {
    if (!authToken || !grantPlayer) return;
    const amt = Math.floor(Number(grantAmount));
    if (!amt || amt <= 0) {
      setErr('Укажите сумму.');
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await nriGrantWonlongs(authToken, inviteCode, {
      playerUserId: grantPlayer,
      amount: amt,
      fromNpcId: grantNpc || undefined,
      memo: memo.trim() || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await load();
    setMemo('');
  };

  const canPayAntispam =
    !!session.spamBotEnabled &&
    !session.spamPausedActive &&
    !isHost &&
    wallet &&
    balance >= wallet.antispamPrice;

  return (
    <div className="nri-wallet">
      <header className="nri-wallet__head">
        <Coins size={18} />
        <div>
          <h2 className="nri-wallet__title">Wonlongs (₩)</h2>
          <p className="mono-text nri-wallet__balance">
            Баланс: <strong>₩{balance}</strong>
            {wallet && (
              <span className="opacity-70">
                {' '}
                · на столе всего ₩{wallet.tableWonlongsSum}
              </span>
            )}
          </p>
        </div>
      </header>

      {err && <p className="nri-vault__err mono-text">{err}</p>}

      {session.spamBotEnabled && !isHost && (
        <section className="nri-wallet__block">
          <h3 className="mono-text">
            <ShieldOff size={14} /> Антиспам
          </h3>
          {session.spamPausedActive ? (
            <p className="mono-text nri-wallet__ok">
              SPAM приглушён ещё {fmtPause(session.spamPausedUntil ?? wallet?.spamPausedUntil)}
            </p>
          ) : (
            <>
              <p className="mono-text opacity-70">
                Цена: ₩{wallet?.antispamPrice ?? '…'}.
                Тишина на 1 час для всего стола.
              </p>
              <button
                type="button"
                className="nri-wallet__pay"
                disabled={busy || !canPayAntispam}
                onClick={payAntispam}
              >
                Оплатить антиспам · ₩{wallet?.antispamPrice ?? '…'}
              </button>
              {wallet && balance < wallet.antispamPrice && (
                <p className="mono-text opacity-50">Не хватает ₩ для оплаты.</p>
              )}
            </>
          )}
        </section>
      )}

      <section className="nri-wallet__block">
        <h3 className="mono-text">
          <Send size={14} /> Перевод
        </h3>
        <div className="nri-wallet__row">
          <input
            type="number"
            min={1}
            className="nri-wallet__input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Сумма ₩"
          />
          <select
            className="nri-wallet__select"
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
          >
            <option value="">Кому…</option>
            {(targets?.players ?? []).map((r) => (
              <option key={r.userId} value={r.userId}>
                Игрок: {r.displayName}
              </option>
            ))}
            {(targets?.npcs ?? []).map((n) => (
              <option key={n.id} value={`npc:${n.id}`}>
                НПС: {n.name}
              </option>
            ))}
          </select>
        </div>
        <input
          className="nri-wallet__input nri-wallet__input--wide"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Комментарий (оплата, чаевые…)"
        />
        <button type="button" className="nri-vault__send-btn" disabled={busy} onClick={transfer}>
          Перевести
        </button>
      </section>

      {isHost && (
        <section className="nri-wallet__block nri-wallet__block--host">
          <h3 className="mono-text">Выдать игроку (мастер)</h3>
          <p className="mono-text opacity-50">Квест, продажа, награда — с кошелька НПС или «из воздуха».</p>
          <div className="nri-wallet__row">
            <select
              className="nri-wallet__select"
              value={grantPlayer}
              onChange={(e) => setGrantPlayer(e.target.value)}
            >
              <option value="">Игрок…</option>
              {roster.map((r) => (
                <option key={r.userId} value={r.userId}>
                  {r.displayName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="nri-wallet__input"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
            />
          </div>
          <select
            className="nri-wallet__select nri-wallet__select--wide"
            value={grantNpc}
            onChange={(e) => setGrantNpc(e.target.value)}
          >
            <option value="">Источник: мастер (без списания)</option>
            {(targets?.npcs ?? []).map((n) => (
              <option key={n.id} value={n.id}>
                Списать с НПС: {n.name} (₩{n.wonlongs})
              </option>
            ))}
          </select>
          <button type="button" className="nri-vault__send-btn" disabled={busy} onClick={grant}>
            Выдать ₩
          </button>
        </section>
      )}
    </div>
  );
};

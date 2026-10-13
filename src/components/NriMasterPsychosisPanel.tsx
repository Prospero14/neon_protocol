import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Phone, PhoneOff, Activity } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { nriFetchRoster, nriPatchPlayer, type NriRosterPlayer } from '../logic/nriApi';
import { sendNriChatMessage } from '../logic/nriChatDispatch';
import { parseNriSheet } from '../logic/nriNpcGenerator';
import {
  computePsychosis,
  psychosisTierLabel,
  requestOpenDm,
  resolvePsychosisEncounter,
  startPsychosisEncounter,
  PSYCHOSIS_THRESHOLDS,
  type PsychosisBreakdown,
} from '../logic/nriPsychosis';
import { getBloodToxLimit, parseAugmentedSheet } from '../logic/nriCyberInstall';

type Props = {
  inviteCode: string;
  authToken: string;
  roomId: string;
};

function StressBar({ snap }: { snap: PsychosisBreakdown }) {
  const max = Math.max(100, snap.total, PSYCHOSIS_THRESHOLDS.episode);
  const pct = Math.min(100, Math.round((snap.total / max) * 100));
  const tierClass =
    snap.tier === 'episode'
      ? 'is-episode'
      : snap.tier === 'critical'
        ? 'is-critical'
        : snap.tier === 'unstable'
          ? 'is-unstable'
          : 'is-stable';
  return (
    <div className={`nri-psychosis-bar ${tierClass}`} title={`PS ${snap.total}`}>
      <div className="nri-psychosis-bar__fill" style={{ width: `${pct}%` }} />
      <span className="nri-psychosis-bar__marks">
        <i style={{ left: `${(PSYCHOSIS_THRESHOLDS.unstable / max) * 100}%` }} />
        <i style={{ left: `${(PSYCHOSIS_THRESHOLDS.critical / max) * 100}%` }} />
        <i style={{ left: `${(PSYCHOSIS_THRESHOLDS.episode / max) * 100}%` }} />
      </span>
    </div>
  );
}

function HistorySpark({ history }: { history: PsychosisBreakdown['history'] }) {
  if (!history.length) {
    return <p className="mono-text opacity-50 nri-psychosis-spark__empty">Нет эпизодов</p>;
  }
  const w = 160;
  const h = 36;
  const maxS = Math.max(60, ...history.map((e) => e.stressAtTrigger));
  const pts = history
    .slice(-12)
    .map((e, i, arr) => {
      const x = arr.length <= 1 ? w / 2 : (i / (arr.length - 1)) * (w - 4) + 2;
      const y = h - 4 - (e.stressAtTrigger / maxS) * (h - 8);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg className="nri-psychosis-spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden>
      <polyline fill="none" stroke="rgba(255,100,120,0.85)" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function playerSnap(p: NriRosterPlayer): PsychosisBreakdown {
  const sheet = parseNriSheet(p.sheet);
  const aug = parseAugmentedSheet(p.sheet);
  const bt =
    aug?.bloodToxCurrent ??
    sheet?.bloodToxCurrent ??
    (aug?.augmentations ?? []).reduce((s, a) => s + (a.bloodTox ?? 0), 0);
  const limit = getBloodToxLimit(aug) || sheet?.bloodToxLimit || 12;
  return computePsychosis({
    ...(sheet ?? {}),
    bloodToxCurrent: bt,
    bloodToxLimit: limit,
    activeConditions: sheet?.activeConditions,
    psychosisScarLevel: sheet?.psychosisScarLevel,
    psychosisHistory: sheet?.psychosisHistory,
    psychosisPending: sheet?.psychosisPending,
    psychosisEncounter: sheet?.psychosisEncounter,
  });
}

export const NriMasterPsychosisPanel: React.FC<Props> = ({ inviteCode, authToken, roomId }) => {
  const { token } = useAuth();
  const tok = authToken || readNeonAuthToken() || token;
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const refresh = useCallback(async () => {
    if (!tok) return;
    const list = await nriFetchRoster(tok, inviteCode);
    if (list) setRoster(list);
  }, [tok, inviteCode]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8_000);
    return () => clearInterval(t);
  }, [refresh]);

  const rows = useMemo(
    () =>
      roster.map((p) => ({
        player: p,
        snap: playerSnap(p),
      })),
    [roster]
  );

  const selected = rows.find((r) => r.player.userId === selectedId) ?? rows[0];
  useEffect(() => {
    if (!selectedId && rows[0]) setSelectedId(rows[0].player.userId);
  }, [rows, selectedId]);

  const patchSheet = async (userId: string, sheet: object, chatLine: string) => {
    const res = await nriPatchPlayer(tok!, inviteCode, userId, { sheet });
    if (!res.ok) {
      setNotice(res.error);
      return false;
    }
    await sendNriChatMessage(tok!, roomId, inviteCode, chatLine, { kind: 'dm', userId });
    await refresh();
    return true;
  };

  const callPlayer = async () => {
    if (!selected || !tok) return;
    setBusy(true);
    setNotice(null);
    try {
      const sheet = parseNriSheet(selected.player.sheet) ?? {
        abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, TEC: 10, PEO: 10 },
        level: 1,
        proficiencyBonus: 2,
        hpMax: 10,
        hp: 10,
        ac: 10,
      };
      const next = startPsychosisEncounter(sheet, { peerUserId: selected.player.userId });
      const ok = await patchSheet(
        selected.player.userId,
        next,
        `📞 Психоз-энкаунтер · связь с ${selected.player.displayName}. Мастер на линии.`
      );
      if (ok) {
        requestOpenDm(selected.player.userId, {
          label: selected.player.displayName,
          popup: true,
        });
        setNotice('Звонок начат — живой чат открыт');
      }
    } finally {
      setBusy(false);
    }
  };

  const endEncounter = async () => {
    if (!selected || !tok) return;
    setBusy(true);
    setNotice(null);
    try {
      const sheet = parseNriSheet(selected.player.sheet);
      if (!sheet) {
        setNotice('Нет листа');
        return;
      }
      const { sheet: next, event } = resolvePsychosisEncounter(sheet, {
        notes: notes.trim() || undefined,
      });
      const ok = await patchSheet(
        selected.player.userId,
        next,
        `📴 Психоз-энкаунтер завершён · шрам ${event.scarAfter}/5 · PS было ${event.stressAtTrigger}`
      );
      if (ok) {
        setNotes('');
        setNotice(`Эпизод записан · шрам ${event.scarAfter}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nri-psychosis">
      <header className="nri-psychosis__head">
        <Activity size={16} />
        <div>
          <h3 className="mono-text">Киберпсихоз</h3>
          <p className="mono-text opacity-60">
            Стресс = хром + статусы + шрамы. Порог эпизода {PSYCHOSIS_THRESHOLDS.episode}. Звонок → живой чат →
            шрам.
          </p>
        </div>
      </header>

      {notice && <p className="mono-text nri-psychosis__notice">{notice}</p>}

      {rows.length === 0 ? (
        <p className="mono-text opacity-50">Нет игроков за столом.</p>
      ) : (
        <ul className="nri-psychosis__list">
          {rows.map(({ player, snap }) => (
            <li key={player.userId}>
              <button
                type="button"
                className={`nri-psychosis__row ${selected?.player.userId === player.userId ? 'is-selected' : ''}`}
                onClick={() => setSelectedId(player.userId)}
              >
                <div className="nri-psychosis__row-top">
                  <strong>{player.displayName}</strong>
                  <span className={`nri-psychosis__tier nri-psychosis__tier--${snap.tier}`}>
                    {psychosisTierLabel(snap.tier)}
                  </span>
                  <span className="mono-text opacity-70">PS {snap.total}</span>
                  {snap.scarLevel > 0 && (
                    <span className="nri-psychosis__scar">шрам {snap.scarLevel}</span>
                  )}
                  {snap.encounterActive && <span className="nri-psychosis__live">НА ЛИНИИ</span>}
                  {snap.pending && !snap.encounterActive && (
                    <span className="nri-psychosis__pending">эпизод</span>
                  )}
                </div>
                <StressBar snap={snap} />
                <div className="nri-psychosis__breakdown mono-text">
                  хром {snap.fromChrome}
                  {snap.fromOverage ? ` +перегруз ${snap.fromOverage}` : ''}
                  {snap.fromConditions > 0 ? ` +статусы ${snap.fromConditions}` : ''}
                  {snap.fromRelief > 0 ? ` −купир. ${snap.fromRelief}` : ''}
                  {snap.fromScars ? ` +шрамы ${snap.fromScars}` : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <section className="nri-psychosis__detail">
          <h4 className="mono-text">
            {selected.player.displayName} · история
          </h4>
          <HistorySpark history={selected.snap.history} />
          <ul className="nri-psychosis__history">
            {selected.snap.history.length === 0 && (
              <li className="mono-text opacity-50">Эпизодов ещё не было.</li>
            )}
            {[...selected.snap.history].reverse().map((e) => (
              <li key={e.id}>
                <strong>шрам → {e.scarAfter}</strong>
                <span className="opacity-70">
                  {' '}
                  · PS {e.stressAtTrigger} ·{' '}
                  {new Date(e.at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {e.notes && <p className="mono-text opacity-60">{e.notes}</p>}
              </li>
            ))}
          </ul>

          <label className="mono-text nri-psychosis__notes">
            Заметка к энкаунтеру
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="голоса в нейролинке, атака союзника…"
            />
          </label>

          <div className="nri-psychosis__actions">
            <button
              type="button"
              className="nri-vault__send-btn"
              disabled={busy}
              onClick={() => void callPlayer()}
            >
              <Phone size={14} />
              Позвонить (личка)
            </button>
            <button
              type="button"
              className="nri-lobby__copy"
              disabled={busy || !selected.snap.encounterActive}
              onClick={() => void endEncounter()}
            >
              <PhoneOff size={14} />
              Завершить энкаунтер
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

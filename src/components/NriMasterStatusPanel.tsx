import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Minus, User } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { nriFetchRoster, nriPatchPlayer, type NriRosterPlayer } from '../logic/nriApi';
import { sendNriChatMessage } from '../logic/nriChatDispatch';
import {
  applyMasterCondition,
  removeMasterCondition,
  tickConditionRounds,
} from '../logic/nriItemConsume';
import {
  CONDITION_DEFS,
  formatConditionChatLine,
  type ConditionId,
} from '../logic/nriConditions';
import { parseNriSheet } from '../logic/nriNpcGenerator';
import { NriChatSendBar } from './NriChatSendBar';
import type { VaultRecipient } from './NriVaultTab';

type Props = {
  inviteCode: string;
  authToken: string;
  roomId: string;
  recipients: VaultRecipient[];
  currentUserId?: string;
};

export const NriMasterStatusPanel: React.FC<Props> = ({
  inviteCode,
  authToken,
  roomId,
  recipients,
  currentUserId,
}) => {
  const { token } = useAuth();
  const tok = authToken || readNeonAuthToken() || token;
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [userId, setUserId] = useState('');
  const [conditionId, setConditionId] = useState<ConditionId>('intoxicated_mild');
  const [rounds, setRounds] = useState(10);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tok) return;
    const list = await nriFetchRoster(tok, inviteCode);
    if (list) setRoster(list);
  }, [tok, inviteCode]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, [refresh]);

  const selected = roster.find((r) => r.userId === userId);
  const sheet = selected ? parseNriSheet(selected.sheet) : null;
  const conditions = sheet?.activeConditions ?? [];

  const patchAndNotify = async (
    nextSheet: object,
    chatLine: string,
    target: { kind: 'table' } | { kind: 'dm'; userId: string }
  ) => {
    if (!userId) return;
    const res = await nriPatchPlayer(tok!, inviteCode, userId, { sheet: nextSheet });
    if (!res.ok) {
      setNotice(res.error);
      return;
    }
    await sendNriChatMessage(tok!, roomId, inviteCode, chatLine, target);
    await refresh();
  };

  const applyStatus = async (target: { kind: 'table' } | { kind: 'dm'; userId: string }) => {
    if (!selected || !sheet) {
      setNotice('Выберите игрока');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = applyMasterCondition(sheet, conditionId, { source: 'мастер', rounds });
      if (!result) {
        setNotice('Не удалось применить статус');
        return;
      }
      const who = selected.displayName || selected.username;
      await patchAndNotify(result.sheet, formatConditionChatLine(who, result.condition, 'apply'), target);
      setNotice('Статус применён');
    } finally {
      setBusy(false);
    }
  };

  const removeStatus = async (id: ConditionId, target: { kind: 'table' } | { kind: 'dm'; userId: string }) => {
    if (!selected || !sheet) return;
    setBusy(true);
    try {
      const next = removeMasterCondition(sheet, id);
      if (!next) return;
      const cond = conditions.find((c) => c.id === id);
      const who = selected.displayName || selected.username;
      const line = cond ? formatConditionChatLine(who, cond, 'remove') : `✅ Статус снят · ${who}`;
      await patchAndNotify(next, line, target);
    } finally {
      setBusy(false);
    }
  };

  const tickRounds = async () => {
    if (!selected || !sheet) return;
    setBusy(true);
    try {
      const next = tickConditionRounds(sheet);
      if (!next) return;
      const res = await nriPatchPlayer(tok!, inviteCode, userId, { sheet: next });
      if (!res.ok) setNotice(res.error);
      else await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nri-master-status">
      <header className="nri-tactical__head">
        <AlertTriangle size={18} />
        <div>
          <h3 className="nri-tactical__title">Статусы игроков</h3>
          <p className="mono-text nri-tactical__hint">
            Дебафы и бафы на листе · объявление в чат · авто при использовании предметов
          </p>
        </div>
      </header>

      <div className="nri-master-status__form mono-text">
        <label className="nri-tactical__field">
          Игрок
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— выберите —</option>
            {roster.map((r) => (
              <option key={r.userId} value={r.userId}>
                {r.displayName} (@{r.username})
              </option>
            ))}
          </select>
        </label>
        <label className="nri-tactical__field">
          Статус
          <select value={conditionId} onChange={(e) => setConditionId(e.target.value as ConditionId)}>
            {CONDITION_DEFS.map((d) => (
              <option key={d.id} value={d.id} title={d.blurb}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="nri-tactical__field nri-tactical__field--short">
          Раундов
          <input
            type="number"
            min={1}
            max={999}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value) || 10)}
          />
        </label>
      </div>

      {selected && (
        <section className="nri-master-status__active">
          <h4 className="mono-text">
            <User size={13} /> Активные у {selected.displayName}
          </h4>
          {conditions.length === 0 ? (
            <p className="mono-text opacity-50">Нет активных статусов</p>
          ) : (
            <ul className="nri-master-status__list">
              {conditions.map((c) => (
                <li key={`${c.id}-${c.appliedAt}`}>
                  <span>
                    <strong>{c.label}</strong>
                    {c.roundsLeft != null && ` · ${c.roundsLeft} р.`}
                    {c.source && <span className="opacity-60"> · {c.source}</span>}
                  </span>
                  <button
                    type="button"
                    className="nri-tactical__tool"
                    disabled={busy}
                    onClick={() => removeStatus(c.id, { kind: 'table' })}
                    title="Снять и объявить в чат"
                  >
                    <Minus size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="nri-tactical__tool" disabled={busy || !conditions.length} onClick={tickRounds}>
            −1 раунд (все статусы)
          </button>
        </section>
      )}

      <NriChatSendBar
        recipients={recipients}
        currentUserId={currentUserId}
        busy={busy}
        label="Применить статус"
        onSend={applyStatus}
      />

      {notice && <p className="mono-text nri-tactical__notice">{notice}</p>}
    </div>
  );
};

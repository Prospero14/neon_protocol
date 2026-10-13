import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import {
  nriFetchIceCounterHack,
  nriPickIceCounterHack,
  type NriIceCounterHackPayload,
} from '../logic/nriApi/wallet';

type Props = {
  inviteCode: string;
  /** Хост тоже видит таймер, но команды бьёт целевой игрок. */
  isHost?: boolean;
};

export const NriIceCounterHackPopup: React.FC<Props> = ({ inviteCode, isHost }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [data, setData] = useState<NriIceCounterHackPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [siren, setSiren] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const payload = await nriFetchIceCounterHack(authToken, inviteCode);
    if (payload && typeof (payload as { sirenMessage?: unknown }).sirenMessage === 'string') {
      setSiren((payload as { sirenMessage: string }).sirenMessage);
    }
    setData(payload);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    const iv = window.setInterval(refresh, 2500);
    return () => window.clearInterval(iv);
  }, [refresh]);

  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(iv);
  }, []);

  if (!data?.active || !data.counterHack) {
    if (siren) {
      return createPortal(
        <div className="nri-counterhack-overlay" role="alertdialog">
          <div className="nri-counterhack-card nri-counterhack-card--siren">
            <p className="mono-text">{siren}</p>
            <button type="button" onClick={() => setSiren(null)}>
              Понял
            </button>
          </div>
        </div>,
        document.body,
      );
    }
    return null;
  }

  const ch = data.counterHack;
  const leftMs = Math.max(0, ch.endsAt - now);
  const leftSec = Math.ceil(leftMs / 1000);
  const enemy = Math.min(
    100,
    Math.max(ch.enemyProgress, Math.round(8 + ((now - ch.startedAt) / Math.max(1, ch.endsAt - ch.startedAt)) * 92)),
  );

  const pick = async (commandId: string) => {
    if (!authToken || !data.canPlay) return;
    setErr(null);
    const r = await nriPickIceCounterHack(authToken, inviteCode, commandId);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    if (r.sirenMessage) setSiren(r.sirenMessage);
    await refresh();
  };

  return createPortal(
    <div className="nri-counterhack-overlay" role="alertdialog" aria-modal>
      <div className="nri-counterhack-card">
        <header className="nri-counterhack-card__head">
          <p className="mono-text nri-counterhack-card__alert">
            ВАС ПЕРЕХВАТИЛИ · ИДЁТ ВСТРЕЧНЫЙ ВЗЛОМ
          </p>
          <h3>ICE → deck · {data.targetName ?? 'netrunner'}</h3>
          <p className="mono-text opacity-70">
            {isHost && !data.canPlay
              ? 'Мастер видит таймер. Команды вводит перехваченный игрок.'
              : 'Собери верную цепочку команд, пока противник не откроет деку.'}
          </p>
        </header>

        <div className="nri-counterhack-meters">
          <div>
            <span className="mono-text">TIMER {leftSec}s</span>
            <div className="nri-counterhack-bar">
              <div
                className="nri-counterhack-bar__fill nri-counterhack-bar__fill--time"
                style={{ width: `${Math.min(100, (leftMs / Math.max(1, ch.endsAt - ch.startedAt)) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <span className="mono-text">ENEMY ACCESS {enemy}%</span>
            <div className="nri-counterhack-bar">
              <div
                className="nri-counterhack-bar__fill nri-counterhack-bar__fill--enemy"
                style={{ width: `${enemy}%` }}
              />
            </div>
            <p className="mono-text nri-counterhack-enemy-chain opacity-60">
              противник строит: SYN → TRACE → {enemy > 40 ? 'SESSION_HIJACK' : '…'} →{' '}
              {enemy > 70 ? 'DECK_ROOT' : '…'}
            </p>
          </div>
        </div>

        {data.stage && (
          <section className="nri-counterhack-stage">
            <h4>
              Этап {ch.stageIndex + 1}/3 · {data.stage.title}
            </h4>
            <p className="mono-text opacity-75">{data.stage.hint}</p>
            <p className="mono-text">
              цепь {ch.picked.length}/{data.stage.need} · ошибки {ch.stageMistakes}/3
            </p>
            <div className="nri-counterhack-cmds">
              {data.stage.commands.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`mono-text ${ch.picked.includes(c.id) ? 'is-picked' : ''}`}
                  disabled={!data.canPlay || ch.picked.includes(c.id)}
                  onClick={() => pick(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {err && <p className="mono-text nri-counterhack-err">{err}</p>}
      </div>
    </div>,
    document.body,
  );
};

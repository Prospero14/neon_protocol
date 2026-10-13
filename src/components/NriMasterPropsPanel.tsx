import React, { useCallback, useEffect, useState } from 'react';
import { Lock, Package, ShoppingBasket } from 'lucide-react';
import type { NriRosterPlayer } from '../logic/nriApi';
import { NRI_ITEM_CATALOG } from '../logic/nriItemCatalog';
import {
  nriAddBasketEntry,
  nriCreateLock,
  nriDeleteLock,
  nriFetchMasterProps,
  nriGrantBasketEntry,
  nriPatchLock,
  nriRemoveBasketEntry,
} from '../logic/nriApi/masterProps';
import type { MasterLock, MasterPropsState, PlayBasketItemKind } from '../../shared/nri-domain/masterProps';

type Props = {
  inviteCode: string;
  authToken: string;
  roster: NriRosterPlayer[];
};

export const NriMasterPropsPanel: React.FC<Props> = ({ inviteCode, authToken, roster }) => {
  const [propsState, setPropsState] = useState<MasterPropsState>({ playBasket: [], locks: [] });
  const [tab, setTab] = useState<'basket' | 'locks'>('basket');
  const [filter, setFilter] = useState<'all' | PlayBasketItemKind>('all');
  const [catalogId, setCatalogId] = useState(NRI_ITEM_CATALOG.find((c) => c.id === 'g_lockpick')?.id ?? NRI_ITEM_CATALOG[0]?.id ?? '');
  const [itemKind, setItemKind] = useState<PlayBasketItemKind>('ordinary');
  const [grantTo, setGrantTo] = useState('');
  const [lockLabel, setLockLabel] = useState('Дверь');
  const [lockKind, setLockKind] = useState<MasterLock['kind']>('door');
  const [lockDc, setLockDc] = useState(15);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const p = await nriFetchMasterProps(authToken, inviteCode);
    if (p) setPropsState(p);
  }, [authToken, inviteCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const basket = propsState.playBasket.filter((e) => filter === 'all' || e.itemKind === filter);

  const addCatalog = async () => {
    setBusy(true);
    setErr(null);
    const cat = NRI_ITEM_CATALOG.find((c) => c.id === catalogId);
    const r = await nriAddBasketEntry(authToken, inviteCode, {
      catalogId,
      label: cat?.name,
      itemKind,
      source: 'catalog',
    });
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    setPropsState(r.props);
  };

  return (
    <div className="nri-master-props nri-deck-module">
      <header className="nri-master-props__head">
        <ShoppingBasket size={18} />
        <div>
          <h3>Пропы сцены</h3>
          <p className="mono-text opacity-60">Корзина «для игры» и замки — только мастер.</p>
        </div>
      </header>

      <div className="nri-people-subtabs">
        <button type="button" className={tab === 'basket' ? 'active' : ''} onClick={() => setTab('basket')}>
          <Package size={13} /> Корзина
        </button>
        <button type="button" className={tab === 'locks' ? 'active' : ''} onClick={() => setTab('locks')}>
          <Lock size={13} /> Замки
        </button>
      </div>

      {err && <p className="mono-text nri-lobby__err">{err}</p>}

      {tab === 'basket' && (
        <section className="nri-master-props__section">
          <div className="nri-master-props__row mono-text">
            <label>
              Каталог
              <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
                {NRI_ITEM_CATALOG.slice(0, 80).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Тип
              <select value={itemKind} onChange={(e) => setItemKind(e.target.value as PlayBasketItemKind)}>
                <option value="ordinary">Обычный</option>
                <option value="quest">Квестовый</option>
              </select>
            </label>
            <button type="button" className="nri-modal__submit" disabled={busy} onClick={() => void addCatalog()}>
              В корзину
            </button>
          </div>
          <div className="nri-people-subtabs">
            {(['all', 'ordinary', 'quest'] as const).map((f) => (
              <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Все' : f === 'ordinary' ? 'Обычные' : 'Квестовые'}
              </button>
            ))}
          </div>
          <ul className="nri-master-props__list mono-text">
            {basket.map((e) => (
              <li key={e.id}>
                <strong>{e.label}</strong>
                <span className="opacity-60"> · {e.itemKind}{e.source ? ` · ${e.source}` : ''}</span>
                <div className="nri-master-props__actions">
                  <select value={grantTo} onChange={(ev) => setGrantTo(ev.target.value)}>
                    <option value="">Игроку…</option>
                    {roster.map((r) => (
                      <option key={r.userId} value={r.userId}>
                        {r.displayName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy || !grantTo}
                    onClick={async () => {
                      setBusy(true);
                      const p = await nriGrantBasketEntry(authToken, inviteCode, e.id, grantTo);
                      setBusy(false);
                      if (p) setPropsState(p);
                    }}
                  >
                    Выдать
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      const p = await nriRemoveBasketEntry(authToken, inviteCode, e.id);
                      setBusy(false);
                      if (p) setPropsState(p);
                    }}
                  >
                    Убрать
                  </button>
                </div>
              </li>
            ))}
            {basket.length === 0 && <li className="opacity-50">Корзина пуста — добавьте реквизит для сцены.</li>}
          </ul>
        </section>
      )}

      {tab === 'locks' && (
        <section className="nri-master-props__section">
          <div className="nri-master-props__row mono-text">
            <label>
              Метка
              <input value={lockLabel} onChange={(e) => setLockLabel(e.target.value)} maxLength={64} />
            </label>
            <label>
              Kind
              <select value={lockKind} onChange={(e) => setLockKind(e.target.value as MasterLock['kind'])}>
                {(['door', 'vehicle', 'safe', 'drawer', 'shelf', 'crate'] as const).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label>
              DC
              <input
                type="number"
                min={5}
                max={30}
                value={lockDc}
                onChange={(e) => setLockDc(Number(e.target.value) || 15)}
              />
            </label>
            <button
              type="button"
              className="nri-modal__submit"
              disabled={busy || !lockLabel.trim()}
              onClick={async () => {
                setBusy(true);
                const r = await nriCreateLock(authToken, inviteCode, {
                  label: lockLabel.trim(),
                  kind: lockKind,
                  dc: lockDc,
                  method: 'mechanical',
                  state: 'locked',
                  anchorType: 'free',
                });
                setBusy(false);
                if (r.ok) setPropsState(r.props);
              }}
            >
              Добавить замок
            </button>
          </div>
          <ul className="nri-master-props__list mono-text">
            {propsState.locks.map((l) => (
              <li key={l.id}>
                <strong>{l.label}</strong>
                <span className="opacity-60">
                  {' '}
                  · {l.kind} · DC{l.dc} · {l.state}
                </span>
                <div className="nri-master-props__actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      const next = l.state === 'locked' ? 'unlocked' : 'locked';
                      const p = await nriPatchLock(authToken, inviteCode, l.id, { state: next });
                      setBusy(false);
                      if (p) setPropsState(p);
                    }}
                  >
                    {l.state === 'locked' ? 'Открыть' : 'Закрыть'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      const p = await nriDeleteLock(authToken, inviteCode, l.id);
                      setBusy(false);
                      if (p) setPropsState(p);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
            {propsState.locks.length === 0 && (
              <li className="opacity-50">Нет замков — повесь метку на дверь/сейф/ящик сцены.</li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
};

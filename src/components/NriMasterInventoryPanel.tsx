import React, { useEffect, useMemo, useState } from 'react';
import { Package, Search } from 'lucide-react';
import {
  nriFetchNpcs,
  nriGrantNpcItem,
  nriTransferItem,
  type NriNpc,
  type NriRosterPlayer,
} from '../logic/nriApi';
import { listMasterGrantCatalog } from '../logic/nriItemCatalog';
import { NriCatalogItemPreview } from './NriSelectionPreview';

type Props = {
  inviteCode: string;
  authToken: string;
  roster: NriRosterPlayer[];
  currentUserId?: string;
};

export const NriMasterInventoryPanel: React.FC<Props> = ({
  inviteCode,
  authToken,
  roster,
  currentUserId,
}) => {
  const masterCatalog = useMemo(() => listMasterGrantCatalog(), []);
  const [search, setSearch] = useState('');
  const [catalogPick, setCatalogPick] = useState(masterCatalog[0]?.id ?? '');
  const [grantTarget, setGrantTarget] = useState('');
  const [grantToNpc, setGrantToNpc] = useState('');
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return masterCatalog;
    return masterCatalog.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.blurb.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.includes(q))
    );
  }, [masterCatalog, search]);

  useEffect(() => {
    if (!filtered.some((c) => c.id === catalogPick) && filtered[0]) {
      setCatalogPick(filtered[0].id);
    }
  }, [filtered, catalogPick]);

  useEffect(() => {
    nriFetchNpcs(authToken, inviteCode).then((list) => {
      if (list) setNpcs(list);
    });
  }, [authToken, inviteCode]);

  const grantToPlayer = async () => {
    if (!catalogPick || !grantTarget) return;
    setBusy('grant');
    setErr(null);
    setOk(null);
    const res = await nriTransferItem(authToken, inviteCode, {
      toUserId: grantTarget,
      catalogId: catalogPick,
    });
    setBusy(null);
    if (!res.ok) setErr(res.error);
    else setOk('Выдано в личку игроку.');
  };

  const grantToNpcInv = async () => {
    if (!catalogPick || !grantToNpc) return;
    setBusy('grant-npc');
    setErr(null);
    setOk(null);
    const res = await nriGrantNpcItem(authToken, inviteCode, grantToNpc, catalogPick);
    setBusy(null);
    if (!res.ok) setErr(res.error);
    else setOk('Выдано в инвентарь НПС.');
  };

  return (
    <div className="nri-inventory nri-master-inventory">
      <header className="nri-inventory__head">
        <Package size={16} />
        <div>
          <h3 className="mono-text">Инвентарь мастера</h3>
          <p className="mono-text opacity-60">
            Сюжетные предметы (тег «мастер»). Обычный каталог их не показывает.
          </p>
        </div>
      </header>

      {err && <p className="nri-lobby__err mono-text">{err}</p>}
      {ok && <p className="mono-text nri-scenario__checkpoint-ok">{ok}</p>}

      {masterCatalog.length === 0 ? (
        <p className="mono-text opacity-50">В каталоге нет предметов с тегом «мастер».</p>
      ) : (
        <>
          <div className="nri-inventory__grant-row">
            <label className="mono-text nri-inventory__search">
              <Search size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск сюжетных…"
              />
            </label>
            <select
              className="nri-inventory__catalog-select"
              value={catalogPick}
              onChange={(e) => setCatalogPick(e.target.value)}
            >
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <NriCatalogItemPreview catalogId={catalogPick} />
          </div>

          <div className="nri-inventory__grant-row">
            <label className="mono-text">
              Игрок
              <select value={grantTarget} onChange={(e) => setGrantTarget(e.target.value)}>
                <option value="">— выберите —</option>
                {roster.map((r) => (
                  <option key={r.userId} value={r.userId}>
                    {r.displayName}
                    {r.userId === currentUserId ? ' (вы)' : ''} (@{r.username})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="nri-vault__send-btn"
              disabled={busy === 'grant' || !grantTarget || !catalogPick}
              onClick={() => void grantToPlayer()}
            >
              Выдать игроку
            </button>
          </div>

          <div className="nri-inventory__grant-row nri-inventory__grant-row--npc">
            <label className="mono-text">
              НПС
              <select value={grantToNpc} onChange={(e) => setGrantToNpc(e.target.value)}>
                <option value="">—</option>
                {npcs.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="nri-lobby__copy"
              disabled={busy === 'grant-npc' || !grantToNpc || !catalogPick}
              onClick={() => void grantToNpcInv()}
            >
              Выдать НПС
            </button>
          </div>
        </>
      )}
    </div>
  );
};

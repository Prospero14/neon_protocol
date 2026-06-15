import React, { useMemo, useState } from 'react';
import { Gift } from 'lucide-react';
import { nriTransferItem, type NriNpc, type NriPlayerProfile } from '../logic/nriApi';
import { parseNriInventory, type NriInventoryItem } from '../logic/nriInventory';
import { nriItemStatsLine } from '../logic/nriItemDisplay';
import {
  ITEM_CATEGORY_ORDER,
  ITEM_CATEGORY_LABELS,
  NRI_ITEM_CATALOG,
  searchCatalog,
  type ItemCategory,
} from '../logic/nriItemCatalog';

type Props = {
  inviteCode: string;
  authToken: string;
  toUserId: string;
  isHost: boolean;
  profile: NriPlayerProfile | null;
  npcs: NriNpc[];
  speakAsNpcId: string | null;
  onProfileUpdate?: (p: NriPlayerProfile) => void;
  onDone?: () => void;
  onErr?: (msg: string) => void;
};

export const NriDmItemTransfer: React.FC<Props> = ({
  inviteCode,
  authToken,
  toUserId,
  isHost,
  profile,
  npcs,
  speakAsNpcId,
  onProfileUpdate,
  onDone,
  onErr,
}) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'mine' | 'npc' | 'catalog'>(isHost ? 'catalog' : 'mine');
  const [itemId, setItemId] = useState('');
  const [fromNpcId, setFromNpcId] = useState('');
  const [catalogId, setCatalogId] = useState(NRI_ITEM_CATALOG[0]?.id ?? '');
  const [catSearch, setCatSearch] = useState('');
  const [catCategory, setCatCategory] = useState<ItemCategory | 'all'>('all');

  const myItems = useMemo(() => parseNriInventory(profile?.inventory), [profile?.inventory]);
  const npcItems = useMemo(() => {
    const npc = npcs.find((n) => n.id === (fromNpcId || speakAsNpcId));
    return npc ? parseNriInventory(npc.inventory) : [];
  }, [npcs, fromNpcId, speakAsNpcId]);
  const catalog = useMemo(() => searchCatalog(catSearch, catCategory), [catSearch, catCategory]);

  const transfer = async () => {
    setBusy(true);
    let payload: Parameters<typeof nriTransferItem>[2];
    if (mode === 'catalog' && isHost) {
      payload = { toUserId, catalogId, asNpcId: speakAsNpcId ?? undefined, fromNpcId: fromNpcId || undefined };
    } else if (mode === 'npc' && isHost) {
      payload = {
        toUserId,
        itemId,
        fromNpcId: fromNpcId || speakAsNpcId || undefined,
        asNpcId: speakAsNpcId ?? undefined,
      };
    } else {
      payload = { toUserId, itemId };
    }
    const res = await nriTransferItem(authToken, inviteCode, payload);
    setBusy(false);
    if (!res.ok) {
      onErr?.(res.error);
      return;
    }
    if (res.inventory && profile && onProfileUpdate) {
      onProfileUpdate({ ...profile, inventory: res.inventory });
    }
    setOpen(false);
    setItemId('');
    onDone?.();
  };

  const previewItem: NriInventoryItem | null = useMemo(() => {
    if (mode === 'mine') return myItems.find((i) => i.id === itemId) ?? null;
    if (mode === 'npc') return npcItems.find((i) => i.id === itemId) ?? null;
    const c = NRI_ITEM_CATALOG.find((x) => x.id === catalogId);
    return c ? { id: c.id, catalogId: c.id, name: c.name, blurb: c.blurb, slot: c.slot } : null;
  }, [mode, itemId, myItems, npcItems, catalogId]);

  if (!profile && !isHost) return null;

  return (
    <div className="nri-dm-transfer">
      <button type="button" className="nri-lobby__copy" onClick={() => setOpen((v) => !v)}>
        <Gift size={14} /> {open ? 'Скрыть передачу' : 'Передать предмет'}
      </button>
      {open && (
        <div className="nri-dm-transfer__panel">
          {isHost && (
            <div className="nri-dm-transfer__modes">
              <button
                type="button"
                className={`nri-people-subtabs__btn ${mode === 'catalog' ? 'active' : ''}`}
                onClick={() => setMode('catalog')}
              >
                Каталог
              </button>
              <button
                type="button"
                className={`nri-people-subtabs__btn ${mode === 'npc' ? 'active' : ''}`}
                onClick={() => setMode('npc')}
              >
                Инвентарь НПС
              </button>
              <button
                type="button"
                className={`nri-people-subtabs__btn ${mode === 'mine' ? 'active' : ''}`}
                onClick={() => setMode('mine')}
              >
                Мой инвентарь
              </button>
            </div>
          )}
          {mode === 'mine' && (
            <label className="nri-modal__field">
              <span>Ваш предмет</span>
              <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
                <option value="">— выберите —</option>
                {myItems.filter((i) => !i.equipped).map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {mode === 'npc' && isHost && (
            <>
              <label className="nri-modal__field">
                <span>НПС</span>
                <select
                  value={fromNpcId || speakAsNpcId || ''}
                  onChange={(e) => {
                    setFromNpcId(e.target.value);
                    setItemId('');
                  }}
                >
                  <option value="">— выберите —</option>
                  {npcs.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="nri-modal__field">
                <span>Предмет НПС</span>
                <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
                  <option value="">— выберите —</option>
                  {npcItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {mode === 'catalog' && isHost && (
            <>
              <input
                className="mono-text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Поиск в каталоге…"
              />
              <div className="nri-dm-transfer__cats">
                <button
                  type="button"
                  className={`nri-people-subtabs__btn ${catCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setCatCategory('all')}
                >
                  Все
                </button>
                {ITEM_CATEGORY_ORDER.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`nri-people-subtabs__btn ${catCategory === cat ? 'active' : ''}`}
                    onClick={() => setCatCategory(cat)}
                  >
                    {ITEM_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
              <select className="nri-inventory__catalog-select" value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
          {previewItem && (
            <p className="mono-text nri-dm-transfer__preview">
              <strong>{previewItem.name}</strong> · {nriItemStatsLine(previewItem)}
            </p>
          )}
          <button
            type="button"
            className="nri-modal__submit"
            disabled={
              busy ||
              (mode === 'catalog' ? !catalogId : !itemId) ||
              (mode === 'npc' && !(fromNpcId || speakAsNpcId))
            }
            onClick={transfer}
          >
            Передать в личку
          </button>
          <p className="mono-text opacity-60">Передача только в личку. Можно показать предмет за столом из сообщения.</p>
        </div>
      )}
    </div>
  );
};

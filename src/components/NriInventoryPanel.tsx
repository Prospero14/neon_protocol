import React, { useMemo, useState } from 'react';
import { Package, Search, Shield, Sword, Zap } from 'lucide-react';
import {
  nriFetchNpcs,
  nriGrantNpcItem,
  nriTransferItem,
  nriToggleEquip,
  nriUseItem,
  type NriNpc,
  type NriPlayerProfile,
  type NriRosterPlayer,
} from '../logic/nriApi';
import { parseNriInventory, type NriInventoryItem } from '../logic/nriInventory';
import { canEquipItem } from '../logic/nriItemEquip';
import { getConsumeEffect } from '../logic/nriConsumeEffects';
import { getCatalogItem } from '../logic/nriItemCatalog';
import {
  ITEM_CATEGORY_LABELS,
  ITEM_CATEGORY_ORDER,
  NRI_ITEM_CATALOG,
  searchCatalog,
  type CatalogItem,
  type ItemCategory,
} from '../logic/nriItemCatalog';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { formatSignedMod } from '../logic/nriSheetCombat';
import { NriCatalogItemPreview } from './NriSelectionPreview';

type Props = {
  inviteCode: string;
  profile: NriPlayerProfile;
  isHost: boolean;
  roster?: NriRosterPlayer[];
  onProfileUpdate: (p: NriPlayerProfile) => void;
  onNewAchievements?: (unlocks: import('../logic/nriApi').NriAchievementUnlock[]) => void;
};

function itemModsLine(item: NriInventoryItem): string {
  const parts: string[] = [];
  if (item.c2185Mods) {
    for (const [k, v] of Object.entries(item.c2185Mods)) {
      if (typeof v === 'number') parts.push(`${k} ${formatSignedMod(v)}`);
    }
  }
  if (typeof item.acBonus === 'number') parts.push(`AC +${item.acBonus}`);
  if (item.attack) parts.push(`${item.attack.damageDice} ${item.attack.damageType}`);
  return parts.join(' · ') || 'без боевых бонусов';
}

export const NriInventoryPanel: React.FC<Props> = ({
  inviteCode,
  profile,
  isHost,
  roster = [],
  onProfileUpdate,
  onNewAchievements,
}) => {
  const { token, user } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [grantTarget, setGrantTarget] = useState('');
  const [grantFromNpc, setGrantFromNpc] = useState('');
  const [grantToNpc, setGrantToNpc] = useState('');
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const [catalogPick, setCatalogPick] = useState(NRI_ITEM_CATALOG[0]?.id ?? '');

  const inventory = useMemo(() => parseNriInventory(profile.inventory), [profile.inventory]);
  const catalog = useMemo(() => searchCatalog(search, category), [search, category]);

  React.useEffect(() => {
    if (!catalog.some((c) => c.id === catalogPick) && catalog[0]) {
      setCatalogPick(catalog[0].id);
    }
  }, [catalog, catalogPick]);

  React.useEffect(() => {
    if (!isHost || !authToken) return;
    nriFetchNpcs(authToken, inviteCode).then((list) => {
      if (list) setNpcs(list);
    });
  }, [isHost, authToken, inviteCode]);

  const toggleEquip = async (itemId: string) => {
    if (!authToken) return;
    setBusy(itemId);
    setErr(null);
    const res = await nriToggleEquip(authToken, inviteCode, itemId);
    setBusy(null);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onProfileUpdate({ ...profile, inventory: res.inventory });
  };

  const useItem = async (item: NriInventoryItem) => {
    if (!authToken) return;
    setBusy(item.id);
    setErr(null);
    const res = await nriUseItem(authToken, inviteCode, item.id);
    setBusy(null);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onProfileUpdate({ ...profile, inventory: res.inventory, sheet: res.sheet });
    if (res.newAchievements?.length) onNewAchievements?.(res.newAchievements);
  };

  const canUseItem = (item: NriInventoryItem) => {
    if (canEquipItem(item)) return false;
    const cat = item.catalogId ? getCatalogItem(item.catalogId) : undefined;
    if (cat?.category === 'consumable' || cat?.category === 'drug' || item.slot === 'quick') {
      return !!getConsumeEffect(item.catalogId);
    }
    return false;
  };

  const grantToPlayer = async () => {
    if (!authToken || !catalogPick || !grantTarget) return;
    setBusy('grant');
    setErr(null);
    const res = await nriTransferItem(authToken, inviteCode, {
      toUserId: grantTarget,
      catalogId: catalogPick,
      fromNpcId: grantFromNpc || undefined,
      asNpcId: grantFromNpc || undefined,
    });
    setBusy(null);
    if (!res.ok) setErr(res.error);
    else {
      if (user?.id && grantTarget === user.id && res.inventory && onProfileUpdate) {
        onProfileUpdate({ ...profile, inventory: res.inventory });
      }
      setErr(null);
    }
  };

  const grantToNpcInv = async () => {
    if (!authToken || !catalogPick || !grantToNpc) return;
    setBusy('grant-npc');
    setErr(null);
    const res = await nriGrantNpcItem(authToken, inviteCode, grantToNpc, catalogPick);
    setBusy(null);
    if (!res.ok) setErr(res.error);
  };

  const slotIcon = (item: CatalogItem | NriInventoryItem) => {
    const slot = 'slot' in item ? item.slot : undefined;
    if (slot === 'weapon') return <Sword size={14} />;
    if (slot === 'armor') return <Shield size={14} />;
    return <Package size={14} />;
  };

  const catalogOptions = (items: CatalogItem[]) =>
    items.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name} — ₩{c.priceWonlongs ?? '?'}
      </option>
    ));

  return (
    <div className="nri-inventory">
      <header className="nri-inventory__head">
        <Package size={18} />
        <div>
          <h2 className="nri-inventory__title">Инвентарь</h2>
          <p className="mono-text opacity-70">
            {profile.displayName} · экипировка даёт бонусы только пока предмет «надет»
          </p>
        </div>
      </header>

      {err && <p className="nri-vault__err mono-text">{err}</p>}

      <ul className="nri-inventory__list">
        {inventory.map((item) => (
          <li key={item.id} className={`nri-inventory__item ${item.equipped ? 'equipped' : ''}`}>
            <div className="nri-inventory__item-icon">{slotIcon(item)}</div>
            <div className="nri-inventory__item-body">
              <strong>
                {item.name}
                {item.qty && item.qty > 1 ? ` ×${item.qty}` : ''}
                {item.equipped && <span className="nri-inventory__badge">ЭКИП</span>}
              </strong>
              <p className="mono-text opacity-70">{item.blurb}</p>
              <p className="mono-text nri-inventory__mods">{itemModsLine(item)}</p>
            </div>
            {canEquipItem(item) && (
              <button
                type="button"
                className={`nri-inventory__equip ${item.equipped ? 'active' : ''}`}
                disabled={busy === item.id}
                onClick={() => toggleEquip(item.id)}
              >
                <Zap size={14} />
                {item.equipped ? 'Снять' : 'Надеть'}
              </button>
            )}
            {canUseItem(item) && (
              <button
                type="button"
                className="nri-inventory__equip"
                disabled={busy === item.id}
                onClick={() => useItem(item)}
              >
                <Zap size={14} />
                Использовать
              </button>
            )}
          </li>
        ))}
        {inventory.length === 0 && (
          <li className="mono-text opacity-50 nri-inventory__empty">Пусто — мастер выдаст лут с каталога.</li>
        )}
      </ul>

      {isHost && (
        <section className="nri-inventory__grant">
          <h3 className="mono-text">Выдать из каталога (мастер → личка)</h3>
          <p className="mono-text opacity-50 nri-inventory__hint">
            Предмет уходит в личку игроку. Показать за столом — из сообщения передачи в личке.
          </p>

          <div className="nri-inventory__category-tabs">
            <button
              type="button"
              className={`nri-people-subtabs__btn ${category === 'all' ? 'active' : ''}`}
              onClick={() => setCategory('all')}
            >
              Все
            </button>
            {ITEM_CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`nri-people-subtabs__btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {ITEM_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="nri-inventory__grant-row">
            <label className="mono-text">
              Игрок (получатель)
              <select value={grantTarget} onChange={(e) => setGrantTarget(e.target.value)}>
                <option value="">— выберите —</option>
                {roster.map((r) => (
                  <option key={r.userId} value={r.userId}>
                    {r.displayName} (@{r.username})
                  </option>
                ))}
              </select>
            </label>
            <label className="mono-text">
              От имени НПС
              <select value={grantFromNpc} onChange={(e) => setGrantFromNpc(e.target.value)}>
                <option value="">— без НПС —</option>
                {npcs.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="nri-inventory__grant-row">
            <label className="mono-text nri-inventory__search">
              <Search size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск в каталоге…"
              />
            </label>
            <select
              className="nri-inventory__catalog-select"
              value={catalogPick}
              onChange={(e) => setCatalogPick(e.target.value)}
            >
              {category === 'all'
                ? ITEM_CATEGORY_ORDER.map((cat) => {
                    const items = catalog.filter((c) => c.category === cat);
                    if (!items.length) return null;
                    return (
                      <optgroup key={cat} label={ITEM_CATEGORY_LABELS[cat]}>
                        {catalogOptions(items)}
                      </optgroup>
                    );
                  })
                : catalogOptions(catalog)}
            </select>
            <NriCatalogItemPreview catalogId={catalogPick} />
            <button
              type="button"
              className="nri-vault__send-btn"
              disabled={busy === 'grant' || !grantTarget}
              onClick={grantToPlayer}
            >
              Выдать игроку
            </button>
          </div>

          <div className="nri-inventory__grant-row nri-inventory__grant-row--npc">
            <label className="mono-text">
              В инвентарь НПС
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
              disabled={busy === 'grant-npc' || !grantToNpc}
              onClick={grantToNpcInv}
            >
              Выдать НПС
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

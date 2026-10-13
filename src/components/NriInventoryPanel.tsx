import React, { useMemo, useState } from 'react';
import { Package, Search, Shield, Sword, Zap } from 'lucide-react';
import {
  nriFetchNpcs,
  nriGrantNpcItem,
  nriInscribeItem,
  nriTransferItem,
  nriToggleEquip,
  nriUseItem,
  nriInstallCyberItem,
  nriUninstallCyberItem,
  type NriNpc,
  type NriPlayerProfile,
  type NriRosterPlayer,
} from '../logic/nriApi';
import { parseNriInventory, type NriInventoryItem } from '../logic/nriInventory';
import { canEquipItem } from '../logic/nriItemEquip';
import { getConsumeEffect } from '../logic/nriConsumeEffects';
import { getCatalogItem } from '../logic/nriItemCatalog';
import { parseAugmentedSheet } from '../logic/nriCyberInstall';
import { CYBER_SLOT_LABELS, type CyberSlot } from '../logic/nriCyberware';
import {
  canInscribeInventoryItem,
  canTransferInventoryItem,
  ITEM_CATEGORY_LABELS,
  ITEM_CATEGORY_ORDER,
  NRI_ITEM_CATALOG,
  isMasterGrantOnly,
  searchCatalog,
  type CatalogItem,
  type ItemCategory,
} from '../logic/nriItemCatalog';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { formatSignedMod } from '../logic/nriSheetCombat';
import { CYBER_EFFECT_META } from '../logic/nriCyberEffects';
import { applyConditionsToSheet, formatConditionDuration } from '../logic/nriConditions';
import { parseNriSheet } from '../logic/nriNpcGenerator';
import { NriCatalogItemPreview } from './NriSelectionPreview';

type Props = {
  inviteCode: string;
  profile: NriPlayerProfile;
  isHost: boolean;
  roster?: NriRosterPlayer[];
  onProfileUpdate: (p: NriPlayerProfile) => void;
  onNewAchievements?: (unlocks: import('../logic/nriApi').NriAchievementUnlock[]) => void;
};

type ModChip = { k: string; v: string };

function itemModChips(item: NriInventoryItem): ModChip[] {
  const chips: ModChip[] = [];
  if (item.c2185Mods) {
    for (const [k, v] of Object.entries(item.c2185Mods)) {
      if (typeof v === 'number') chips.push({ k, v: formatSignedMod(v) });
    }
  }
  if (typeof item.acBonus === 'number' && item.acBonus !== 0) {
    chips.push({ k: 'AC', v: `+${item.acBonus}` });
  }
  if (item.attack) chips.push({ k: 'DMG', v: `${item.attack.damageDice}` });
  if (item.tags?.length) {
    for (const t of item.tags) {
      if (!t.startsWith('cyber:')) continue;
      const id = t.slice(6) as keyof typeof CYBER_EFFECT_META;
      const meta = CYBER_EFFECT_META[id];
      chips.push({ k: 'FX', v: meta?.label ?? id });
    }
  }
  if (item.kind === 'cyberware' && item.cyber?.effects?.length) {
    for (const id of item.cyber.effects) {
      const meta = CYBER_EFFECT_META[id as keyof typeof CYBER_EFFECT_META];
      if (meta) chips.push({ k: 'FX', v: meta.label });
    }
  }
  return chips;
}

function catalogGlanceChips(c: CatalogItem): ModChip[] {
  const chips: ModChip[] = [
    { k: 'CAT', v: ITEM_CATEGORY_LABELS[c.category] ?? c.category },
  ];
  if (c.priceWonlongs != null) chips.push({ k: '₩', v: String(c.priceWonlongs) });
  if (c.c2185Mods) {
    for (const [k, v] of Object.entries(c.c2185Mods)) {
      if (typeof v === 'number') chips.push({ k, v: formatSignedMod(v) });
    }
  }
  if (typeof c.acBonus === 'number' && c.acBonus !== 0) chips.push({ k: 'AC', v: `+${c.acBonus}` });
  return chips;
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [grantTarget, setGrantTarget] = useState('');
  const [grantFromNpc, setGrantFromNpc] = useState('');
  const [grantToNpc, setGrantToNpc] = useState('');
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const grantCatalogSeed = NRI_ITEM_CATALOG.find((c) => !isMasterGrantOnly(c));
  const [catalogPick, setCatalogPick] = useState(grantCatalogSeed?.id ?? '');

  const inventory = useMemo(() => parseNriInventory(profile.inventory), [profile.inventory]);
  const catalog = useMemo(
    () => searchCatalog(search, category).filter((c) => !isMasterGrantOnly(c)),
    [search, category]
  );

  const activeConditions = useMemo(() => {
    const sheet = parseNriSheet(profile.sheet);
    if (!sheet) return [];
    return applyConditionsToSheet(sheet).activeConditions ?? [];
  }, [profile.sheet]);

  const installedAugs = useMemo(() => {
    const aug = parseAugmentedSheet(profile.sheet);
    return aug?.augmentations ?? [];
  }, [profile.sheet]);

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

  const installCyber = async (item: NriInventoryItem) => {
    if (!authToken || !user?.id) return;
    setBusy(item.id);
    setErr(null);
    const res = await nriInstallCyberItem(authToken, inviteCode, user.id, item.id);
    setBusy(null);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onProfileUpdate({
      ...profile,
      ...(res.inventory ? { inventory: res.inventory } : {}),
      ...(res.sheet !== undefined ? { sheet: res.sheet } : {}),
    });
  };

  const uninstallCyber = async (itemId: string) => {
    if (!authToken || !user?.id) return;
    if (!window.confirm('Снять имплант? Blood Tox и психоз пересчитаются.')) return;
    setBusy(itemId);
    setErr(null);
    const res = await nriUninstallCyberItem(authToken, inviteCode, user.id, itemId);
    setBusy(null);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onProfileUpdate({
      ...profile,
      ...(res.inventory ? { inventory: res.inventory } : {}),
      ...(res.sheet !== undefined ? { sheet: res.sheet } : {}),
    });
  };

  const canUseItem = (item: NriInventoryItem) => {
    if (canEquipItem(item)) return false;
    const cat = item.catalogId ? getCatalogItem(item.catalogId) : undefined;
    if (cat?.category === 'consumable' || cat?.category === 'drug' || item.slot === 'quick') {
      return !!getConsumeEffect(item.catalogId);
    }
    return false;
  };

  const canInstallCyber = (item: NriInventoryItem) => item.kind === 'cyberware' && !!item.cyber?.slot;

  const inscribeItem = async (item: NriInventoryItem) => {
    if (!authToken) return;
    const raw = window.prompt('Впишите имя владельца. Изменить потом нельзя.', '');
    const inscribedName = raw?.trim();
    if (!inscribedName) return;
    setBusy(item.id);
    setErr(null);
    const res = await nriInscribeItem(authToken, inviteCode, item.id, inscribedName);
    setBusy(null);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onProfileUpdate({ ...profile, inventory: res.inventory });
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

  return (
    <div className="nri-inventory nri-deck-module">
      <header className="nri-inventory__head">
        <Package size={18} />
        <div>
          <h2 className="nri-inventory__title nri-deck-sheet__title">Инвентарь</h2>
          <p className="mono-text opacity-70">
            Чипы — всегда. Описание — по «ещё». Экип влияет на лист, пока надет.
          </p>
        </div>
      </header>

      {err && <p className="nri-vault__err mono-text">{err}</p>}

      {activeConditions.length > 0 && (
        <section className="nri-inventory__status" aria-label="Активные статусы">
          <span className="nri-inventory__status-label mono-text">Статусы</span>
          <div className="nri-cyber__chip-row">
            {activeConditions.map((c) => {
              const dur = formatConditionDuration(c);
              return (
                <span
                  key={`${c.id}-${c.appliedAt}`}
                  className="nri-cyber__chip warn"
                  title={c.notes ?? c.label}
                >
                  <span className="nri-cyber__chip-k">{c.label}</span>
                  {dur ? <span className="nri-cyber__chip-v">{dur}</span> : null}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {installedAugs.length > 0 && (
        <section className="nri-inventory__status nri-inventory__status--chrome" aria-label="Установленный хром">
          <span className="nri-inventory__status-label mono-text">Хром (снятие ↓ психоз)</span>
          <ul className="nri-inventory__aug-list">
            {installedAugs.map((a) => (
              <li key={a.itemId}>
                <span>
                  {a.name} · {CYBER_SLOT_LABELS[a.slot as CyberSlot] ?? a.slot} · BT {a.bloodTox}
                </span>
                <button
                  type="button"
                  className="nri-inventory__more"
                  disabled={busy === a.itemId || !user?.id}
                  onClick={() => void uninstallCyber(a.itemId)}
                >
                  отключить
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="nri-inventory__list">
        {inventory.map((item) => {
          const chips = itemModChips(item);
          const open = !!expanded[item.id];
          const cat = item.catalogId ? getCatalogItem(item.catalogId) : undefined;
          return (
            <li key={item.id} className={`nri-inventory__item ${item.equipped ? 'equipped' : ''}`}>
              <div className="nri-inventory__item-icon">{slotIcon(item)}</div>
              <div className="nri-inventory__item-body">
                <div className="nri-inventory__item-title-row">
                  <strong>
                    {item.name}
                    {item.qty && item.qty > 1 ? ` ×${item.qty}` : ''}
                  </strong>
                  {item.equipped && <span className="nri-inventory__badge">ЭКИП</span>}
                  {!canTransferInventoryItem(item) && (
                    <span className="nri-inventory__badge">ПЕРСОН.</span>
                  )}
                  {cat && (
                    <span className="nri-inventory__badge nri-inventory__badge--muted">
                      {ITEM_CATEGORY_LABELS[cat.category] ?? cat.category}
                    </span>
                  )}
                  {item.blurb && (
                    <button
                      type="button"
                      className="nri-inventory__more"
                      onClick={() => setExpanded((e) => ({ ...e, [item.id]: !open }))}
                    >
                      {open ? 'свернуть' : 'ещё'}
                    </button>
                  )}
                </div>
                {chips.length > 0 ? (
                  <div className="nri-cyber__chip-row">
                    {chips.map((row, i) => (
                      <span key={`${row.k}-${row.v}-${i}`} className="nri-cyber__chip" title={row.k}>
                        <span className="nri-cyber__chip-k">{row.k}</span>
                        <span className="nri-cyber__chip-v">{row.v}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mono-text opacity-50 nri-inventory__mods">без боевых бонусов</p>
                )}
                {open && item.blurb && <p className="mono-text opacity-70">{item.blurb}</p>}
                {item.inscribedName && (
                  <p className="mono-text opacity-60">Вписано: {item.inscribedName}</p>
                )}
              </div>
              <div className="nri-inventory__actions">
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
                {canInstallCyber(item) && (
                  <button
                    type="button"
                    className="nri-inventory__equip"
                    disabled={busy === item.id || !user?.id}
                    onClick={() => installCyber(item)}
                  >
                    <Zap size={14} />
                    Установить
                  </button>
                )}
                {canInscribeInventoryItem(item) && (
                  <button
                    type="button"
                    className="nri-inventory__equip"
                    disabled={busy === item.id}
                    onClick={() => void inscribeItem(item)}
                  >
                    <Zap size={14} />
                    Вписать имя
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {inventory.length === 0 && (
          <li className="mono-text opacity-50 nri-inventory__empty">Пусто — мастер выдаст лут с каталога.</li>
        )}
      </ul>

      {isHost && (
        <section className="nri-inventory__grant">
          <h3 className="mono-text">Выдать из каталога (мастер → личка)</h3>
          <p className="mono-text opacity-50 nri-inventory__hint">
            Предмет уходит в личку игроку. Сюжетные вещи с тегом «мастер» — во вкладке «Инвентарь мастера».
          </p>

          <div className="nri-people-subtabs nri-inventory__category-tabs" role="tablist" aria-label="Категории каталога">
            <button
              type="button"
              role="tab"
              aria-selected={category === 'all'}
              className={category === 'all' ? 'active' : ''}
              onClick={() => setCategory('all')}
            >
              Все
            </button>
            {ITEM_CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={category === cat}
                className={category === cat ? 'active' : ''}
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
          </div>

          <div className="nri-inventory__catalog-grid" role="listbox" aria-label="Каталог">
            {catalog.slice(0, 48).map((c) => {
              const chips = catalogGlanceChips(c);
              const selected = catalogPick === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`nri-inventory__catalog-card ${selected ? 'is-selected' : ''}`}
                  onClick={() => setCatalogPick(c.id)}
                  title={c.blurb}
                >
                  <span className="nri-inventory__catalog-card-name">{c.name}</span>
                  <div className="nri-cyber__chip-row">
                    {chips.slice(0, 4).map((row, i) => (
                      <span key={`${row.k}-${i}`} className="nri-cyber__chip">
                        <span className="nri-cyber__chip-k">{row.k}</span>
                        <span className="nri-cyber__chip-v">{row.v}</span>
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
            {catalog.length === 0 && (
              <p className="mono-text opacity-50">Ничего не найдено.</p>
            )}
          </div>

          <div className="nri-inventory__grant-row">
            <NriCatalogItemPreview catalogId={catalogPick} />
            <button
              type="button"
              className="nri-vault__send-btn"
              disabled={busy === 'grant' || !grantTarget || !catalogPick}
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

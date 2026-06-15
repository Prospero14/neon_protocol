import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Send, ShoppingBag, Trash2, Wrench, Zap } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import {
  nriCreateCyberProduct,
  nriDeleteCyberProduct,
  nriFetchCyberProducts,
  nriFetchNpcs,
  nriFetchRoster,
  nriGrantCyberProduct,
  nriGrantCyberProductToNpc,
  nriPatchCyberProduct,
  type NriCyberProduct,
  type NriNpc,
  type NriRosterPlayer,
} from '../logic/nriApi';
import {
  ASSEMBLY_LABELS,
  buildCyberImplant,
  bloodToxLimitFromCon,
  C2185_ABILITY_LABELS,
  CYBER_BLUEPRINT_PRESETS,
  CYBER_RULES_SUMMARY,
  CYBER_SLOT_LABELS,
  formatCyberPartMeta,
  partsGroupedForSlot,
  type CyberBlueprint,
  type CyberSlot,
} from '../logic/nriCyberware';
import {
  getCyberBudget,
  isCyberSlotFree,
  parseAugmentedSheet,
  previewInstallStatus,
  sumInstalledBloodTox,
} from '../logic/nriCyberInstall';
import type { VaultRecipient } from './NriVaultTab';

type Props = {
  inviteCode: string;
  recipients: VaultRecipient[];
};

type SubTab = 'build' | 'stock';

type GrantTarget =
  | { kind: 'player'; id: string; label: string; sheet: unknown }
  | { kind: 'npc'; id: string; label: string; sheet: unknown };

function productBuildMeta(p: NriCyberProduct) {
  const b = (p.build && typeof p.build === 'object' ? p.build : {}) as Record<string, unknown>;
  return {
    bloodTox: typeof b.bloodTox === 'number' ? b.bloodTox : 0,
    overload: !!b.overload,
    blocked: !!b.blocked,
    slot: typeof b.slot === 'string' ? b.slot : p.slot,
  };
}

export const NriCyberPanel: React.FC<Props> = ({ inviteCode, recipients }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [sub, setSub] = useState<SubTab>('build');
  const [products, setProducts] = useState<NriCyberProduct[]>([]);
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const [slot, setSlot] = useState<CyberSlot>('arm');
  const [name, setName] = useState('Свой имплант');
  const [partIds, setPartIds] = useState<string[]>([]);
  const [conScore, setConScore] = useState(10);
  const [showRules, setShowRules] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [grantProduct, setGrantProduct] = useState<NriCyberProduct | null>(null);
  const [grantTarget, setGrantTarget] = useState<GrantTarget | null>(null);

  const bloodToxLimit = bloodToxLimitFromCon(conScore);

  const blueprint: CyberBlueprint = useMemo(() => ({ slot, name, partIds }), [slot, name, partIds]);
  const build = useMemo(() => buildCyberImplant(blueprint), [blueprint]);
  const groupedParts = useMemo(() => partsGroupedForSlot(slot), [slot]);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const list = await nriFetchCyberProducts(authToken, inviteCode);
    if (list === null) {
      setErr('Не удалось загрузить киберимпланты.');
      return;
    }
    setErr(null);
    setProducts(list);
  }, [authToken, inviteCode]);

  const refreshTargets = useCallback(async () => {
    if (!authToken) return;
    const [players, npcList] = await Promise.all([
      nriFetchRoster(authToken, inviteCode),
      nriFetchNpcs(authToken, inviteCode),
    ]);
    if (players) setRoster(players);
    if (npcList) setNpcs(npcList);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    refreshTargets();
  }, [refresh, refreshTargets]);

  useEffect(() => {
    if (!authToken || !inviteCode) return;
    fetch(`/neon_v1/services/nri/${encodeURIComponent(inviteCode)}/cyber`, {
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      if (res.status === 404) {
        setErr('Маршрут /cyber не найден — на порту 8080 старый сервер. Выполните: npm run build && npm start');
      }
    });
  }, [authToken, inviteCode]);

  const togglePart = (id: string) => {
    setPartIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const loadPreset = (p: CyberBlueprint) => {
    setSlot(p.slot);
    setName(p.name);
    setPartIds([...p.partIds]);
  };

  const saveProduct = async (inShop: boolean) => {
    if (!authToken || !build.canSave) return;
    if (inShop && build.overload) {
      setErr('Перегруз питания — в лавку нельзя, исправьте сборку или сохраните черновик.');
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await nriCreateCyberProduct(authToken, inviteCode, {
      name: build.name,
      slot: build.slot,
      blueprint,
      build,
      priceWonlongs: build.priceWonlongs,
      inShop,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setOkMsg(inShop ? 'Имплант выставлен в лавку.' : 'Черновик сохранён — откройте вкладку «Склад / лавка».');
    await refresh();
    setSub('stock');
  };

  const toggleShop = async (p: NriCyberProduct) => {
    if (!authToken) return;
    await nriPatchCyberProduct(authToken, inviteCode, p.id, { inShop: !p.inShop });
    await refresh();
  };

  const remove = async (id: string) => {
    if (!authToken || !window.confirm('Удалить имплант?')) return;
    await nriDeleteCyberProduct(authToken, inviteCode, id);
    await refresh();
  };

  const grant = async (install: boolean) => {
    if (!authToken || !grantProduct || !grantTarget) {
      setErr('Выберите имплант и получателя.');
      return;
    }
    const meta = productBuildMeta(grantProduct);
    if (install && (meta.blocked || meta.overload)) {
      setErr('Эту сборку нельзя установить — ошибки или перегруз питания.');
      return;
    }
    setBusy(true);
    const res =
      grantTarget.kind === 'player'
        ? await nriGrantCyberProduct(authToken, inviteCode, grantProduct.id, grantTarget.id, install)
        : await nriGrantCyberProductToNpc(authToken, inviteCode, grantProduct.id, grantTarget.id, install);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      setOkMsg(null);
      return;
    }
    setErr(null);
    const who = grantTarget.label;
    setOkMsg(
      install
        ? `«${grantProduct.name}» установлен: ${who}.`
        : `«${grantProduct.name}» в инвентаре: ${who}.`
    );
    setGrantProduct(null);
    setGrantTarget(null);
    await refreshTargets();
  };

  const grantInstallPreview = useMemo(() => {
    if (!grantProduct || !grantTarget) return null;
    const meta = productBuildMeta(grantProduct);
    const sheet = parseAugmentedSheet(grantTarget.sheet);
    const slotTaken = !isCyberSlotFree(grantTarget.sheet, meta.slot);
    return previewInstallStatus({
      buildBloodTox: meta.bloodTox,
      buildSlot: meta.slot,
      buildOverload: meta.overload,
      buildBlocked: meta.blocked,
      playerCon: sheet?.abilities?.CON,
      playerInstalledBt: sumInstalledBloodTox(sheet),
      playerSlotTaken: slotTaken,
    });
  }, [grantProduct, grantTarget]);

  const playerTargets = useMemo((): GrantTarget[] => {
    if (roster.length > 0) {
      return roster.map((p) => ({
        kind: 'player',
        id: p.userId,
        label: `${p.displayName} (@${p.username})`,
        sheet: p.sheet ?? null,
      }));
    }
    return recipients.map((r) => ({
      kind: 'player',
      id: r.userId,
      label: r.label,
      sheet: null,
    }));
  }, [roster, recipients]);

  const draftCount = products.filter((p) => !p.inShop).length;

  const modLine = (['STR', 'DEX', 'CON', 'INT', 'TEC', 'PEO'] as const)
    .map((k) => {
      const v = build.c2185Mods[k];
      if (!v) return null;
      return `${C2185_ABILITY_LABELS[k]} ${v >= 0 ? '+' : ''}${v}`;
    })
    .filter(Boolean)
    .join(' · ');

  const btOverLimit = build.bloodTox > bloodToxLimit;

  const renderTargetRow = (t: GrantTarget) => {
    const budget = getCyberBudget(t.sheet);
    const slotFree = grantProduct ? isCyberSlotFree(t.sheet, productBuildMeta(grantProduct).slot) : true;
    const selected = grantTarget?.kind === t.kind && grantTarget.id === t.id;
    return (
      <button
        key={`${t.kind}-${t.id}`}
        type="button"
        className={`nri-cyber__grant-row ${selected ? 'selected' : ''}`}
        onClick={() => setGrantTarget(t)}
      >
        <span className="nri-cyber__grant-name">{t.label}</span>
        <span className="mono-text opacity-70">
          BT {budget.btUsed}/{budget.btLimit} (своб. {budget.btFree})
        </span>
        <span className={`mono-text ${slotFree ? 'nri-cyber__slot-ok' : 'nri-cyber__slot-busy'}`}>
          {grantProduct
            ? slotFree
              ? `Слот «${CYBER_SLOT_LABELS[productBuildMeta(grantProduct).slot as CyberSlot] ?? productBuildMeta(grantProduct).slot}» свободен`
              : 'Слот занят'
            : '—'}
        </span>
      </button>
    );
  };

  return (
    <div className="nri-cyber">
      <header className="nri-chars__head">
        <h3 className="mono-text">Киберимпланты</h3>
        <p className="mono-text opacity-70">
          Одна сборка = один имплант в слот тела. Детали суммируют CPU, RAM, батарею и расход.
        </p>
        <button type="button" className="nri-lobby__copy" onClick={() => setShowRules((v) => !v)}>
          <BookOpen size={14} /> {showRules ? 'Скрыть правила' : 'Ограничения и правила'}
        </button>
      </header>

      {showRules && (
        <div className="nri-cyber__rules">
          {CYBER_RULES_SUMMARY.map((sec) => (
            <section key={sec.title}>
              <h4 className="mono-text">{sec.title}</h4>
              <ul>
                {sec.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <label className="nri-modal__field nri-cyber__con-field">
        <span>ВЫН персонажа (для лимита Blood Tox)</span>
        <input
          type="number"
          min={3}
          max={20}
          value={conScore}
          onChange={(e) => setConScore(Number(e.target.value) || 10)}
        />
        <span className="mono-text opacity-70">
          Лимит BT на листе: <strong>{bloodToxLimit}</strong> (10 + мод ВЫН). Эта сборка: {build.bloodTox} BT
          {btOverLimit && ' — превышает лимит при установке одного импланта!'}
        </span>
      </label>

      <nav className="nri-cyber__subtabs">
        <button type="button" className={sub === 'build' ? 'active' : ''} onClick={() => setSub('build')}>
          <Wrench size={14} /> Конструктор
        </button>
        <button type="button" className={sub === 'stock' ? 'active' : ''} onClick={() => setSub('stock')}>
          <ShoppingBag size={14} /> Склад / лавка ({products.length})
          {draftCount > 0 && ` · ${draftCount} черн.`}
        </button>
      </nav>

      {sub === 'build' && (
        <div className="nri-cyber__build">
          <div className="nri-cyber__presets">
            <span className="mono-text opacity-70">Шаблоны:</span>
            {CYBER_BLUEPRINT_PRESETS.map((p) => (
              <button key={p.name} type="button" className="nri-lobby__copy" onClick={() => loadPreset(p)}>
                {p.name}
              </button>
            ))}
          </div>

          <label className="nri-modal__field">
            <span>Название импланта</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <div className="nri-cyber__slots">
            {(Object.keys(CYBER_SLOT_LABELS) as CyberSlot[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`nri-class-card ${slot === s ? 'active' : ''}`}
                onClick={() => {
                  setSlot(s);
                  setPartIds([]);
                }}
              >
                {CYBER_SLOT_LABELS[s]}
              </button>
            ))}
          </div>

          <p className="mono-text opacity-60 nri-cyber__parts-legend">
            У каждой детали: описание, BT, статы, расход/батарея, цена. Ячейки питания дают общую батарею сборки.
          </p>

          {groupedParts.map((group) => (
            <div key={group.kind} className="nri-cyber__parts">
              <h4 className="mono-text">{group.label}</h4>
              <ul className="nri-cyber__part-list">
                {group.parts.map((p) => (
                  <li key={p.id}>
                    <label className={`nri-cyber__part ${partIds.includes(p.id) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={partIds.includes(p.id)} onChange={() => togglePart(p.id)} />
                      <div className="nri-cyber__part-body">
                        <strong className="nri-cyber__part-name">{p.name}</strong>
                        <p className="nri-cyber__part-blurb mono-text">{p.blurb}</p>
                        <div className="nri-cyber__part-meta">
                          {formatCyberPartMeta(p).map((row) => (
                            <span key={row.label} className="nri-cyber__part-tag" title={row.label}>
                              <span className="nri-cyber__part-tag-label">{row.label}</span>
                              <span className="nri-cyber__part-tag-val">{row.value}</span>
                            </span>
                          ))}
                        </div>
                        {p.features.length > 0 && (
                          <p className="nri-cyber__part-fx mono-text opacity-70">{p.features.join(' · ')}</p>
                        )}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="nri-cyber__tuning">
            <h4 className="mono-text">
              <Zap size={14} /> Сводка сборки (сумма деталей)
            </h4>
            <p className="mono-text opacity-60 nri-cyber__tuning-hint">
              Батарея = сумма ячеек питания. Расход = сумма всех модулей. Слайдеров нет — только то, что выбрано.
            </p>
            {(['cpuMhz', 'ramGb', 'powerWh', 'powerDrawW'] as const).map((key) => (
              <div key={key} className="nri-cyber__assembly-row">
                <span>{ASSEMBLY_LABELS[key]}</span>
                <strong className="mono-text">{build.totals[key]}</strong>
              </div>
            ))}
            {build.partLines.length > 0 && (
              <ul className="nri-cyber__assembly-parts mono-text opacity-70">
                {build.partLines.map((line) => (
                  <li key={line.partId}>
                    {line.partName}
                    {line.powerWh > 0 && ` · +${line.powerWh} Вт·ч`}
                    {line.powerDrawW > 0 && ` · ${line.powerDrawW} Вт`}
                    {line.cpuMhz > 0 && ` · ${line.cpuMhz} МГц`}
                    {line.ramGb > 0 && ` · ${line.ramGb} ГБ`}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`nri-cyber__preview ${build.overload || build.blocked ? 'overload' : ''}`}>
            <h4 className="mono-text">Итог</h4>
            <p className="mono-text">{modLine || '— без модов характеристик'}</p>
            <p className="mono-text opacity-70">
              Blood Tox {build.bloodTox} · CPU {build.cpuMhz} МГц · RAM {build.ramGb} ГБ · расход {build.powerDrawW}{' '}
              Вт / батарея {build.powerWh} Вт·ч · ₩{build.priceWonlongs}
            </p>
            {build.overload && (
              <p className="nri-lobby__err mono-text">Перегруз: расход превышает ёмкость (или нет ячейки).</p>
            )}
            {build.features.length > 0 && (
              <ul className="nri-cyber__features">
                {build.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            {build.warnings.map((w) => (
              <p
                key={w}
                className={
                  /Слишком много|Только один|Не более|не подходит|Blood Tox сборки/.test(w)
                    ? 'nri-lobby__err mono-text'
                    : 'mono-text opacity-70'
                }
              >
                {w}
              </p>
            ))}
          </div>

          <div className="nri-presets__actions">
            <button
              type="button"
              className="nri-lobby__copy"
              disabled={busy || !build.canSave}
              onClick={() => saveProduct(false)}
            >
              <Plus size={14} /> Сохранить черновик
            </button>
            <button
              type="button"
              className="nri-modal__submit"
              disabled={busy || !build.canSave || build.overload}
              onClick={() => saveProduct(true)}
            >
              <ShoppingBag size={14} /> В лавку
            </button>
          </div>
          {!build.canSave && (
            <p className="nri-lobby__err mono-text">Добавьте детали и исправьте ошибки — сохранение заблокировано.</p>
          )}
        </div>
      )}

      {sub === 'stock' && (
        <div className="nri-cyber__shop nri-cyber__stock-panel">
          <p className="mono-text opacity-70 nri-cyber__shop-hint">
            Все сохранённые импланты. Кнопка <strong>«Передать игроку / НПС»</strong> — выдача с проверкой BT и слота.
            «В лавку» — видно как товар (опционально).
          </p>
          <ul className="nri-cyber__shop-list">
            {products.map((p) => {
              const meta = productBuildMeta(p);
              return (
                <li key={p.id} className="nri-cyber__shop-item">
                  <div>
                    <strong>{p.name}</strong>
                    <span className="mono-text opacity-70">
                      {CYBER_SLOT_LABELS[p.slot as CyberSlot] ?? p.slot} · BT {meta.bloodTox} · ₩{p.priceWonlongs}
                      {p.inShop ? ' · в лавке' : ' · черновик'}
                      {meta.overload && ' · перегруз'}
                    </span>
                  </div>
                  <div className="nri-cyber__shop-actions">
                    <button
                      type="button"
                      className="nri-modal__submit nri-cyber__grant-btn"
                      onClick={() => {
                        setGrantProduct(p);
                        setGrantTarget(null);
                        setOkMsg(null);
                      }}
                    >
                      <Send size={14} /> Передать игроку / НПС
                    </button>
                    <button type="button" className="nri-lobby__copy" onClick={() => toggleShop(p)}>
                      {p.inShop ? 'Снять с лавки' : 'В лавку'}
                    </button>
                    <button type="button" className="nri-lobby__close" onClick={() => remove(p.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
            {products.length === 0 && (
              <p className="mono-text opacity-50">Пусто — соберите в конструкторе и нажмите «Сохранить черновик».</p>
            )}
          </ul>
        </div>
      )}

      {grantProduct && (
        <div className="nri-cyber__grant-modal">
          <div className="nri-cyber__grant-dialog">
            <h4 className="mono-text">Передать имплант: {grantProduct.name}</h4>
            <p className="mono-text opacity-70">
              BT сборки {productBuildMeta(grantProduct).bloodTox} · слот{' '}
              {CYBER_SLOT_LABELS[productBuildMeta(grantProduct).slot as CyberSlot] ??
                productBuildMeta(grantProduct).slot}
            </p>
            <div className="nri-cyber__grant-cols">
              <div>
                <h5 className="mono-text">Игроки</h5>
                {playerTargets.length === 0 && (
                  <p className="mono-text opacity-50">Нет игроков за столом.</p>
                )}
                {playerTargets.map((t) => renderTargetRow(t))}
              </div>
              <div>
                <h5 className="mono-text">НПС</h5>
                {npcs.length === 0 && <p className="mono-text opacity-50">Нет НПС — создайте во вкладке NPC.</p>}
                {npcs.map((n) =>
                  renderTargetRow({
                    kind: 'npc',
                    id: n.id,
                    label: n.name,
                    sheet: n.sheet,
                  })
                )}
              </div>
            </div>
            {grantInstallPreview && grantTarget && (
              <p
                className={`mono-text nri-cyber__install-hint ${grantInstallPreview.canInstall ? 'ok' : 'warn'}`}
              >
                {grantInstallPreview.hint}
              </p>
            )}
            <div className="nri-cyber__grant-actions">
              <button type="button" className="nri-lobby__close" onClick={() => setGrantProduct(null)}>
                Отмена
              </button>
              <button
                type="button"
                className="nri-lobby__copy"
                disabled={busy || !grantTarget}
                onClick={() => grant(false)}
              >
                В инвентарь
              </button>
              <button
                type="button"
                className="nri-modal__submit"
                disabled={busy || !grantTarget || !grantInstallPreview?.canInstall}
                onClick={() => grant(true)}
              >
                Установить
              </button>
            </div>
          </div>
        </div>
      )}

      {err && <p className="nri-lobby__err mono-text">{err}</p>}
      {okMsg && <p className="mono-text nri-cyber__install-hint ok">{okMsg}</p>}
    </div>
  );
};

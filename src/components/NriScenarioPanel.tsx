import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import {
  nriCreateScenarioNode,
  nriDeleteScenarioNode,
  nriFetchLore,
  nriFetchMapZones,
  nriFetchNpcs,
  nriFetchScenario,
  nriFetchVault,
  nriPatchScenarioNode,
  nriPatchScenarioProgress,
  type NriMapZone,
  type NriNpc,
  type NriScenarioNode,
  type NriScenarioProgress,
  type NriVaultFile,
} from '../logic/nriApi';
import { LORE_MARKUP_HINT } from '../../shared/nri-domain/loreMarkup';
import { buildLoreCardIndex, type LoreCardRef } from '../../shared/nri-domain/loreCards';
import { LoreMarkupInteractive } from './LoreMarkupInteractive';
import { LoreCardPopup } from './LoreCardPopup';
import { NRI_ITEM_CATALOG, searchCatalog } from '../logic/nriItemCatalog';
import {
  emptyScenarioLinks,
  parseScenarioLinks,
  scenarioDepth,
  type NriScenarioLinks,
} from '../logic/nriScenario';
import { NriCatalogItemPreview } from './NriSelectionPreview';

type Props = { inviteCode: string };

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export const NriScenarioPanel: React.FC<Props> = ({ inviteCode }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [nodes, setNodes] = useState<NriScenarioNode[]>([]);
  const [progress, setProgress] = useState<NriScenarioProgress | null>(null);
  const [zones, setZones] = useState<NriMapZone[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [links, setLinks] = useState<NriScenarioLinks>(emptyScenarioLinks());
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const [files, setFiles] = useState<NriVaultFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previewCatalogId, setPreviewCatalogId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [loreCards, setLoreCards] = useState<LoreCardRef[]>([]);
  const [lorePopup, setLorePopup] = useState<LoreCardRef | null>(null);
  const [loreLinkErr, setLoreLinkErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const [scenarioRes, npcList, vault, zoneData, loreRes] = await Promise.all([
      nriFetchScenario(authToken, inviteCode),
      nriFetchNpcs(authToken, inviteCode),
      nriFetchVault(authToken, inviteCode),
      nriFetchMapZones(authToken, inviteCode),
      nriFetchLore(authToken, inviteCode),
    ]);
    if (scenarioRes.ok) {
      setNodes(scenarioRes.nodes);
      setProgress(scenarioRes.progress);
      setErr(null);
    } else {
      setErr(scenarioRes.error);
    }
    if (zoneData.ok) setZones(zoneData.zones);
    if (npcList) setNpcs(npcList);
    if (vault) setFiles(vault);
    if (loreRes.ok) {
      const lore = loreRes.data;
      const cards = buildLoreCardIndex({
        places: lore.places,
        factions: lore.factions,
        entries: lore.entries ?? [],
      });
      setLoreCards(cards);
    }
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loreLinkErr) return;
    const t = window.setTimeout(() => setLoreLinkErr(null), 5000);
    return () => window.clearTimeout(t);
  }, [loreLinkErr]);

  const root = nodes.find((n) => !n.parentId);
  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) {
      setTitle('');
      setSummary('');
      setBody('');
      setLinks(emptyScenarioLinks());
      return;
    }
    setTitle(selected.title);
    setSummary(selected.summary ?? '');
    setBody(selected.body);
    setLinks(parseScenarioLinks(selected.links));
  }, [selected]);

  const filteredItems = useMemo(() => searchCatalog(itemSearch, 'all').slice(0, 40), [itemSearch]);

  const loreCardsForPreview = useMemo(() => {
    const scenarioCards = buildLoreCardIndex({
      scenarios: nodes.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary ?? '',
        body: n.body,
      })),
    });
    const byTitle = new Map<string, LoreCardRef>();
    for (const c of [...loreCards, ...scenarioCards]) {
      byTitle.set(c.title.toLowerCase(), c);
    }
    return [...byTitle.values()];
  }, [loreCards, nodes]);

  const tree = useMemo(() => {
    const byParent = new Map<string | null, NriScenarioNode[]>();
    for (const n of nodes) {
      const key = n.parentId;
      const arr = byParent.get(key) ?? [];
      arr.push(n);
      byParent.set(key, arr);
    }
    const walk = (parentId: string | null): React.ReactNode[] => {
      const list = byParent.get(parentId) ?? [];
      return list.flatMap((n) => {
        const depth = scenarioDepth(nodes, n.id);
        const isRoot = !n.parentId;
        return [
          <button
            key={n.id}
            type="button"
            className={`nri-scenario__tree-item ${selectedId === n.id ? 'active' : ''}`}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            onClick={() => setSelectedId(n.id)}
          >
            {isRoot ? '◆ ' : '▸ '}
            {n.title}
            {progress?.currentScriptNodeId === n.id && ' · ▶'}
            {n.checkpointMet && ' ✓'}
          </button>,
          ...walk(n.id),
        ];
      });
    };
    return walk(null);
  }, [nodes, selectedId, progress?.currentScriptNodeId]);

  const addRoot = async () => {
    if (!authToken || root) return;
    setBusy(true);
    setErr(null);
    const res = await nriCreateScenarioNode(authToken, inviteCode, {
      title: 'Основной сценарий',
      body: '',
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refresh();
    setSelectedId(res.node.id);
  };

  const addQuest = async () => {
    if (!authToken) return;
    const parentId = selected?.id ?? root?.id;
    if (!parentId) {
      setErr('Сначала создайте основной сценарий.');
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await nriCreateScenarioNode(authToken, inviteCode, {
      parentId,
      title: 'Новый квест',
      body: '',
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refresh();
    setSelectedId(res.node.id);
  };

  const saveSelected = async () => {
    if (!authToken || !selectedId) return;
    setBusy(true);
    setErr(null);
    const res = await nriPatchScenarioNode(authToken, inviteCode, selectedId, {
      title: title.trim() || 'Без названия',
      summary,
      body,
      links,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refresh();
  };

  const removeSelected = async () => {
    if (!authToken || !selectedId || !window.confirm('Удалить узел и все дочерние квесты?')) return;
    setBusy(true);
    await nriDeleteScenarioNode(authToken, inviteCode, selectedId);
    setBusy(false);
    setSelectedId(null);
    await refresh();
  };

  const setCurrentScript = async () => {
    if (!authToken || !selectedId) return;
    setBusy(true);
    const p = await nriPatchScenarioProgress(authToken, inviteCode, { currentScriptNodeId: selectedId });
    setBusy(false);
    if (p) setProgress(p);
    else setErr('Не удалось установить текущий пункт сценария.');
    await refresh();
  };

  const completeCheckpoint = async () => {
    if (!authToken || !selectedId || !selected?.checkpointMet) return;
    setBusy(true);
    await nriPatchScenarioProgress(authToken, inviteCode, { completeNodeId: selectedId });
    setBusy(false);
    await refresh();
  };

  const linkNpcName = (id: string) => npcs.find((n) => n.id === id)?.name ?? id;
  const linkFileTitle = (id: string) => files.find((f) => f.id === id)?.title ?? id;
  const linkItemName = (id: string) => NRI_ITEM_CATALOG.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="nri-scenario">
      <header className="nri-chars__head">
        <h3 className="mono-text">Сценарий</h3>
        <p className="mono-text opacity-70">
          Основной сюжет и ответвления-квесты. Привязывайте НПС, предметы каталога и файлы из хранилища.
        </p>
        <p className="mono-text opacity-60 nri-lore__hint">{LORE_MARKUP_HINT}</p>
        <div className="nri-scenario__toolbar">
          {!root && (
            <button type="button" className="nri-modal__submit" disabled={busy} onClick={addRoot}>
              <Plus size={14} /> Основной сценарий
            </button>
          )}
          <button type="button" className="nri-lobby__copy" disabled={busy || !root} onClick={addQuest}>
            <Plus size={14} /> Квест / ветка
          </button>
        </div>
      </header>

      <div className="nri-scenario__layout">
        <aside className="nri-scenario__tree">
          <h4 className="mono-text">Структура</h4>
          {tree.length === 0 && (
            <p className="mono-text opacity-50">Пока пусто — создайте основной сценарий.</p>
          )}
          {tree}
        </aside>

        <div className="nri-scenario__editor">
          {!selected && (
            <p className="mono-text opacity-50">Выберите узел слева или создайте новый.</p>
          )}
          {selected && (
            <>
              <label className="nri-modal__field">
                <span>{selected.parentId ? 'Квест / ветка' : 'Основной сценарий'}</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="nri-modal__field">
                <span>Краткая сводка (для [[ссылки]] в чате)</span>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="Текст, который увидят игроки во всплывающей подсказке…"
                />
              </label>
              {summary.trim() && (
                <div className="nri-modal__field">
                  <span>Превью подсветки</span>
                  <p className="mono-text nri-scenario__markup-preview">
                    <LoreMarkupInteractive
                      text={summary}
                      cards={loreCardsForPreview}
                      onOpenCard={setLorePopup}
                      onBrokenLink={(t) =>
                        setLoreLinkErr(`Карточка «${t}» не найдена — создайте её в лоре или сохраните квест.`)
                      }
                    />
                  </p>
                </div>
              )}
              <label className="nri-modal__field">
                <span>Полный текст (только мастер)</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  placeholder="Заметки, полный лор квеста, детали для себя…"
                />
              </label>

              <section className="nri-scenario__place">
                <h4 className="mono-text">Место · лор</h4>
                <label className="mono-text nri-scenario__check">
                  <input
                    type="checkbox"
                    checked={!!links.syncToLore}
                    onChange={(e) => setLinks((l) => ({ ...l, syncToLore: e.target.checked }))}
                  />
                  Дублировать в лор (карточка места)
                </label>
                <label className="nri-modal__field">
                  <span>Название места</span>
                  <input
                    value={links.placeTitle ?? ''}
                    placeholder={title}
                    onChange={(e) => setLinks((l) => ({ ...l, placeTitle: e.target.value }))}
                  />
                </label>
                <label className="nri-modal__field">
                  <span>Район на карте</span>
                  <select
                    value={links.zoneKey ?? ''}
                    onChange={(e) => setLinks((l) => ({ ...l, zoneKey: e.target.value || null }))}
                  >
                    <option value="">— не выбран —</option>
                    {zones.map((z) => (
                      <option key={z.zoneKey} value={z.zoneKey}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mono-text nri-scenario__check">
                  <input
                    type="checkbox"
                    checked={!!links.meetCheckpoint}
                    onChange={(e) => setLinks((l) => ({ ...l, meetCheckpoint: e.target.checked }))}
                  />
                  Чекпоинт: все игроки здесь (только если это текущий пункт сценария)
                </label>
                {selected.checkpointMet && (
                  <p className="mono-text nri-scenario__checkpoint-ok">✓ Условие встречи выполнено</p>
                )}
                {links.meetCheckpoint && progress?.currentScriptNodeId !== selected.id && (
                  <p className="mono-text opacity-60">
                    Игроки могут прийти раньше — галочка не засчитается, пока не нажмёте «Текущий пункт».
                  </p>
                )}
                <div className="nri-presets__actions">
                  <button type="button" className="nri-lobby__copy" disabled={busy} onClick={setCurrentScript}>
                    ▶ Текущий пункт сценария
                  </button>
                  {selected.checkpointMet && (
                    <button type="button" className="nri-modal__submit" disabled={busy} onClick={completeCheckpoint}>
                      Завершить чекпоинт
                    </button>
                  )}
                </div>
              </section>

              <section className="nri-scenario__links">
                <h4 className="mono-text">Привязки</h4>

                <div className="nri-scenario__link-block">
                  <span className="mono-text">НПС</span>
                  <ul className="nri-scenario__link-list">
                    {npcs.map((n) => (
                      <li key={n.id}>
                        <label className="mono-text">
                          <input
                            type="checkbox"
                            checked={links.npcIds.includes(n.id)}
                            onChange={() => setLinks((l) => ({ ...l, npcIds: toggleId(l.npcIds, n.id) }))}
                          />
                          {n.name}
                        </label>
                      </li>
                    ))}
                    {npcs.length === 0 && <li className="mono-text opacity-50">Нет НПС на столе.</li>}
                  </ul>
                </div>

                <div className="nri-scenario__link-block">
                  <span className="mono-text">Предметы каталога</span>
                  <input
                    className="mono-text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Поиск предмета…"
                  />
                  <ul className="nri-scenario__link-list nri-scenario__link-list--scroll">
                    {filteredItems.map((c) => (
                      <li key={c.id}>
                        <label className="mono-text">
                          <input
                            type="checkbox"
                            checked={links.catalogIds.includes(c.id)}
                            onChange={() => {
                              setLinks((l) => ({ ...l, catalogIds: toggleId(l.catalogIds, c.id) }));
                              setPreviewCatalogId(c.id);
                            }}
                          />
                          {c.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                  {previewCatalogId && links.catalogIds.includes(previewCatalogId) && (
                    <NriCatalogItemPreview catalogId={previewCatalogId} />
                  )}
                </div>

                <div className="nri-scenario__link-block">
                  <span className="mono-text">Файлы хранилища</span>
                  <ul className="nri-scenario__link-list">
                    {files.map((f) => (
                      <li key={f.id}>
                        <label className="mono-text">
                          <input
                            type="checkbox"
                            checked={links.fileIds.includes(f.id)}
                            onChange={() => setLinks((l) => ({ ...l, fileIds: toggleId(l.fileIds, f.id) }))}
                          />
                          {f.title}
                          {f.protected && ' 🔒'}
                        </label>
                      </li>
                    ))}
                    {files.length === 0 && (
                      <li className="mono-text opacity-50">Нет файлов — создайте во вкладке «Файлохранилище».</li>
                    )}
                  </ul>
                </div>

                {(links.npcIds.length > 0 || links.catalogIds.length > 0 || links.fileIds.length > 0) && (
                  <div className="nri-scenario__linked-summary mono-text opacity-70">
                    <strong>Сводка:</strong>{' '}
                    {links.npcIds.map(linkNpcName).join(', ')}
                    {links.catalogIds.length > 0 &&
                      `${links.npcIds.length ? ' · ' : ''}предметы: ${links.catalogIds.map(linkItemName).join(', ')}`}
                    {links.fileIds.length > 0 &&
                      `${links.npcIds.length || links.catalogIds.length ? ' · ' : ''}файлы: ${links.fileIds.map(linkFileTitle).join(', ')}`}
                  </div>
                )}
              </section>

              <div className="nri-presets__actions">
                <button type="button" className="nri-lobby__close" disabled={busy} onClick={removeSelected}>
                  <Trash2 size={14} /> Удалить
                </button>
                <button type="button" className="nri-modal__submit" disabled={busy} onClick={saveSelected}>
                  <Save size={14} /> Сохранить
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {err && <p className="nri-lobby__err mono-text">{err}</p>}
      {loreLinkErr && <p className="nri-lobby__err mono-text">{loreLinkErr}</p>}
      <LoreCardPopup card={lorePopup} onClose={() => setLorePopup(null)} />
    </div>
  );
};

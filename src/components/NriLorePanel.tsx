import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import {
  nriCreateFaction,
  nriCreateLoreEntry,
  nriCreateLorePlace,
  nriDeleteFaction,
  nriDeleteLoreEntry,
  nriFetchLore,
  nriFetchMapZones,
  nriFetchNpcs,
  nriFetchRoster,
  nriPatchFaction,
  nriPatchLoreEntry,
  nriPatchLorePlace,
  type NriFaction,
  type NriLoreEntry,
  type NriLorePlace,
  type NriMapZone,
  type NriNpc,
  type NriRosterPlayer,
} from '../logic/nriApi';
import { formatFactionTitle, NRI_FACTION_KINDS } from '../logic/nriFactionKinds';
import { defaultZoneIconId, defaultEntityIconId, resolveEntityIconHref } from '../../shared/nri-domain/zoneIcons';
import { NriEntityIconPicker } from './NriEntityIconPicker';

type Props = { inviteCode: string };

type LoreTab = 'world' | 'factions' | 'places';

function factionTagsFor(
  id: string,
  kind: 'player' | 'npc',
  factions: NriFaction[]
): NriFaction[] {
  return factions.filter((f) =>
    kind === 'player' ? f.memberPlayerIds.includes(id) : f.memberNpcIds.includes(id)
  );
}

export const NriLorePanel: React.FC<Props> = ({ inviteCode }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [tab, setTab] = useState<LoreTab>('world');
  const [entries, setEntries] = useState<NriLoreEntry[]>([]);
  const [factions, setFactions] = useState<NriFaction[]>([]);
  const [places, setPlaces] = useState<NriLorePlace[]>([]);
  const [mapZones, setMapZones] = useState<NriMapZone[]>([]);
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const [loreRes, npcList, players, mapData] = await Promise.all([
      nriFetchLore(authToken, inviteCode),
      nriFetchNpcs(authToken, inviteCode),
      nriFetchRoster(authToken, inviteCode),
      nriFetchMapZones(authToken, inviteCode),
    ]);
    if (!loreRes.ok) {
      setErr(loreRes.error);
    } else {
      setErr(null);
      const lore = loreRes.data;
      setEntries(lore.entries ?? []);
      setFactions(lore.factions);
      setPlaces(lore.places);
    }
    if (mapData.ok) setMapZones(mapData.zones.filter((z) => !z.zoneKey.startsWith('__')));
    if (npcList) setNpcs(npcList);
    if (players) setRoster(players);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;
  const selectedFaction = factions.find((f) => f.id === selectedFactionId) ?? null;
  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  const addEntry = async () => {
    if (!authToken) return;
    setBusy(true);
    const res = await nriCreateLoreEntry(authToken, inviteCode, { title: 'Новая карточка' });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refresh();
    setSelectedEntryId(res.entry.id);
  };

  const addFaction = async () => {
    if (!authToken) return;
    setBusy(true);
    const res = await nriCreateFaction(authToken, inviteCode, { name: 'Новая фракция' });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refresh();
    setSelectedFactionId(res.faction.id);
  };

  const savePlace = async (
    title: string,
    summary: string,
    body: string,
    entityTag: string | null,
    iconId: string | null
  ) => {
    if (!authToken || !selectedPlace) return;
    setBusy(true);
    const ok = await nriPatchLorePlace(authToken, inviteCode, selectedPlace.id, {
      title,
      summary,
      body,
      entityTag,
      iconId,
    });
    setBusy(false);
    if (!ok) setErr('Не удалось сохранить место.');
    else await refresh();
  };

  const addPlace = async () => {
    if (!authToken) return;
    setBusy(true);
    const res = await nriCreateLorePlace(authToken, inviteCode, { title: 'Новое место' });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refresh();
    setSelectedPlaceId(res.place.id);
  };

  const factionDraft = useMemo(
    () => selectedFaction,
    [selectedFaction?.id, selectedFaction?.updatedAt]
  );

  const zoneOrder = useMemo(
    () => new Map(mapZones.map((z) => [z.zoneKey, z.sortOrder])),
    [mapZones]
  );
  const zoneByKey = useMemo(() => new Map(mapZones.map((z) => [z.zoneKey, z])), [mapZones]);

  const districtPlaces = useMemo(
    () =>
      [...places]
        .filter((p) => p.zoneKey)
        .sort(
          (a, b) =>
            (zoneOrder.get(a.zoneKey!) ?? 999) - (zoneOrder.get(b.zoneKey!) ?? 999) ||
            a.title.localeCompare(b.title, 'ru')
        ),
    [places, zoneOrder]
  );
  const otherPlaces = useMemo(() => places.filter((p) => !p.zoneKey), [places]);

  return (
    <div className="nri-lore">
      <nav className="nri-people-subtabs">
        {(['world', 'factions', 'places'] as LoreTab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`nri-people-subtabs__btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'world' ? 'Мир' : t === 'factions' ? 'Фракции' : 'Места'}
          </button>
        ))}
      </nav>

      {tab === 'world' && (
        <div className="nri-lore__world">
          <p className="mono-text opacity-70">Каждый блок лора — отдельная карточка.</p>
          <button type="button" className="nri-lobby__copy" disabled={busy} onClick={addEntry}>
            <Plus size={14} /> Карточка
          </button>
          <div className="nri-scenario__layout">
            <ul className="nri-lore__list">
              {entries.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className={`nri-scenario__tree-item ${selectedEntryId === e.id ? 'active' : ''}`}
                    onClick={() => setSelectedEntryId(e.id)}
                  >
                    {e.title}
                  </button>
                </li>
              ))}
              {entries.length === 0 && (
                <li className="mono-text opacity-50">Нет карточек — создайте первую.</li>
              )}
            </ul>
            {selectedEntry && (
              <EntryEditor
                key={selectedEntry.id}
                entry={selectedEntry}
                busy={busy}
                onSave={async (title, summary, body) => {
                  if (!authToken) return;
                  setBusy(true);
                  const ok = await nriPatchLoreEntry(authToken, inviteCode, selectedEntry.id, {
                    title,
                    summary,
                    body,
                  });
                  setBusy(false);
                  if (!ok) setErr('Не удалось сохранить карточку.');
                  else await refresh();
                }}
                onDelete={async () => {
                  if (!authToken || !window.confirm('Удалить карточку?')) return;
                  setBusy(true);
                  await nriDeleteLoreEntry(authToken, inviteCode, selectedEntry.id);
                  setBusy(false);
                  setSelectedEntryId(null);
                  await refresh();
                }}
              />
            )}
          </div>
        </div>
      )}

      {tab === 'factions' && (
        <div className="nri-lore__factions">
          <button type="button" className="nri-lobby__copy" disabled={busy} onClick={addFaction}>
            <Plus size={14} /> Фракция
          </button>
          <div className="nri-scenario__layout">
            <ul className="nri-lore__list">
              {factions.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className={`nri-scenario__tree-item ${selectedFactionId === f.id ? 'active' : ''}`}
                    onClick={() => setSelectedFactionId(f.id)}
                  >
                    {f.displayName ?? formatFactionTitle(f.kind, f.name)}
                  </button>
                </li>
              ))}
            </ul>
            {factionDraft && (
              <FactionEditor
                key={factionDraft.id}
                faction={factionDraft}
                roster={roster}
                npcs={npcs}
                allFactions={factions}
                mapZones={mapZones}
                busy={busy}
                onSave={async (patch) => {
                  if (!authToken) return;
                  setBusy(true);
                  const res = await nriPatchFaction(authToken, inviteCode, factionDraft.id, patch);
                  setBusy(false);
                  if (!res.ok) setErr(res.error);
                  else await refresh();
                }}
                onDelete={async () => {
                  if (!authToken || !window.confirm('Удалить фракцию?')) return;
                  setBusy(true);
                  await nriDeleteFaction(authToken, inviteCode, factionDraft.id);
                  setBusy(false);
                  setSelectedFactionId(null);
                  await refresh();
                }}
              />
            )}
          </div>
        </div>
      )}

      {tab === 'places' && (
        <div className="nri-lore__places">
          <p className="mono-text opacity-70">
            Для каждого района карты — карточка места. Название синхронизируется с картой в обе стороны;
            описание можно править свободно. Дополнительные места — без привязки к району.
          </p>
          <button type="button" className="nri-lobby__copy" disabled={busy} onClick={addPlace}>
            <Plus size={14} /> Место
          </button>
          <div className="nri-scenario__layout">
            <ul className="nri-lore__list">
              {districtPlaces.length > 0 && (
                <li className="mono-text opacity-50 nri-lore__list-heading">Районы карты</li>
              )}
              {districtPlaces.map((p) => {
                const zone = p.zoneKey ? zoneByKey.get(p.zoneKey) : undefined;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`nri-scenario__tree-item ${selectedPlaceId === p.id ? 'active' : ''}`}
                      onClick={() => setSelectedPlaceId(p.id)}
                    >
                      {p.title}
                      {zone?.megaDistrict && (
                        <span className="opacity-60"> · {zone.megaDistrict}</span>
                      )}
                    </button>
                  </li>
                );
              })}
              {otherPlaces.length > 0 && (
                <li className="mono-text opacity-50 nri-lore__list-heading">Прочие места</li>
              )}
              {otherPlaces.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`nri-scenario__tree-item ${selectedPlaceId === p.id ? 'active' : ''}`}
                    onClick={() => setSelectedPlaceId(p.id)}
                  >
                    {p.title}
                  </button>
                </li>
              ))}
              {places.length === 0 && (
                <li className="mono-text opacity-50">
                  Загрузка карточек районов… Если пусто — откройте вкладку снова или карту (мастер).
                </li>
              )}
            </ul>
            {selectedPlace && (
              <PlaceEditor
                key={selectedPlace.id}
                place={selectedPlace}
                mapZone={selectedPlace.zoneKey ? zoneByKey.get(selectedPlace.zoneKey) : undefined}
                busy={busy}
                onSave={(title, summary, body, entityTag, iconId) =>
                  savePlace(title, summary, body, entityTag, iconId)
                }
              />
            )}
          </div>
        </div>
      )}

      {err && <p className="nri-lobby__err mono-text">{err}</p>}
    </div>
  );
};

const EntryEditor: React.FC<{
  entry: NriLoreEntry;
  busy: boolean;
  onSave: (title: string, summary: string, body: string) => void;
  onDelete: () => void;
}> = ({ entry, busy, onSave, onDelete }) => {
  const [title, setTitle] = useState(entry.title);
  const [summary, setSummary] = useState(entry.summary ?? '');
  const [body, setBody] = useState(entry.body);
  useEffect(() => {
    setTitle(entry.title);
    setSummary(entry.summary ?? '');
    setBody(entry.body);
  }, [entry.id, entry.title, entry.summary, entry.body]);
  return (
    <div className="nri-lore__place-edit">
      <label className="nri-modal__field">
        <span>Заголовок</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="nri-modal__field">
        <span>Краткая сводка (для чата)</span>
        <textarea
          className="mono-text"
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="1–3 предложения — увидят игроки при клике на ссылку в чате"
        />
      </label>
      <label className="nri-modal__field">
        <span>Полный лор</span>
        <textarea className="nri-notes__editor mono-text" rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="nri-presets__actions">
        <button type="button" className="nri-modal__submit" disabled={busy} onClick={() => onSave(title, summary, body)}>
          <Save size={14} /> Сохранить
        </button>
        <button type="button" className="nri-lobby__close" onClick={onDelete}>
          <Trash2 size={14} /> Удалить
        </button>
      </div>
    </div>
  );
};

const FactionEditor: React.FC<{
  faction: NriFaction;
  roster: NriRosterPlayer[];
  npcs: NriNpc[];
  allFactions: NriFaction[];
  mapZones: NriMapZone[];
  busy: boolean;
  onSave: (patch: Partial<NriFaction>) => void;
  onDelete: () => void;
}> = ({ faction, roster, npcs, allFactions, mapZones, busy, onSave, onDelete }) => {
  const [kind, setKind] = useState(faction.kind || 'unknown');
  const [name, setName] = useState(faction.name);
  const [summary, setSummary] = useState(faction.summary ?? '');
  const [description, setDescription] = useState(faction.description);
  const [iconId, setIconId] = useState(faction.iconId ?? defaultEntityIconId(faction.kind));
  const [zoneKeys, setZoneKeys] = useState(faction.zoneKeys ?? []);
  const [memberPlayerIds, setMemberPlayerIds] = useState(faction.memberPlayerIds);
  const [memberNpcIds, setMemberNpcIds] = useState(faction.memberNpcIds);

  useEffect(() => {
    setKind(faction.kind || 'unknown');
    setName(faction.name);
    setSummary(faction.summary ?? '');
    setDescription(faction.description);
    setIconId(faction.iconId ?? defaultEntityIconId(faction.kind));
    setZoneKeys(faction.zoneKeys ?? []);
    setMemberPlayerIds(faction.memberPlayerIds);
    setMemberNpcIds(faction.memberNpcIds);
  }, [
    faction.id,
    faction.kind,
    faction.name,
    faction.summary,
    faction.description,
    faction.zoneKeys,
    faction.memberPlayerIds,
    faction.memberNpcIds,
    faction.iconId,
  ]);

  const displayPreview = formatFactionTitle(kind, name);
  const iconPreview = resolveEntityIconHref(iconId, kind);

  const toggleZone = (zoneKey: string) => {
    setZoneKeys((list) =>
      list.includes(zoneKey) ? list.filter((z) => z !== zoneKey) : [...list, zoneKey]
    );
  };

  const toggleMember = (memberKind: 'player' | 'npc', id: string) => {
    if (memberKind === 'player') {
      setMemberPlayerIds((list) =>
        list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
      );
    } else {
      setMemberNpcIds((list) =>
        list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
      );
    }
  };

  const otherTags = (id: string, kind: 'player' | 'npc') =>
    factionTagsFor(id, kind, allFactions).filter((f) => f.id !== faction.id);

  return (
    <div>
      <p className="mono-text nri-lore__faction-preview">
        {iconPreview && <img src={iconPreview} alt="" className="nri-lore__faction-icon" />}
        {displayPreview}
      </p>
      <label className="nri-modal__field">
        <span>Тип</span>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {NRI_FACTION_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <label className="nri-modal__field">
        <span>Название</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="nri-modal__field">
        <span>Краткая сводка (для чата)</span>
        <textarea
          value={summary}
          rows={3}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="1–3 предложения для поп-апа в чате"
        />
      </label>
      <label className="nri-modal__field">
        <span>Полный лор</span>
        <textarea value={description} rows={8} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <NriEntityIconPicker
        iconId={iconId}
        onChange={setIconId}
        disabled={busy}
        label="Иконка фракции"
      />
      <div className="nri-scenario__link-block">
        <span className="mono-text">Районы на карте</span>
        <p className="mono-text opacity-60 nri-lore__hint">
          Выбранные районы появятся карточками во вкладке «Места».
        </p>
        <ul className="nri-scenario__link-list nri-lore__zone-list">
          {mapZones.map((z) => (
            <li key={z.zoneKey}>
              <label className="mono-text">
                <input
                  type="checkbox"
                  checked={zoneKeys.includes(z.zoneKey)}
                  onChange={() => toggleZone(z.zoneKey)}
                />
                {z.name}
                {z.megaDistrict && <span className="opacity-60"> · {z.megaDistrict}</span>}
              </label>
            </li>
          ))}
          {mapZones.length === 0 && (
            <li className="mono-text opacity-50">Карта ещё не загружена.</li>
          )}
        </ul>
      </div>
      <div className="nri-scenario__link-block">
        <span className="mono-text">Игроки</span>
        <ul className="nri-scenario__link-list">
          {roster.map((p) => (
            <li key={p.userId}>
              <label className="mono-text">
                <input
                  type="checkbox"
                  checked={memberPlayerIds.includes(p.userId)}
                  onChange={() => toggleMember('player', p.userId)}
                />
                {p.displayName}
                {memberPlayerIds.includes(p.userId) && (
                  <span className="nri-faction-tag">{displayPreview}</span>
                )}
                {otherTags(p.userId, 'player').map((f) => (
                  <span key={f.id} className="nri-faction-tag nri-faction-tag--other" title="Другая фракция">
                    {f.displayName ?? formatFactionTitle(f.kind, f.name)}
                  </span>
                ))}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="nri-scenario__link-block">
        <span className="mono-text">НПС</span>
        <ul className="nri-scenario__link-list">
          {npcs.map((n) => (
            <li key={n.id}>
              <label className="mono-text">
                <input
                  type="checkbox"
                  checked={memberNpcIds.includes(n.id)}
                  onChange={() => toggleMember('npc', n.id)}
                />
                {n.name}
                {memberNpcIds.includes(n.id) && (
                  <span className="nri-faction-tag">{displayPreview}</span>
                )}
                {otherTags(n.id, 'npc').map((f) => (
                  <span key={f.id} className="nri-faction-tag nri-faction-tag--other">
                    {f.displayName ?? formatFactionTitle(f.kind, f.name)}
                  </span>
                ))}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="nri-presets__actions">
        <button
          type="button"
          className="nri-modal__submit"
          disabled={busy}
          onClick={() =>
            onSave({
              kind,
              name: name.trim() || 'Без названия',
              summary,
              description,
              iconId,
              zoneKeys,
              memberPlayerIds,
              memberNpcIds,
            })
          }
        >
          <Save size={14} /> Сохранить
        </button>
        <button type="button" className="nri-lobby__close" onClick={onDelete}>
          <Trash2 size={14} /> Удалить
        </button>
      </div>
    </div>
  );
};

const PlaceEditor: React.FC<{
  place: NriLorePlace;
  mapZone?: NriMapZone;
  busy: boolean;
  onSave: (title: string, summary: string, body: string, entityTag: string | null, iconId: string | null) => void;
}> = ({ place, mapZone, busy, onSave }) => {
  const [title, setTitle] = useState(place.title);
  const [summary, setSummary] = useState(place.summary ?? '');
  const [body, setBody] = useState(place.body);
  const [entityTag, setEntityTag] = useState(place.entityTag ?? '');
  const [iconId, setIconId] = useState(
    place.iconId ?? (mapZone ? defaultZoneIconId(mapZone.zoneType, mapZone.zoneKey) : 'mid')
  );
  useEffect(() => {
    setTitle(place.title);
    setSummary(place.summary ?? '');
    setBody(place.body);
    setEntityTag(place.entityTag ?? '');
    setIconId(
      place.iconId ?? (mapZone ? defaultZoneIconId(mapZone.zoneType, mapZone.zoneKey) : 'mid')
    );
  }, [place.id, place.title, place.summary, place.body, place.entityTag, place.iconId, mapZone?.zoneKey]);
  return (
    <div className="nri-lore__place-edit">
      {place.zoneKey && (
        <p className="mono-text opacity-70 nri-lore__hint">
          Район карты: <strong>{mapZone?.name ?? place.zoneKey}</strong>
          {mapZone?.megaDistrict ? ` · ${mapZone.megaDistrict}` : ''}
          {mapZone?.corpName ? ` · ${mapZone.corpName}` : ''}
          {place.sourceFactionId ? ' · привязан к фракции' : ''}
          {place.sourceScenarioNodeId ? ' · из сценария' : ''}
          <br />
          Название и иконка синхронизируются с картой.
        </p>
      )}
      <label className="nri-modal__field">
        <span>Метка</span>
        <select value={entityTag} onChange={(e) => setEntityTag(e.target.value)} disabled={busy}>
          <option value="">— не задана —</option>
          {NRI_FACTION_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <label className="nri-modal__field">
        <span>Название</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} />
      </label>
      <label className="nri-modal__field">
        <span>Краткая сводка (для чата)</span>
        <textarea
          value={summary}
          rows={3}
          onChange={(e) => setSummary(e.target.value)}
          disabled={busy}
          placeholder="1–3 предложения — увидят игроки при клике на ссылку"
        />
      </label>
      <label className="nri-modal__field">
        <span>Полный лор</span>
        <textarea
          value={body}
          rows={8}
          onChange={(e) => setBody(e.target.value)}
          disabled={busy}
        />
      </label>
      <NriEntityIconPicker
        iconId={iconId}
        onChange={setIconId}
        disabled={busy}
        label={place.zoneKey ? 'Иконка района на карте' : 'Иконка места'}
      />
      <button
        type="button"
        className="nri-modal__submit"
        disabled={busy}
        onClick={() => onSave(title, summary, body, entityTag || null, iconId || null)}
      >
        <Save size={14} /> Сохранить карточку
      </button>
    </div>
  );
};

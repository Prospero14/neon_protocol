import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import {
  nriCreateFaction,
  nriCreateLoreEntry,
  nriDeleteFaction,
  nriDeleteLoreEntry,
  nriFetchLore,
  nriFetchNpcs,
  nriFetchRoster,
  nriPatchFaction,
  nriPatchLoreEntry,
  nriPatchLorePlace,
  type NriFaction,
  type NriLoreEntry,
  type NriLorePlace,
  type NriNpc,
  type NriRosterPlayer,
} from '../logic/nriApi';

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
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const [lore, npcList, players] = await Promise.all([
      nriFetchLore(authToken, inviteCode),
      nriFetchNpcs(authToken, inviteCode),
      nriFetchRoster(authToken, inviteCode),
    ]);
    if (!lore) {
      setErr('Не удалось загрузить лор.');
      return;
    }
    setErr(null);
    setEntries(lore.entries ?? []);
    setFactions(lore.factions);
    setPlaces(lore.places);
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

  const savePlace = async (title: string, body: string) => {
    if (!authToken || !selectedPlace) return;
    setBusy(true);
    const ok = await nriPatchLorePlace(authToken, inviteCode, selectedPlace.id, { title, body });
    setBusy(false);
    if (!ok) setErr('Не удалось сохранить место.');
    else await refresh();
  };

  const factionDraft = useMemo(
    () => selectedFaction,
    [selectedFaction?.id, selectedFaction?.updatedAt]
  );

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
                onSave={async (title, body) => {
                  if (!authToken) return;
                  setBusy(true);
                  const ok = await nriPatchLoreEntry(authToken, inviteCode, selectedEntry.id, { title, body });
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
                    {f.name}
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
            Карточки мест из сценария (метка «в лор») и их описания для стола.
          </p>
          <ul className="nri-lore__list">
            {places.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`nri-scenario__tree-item ${selectedPlaceId === p.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlaceId(p.id)}
                >
                  {p.title}
                  {p.zoneKey && <span className="opacity-60"> · {p.zoneKey}</span>}
                </button>
              </li>
            ))}
            {places.length === 0 && (
              <li className="mono-text opacity-50">Пока нет — отметьте место в узле сценария «→ в лор».</li>
            )}
          </ul>
          {selectedPlace && (
            <PlaceEditor
              key={selectedPlace.id}
              place={selectedPlace}
              onSave={(title, body) => savePlace(title, body)}
            />
          )}
        </div>
      )}

      {err && <p className="nri-lobby__err mono-text">{err}</p>}
    </div>
  );
};

const EntryEditor: React.FC<{
  entry: NriLoreEntry;
  busy: boolean;
  onSave: (title: string, body: string) => void;
  onDelete: () => void;
}> = ({ entry, busy, onSave, onDelete }) => {
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  useEffect(() => {
    setTitle(entry.title);
    setBody(entry.body);
  }, [entry.id, entry.title, entry.body]);
  return (
    <div className="nri-lore__place-edit">
      <label className="nri-modal__field">
        <span>Заголовок</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="nri-modal__field">
        <span>Текст</span>
        <textarea className="nri-notes__editor mono-text" rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="nri-presets__actions">
        <button type="button" className="nri-modal__submit" disabled={busy} onClick={() => onSave(title, body)}>
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
  busy: boolean;
  onSave: (patch: Partial<NriFaction>) => void;
  onDelete: () => void;
}> = ({ faction, roster, npcs, allFactions, busy, onSave, onDelete }) => {
  const [name, setName] = useState(faction.name);
  const [description, setDescription] = useState(faction.description);
  const [memberPlayerIds, setMemberPlayerIds] = useState(faction.memberPlayerIds);
  const [memberNpcIds, setMemberNpcIds] = useState(faction.memberNpcIds);

  useEffect(() => {
    setName(faction.name);
    setDescription(faction.description);
    setMemberPlayerIds(faction.memberPlayerIds);
    setMemberNpcIds(faction.memberNpcIds);
  }, [faction.id, faction.name, faction.description, faction.memberPlayerIds, faction.memberNpcIds]);

  const toggleMember = (kind: 'player' | 'npc', id: string) => {
    if (kind === 'player') {
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
      <label className="nri-modal__field">
        <span>Название</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="nri-modal__field">
        <span>Описание</span>
        <textarea value={description} rows={4} onChange={(e) => setDescription(e.target.value)} />
      </label>
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
                  <span className="nri-faction-tag">{name.trim() || faction.name}</span>
                )}
                {otherTags(p.userId, 'player').map((f) => (
                  <span key={f.id} className="nri-faction-tag nri-faction-tag--other" title="Другая фракция">
                    {f.name}
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
                  <span className="nri-faction-tag">{name.trim() || faction.name}</span>
                )}
                {otherTags(n.id, 'npc').map((f) => (
                  <span key={f.id} className="nri-faction-tag nri-faction-tag--other">
                    {f.name}
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
              name: name.trim() || 'Без названия',
              description,
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
  onSave: (title: string, body: string) => void;
}> = ({ place, onSave }) => {
  const [title, setTitle] = useState(place.title);
  const [body, setBody] = useState(place.body);
  useEffect(() => {
    setTitle(place.title);
    setBody(place.body);
  }, [place.id, place.title, place.body]);
  return (
    <div className="nri-lore__place-edit">
      <label className="nri-modal__field">
        <span>Название</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="nri-modal__field">
        <span>Описание места</span>
        <textarea value={body} rows={6} onChange={(e) => setBody(e.target.value)} />
      </label>
      <button type="button" className="nri-modal__submit" onClick={() => onSave(title, body)}>
        <Save size={14} /> Сохранить карточку
      </button>
    </div>
  );
};

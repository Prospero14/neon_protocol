import React, { useCallback, useEffect, useState } from 'react';
import { Dices, Plus, Trash2, User } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { nriCreateNpc, nriDeleteNpc, nriFetchNpcs, type NriNpc } from '../logic/nriApi';
import { NRI_CLASSES, type NriClassId } from '../logic/nriClasses';
import { buildSheetForClass, rollNpcName, type NriSheetData } from '../logic/nriNpcGenerator';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';

type Props = {
  inviteCode: string;
  selectedNpcId: string | null;
  onSelectNpc: (npc: { id: string; name: string; imageUrl: string | null } | null) => void;
  onOpenChat?: () => void;
};

export const NriNpcsPanel: React.FC<Props> = ({ inviteCode, selectedNpcId, onSelectNpc, onOpenChat }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const [name, setName] = useState('');
  const [classId, setClassId] = useState<NriClassId>('merc');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [sheet, setSheet] = useState<NriSheetData | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const list = await nriFetchNpcs(authToken, inviteCode);
    if (list === null) {
      setErr('Не удалось загрузить НПС. Перезапустите сервер (npm run build && npm start).');
      return;
    }
    setErr(null);
    setNpcs(list);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const rollSheet = () => {
    setSheet(buildSheetForClass(classId));
    setErr(null);
  };

  const rollName = () => setName(rollNpcName());

  const create = async (opts?: { autoName?: boolean; autoRoll?: boolean }) => {
    if (!authToken) return;
    const npcName = opts?.autoName ? rollNpcName() : name.trim();
    if (!npcName) {
      setErr('Укажите имя НПС или нажмите «Сгенерировать и сохранить».');
      return;
    }
    const npcSheet = opts?.autoRoll || !sheet ? buildSheetForClass(classId) : sheet;
    setBusy(true);
    setErr(null);
    const created = await nriCreateNpc(authToken, inviteCode, {
      name: npcName,
      classId,
      imageUrl: imageUrl.trim() || undefined,
      sheet: npcSheet,
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    if (!created.ok) {
      setErr(created.error);
      return;
    }
    if (opts?.autoName) setName(npcName);
    else setName('');
    setImageUrl('');
    setNotes('');
    setSheet(null);
    await refresh();
  };

  const generateAndSave = () => create({ autoName: true, autoRoll: true });

  const remove = async (id: string) => {
    if (!authToken || !window.confirm('Удалить НПС?')) return;
    if (await nriDeleteNpc(authToken, inviteCode, id)) {
      if (selectedNpcId === id) onSelectNpc(null);
      await refresh();
    }
  };

  return (
    <div className="nri-npcs">
      <header className="nri-chars__head">
        <h3 className="mono-text">НПС стола</h3>
        <p className="mono-text opacity-70">
          «Сгенерировать и сохранить» — имя, статы 2d6+5 и запись в список. Или вручную: имя → статы → «Сохранить».
        </p>
      </header>

      <div className="nri-presets__form">
        <label className="nri-modal__field">
          <span>Имя НПС</span>
          <div className="nri-presets__name-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jackie Chow…" />
            <button type="button" className="nri-lobby__copy" onClick={rollName} title="Случайное имя">
              <Dices size={14} />
            </button>
          </div>
        </label>
        <label className="nri-modal__field">
          <span>Изображение (URL)</span>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
        </label>
        <label className="nri-modal__field">
          <span>Заметки</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Red Pole, 16K Triad…" />
        </label>
        <div className="nri-class-grid nri-class-grid--compact">
          {NRI_CLASSES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`nri-class-card ${classId === c.id ? 'active' : ''}`}
              onClick={() => setClassId(c.id)}
            >
              <strong>{c.name}</strong>
            </button>
          ))}
        </div>
        <div className="nri-presets__actions">
          <button type="button" className="nri-modal__submit" disabled={busy} onClick={generateAndSave}>
            <Dices size={14} /> Сгенерировать и сохранить
          </button>
          <button type="button" className="nri-lobby__copy" onClick={rollSheet} disabled={busy}>
            <Dices size={14} /> Только статы (2d6+5)
          </button>
          <button type="button" className="nri-lobby__copy" disabled={busy || !name.trim()} onClick={() => create()}>
            <Plus size={14} /> Сохранить НПС
          </button>
        </div>
        {sheet && (
          <p className="mono-text opacity-70">
            STR {sheet.abilities.STR} · DEX {sheet.abilities.DEX} · CON {sheet.abilities.CON} · INT {sheet.abilities.INT} · TEC{' '}
            {sheet.abilities.TEC} · PEO {sheet.abilities.PEO} · HP {sheet.hpMax} · AC {sheet.ac}
          </p>
        )}
      </div>
      {err && <p className="nri-lobby__err mono-text">{err}</p>}

      <ul className="nri-npcs__list">
        {npcs.map((n) => {
          const open = expandedId === n.id;
          const selected = selectedNpcId === n.id;
          return (
            <li key={n.id} className={`nri-npcs__item ${selected ? 'selected' : ''}`}>
              <button
                type="button"
                className="nri-npcs__pick"
                onClick={() => {
                  if (selected) {
                    onSelectNpc(null);
                    return;
                  }
                  onSelectNpc({ id: n.id, name: n.name, imageUrl: n.imageUrl });
                  onOpenChat?.();
                }}
                title="Выбрать и писать в чат"
              >
                {n.imageUrl ? (
                  <img src={n.imageUrl} alt="" className="nri-npcs__avatar" />
                ) : (
                  <span className="nri-npcs__avatar nri-npcs__avatar--ph">
                    <User size={18} />
                  </span>
                )}
                <span>
                  <strong>{n.name}</strong>
                  <span className="mono-text opacity-70">
                    {NRI_CLASSES.find((c) => c.id === n.classId)?.name ?? n.classId ?? '—'}
                    {selected ? ' · в чате' : ''}
                  </span>
                </span>
              </button>
              <button type="button" className="nri-lobby__copy" onClick={() => setExpandedId(open ? null : n.id)}>
                Лист
              </button>
              <button type="button" className="nri-lobby__close" onClick={() => remove(n.id)}>
                <Trash2 size={14} />
              </button>
              {open && (
                <div className="nri-npcs__sheet">
                  {n.notes && <p className="mono-text opacity-70">{n.notes}</p>}
                  <NriCharacterSheetContent
                    profile={{
                      displayName: n.name,
                      classId: n.classId ?? 'merc',
                      inventory: n.inventory,
                      sheet: n.sheet,
                      portraitUrl: n.imageUrl,
                    }}
                    compact
                  />
                </div>
              )}
            </li>
          );
        })}
        {npcs.length === 0 && <p className="mono-text opacity-50">Нет сохранённых НПС.</p>}
      </ul>
      {selectedNpcId && (
        <p className="mono-text nri-npcs__hint opacity-70">
          Активен в чате: <strong>{npcs.find((n) => n.id === selectedNpcId)?.name}</strong>
          {onOpenChat && (
            <>
              {' '}
              ·{' '}
              <button type="button" className="nri-npcs__chat-link" onClick={onOpenChat}>
                открыть чат
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
};

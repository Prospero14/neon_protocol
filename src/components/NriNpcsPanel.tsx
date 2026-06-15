import React, { useCallback, useEffect, useState } from 'react';
import { Dices, Save, Trash2, User } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { nriCreateNpc, nriDeleteNpc, nriFetchLore, nriFetchNpcs, type NriNpc } from '../logic/nriApi';
import type { NriFaction } from '../logic/nriLore';
import { NRI_CLASSES, type NriClassId } from '../logic/nriClasses';
import {
  applyMetaToSheet,
  buildFullCharacter,
  NRI_ACTIVITIES,
  NRI_NPC_ARCHETYPES,
  NRI_ORIGINS,
  type CharacterMetaDraft,
  type NriActivityId,
  type NriNpcArchetypeId,
  type NriOriginId,
} from '../logic/nriCharacterGen';
import { rollNpcName, parseNriSheet, type NriSheetData } from '../logic/nriNpcGenerator';
import { NriCharacterMetaForm } from './NriCharacterMetaForm';
import { NriCharacterSheet } from './NriCharacterSheet';
import { NriSkillPickField } from './NriSkillPickField';
import { defaultSkillsForClass, validateSkillPick } from '../logic/nriSkillPick';

type Props = {
  inviteCode: string;
  mode?: 'full' | 'list' | 'gen';
  selectedNpcId: string | null;
  onSelectNpc: (npc: { id: string; name: string; imageUrl?: string | null; archetype?: string } | null) => void;
  onOpenChat?: () => void;
};

function mergeNpcNotes(factionName: string, userNotes: string): string | undefined {
  const body = userNotes
    .split('\n')
    .filter((line) => !line.trim().startsWith('Фракция:'))
    .join('\n')
    .trim();
  if (factionName.trim()) {
    const head = `Фракция: ${factionName.trim()}`;
    return body ? `${head}\n${body}` : head;
  }
  return body || undefined;
}

export const NriNpcsPanel: React.FC<Props> = ({
  inviteCode,
  mode = 'full',
  selectedNpcId,
  onSelectNpc,
  onOpenChat,
}) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [npcs, setNpcs] = useState<NriNpc[]>([]);
  const [archetypeId, setArchetypeId] = useState<NriNpcArchetypeId>('civilian');
  const [originId, setOriginId] = useState<NriOriginId>('neo_tokyo');
  const [activityId, setActivityId] = useState<NriActivityId>('street');
  const [classId, setClassId] = useState<NriClassId>('merc');
  const [pickedSkills, setPickedSkills] = useState<string[]>(() => defaultSkillsForClass('merc'));
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [factionName, setFactionName] = useState('');
  const [factions, setFactions] = useState<NriFaction[]>([]);
  const [notes, setNotes] = useState('');
  const [sheet, setSheet] = useState<NriSheetData | null>(null);
  const [meta, setMeta] = useState<CharacterMetaDraft>({ originId: 'neo_tokyo', activityId: 'street', level: 1 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sheetPreviewId, setSheetPreviewId] = useState<string | null>(null);

  const refreshFactions = useCallback(async () => {
    if (!authToken) return;
    const lore = await nriFetchLore(authToken, inviteCode);
    if (lore) setFactions(lore.factions);
  }, [authToken, inviteCode]);

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
    refreshFactions();
    const t = setInterval(() => {
      refresh();
      refreshFactions();
    }, 8000);
    return () => clearInterval(t);
  }, [refresh, refreshFactions]);

  const pickArchetype = (id: NriNpcArchetypeId) => {
    setArchetypeId(id);
    const arch = NRI_NPC_ARCHETYPES.find((a) => a.id === id);
    if (arch?.defaultClass) {
      setClassId(arch.defaultClass);
      setPickedSkills(defaultSkillsForClass(arch.defaultClass));
    }
  };

  const generatePreview = () => {
    const skillErr = validateSkillPick(classId, pickedSkills);
    if (skillErr) {
      setErr(skillErr);
      return;
    }
    const built = buildFullCharacter({
      classId,
      originId,
      activityId,
      archetypeId,
      characterName: name.trim() || undefined,
      skillProficiencies: pickedSkills,
    });
    setSheet(built.sheet);
    setMeta({ ...built.meta, npcArchetypeId: archetypeId });
    if (!name.trim()) setName(built.meta.characterName);
    setErr(null);
  };

  const saveNpc = async () => {
    if (!authToken) return;
    if (!sheet) {
      setErr('Сначала нажмите «Сгенерировать» и проверьте чарник.');
      return;
    }
    const npcName = (meta.characterName ?? name).trim();
    if (!npcName) {
      setErr('Укажите имя или сгенерируйте персонажа.');
      return;
    }
    const base = sheet;
    const finalSheet = applyMetaToSheet(base, { ...meta, characterName: npcName, npcArchetypeId: archetypeId });
    setBusy(true);
    setErr(null);
    const created = await nriCreateNpc(authToken, inviteCode, {
      name: npcName,
      classId,
      imageUrl: imageUrl.trim() || undefined,
      sheet: finalSheet,
      notes: mergeNpcNotes(factionName, notes.trim() || finalSheet.backstory || ''),
    });
    setBusy(false);
    if (!created.ok) {
      setErr(created.error);
      return;
    }
    setName('');
    setImageUrl('');
    setFactionName('');
    setNotes('');
    setSheet(null);
    await refresh();
  };

  const remove = async (id: string) => {
    if (!authToken || !window.confirm('Удалить НПС?')) return;
    if (await nriDeleteNpc(authToken, inviteCode, id)) {
      if (selectedNpcId === id) onSelectNpc(null);
      await refresh();
    }
  };

  return (
    <div className="nri-npcs">
      {(mode === 'full' || mode === 'list') && (
      <header className="nri-chars__head">
        <h3 className="mono-text">НПС стола</h3>
        <p className="mono-text opacity-70">
          Список неигровых персонажей. Выберите — пишите в чат от их имени.
        </p>
      </header>
      )}

      {(mode === 'full' || mode === 'gen') && (
      <div className="nri-presets__form">
        {mode === 'gen' && (
          <header className="nri-chars__head nri-chars__head--compact">
            <p className="mono-text opacity-70">
              Параметры → <strong>Сгенерировать</strong> → проверьте лист → <strong>Сохранить НПС</strong>.
            </p>
          </header>
        )}
        {mode === 'full' && <h4 className="mono-text">1. Тип НПС</h4>}
        {mode === 'gen' && <h4 className="mono-text">Тип НПС</h4>}
        <div className="nri-class-grid nri-class-grid--compact">
          {NRI_NPC_ARCHETYPES.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`nri-class-card ${archetypeId === a.id ? 'active' : ''}`}
              onClick={() => pickArchetype(a.id)}
              title={a.blurb}
            >
              <strong>{a.label}</strong>
            </button>
          ))}
        </div>

        <h4 className="mono-text">2. Происхождение и деятельность</h4>
        <div className="nri-meta-form__row">
          <label className="nri-modal__field">
            <span>Происхождение</span>
            <select value={originId} onChange={(e) => setOriginId(e.target.value as NriOriginId)}>
              {NRI_ORIGINS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="nri-modal__field">
            <span>Деятельность</span>
            <select value={activityId} onChange={(e) => setActivityId(e.target.value as NriActivityId)}>
              {NRI_ACTIVITIES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h4 className="mono-text">3. Класс (C2185)</h4>
        <div className="nri-class-grid nri-class-grid--compact">
          {NRI_CLASSES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`nri-class-card ${classId === c.id ? 'active' : ''}`}
              onClick={() => {
                setClassId(c.id);
                setPickedSkills(defaultSkillsForClass(c.id));
              }}
            >
              <strong>{c.name}</strong>
            </button>
          ))}
        </div>

        <NriSkillPickField classId={classId} picked={pickedSkills} onChange={setPickedSkills} />

        <label className="nri-modal__field">
          <span>Имя (опционально до генерации)</span>
          <div className="nri-presets__name-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Случайное при генерации…" />
            <button type="button" className="nri-lobby__copy" onClick={() => setName(rollNpcName())} title="Случайное имя">
              <Dices size={14} />
            </button>
          </div>
        </label>
        <label className="nri-modal__field">
          <span>Изображение (URL)</span>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
        </label>

        <label className="nri-modal__field">
          <span>Фракция</span>
          <input
            value={factionName}
            onChange={(e) => setFactionName(e.target.value)}
            placeholder="Выберите или введите…"
            list={`nri-npc-factions-${inviteCode}`}
          />
          <datalist id={`nri-npc-factions-${inviteCode}`}>
            {factions.map((f) => (
              <option key={f.id} value={f.name} />
            ))}
          </datalist>
        </label>

        <div className="nri-presets__actions">
          <button type="button" className="nri-lobby__copy" disabled={busy} onClick={generatePreview}>
            <Dices size={14} /> Сгенерировать
          </button>
          <button
            type="button"
            className="nri-modal__submit"
            disabled={busy || !sheet}
            onClick={saveNpc}
            title={!sheet ? 'Сначала сгенерируйте чарник' : 'Сохранить в список НПС'}
          >
            <Save size={14} /> Сохранить НПС
          </button>
        </div>

        {sheet && (
          <div className="nri-presets__wizard">
            <h4 className="mono-text">Проверьте чарник перед сохранением</h4>
            <NriCharacterMetaForm
              meta={{ ...meta, originId, activityId, npcArchetypeId: archetypeId }}
              sheet={sheet}
              onChange={(m) => {
                setMeta(m);
                setSheet(applyMetaToSheet(sheet, m));
              }}
            />
            <label className="nri-modal__field">
              <span>Заметки мастера</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Крючок, контакты…" />
            </label>
            <button
              type="button"
              className="nri-lobby__copy"
              onClick={() => setSheetPreviewId((id) => (id === 'draft' ? null : 'draft'))}
            >
              {sheetPreviewId === 'draft' ? 'Скрыть лист' : 'Открыть лист'}
            </button>
          </div>
        )}
      </div>
      )}
      {err && <p className="nri-lobby__err mono-text">{err}</p>}

      {(mode === 'full' || mode === 'list') && (
      <ul className="nri-npcs__list">
        {npcs.map((n) => {
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
                  onSelectNpc({
                    id: n.id,
                    name: n.name,
                    imageUrl: n.imageUrl,
                    archetype: parseNriSheet(n.sheet)?.npcArchetype,
                  });
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
              <button
                type="button"
                className={`nri-lobby__copy ${sheetPreviewId === n.id ? 'active' : ''}`}
                onClick={() => setSheetPreviewId((id) => (id === n.id ? null : n.id))}
              >
                Лист
              </button>
              <button type="button" className="nri-lobby__close" onClick={() => remove(n.id)}>
                <Trash2 size={14} />
              </button>
              {n.notes && <p className="mono-text opacity-70 nri-npcs__notes">{n.notes}</p>}
            </li>
          );
        })}
        {npcs.length === 0 && <p className="mono-text opacity-50">НПС пока нет — сгенерируйте во вкладке «Генерация».</p>}
      </ul>
      )}

      {sheetPreviewId === 'draft' && sheet && (
        <NriCharacterSheet
          title={meta.characterName ?? name}
          profile={{
            displayName: meta.characterName ?? name,
            classId,
            inventory: [],
            sheet: applyMetaToSheet(sheet, meta),
            portraitUrl: imageUrl || null,
          }}
          onClose={() => setSheetPreviewId(null)}
        />
      )}

      {sheetPreviewId && sheetPreviewId !== 'draft' && (() => {
        const n = npcs.find((x) => x.id === sheetPreviewId);
        if (!n) return null;
        return (
          <NriCharacterSheet
            title={n.name}
            profile={{
              displayName: n.name,
              classId: n.classId ?? 'merc',
              inventory: n.inventory,
              sheet: n.sheet,
              portraitUrl: n.imageUrl,
            }}
            onClose={() => setSheetPreviewId(null)}
          />
        );
      })()}
    </div>
  );
};

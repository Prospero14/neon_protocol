import React, { useCallback, useEffect, useState } from 'react';
import { Dices, Save, Trash2, User } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import {
  nriCreateCombatant,
  nriCreateNpc,
  nriDeleteNpc,
  nriFetchLore,
  nriFetchNpcs,
  type NriNpc,
} from '../logic/nriApi';
import type { NriFaction } from '../logic/nriLore';
import { NRI_CLASSES, type NriClassId } from '../logic/nriClasses';
import {
  applyMetaToSheet,
  buildFullCharacter,
  finalizeCharacterSheet,
  NRI_ACTIVITIES,
  NRI_NPC_ARCHETYPES,
  NRI_ORIGINS,
  type CharacterMetaDraft,
  type NriActivityId,
  type NriNpcArchetypeId,
  type NriOriginId,
} from '../logic/nriCharacterGen';
import { rollNpcName, parseNriSheet, type NriSheetData } from '../logic/nriNpcGenerator';
import type { NriInventoryItem } from '../logic/nriInventory';
import { rollNpcTattoos, type FactionRef } from '../../shared/nri-domain/tattoos';
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
  const [factionId, setFactionId] = useState('');
  const [disposition, setDisposition] = useState('0');
  const [factions, setFactions] = useState<NriFaction[]>([]);
  const [notes, setNotes] = useState('');
  const [sheet, setSheet] = useState<NriSheetData | null>(null);
  const [draftInventory, setDraftInventory] = useState<NriInventoryItem[]>([]);
  const [meta, setMeta] = useState<CharacterMetaDraft>({ originId: 'neo_tokyo', activityId: 'street', level: 1 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [sheetPreviewId, setSheetPreviewId] = useState<string | null>(null);

  const refreshFactions = useCallback(async () => {
    if (!authToken) return;
    const loreRes = await nriFetchLore(authToken, inviteCode);
    if (loreRes.ok) setFactions(loreRes.data.factions);
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

  const factionRefs: FactionRef[] = factions.map((f) => ({
    id: f.id,
    kind: f.kind,
    name: f.name,
    displayName: f.displayName,
  }));

  const selectedFaction = factions.find((f) => f.id === factionId) ?? null;
  const factionLabel = selectedFaction?.displayName || selectedFaction?.name || '';

  const generatePreview = () => {
    const skillErr = validateSkillPick(classId, pickedSkills);
    if (skillErr) {
      setErr(skillErr);
      return;
    }
    const useOrigin = meta.originId ?? originId;
    const useActivity = meta.activityId ?? activityId;
    const built = buildFullCharacter({
      classId,
      originId: useOrigin,
      activityId: useActivity,
      archetypeId,
      characterName: name.trim() || meta.characterName?.trim() || undefined,
      nickname: meta.nickname,
      level: meta.level,
      career: meta.career,
      age: meta.age,
      yearsServed: meta.yearsServed,
      streetInfluence: meta.streetInfluence,
      corporateInfluence: meta.corporateInfluence,
      skillProficiencies: pickedSkills,
    });
    const pickedFactionId = factionId || undefined;
    const tattoos = rollNpcTattoos(
      {
        originId: useOrigin,
        activityId: useActivity,
        archetypeId,
        factionId: pickedFactionId,
        augmentations: built.sheet.augmentations,
      },
      factionRefs
    );
    setOriginId(useOrigin);
    setActivityId(useActivity);
    setSheet({
      ...built.sheet,
      tattoos,
      factionId: pickedFactionId,
      disposition: Number.isFinite(Number(disposition)) ? Number(disposition) : 0,
    });
    setDraftInventory(Array.isArray(built.inventory) ? built.inventory : []);
    setMeta({ ...built.meta, npcArchetypeId: archetypeId, factionId: pickedFactionId ?? null });
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
    const pickedFactionId = factionId || base.factionId;
    const finalSheet = applyMetaToSheet(base, {
      ...meta,
      characterName: npcName,
      npcArchetypeId: archetypeId,
      factionId: pickedFactionId ?? null,
    });
    finalSheet.factionId = pickedFactionId;
    finalSheet.disposition = Number.isFinite(Number(disposition)) ? Number(disposition) : finalSheet.disposition ?? 0;
    if (!finalSheet.tattoos?.length) {
      finalSheet.tattoos = rollNpcTattoos(
        {
          originId,
          activityId,
          archetypeId,
          factionId,
          augmentations: finalSheet.augmentations,
        },
        factionRefs
      );
    }
    setBusy(true);
    setErr(null);
    setOkMsg(null);
    const created = await nriCreateNpc(authToken, inviteCode, {
      name: npcName,
      classId,
      imageUrl: imageUrl.trim() || undefined,
      inventory: draftInventory,
      sheet: finalizeCharacterSheet(finalSheet),
      notes: mergeNpcNotes(factionLabel, notes.trim() || finalSheet.backstory || ''),
    });
    setBusy(false);
    if (!created.ok) {
      setErr(created.error);
      return;
    }
    setName('');
    setImageUrl('');
    setFactionId('');
    setNotes('');
    setSheet(null);
    setDraftInventory([]);
    setNpcs((prev) => [created.npc, ...prev.filter((x) => x.id !== created.npc.id)]);
    setOkMsg(`НПС «${created.npc.name}» сохранён — смотрите вкладку «НПС».`);
    await refresh();
  };

  const promoteNpcToCombatant = async (npcId: string) => {
    if (!authToken) return;
    const n = npcs.find((x) => x.id === npcId);
    if (!n) return;
    setBusy(true);
    setErr(null);
    setOkMsg(null);
    const res = await nriCreateCombatant(authToken, inviteCode, {
      name: n.name,
      classId: n.classId ?? undefined,
      archetypeId: 'gang',
      threatTier: 'street',
      imageUrl: n.imageUrl ?? undefined,
      inventory: Array.isArray(n.inventory) ? n.inventory : [],
      sheet: n.sheet ?? undefined,
      notes: n.notes ? `Из НПС. ${n.notes}` : 'Из НПС',
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setOkMsg(`«${n.name}» скопирован в боевики (схема боя).`);
    window.dispatchEvent(new CustomEvent('neon:combatants-changed'));
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
          Список неигровых персонажей. Выберите — пишите в чат от их имени. Новых — во вкладке{' '}
          <strong>Генерация → НПС</strong>.
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
            <select
              value={originId}
              onChange={(e) => {
                const next = e.target.value as NriOriginId;
                setOriginId(next);
                setMeta((m) => ({ ...m, originId: next }));
              }}
            >
              {NRI_ORIGINS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="nri-modal__field">
            <span>Деятельность</span>
            <select
              value={activityId}
              onChange={(e) => {
                const next = e.target.value as NriActivityId;
                setActivityId(next);
                setMeta((m) => ({ ...m, activityId: next }));
              }}
            >
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
            <button type="button" className="nri-lobby__copy" onClick={() => setName(rollNpcName(originId))} title="Случайное имя">
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
          <select value={factionId} onChange={(e) => setFactionId(e.target.value)}>
            <option value="">— без фракции —</option>
            {factions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.displayName || f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="nri-modal__field">
          <span>Базовое отношение к игрокам (−100…+100)</span>
          <input
            type="number"
            min={-100}
            max={100}
            value={disposition}
            onChange={(e) => setDisposition(e.target.value)}
          />
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
              classId={classId}
              meta={{ ...meta, originId, activityId, npcArchetypeId: archetypeId, factionId: factionId || null }}
              sheet={sheet}
              factions={factions}
              onChange={(m) => {
                setMeta(m);
                if (m.originId) setOriginId(m.originId);
                if (m.activityId) setActivityId(m.activityId);
                if (m.factionId !== undefined) setFactionId(m.factionId ?? '');
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
      {okMsg && <p className="mono-text nri-scenario__checkpoint-ok">{okMsg}</p>}

      {(mode === 'full' || mode === 'list') && (
      <>
        <div className="nri-combatants__list-head mono-text">Сохранённые НПС ({npcs.length})</div>
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
              <button
                type="button"
                className="nri-lobby__copy"
                disabled={busy}
                onClick={() => void promoteNpcToCombatant(n.id)}
                title="Скопировать в боевики для схемы боя"
              >
                → Боевик
              </button>
              <button type="button" className="nri-lobby__close" onClick={() => remove(n.id)}>
                <Trash2 size={14} />
              </button>
              {n.notes && <p className="mono-text opacity-70 nri-npcs__notes">{n.notes}</p>}
            </li>
          );
        })}
        {npcs.length === 0 && (
          <p className="mono-text opacity-50">
            НПС пока нет — соберите во вкладке «Генерация» → НПС.
          </p>
        )}
      </ul>
      </>
      )}

      {sheetPreviewId === 'draft' && sheet && (
        <NriCharacterSheet
          title={meta.characterName ?? name}
          profile={{
            displayName: meta.characterName ?? name,
            classId,
            inventory: draftInventory,
            sheet: applyMetaToSheet(sheet, meta),
            portraitUrl: imageUrl || null,
          }}
          gmView
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
            gmView
            onClose={() => setSheetPreviewId(null)}
          />
        );
      })()}
    </div>
  );
};

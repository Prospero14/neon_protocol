import React, { useCallback, useEffect, useState } from 'react';
import { Dices, Save, Skull, Trash2, User } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import {
  nriCreateCombatant,
  nriCreateNpc,
  nriDeleteCombatant,
  nriFetchCombatants,
  nriFetchLore,
  type NriCombatant,
} from '../logic/nriApi';
import type { NriFaction } from '../logic/nriLore';
import { NRI_CLASSES, type NriClassId } from '../logic/nriClasses';
import {
  applyMetaToSheet,
  buildFullCharacter,
  finalizeCharacterSheet,
  levelForThreatTier,
  NRI_ACTIVITIES,
  NRI_COMBAT_ARCHETYPES,
  NRI_ORIGINS,
  NRI_THREAT_TIERS,
  type CharacterMetaDraft,
  type NriActivityId,
  type NriNpcArchetypeId,
  type NriOriginId,
  type NriThreatTier,
} from '../logic/nriCharacterGen';
import { rollNpcName, parseNriSheet, type NriSheetData } from '../logic/nriNpcGenerator';
import type { NriInventoryItem } from '../logic/nriInventory';
import { NriCharacterMetaForm } from './NriCharacterMetaForm';
import { NriCharacterSheet } from './NriCharacterSheet';
import { NriSkillPickField } from './NriSkillPickField';
import { defaultSkillsForClass, validateSkillPick } from '../logic/nriSkillPick';

type Props = {
  inviteCode: string;
  /** gen — форма сборки; list — только сохранённые; full — оба (legacy). */
  mode?: 'full' | 'list' | 'gen';
};

function threatLabel(tier: string): string {
  return NRI_THREAT_TIERS.find((t) => t.id === tier)?.label ?? tier;
}

export const NriCombatantsPanel: React.FC<Props> = ({ inviteCode, mode = 'full' }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [combatants, setCombatants] = useState<NriCombatant[]>([]);
  const [archetypeId, setArchetypeId] = useState<NriNpcArchetypeId>('gang');
  const [threatTier, setThreatTier] = useState<NriThreatTier>('street');
  const [originId, setOriginId] = useState<NriOriginId>('neo_tokyo');
  const [activityId, setActivityId] = useState<NriActivityId>('military');
  const [classId, setClassId] = useState<NriClassId>('merc');
  const [pickedSkills, setPickedSkills] = useState<string[]>(() => defaultSkillsForClass('merc'));
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [factionId, setFactionId] = useState('');
  const [sheet, setSheet] = useState<NriSheetData | null>(null);
  const [draftInventory, setDraftInventory] = useState<NriInventoryItem[]>([]);
  const [meta, setMeta] = useState<CharacterMetaDraft>({
    originId: 'neo_tokyo',
    activityId: 'military',
    level: 1,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [sheetPreviewId, setSheetPreviewId] = useState<string | null>(null);
  const [factions, setFactions] = useState<NriFaction[]>([]);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const [list, loreRes] = await Promise.all([
      nriFetchCombatants(authToken, inviteCode),
      nriFetchLore(authToken, inviteCode),
    ]);
    if (list === null) {
      setErr('Не удалось загрузить боевиков. Перезапустите сервер (npm run build && npm start).');
      return;
    }
    setErr(null);
    setCombatants(list);
    if (loreRes.ok) setFactions(loreRes.data.factions);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    const onChanged = () => {
      void refresh();
    };
    window.addEventListener('neon:combatants-changed', onChanged);
    const t = setInterval(refresh, 8000);
    return () => {
      clearInterval(t);
      window.removeEventListener('neon:combatants-changed', onChanged);
    };
  }, [refresh]);

  const pickArchetype = (id: NriNpcArchetypeId) => {
    setArchetypeId(id);
    const arch = NRI_COMBAT_ARCHETYPES.find((a) => a.id === id);
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
    const level = levelForThreatTier(threatTier);
    const useOrigin = meta.originId ?? originId;
    const useActivity = meta.activityId ?? activityId;
    const pickedFactionId = factionId || undefined;
    const built = buildFullCharacter({
      classId,
      originId: useOrigin,
      activityId: useActivity,
      archetypeId,
      level,
      characterName: name.trim() || meta.characterName?.trim() || undefined,
      nickname: meta.nickname,
      career: meta.career,
      age: meta.age,
      yearsServed: meta.yearsServed,
      streetInfluence: meta.streetInfluence,
      corporateInfluence: meta.corporateInfluence,
      skillProficiencies: pickedSkills,
    });
    setOriginId(useOrigin);
    setActivityId(useActivity);
    setSheet({ ...built.sheet, factionId: pickedFactionId });
    setDraftInventory(Array.isArray(built.inventory) ? built.inventory : []);
    setMeta({ ...built.meta, npcArchetypeId: archetypeId, level, factionId: pickedFactionId ?? null });
    if (!name.trim()) setName(built.meta.characterName);
    setErr(null);
  };

  const saveCombatant = async () => {
    if (!authToken) return;
    if (!sheet) {
      setErr('Сначала нажмите «Сгенерировать» и проверьте лист.');
      return;
    }
    const combatantName = (meta.characterName ?? name).trim();
    if (!combatantName) {
      setErr('Укажите имя или сгенерируйте боевика.');
      return;
    }
    const pickedFactionId = factionId || meta.factionId || null;
    const finalSheet = applyMetaToSheet(sheet, {
      ...meta,
      characterName: combatantName,
      npcArchetypeId: archetypeId,
      level: levelForThreatTier(threatTier),
      factionId: pickedFactionId,
    });
    finalSheet.factionId = pickedFactionId ?? undefined;
    setBusy(true);
    setErr(null);
    setOkMsg(null);
    const created = await nriCreateCombatant(authToken, inviteCode, {
      name: combatantName,
      classId,
      archetypeId,
      threatTier,
      imageUrl: imageUrl.trim() || undefined,
      inventory: draftInventory,
      sheet: finalizeCharacterSheet(finalSheet),
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    if (!created.ok) {
      setErr(created.error);
      return;
    }
    setDraftInventory([]);
    setName('');
    setImageUrl('');
    setNotes('');
    setFactionId('');
    setSheet(null);
    setCombatants((prev) => [created.combatant, ...prev.filter((x) => x.id !== created.combatant.id)]);
    setOkMsg(`Боевик «${created.combatant.name}» сохранён — вкладка «Боевики» и схема боя.`);
    window.dispatchEvent(new CustomEvent('neon:combatants-changed'));
    await refresh();
  };

  const demoteToNpc = async (id: string) => {
    if (!authToken) return;
    const c = combatants.find((x) => x.id === id);
    if (!c) return;
    setBusy(true);
    setErr(null);
    setOkMsg(null);
    const res = await nriCreateNpc(authToken, inviteCode, {
      name: c.name,
      classId: c.classId ?? undefined,
      imageUrl: c.imageUrl ?? undefined,
      inventory: Array.isArray(c.inventory) ? c.inventory : [],
      sheet: c.sheet ?? undefined,
      notes: c.notes ? `Из боевика. ${c.notes}` : 'Из боевика',
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setOkMsg(`«${c.name}» скопирован в НПС стола.`);
  };

  const remove = async (id: string) => {
    if (!authToken || !window.confirm('Удалить боевика?')) return;
    if (await nriDeleteCombatant(authToken, inviteCode, id)) {
      if (sheetPreviewId === id) setSheetPreviewId(null);
      window.dispatchEvent(new CustomEvent('neon:combatants-changed'));
      await refresh();
    }
  };

  const showGen = mode === 'full' || mode === 'gen';
  const showList = mode === 'full' || mode === 'list';

  return (
    <div className="nri-combatants">
      {(mode === 'full' || mode === 'list') && (
        <header className="nri-chars__head">
          <h3 className="mono-text">
            <Skull size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Противники-боевики
          </h3>
          <p className="mono-text opacity-70">
            Листы для схемы боя. Новых собирайте во вкладке <strong>Генерация → Боевики</strong>.
          </p>
        </header>
      )}

      {showGen && (
      <div className="nri-presets__form">
        {mode === 'gen' && (
          <header className="nri-chars__head nri-chars__head--compact">
            <p className="mono-text opacity-70">
              Угроза → <strong>Сгенерировать</strong> → проверьте лист → <strong>Сохранить боевика</strong>.
            </p>
          </header>
        )}
        <h4 className="mono-text">{mode === 'gen' ? 'Угроза и архетип' : '1. Угроза и архетип'}</h4>
        <div className="nri-threat-row">
          {NRI_THREAT_TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`nri-threat-chip nri-threat-chip--${t.id} ${threatTier === t.id ? 'active' : ''}`}
              onClick={() => setThreatTier(t.id)}
              title={t.blurb}
            >
              <strong>{t.label}</strong>
              <span>Lv {t.level}</span>
            </button>
          ))}
        </div>
        <div className="nri-class-grid nri-class-grid--compact">
          {NRI_COMBAT_ARCHETYPES.map((a) => (
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

        <h4 className="mono-text">2. Происхождение и класс</h4>
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
                <option key={o.id} value={o.id}>{o.label}</option>
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
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </label>
        </div>
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
          <span>Имя / позывной</span>
          <div className="nri-presets__name-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Случайное при генерации…" />
            <button type="button" className="nri-lobby__copy" onClick={() => setName(rollNpcName(originId))} title="Случайное имя">
              <Dices size={14} />
            </button>
          </div>
        </label>
        <label className="nri-modal__field">
          <span>Портрет (URL)</span>
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

        <div className="nri-presets__actions">
          <button type="button" className="nri-lobby__copy" disabled={busy} onClick={generatePreview}>
            <Dices size={14} /> Сгенерировать
          </button>
          <button
            type="button"
            className="nri-modal__submit"
            disabled={busy || !sheet}
            onClick={saveCombatant}
            title={!sheet ? 'Сначала сгенерируйте лист' : 'Сохранить в список'}
          >
            <Save size={14} /> Сохранить боевика
          </button>
        </div>

        {sheet && (
          <div className="nri-presets__wizard">
            <h4 className="mono-text">Проверьте лист перед сохранением</h4>
            <NriCharacterMetaForm
              classId={classId}
              meta={{
                ...meta,
                originId,
                activityId,
                npcArchetypeId: archetypeId,
                level: levelForThreatTier(threatTier),
                factionId: factionId || null,
              }}
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
              <span>Тактика / заметки мастера</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Укрытие, приоритет цели…" />
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

      {showList && (
      <>
      <div className="nri-combatants__list-head mono-text">
        Сохранённые боевики ({combatants.length})
      </div>
      <ul className="nri-npcs__list nri-combatants__list">
        {combatants.map((c) => {
          const arch = NRI_COMBAT_ARCHETYPES.find((a) => a.id === c.archetypeId);
          const parsed = parseNriSheet(c.sheet);
          const hp = parsed?.hpMax ?? parsed?.hp;
          return (
            <li key={c.id} className="nri-npcs__item nri-combatants__item">
              <div className="nri-combatants__main">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt="" className="nri-npcs__avatar" />
                ) : (
                  <span className="nri-npcs__avatar nri-npcs__avatar--ph">
                    <User size={18} />
                  </span>
                )}
                <span className="nri-combatants__info">
                  <strong>{c.name}</strong>
                  <span className="mono-text opacity-70">
                    {arch?.label ?? c.archetypeId ?? '—'}
                    {' · '}
                    {NRI_CLASSES.find((cl) => cl.id === c.classId)?.name ?? c.classId ?? '—'}
                    {typeof hp === 'number' ? ` · HP ${hp}` : ''}
                  </span>
                </span>
                <span className={`nri-threat-badge nri-threat-badge--${c.threatTier}`}>
                  {threatLabel(c.threatTier)}
                </span>
              </div>
              <div className="nri-combatants__actions">
                <button
                  type="button"
                  className={`nri-lobby__copy ${sheetPreviewId === c.id ? 'active' : ''}`}
                  onClick={() => setSheetPreviewId((id) => (id === c.id ? null : c.id))}
                >
                  Лист
                </button>
                <button
                  type="button"
                  className="nri-lobby__copy"
                  disabled={busy}
                  onClick={() => void demoteToNpc(c.id)}
                  title="Скопировать в список НПС"
                >
                  → НПС
                </button>
                <button type="button" className="nri-lobby__close" onClick={() => remove(c.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
              {c.notes && <p className="mono-text opacity-70 nri-npcs__notes">{c.notes}</p>}
            </li>
          );
        })}
        {combatants.length === 0 && (
          <p className="mono-text opacity-50 nri-combatants__empty">
            Пока нет боевиков — соберите во вкладке «Генерация» → Боевики.
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
            sheet: applyMetaToSheet(sheet, { ...meta, level: levelForThreatTier(threatTier) }),
            portraitUrl: imageUrl || null,
          }}
          gmView
          onClose={() => setSheetPreviewId(null)}
        />
      )}

      {sheetPreviewId && sheetPreviewId !== 'draft' && (() => {
        const c = combatants.find((x) => x.id === sheetPreviewId);
        if (!c) return null;
        return (
          <NriCharacterSheet
            title={c.name}
            profile={{
              displayName: c.name,
              classId: c.classId ?? 'merc',
              inventory: c.inventory,
              sheet: c.sheet,
              portraitUrl: c.imageUrl,
            }}
            gmView
            onClose={() => setSheetPreviewId(null)}
          />
        );
      })()}
    </div>
  );
};

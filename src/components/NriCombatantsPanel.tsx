import React, { useCallback, useEffect, useState } from 'react';
import { Dices, Save, Skull, Trash2, User } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import {
  nriCreateCombatant,
  nriDeleteCombatant,
  nriFetchCombatants,
  type NriCombatant,
} from '../logic/nriApi';
import { NRI_CLASSES, type NriClassId } from '../logic/nriClasses';
import {
  applyMetaToSheet,
  buildFullCharacter,
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
import { NriCharacterMetaForm } from './NriCharacterMetaForm';
import { NriCharacterSheet } from './NriCharacterSheet';
import { NriSkillPickField } from './NriSkillPickField';
import { defaultSkillsForClass, validateSkillPick } from '../logic/nriSkillPick';

type Props = {
  inviteCode: string;
};

function threatLabel(tier: string): string {
  return NRI_THREAT_TIERS.find((t) => t.id === tier)?.label ?? tier;
}

export const NriCombatantsPanel: React.FC<Props> = ({ inviteCode }) => {
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
  const [sheet, setSheet] = useState<NriSheetData | null>(null);
  const [meta, setMeta] = useState<CharacterMetaDraft>({
    originId: 'neo_tokyo',
    activityId: 'military',
    level: 1,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sheetPreviewId, setSheetPreviewId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const list = await nriFetchCombatants(authToken, inviteCode);
    if (list === null) {
      setErr('Не удалось загрузить боевиков. Перезапустите сервер (npm run build && npm start).');
      return;
    }
    setErr(null);
    setCombatants(list);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
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
    const built = buildFullCharacter({
      classId,
      originId,
      activityId,
      archetypeId,
      level,
      characterName: name.trim() || undefined,
      skillProficiencies: pickedSkills,
    });
    setSheet(built.sheet);
    setMeta({ ...built.meta, npcArchetypeId: archetypeId, level });
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
    const finalSheet = applyMetaToSheet(sheet, {
      ...meta,
      characterName: combatantName,
      npcArchetypeId: archetypeId,
      level: levelForThreatTier(threatTier),
    });
    setBusy(true);
    setErr(null);
    const created = await nriCreateCombatant(authToken, inviteCode, {
      name: combatantName,
      classId,
      archetypeId,
      threatTier,
      imageUrl: imageUrl.trim() || undefined,
      sheet: finalSheet,
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    if (!created.ok) {
      setErr(created.error);
      return;
    }
    setName('');
    setImageUrl('');
    setNotes('');
    setSheet(null);
    await refresh();
  };

  const remove = async (id: string) => {
    if (!authToken || !window.confirm('Удалить боевика?')) return;
    if (await nriDeleteCombatant(authToken, inviteCode, id)) {
      if (sheetPreviewId === id) setSheetPreviewId(null);
      await refresh();
    }
  };

  return (
    <div className="nri-combatants">
      <header className="nri-chars__head">
        <h3 className="mono-text">
          <Skull size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Противники-боевики
        </h3>
        <p className="mono-text opacity-70">
          Генерация и хранение листов для боя. Только мастер — игроки не видят этот список.
        </p>
      </header>

      <div className="nri-presets__form">
        <h4 className="mono-text">1. Угроза и архетип</h4>
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
            <select value={originId} onChange={(e) => setOriginId(e.target.value as NriOriginId)}>
              {NRI_ORIGINS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="nri-modal__field">
            <span>Деятельность</span>
            <select value={activityId} onChange={(e) => setActivityId(e.target.value as NriActivityId)}>
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
            <button type="button" className="nri-lobby__copy" onClick={() => setName(rollNpcName())} title="Случайное имя">
              <Dices size={14} />
            </button>
          </div>
        </label>
        <label className="nri-modal__field">
          <span>Портрет (URL)</span>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
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
              meta={{
                ...meta,
                originId,
                activityId,
                npcArchetypeId: archetypeId,
                level: levelForThreatTier(threatTier),
              }}
              sheet={sheet}
              onChange={(m) => {
                setMeta(m);
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

      {err && <p className="nri-lobby__err mono-text">{err}</p>}

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
                <button type="button" className="nri-lobby__close" onClick={() => remove(c.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
              {c.notes && <p className="mono-text opacity-70 nri-npcs__notes">{c.notes}</p>}
            </li>
          );
        })}
        {combatants.length === 0 && (
          <p className="mono-text opacity-50 nri-combatants__empty">Пока нет боевиков — сгенерируйте первого выше.</p>
        )}
      </ul>

      {sheetPreviewId === 'draft' && sheet && (
        <NriCharacterSheet
          title={meta.characterName ?? name}
          profile={{
            displayName: meta.characterName ?? name,
            classId,
            inventory: [],
            sheet: applyMetaToSheet(sheet, { ...meta, level: levelForThreatTier(threatTier) }),
            portraitUrl: imageUrl || null,
          }}
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
            onClose={() => setSheetPreviewId(null)}
          />
        );
      })()}
    </div>
  );
};

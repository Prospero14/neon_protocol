import React, { useCallback, useEffect, useState } from 'react';
import { Dices, Eye, Pencil, Plus, Save, Trash2, Users } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import {
  nriCreatePreset,
  nriDeletePreset,
  nriFetchCyberProducts,
  nriFetchPresets,
  nriPatchPreset,
  type NriCyberProduct,
  type NriPresetCharacter,
} from '../logic/nriApi';
import { NRI_CLASS_SEEDS } from '../logic/nriClassSeeds';
import { NRI_CLASSES, type NriClassId } from '../logic/nriClasses';
import {
  applyMetaToSheet,
  archetypeForClass,
  buildFullCharacter,
  ensureCompleteSheet,
  sheetHpForLevel,
  sheetToMetaDraft,
  type CharacterMetaDraft,
  type NriOriginId,
} from '../logic/nriCharacterGen';
import { blueprintToInventoryItem, type CyberBlueprint } from '../logic/nriCyberware';
import { parseNriSheet, type NriSheetData } from '../logic/nriNpcGenerator';
import type { NriInventoryItem } from '../logic/nriInventory';
import { NriCharacterMetaForm } from './NriCharacterMetaForm';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';
import { NriCharacterSheet } from './NriCharacterSheet';
import { NriSkillPickField } from './NriSkillPickField';
import { defaultSkillsForClass, validateSkillPick } from '../logic/nriSkillPick';

type Props = { inviteCode: string; mode?: 'full' | 'players' | 'gen' };

type PendingPreset = {
  key: string;
  label: string;
  classId: NriClassId;
  sheet: NriSheetData;
  inventory: NriInventoryItem[];
  meta: CharacterMetaDraft;
  portraitUrl: string;
  publishedToPlayers: boolean;
};

function cyberProductToItem(p: NriCyberProduct): NriInventoryItem | null {
  const bp = p.blueprint as CyberBlueprint | null;
  if (!bp?.partIds) return null;
  const item = blueprintToInventoryItem(bp) as NriInventoryItem;
  return { ...item, id: `cyber_preset_${p.id}` };
}

const DEFAULT_CLASS_ID: NriClassId = 'merc';
const DEFAULT_META: CharacterMetaDraft = { originId: 'neo_tokyo', activityId: 'street', level: 1 };

export const NriPresetsPanel: React.FC<Props> = ({ inviteCode, mode = 'full' }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [presets, setPresets] = useState<NriPresetCharacter[]>([]);
  const [cyberDrafts, setCyberDrafts] = useState<NriCyberProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editSheet, setEditSheet] = useState<NriSheetData | null>(null);
  const [editMeta, setEditMeta] = useState<CharacterMetaDraft>({});
  const [pendingPreset, setPendingPreset] = useState<PendingPreset | null>(null);
  const [pickedSkills] = useState<string[]>(() => defaultSkillsForClass(DEFAULT_CLASS_ID));
  const [editSkills, setEditSkills] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const [list, cyber] = await Promise.all([
      nriFetchPresets(authToken, inviteCode),
      nriFetchCyberProducts(authToken, inviteCode),
    ]);
    if (list !== null) setPresets(list.presets);
    if (cyber) setCyberDrafts(cyber);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const remove = async (id: string) => {
    if (!authToken || !window.confirm('Удалить пресет?')) return;
    if (await nriDeletePreset(authToken, inviteCode, id)) await refresh();
  };

  const togglePublish = async (p: NriPresetCharacter) => {
    if (!authToken || p.claimed) return;
    await nriPatchPreset(authToken, inviteCode, p.id, { publishedToPlayers: !p.publishedToPlayers });
    await refresh();
  };

  const startEdit = (p: NriPresetCharacter) => {
    const completed = ensureCompleteSheet(p.sheet, p.classId as NriClassId, p.label);
    const sheet = parseNriSheet(completed) ?? completed;
    setEditId(p.id);
    setEditLabel(p.label);
    setEditSheet(sheet);
    setEditMeta(sheetToMetaDraft(sheet, p.label));
    setEditSkills(sheet.skillProficiencies ?? defaultSkillsForClass(p.classId as NriClassId));
    setPreviewId(null);
    setPendingPreset(null);
    setErr(null);
  };

  const saveEdit = async () => {
    if (!authToken || !editId || !editLabel.trim()) return;
    const presetClass = presets.find((x) => x.id === editId)?.classId as NriClassId;
    const skillErr = validateSkillPick(presetClass, editSkills);
    if (skillErr) {
      setErr(skillErr);
      return;
    }
    const preset = presets.find((x) => x.id === editId);
    const baseSheet =
      editSheet ??
      parseNriSheet(ensureCompleteSheet(preset?.sheet, presetClass, editLabel)) ??
      ensureCompleteSheet(preset?.sheet, presetClass, editLabel);
    setBusy(true);
    setErr(null);
    const patched = await nriPatchPreset(authToken, inviteCode, editId, {
      label: editLabel.trim(),
      sheet: sheetHpForLevel(
        { ...applyMetaToSheet(baseSheet, editMeta), skillProficiencies: editSkills },
        presetClass
      ),
    });
    setBusy(false);
    if (!patched.ok) {
      setErr(patched.error);
      return;
    }
    setEditId(null);
    setEditSheet(null);
    await refresh();
  };

  const buildPendingPreset = (
    cid: NriClassId,
    origin: NriOriginId,
    activity: CharacterMetaDraft['activityId'],
    skills: string[]
  ): PendingPreset => {
    const built = buildFullCharacter({
      classId: cid,
      originId: origin ?? 'neo_tokyo',
      activityId: activity ?? 'street',
      archetypeId: archetypeForClass(cid),
      skillProficiencies: skills,
    });
    const seed = NRI_CLASS_SEEDS.find((s) => s.classId === cid);
    let sheet = built.sheet;
    if (seed?.sheet?.abilities) {
      sheet = sheetHpForLevel({ ...built.sheet, abilities: seed.sheet.abilities }, cid);
    }
    const clsName = NRI_CLASSES.find((c) => c.id === cid)?.name ?? cid;
    return {
      key: `gen-${Date.now()}`,
      label: seed?.label ?? `${clsName} — ${built.meta.characterName}`,
      classId: cid,
      sheet,
      inventory: seed && Array.isArray(seed.inventory) ? [...seed.inventory] : [],
      meta: { ...built.meta, level: 1 },
      portraitUrl: '',
      publishedToPlayers: true,
    };
  };

  const startWizard = () => {
    setPendingPreset(
      buildPendingPreset(DEFAULT_CLASS_ID, DEFAULT_META.originId ?? 'neo_tokyo', DEFAULT_META.activityId ?? 'street', pickedSkills)
    );
    setErr(null);
  };

  const rerollPending = () => {
    if (!pendingPreset) return;
    setPendingPreset(
      buildPendingPreset(
        pendingPreset.classId,
        pendingPreset.meta.originId ?? 'neo_tokyo',
        pendingPreset.meta.activityId ?? 'street',
        pendingPreset.sheet.skillProficiencies ?? pickedSkills
      )
    );
  };

  const savePending = async () => {
    if (!authToken || !pendingPreset) return;
    const skills = pendingPreset.sheet.skillProficiencies ?? pickedSkills;
    const skillErr = validateSkillPick(pendingPreset.classId, skills);
    if (skillErr) {
      setErr(skillErr);
      return;
    }
    setBusy(true);
    setErr(null);
    const finalSheet = sheetHpForLevel(
      { ...applyMetaToSheet(pendingPreset.sheet, pendingPreset.meta), skillProficiencies: skills },
      pendingPreset.classId
    );
    const res = await nriCreatePreset(authToken, inviteCode, {
      label: pendingPreset.label.trim(),
      classId: pendingPreset.classId,
      sheet: finalSheet,
      inventory: pendingPreset.inventory,
      portraitUrl: pendingPreset.portraitUrl.trim() || undefined,
      publishedToPlayers: pendingPreset.publishedToPlayers,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setPendingPreset(null);
    await refresh();
  };

  const updatePending = (patch: Partial<PendingPreset>) => {
    if (!pendingPreset) return;
    setPendingPreset((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const preview = presets.find((p) => p.id === previewId);
  const showGen = mode === 'full' || mode === 'gen';
  const showList = mode === 'full' || mode === 'players';

  return (
    <div className="nri-presets">
      {showGen && (
      <header className="nri-chars__head">
        <h3 className="mono-text">Персонажи для игроков</h3>
        <p className="mono-text opacity-70">
          Черновики видны только мастеру. Опубликуйте — игрок выберет чарник и введёт имя при входе.
        </p>
        <button type="button" className="nri-modal__submit" disabled={busy || !!pendingPreset} onClick={startWizard}>
          <Plus size={14} /> Сгенерировать персонажа (редактировать → сохранить)
        </button>
      </header>
      )}

      {showList && mode === 'players' && (
        <header className="nri-chars__head">
          <h3 className="mono-text">Игроки за столом</h3>
          <p className="mono-text opacity-70">
            Пресеты для выбора при входе. Опубликуйте — игрок увидит чарник в форме регистрации.
          </p>
        </header>
      )}

      {showGen && pendingPreset && (
        <div className="nri-presets__wizard">
          <h4 className="mono-text">Новый персонаж: {pendingPreset.label}</h4>
          <div className="nri-class-grid nri-class-grid--compact">
            {NRI_CLASSES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`nri-class-card ${pendingPreset.classId === c.id ? 'active' : ''}`}
                onClick={() =>
                  setPendingPreset(
                    buildPendingPreset(
                      c.id,
                      pendingPreset.meta.originId ?? 'neo_tokyo',
                      pendingPreset.meta.activityId ?? 'street',
                      pendingPreset.sheet.skillProficiencies ?? pickedSkills
                    )
                  )
                }
              >
                <strong>{c.name}</strong>
              </button>
            ))}
          </div>
          <label className="nri-modal__field">
            <span>Название для мастера</span>
            <input
              value={pendingPreset.label}
              onChange={(e) => updatePending({ label: e.target.value })}
            />
          </label>
          <NriCharacterMetaForm
            meta={pendingPreset.meta}
            sheet={pendingPreset.sheet}
            onChange={(m) =>
              updatePending({ meta: m, sheet: applyMetaToSheet(pendingPreset.sheet, m) })
            }
          />
          <NriSkillPickField
            classId={pendingPreset.classId}
            picked={pendingPreset.sheet.skillProficiencies ?? defaultSkillsForClass(pendingPreset.classId)}
            onChange={(skills) =>
              updatePending({ sheet: { ...pendingPreset.sheet, skillProficiencies: skills } })
            }
          />
          <label className="nri-modal__field">
            <span>Портрет (URL)</span>
            <input
              value={pendingPreset.portraitUrl}
              onChange={(e) => updatePending({ portraitUrl: e.target.value })}
            />
          </label>
          {cyberDrafts.length > 0 && (
            <div className="nri-presets__cyber-pick">
              <span className="mono-text">Импланты из черновиков:</span>
              <ul>
                {cyberDrafts.map((c) => (
                  <li key={c.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={pendingPreset.inventory.some((i) => i.id === `cyber_preset_${c.id}`)}
                        onChange={() => {
                          const item = cyberProductToItem(c);
                          if (!item) return;
                          const has = pendingPreset.inventory.some((i) => i.id === item.id);
                          updatePending({
                            inventory: has
                              ? pendingPreset.inventory.filter((i) => i.id !== item.id)
                              : [...(Array.isArray(pendingPreset.inventory) ? pendingPreset.inventory : []), item],
                          });
                        }}
                      />
                      {c.name} ({c.slot})
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <label className="nri-modal__field nri-presets__publish-row">
            <input
              type="checkbox"
              checked={pendingPreset.publishedToPlayers}
              onChange={(e) => updatePending({ publishedToPlayers: e.target.checked })}
            />
            <span>Сразу доступен игрокам</span>
          </label>
          <NriCharacterSheetContent
            profile={{
              displayName: pendingPreset.meta.characterName ?? pendingPreset.label,
              classId: pendingPreset.classId,
              inventory: pendingPreset.inventory,
              sheet: applyMetaToSheet(pendingPreset.sheet, pendingPreset.meta),
              portraitUrl: pendingPreset.portraitUrl || null,
            }}
          />
          <div className="nri-presets__actions">
            <button type="button" className="nri-lobby__copy" disabled={busy} onClick={rerollPending}>
              <Dices size={14} /> Пересобрать
            </button>
            <button type="button" className="nri-lobby__close" onClick={() => setPendingPreset(null)}>
              Отмена
            </button>
            <button
              type="button"
              className="nri-modal__submit"
              disabled={busy || !pendingPreset.label.trim()}
              onClick={savePending}
            >
              <Save size={14} /> Сохранить персонажа
            </button>
          </div>
          {err && <p className="nri-lobby__err mono-text">{err}</p>}
        </div>
      )}

      {showList && (
      <ul className="nri-presets__list">
        {presets.map((p) => (
          <li key={p.id} className={`nri-presets__item ${p.claimed ? 'claimed' : ''}`}>
            {p.portraitUrl && <img src={p.portraitUrl} alt="" className="nri-presets__thumb" />}
            <div className="nri-presets__meta">
              <strong>{p.label}</strong>
              <span className="mono-text opacity-70">
                {NRI_CLASSES.find((c) => c.id === p.classId)?.name ?? p.classId}
                {p.claimed ? ' · занят' : p.publishedToPlayers ? ' · для игроков' : ' · черновик мастера'}
              </span>
            </div>
            <button
              type="button"
              className={`nri-lobby__copy ${previewId === p.id ? 'active' : ''}`}
              onClick={() => setPreviewId((id) => (id === p.id ? null : p.id))}
            >
              <Eye size={14} /> Лист
            </button>
            <button type="button" className="nri-lobby__copy" onClick={() => startEdit(p)}>
              <Pencil size={14} /> Имя / бэк
            </button>
            {!p.claimed && (
              <button type="button" className="nri-lobby__copy" onClick={() => togglePublish(p)}>
                <Users size={14} /> {p.publishedToPlayers ? 'Скрыть' : 'Игрокам'}
              </button>
            )}
            {!p.claimed && (
              <button type="button" className="nri-lobby__close" onClick={() => remove(p.id)}>
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
        {presets.length === 0 && (
          <p className="mono-text opacity-50">Пока нет персонажей — нажмите «Сгенерировать персонажа».</p>
        )}
      </ul>
      )}

      {showList && editId && (
        <div className="nri-presets__wizard">
          <h4 className="mono-text">Редактирование листа</h4>
          <label className="nri-modal__field">
            <span>Название для мастера</span>
            <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
          </label>
          <NriCharacterMetaForm
            meta={editMeta}
            sheet={editSheet ?? undefined}
            onChange={(m) => {
              setEditMeta(m);
              if (editSheet) setEditSheet(applyMetaToSheet(editSheet, m));
            }}
          />
          <NriSkillPickField classId={presets.find((x) => x.id === editId)?.classId as NriClassId} picked={editSkills} onChange={setEditSkills} />
          <div className="nri-presets__actions">
            <button type="button" className="nri-lobby__close" onClick={() => setEditId(null)}>
              Отмена
            </button>
            <button type="button" className="nri-modal__submit" disabled={busy} onClick={saveEdit}>
              <Save size={14} /> Сохранить изменения
            </button>
          </div>
          {err && <p className="nri-lobby__err mono-text">{err}</p>}
        </div>
      )}

      {showList && preview && !editId && (
        <NriCharacterSheet
          title={preview.label}
          profile={{
            displayName: preview.label,
            classId: preview.classId,
            inventory: preview.inventory,
            sheet: preview.sheet,
            portraitUrl: preview.portraitUrl,
          }}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
};

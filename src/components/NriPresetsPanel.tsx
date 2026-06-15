import React, { useCallback, useEffect, useState } from 'react';
import { Dices, Plus, Trash2 } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { nriCreatePreset, nriDeletePreset, nriFetchPresets, type NriPresetCharacter } from '../logic/nriApi';
import { NRI_CLASS_SEEDS } from '../logic/nriClassSeeds';
import { NRI_CLASSES } from '../logic/nriClasses';
import { buildSheetForClass, type NriSheetData } from '../logic/nriNpcGenerator';
import type { NriClassId } from '../logic/nriClasses';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';

type Props = { inviteCode: string };

export const NriPresetsPanel: React.FC<Props> = ({ inviteCode }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [presets, setPresets] = useState<NriPresetCharacter[]>([]);
  const [label, setLabel] = useState('');
  const [classId, setClassId] = useState<NriClassId>('merc');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [sheet, setSheet] = useState<NriSheetData | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const list = await nriFetchPresets(authToken, inviteCode);
    if (list !== null) setPresets(list);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const rollSheet = () => setSheet(buildSheetForClass(classId));

  const create = async () => {
    if (!authToken || !label.trim()) return;
    setBusy(true);
    setErr(null);
    const created = await nriCreatePreset(authToken, inviteCode, {
      label: label.trim(),
      classId,
      sheet: sheet ?? buildSheetForClass(classId),
      portraitUrl: portraitUrl.trim() || undefined,
    });
    setBusy(false);
    if (!created.ok) {
      setErr(created.error);
      return;
    }
    setLabel('');
    setPortraitUrl('');
    setSheet(null);
    await refresh();
  };

  const remove = async (id: string) => {
    if (!authToken || !window.confirm('Удалить пресет?')) return;
    if (await nriDeletePreset(authToken, inviteCode, id)) await refresh();
  };

  const seedClasses = async () => {
    if (!authToken || presets.length > 0) {
      if (presets.length > 0 && !window.confirm('Уже есть пресеты. Добавить 6 классов ещё раз?')) return;
    }
    setBusy(true);
    setErr(null);
    for (const seed of NRI_CLASS_SEEDS) {
      const created = await nriCreatePreset(authToken, inviteCode, {
        label: seed.label,
        classId: seed.classId,
        sheet: seed.sheet,
        inventory: seed.inventory,
      });
      if (!created.ok) {
        setErr(created.error);
        break;
      }
    }
    setBusy(false);
    await refresh();
  };

  const preview = presets.find((p) => p.id === previewId);

  return (
    <div className="nri-presets">
      <header className="nri-chars__head">
        <h3 className="mono-text">Персонажи для игроков</h3>
        <p className="mono-text opacity-70">
          Заполненные чарники Carbon 2185 (стр. 283) — игрок выбирает один при входе.
        </p>
        <button type="button" className="nri-modal__submit" disabled={busy} onClick={seedClasses}>
          <Plus size={14} /> Создать 6 классов (лист p283)
        </button>
      </header>

      <div className="nri-presets__form">
        <label className="nri-modal__field">
          <span>Название (для мастера)</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Jackie Chow build…" />
        </label>
        <label className="nri-modal__field">
          <span>Портрет (URL)</span>
          <input value={portraitUrl} onChange={(e) => setPortraitUrl(e.target.value)} placeholder="https://…" />
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
          <button type="button" className="nri-lobby__copy" onClick={rollSheet}>
            <Dices size={14} /> Сгенерировать статы (2d6+5)
          </button>
          <button type="button" className="nri-modal__submit" disabled={busy || !label.trim()} onClick={create}>
            <Plus size={14} /> Сохранить персонажа
          </button>
        </div>
        {sheet && (
          <p className="mono-text opacity-70">
            STR {sheet.abilities.STR} · DEX {sheet.abilities.DEX} · CON {sheet.abilities.CON} · HP {sheet.hpMax} · AC {sheet.ac}
          </p>
        )}
        {err && <p className="nri-lobby__err mono-text">{err}</p>}
      </div>

      <ul className="nri-presets__list">
        {presets.map((p) => (
          <li key={p.id} className={`nri-presets__item ${p.claimed ? 'claimed' : ''}`}>
            {p.portraitUrl && (
              <img src={p.portraitUrl} alt="" className="nri-presets__thumb" />
            )}
            <div className="nri-presets__meta">
              <strong>{p.label}</strong>
              <span className="mono-text opacity-70">
                {NRI_CLASSES.find((c) => c.id === p.classId)?.name ?? p.classId}
                {p.claimed ? ' · занят' : ' · свободен'}
              </span>
            </div>
            <button type="button" className="nri-lobby__copy" onClick={() => setPreviewId(p.id)}>
              Лист
            </button>
            {!p.claimed && (
              <button type="button" className="nri-lobby__close" onClick={() => remove(p.id)}>
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
        {presets.length === 0 && (
          <p className="mono-text opacity-50">Пока нет персонажей — создайте хотя бы одного для игроков.</p>
        )}
      </ul>

      {preview && (
        <div className="nri-presets__preview">
          <NriCharacterSheetContent
            profile={{
              displayName: preview.label,
              classId: preview.classId,
              inventory: preview.inventory,
              sheet: preview.sheet,
              portraitUrl: preview.portraitUrl,
            }}
          />
        </div>
      )}
    </div>
  );
};

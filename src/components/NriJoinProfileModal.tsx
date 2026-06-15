import React, { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { getNriClass, type NriClassId } from '../logic/nriClasses';
import { ensureCompleteSheet } from '../logic/nriCharacterGen';
import { nriFetchPresets, type NriPresetCharacter } from '../logic/nriApi';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';
import type { NriPlayerProfile } from '../logic/nriApi';

type Props = {
  inviteCode: string;
  onSubmit: (
    displayName: string,
    opts: { presetId?: string; sheet?: unknown }
  ) => void;
  loading?: boolean;
  submitError?: string | null;
};

export const NriJoinProfileModal: React.FC<Props> = ({
  inviteCode,
  onSubmit,
  loading,
  submitError,
}) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [displayName, setDisplayName] = useState('');
  const [presetId, setPresetId] = useState<string | null>(null);
  const [presets, setPresets] = useState<NriPresetCharacter[] | null>(null);
  const [selectionRequired, setSelectionRequired] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    nriFetchPresets(authToken, inviteCode).then((data) => {
      if (data === null) {
        setFetchErr('Не удалось загрузить персонажей. Перезапустите сервер (npm run build && npm start).');
        setPresets([]);
        return;
      }
      setPresets(data.presets);
      setSelectionRequired(data.meta?.selectionRequired ?? data.presets.length > 0);
      const free = data.presets.filter((p) => !p.claimed);
      if (free.length === 1) {
        setPresetId(free[0].id);
        setDisplayName(free[0].label);
      }
    });
  }, [authToken, inviteCode]);

  const available = presets?.filter((p) => !p.claimed) ?? [];
  const picked = available.find((p) => p.id === presetId);

  const previewProfile: NriPlayerProfile | null = useMemo(() => {
    if (!picked) return null;
    const name = displayName.trim() || picked.label;
    const completed = ensureCompleteSheet(picked.sheet, picked.classId as NriClassId, name);
    return {
      displayName: name,
      classId: picked.classId,
      sheet: { ...completed, characterName: name },
      inventory: picked.inventory ?? [],
      portraitUrl: picked.portraitUrl,
    };
  }, [picked, displayName]);

  const pickPreset = (p: NriPresetCharacter) => {
    setPresetId(p.id);
    setDisplayName(p.label);
    setShowSheet(false);
  };

  if (presets === null) {
    return (
      <div className="nri-modal-overlay">
        <div className="nri-modal">
          <p className="mono-text">Загрузка персонажей…</p>
        </div>
      </div>
    );
  }

  if (selectionRequired && available.length === 0) {
    return (
      <div className="nri-modal-overlay">
        <div className="nri-modal">
          <h2 className="nri-modal__title">
            {presets.length > 0 ? 'Все персонажи заняты' : 'Ожидание персонажей мастера'}
          </h2>
          <p className="mono-text nri-modal__hint">
            {presets.length > 0
              ? 'Попросите мастера добавить ещё пресетов на вкладке «ПЕРСОНАЖИ».'
              : 'Мастер создал персонажей, но ещё не открыл их игрокам. Попросите опубликовать на вкладке «ПЕРСОНАЖИ».'}
          </p>
        </div>
      </div>
    );
  }

  if (!selectionRequired && available.length === 0) {
    return (
      <div className="nri-modal-overlay">
        <div className="nri-modal">
          <h2 className="nri-modal__title">Стол без пресетов</h2>
          <p className="mono-text nri-modal__hint">
            Мастер ещё не создал персонажей — попросите подготовить чарники на вкладке «ПЕРСОНАЖИ».
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="nri-modal-overlay">
      <div className="nri-modal nri-modal--wide nri-modal--join">
        <h2 className="nri-modal__title">Выберите персонажа</h2>
        <p className="mono-text nri-modal__hint">
          Выберите чарник мастера, посмотрите лист, задайте своё имя — оно заменит имя на листе.
        </p>

        {fetchErr && <p className="nri-lobby__err mono-text">{fetchErr}</p>}
        {submitError && <p className="nri-lobby__err mono-text">{submitError}</p>}

        <div className="nri-preset-pick-grid">
          {available.map((p) => {
            const cls = getNriClass(p.classId);
            return (
              <button
                key={p.id}
                type="button"
                className={`nri-preset-pick ${presetId === p.id ? 'active' : ''}`}
                onClick={() => pickPreset(p)}
              >
                {p.portraitUrl && <img src={p.portraitUrl} alt="" className="nri-preset-pick__img" />}
                <strong>{p.label}</strong>
                <span className="mono-text">{cls?.name ?? p.classId}</span>
              </button>
            );
          })}
        </div>

        {picked && (
          <>
            <label className="nri-modal__field">
              <span>Ваше имя персонажа</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                placeholder={picked.label}
              />
            </label>
            <p className="mono-text opacity-60 nri-modal__hint">
              Было: <strong>{picked.label}</strong> → станет: <strong>{displayName.trim() || picked.label}</strong>
            </p>

            <div className="nri-join-sheet-actions">
              <button type="button" className="nri-lobby__copy" onClick={() => setShowSheet((v) => !v)}>
                <Eye size={14} /> {showSheet ? 'Скрыть лист' : 'Смотреть лист'}
              </button>
            </div>

            {showSheet && previewProfile && (
              <div className="nri-join-sheet-preview">
                <NriCharacterSheetContent profile={previewProfile} />
              </div>
            )}

            <button
              type="button"
              className="nri-modal__submit"
              disabled={!displayName.trim() || loading}
              onClick={() =>
                onSubmit(displayName.trim(), {
                  presetId: picked.id,
                  sheet: previewProfile?.sheet,
                })
              }
            >
              {loading ? '…' : 'Войти за стол'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

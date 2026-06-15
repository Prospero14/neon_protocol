import React, { useEffect, useState } from 'react';
import { getNriClass, NRI_CLASSES } from '../logic/nriClasses';
import { nriFetchPresets, type NriPresetCharacter } from '../logic/nriApi';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';

type Props = {
  inviteCode: string;
  onSubmit: (displayName: string, opts: { presetId?: string; classId?: string }) => void;
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
  const [classId, setClassId] = useState(NRI_CLASSES[0]?.id ?? 'merc');
  const [presets, setPresets] = useState<NriPresetCharacter[] | null>(null);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;
    nriFetchPresets(authToken, inviteCode).then((list) => {
      if (list === null) {
        setFetchErr('Не удалось загрузить персонажей. Перезапустите сервер (npm run build && npm start).');
        setPresets([]);
        return;
      }
      setPresets(list);
      const free = list.filter((p) => !p.claimed);
      if (free.length === 1) setPresetId(free[0].id);
    });
  }, [authToken, inviteCode]);

  if (presets === null) {
    return (
      <div className="nri-modal-overlay">
        <div className="nri-modal">
          <p className="mono-text">Загрузка персонажей…</p>
        </div>
      </div>
    );
  }

  const available = presets.filter((p) => !p.claimed);
  const usePresets = available.length > 0;
  const picked = available.find((p) => p.id === presetId);

  if (!usePresets && presets.length > 0) {
    return (
      <div className="nri-modal-overlay">
        <div className="nri-modal">
          <h2 className="nri-modal__title">Все персонажи заняты</h2>
          <p className="mono-text nri-modal__hint">
            Попросите мастера добавить ещё пресетов на вкладке «ПЕРСОНАЖИ».
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="nri-modal-overlay">
      <div className="nri-modal nri-modal--wide">
        <h2 className="nri-modal__title">
          {usePresets ? 'Выберите персонажа' : 'Персонаж за столом'}
        </h2>
        <p className="mono-text nri-modal__hint">
          {usePresets
            ? 'Мастер подготовил чарники — выберите роль и введите своё имя.'
            : 'Мастер ещё не создал пресеты — выберите класс вручную (или попросите GM вкладка «ПЕРСОНАЖИ»).'}
        </p>

        {fetchErr && <p className="nri-lobby__err mono-text">{fetchErr}</p>}
        {submitError && <p className="nri-lobby__err mono-text">{submitError}</p>}

        {usePresets ? (
          <div className="nri-preset-pick-grid">
            {available.map((p) => {
              const cls = getNriClass(p.classId);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`nri-preset-pick ${presetId === p.id ? 'active' : ''}`}
                  onClick={() => setPresetId(p.id)}
                >
                  {p.portraitUrl && <img src={p.portraitUrl} alt="" className="nri-preset-pick__img" />}
                  <strong>{p.label}</strong>
                  <span className="mono-text">{cls?.name ?? p.classId}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="nri-class-grid">
            {NRI_CLASSES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`nri-class-card ${classId === c.id ? 'active' : ''}`}
                onClick={() => setClassId(c.id)}
              >
                <strong>{c.name}</strong>
                <span className="mono-text">{c.tagline}</span>
              </button>
            ))}
          </div>
        )}

        <label className="nri-modal__field">
          <span>Имя персонажа</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            placeholder={picked?.label ?? 'Callsign…'}
          />
        </label>

        <button
          type="button"
          className="nri-modal__submit"
          disabled={
            !displayName.trim() ||
            loading ||
            (usePresets ? !presetId : false)
          }
          onClick={() =>
            onSubmit(displayName.trim(), usePresets ? { presetId: presetId! } : { classId })
          }
        >
          {loading ? '…' : 'Войти за стол'}
        </button>
      </div>
    </div>
  );
};

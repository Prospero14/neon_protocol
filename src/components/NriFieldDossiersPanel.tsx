import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, User, X } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { nriSaveFieldDossiers, type NriPlayerProfile } from '../logic/nriApi';
import {
  emptyFieldDossier,
  sanitizeFieldDossiers,
  type NriFieldDossier,
} from '../../shared/nri-domain/fieldDossiers';

type Props = {
  inviteCode: string;
  profile: NriPlayerProfile;
  onUpdate?: (fieldDossiers: NriFieldDossier[]) => void;
};

export const NriFieldDossiersPanel: React.FC<Props> = ({ inviteCode, profile, onUpdate }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [list, setList] = useState<NriFieldDossier[]>(() => sanitizeFieldDossiers(profile.fieldDossiers));
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NriFieldDossier | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    setList(sanitizeFieldDossiers(profile.fieldDossiers));
  }, [profile.fieldDossiers]);

  const persist = async (next: NriFieldDossier[]) => {
    if (!authToken) return;
    setBusy(true);
    setErr(null);
    setOkMsg(null);
    const res = await nriSaveFieldDossiers(authToken, inviteCode, next);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setList(res.fieldDossiers);
    onUpdate?.(res.fieldDossiers);
    setOkMsg('Сохранено');
  };

  const startCreate = () => {
    const card = emptyFieldDossier();
    setEditId(card.id);
    setDraft(card);
    setErr(null);
    setOkMsg(null);
  };

  const startEdit = (card: NriFieldDossier) => {
    setEditId(card.id);
    setDraft({ ...card });
    setErr(null);
    setOkMsg(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setDraft(null);
  };

  const saveDraft = async () => {
    if (!draft) return;
    const stamped = { ...draft, updatedAt: Date.now() };
    const exists = list.some((d) => d.id === stamped.id);
    const next = exists
      ? list.map((d) => (d.id === stamped.id ? stamped : d))
      : [stamped, ...list];
    await persist(next);
    setEditId(null);
    setDraft(null);
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить карточку досье?')) return;
    if (editId === id) cancelEdit();
    await persist(list.filter((d) => d.id !== id));
  };

  const setField = <K extends keyof NriFieldDossier>(key: K, value: NriFieldDossier[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  };

  return (
    <div className={`nri-field-dossiers nri-deck-pda${draft ? ' nri-deck-pda--editing' : ''}`}>
      <header className="nri-chars__head nri-deck-pda__head">
        <h3 className="nri-deck-sheet__title">Field-PDA</h3>
        <p className="mono-text opacity-70">
          Карточки без статов. Видны только вам.
        </p>
      </header>

      {!draft && (
        <div className="nri-deck-pda__toolbar">
          <button type="button" className="nri-lobby__copy nri-deck-pda__primary" disabled={busy} onClick={startCreate}>
            <Plus size={16} /> Новое досье
          </button>
        </div>
      )}

      {err && <p className="nri-lobby__err mono-text">{err}</p>}
      {okMsg && !err && <p className="mono-text nri-scenario__checkpoint-ok">{okMsg}</p>}

      {draft && (
        <div className="nri-field-dossiers__form nri-deck-pda__form">
          <label className="nri-modal__field">
            <span>Имя</span>
            <input
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Пётр"
              autoComplete="off"
            />
          </label>
          <label className="nri-modal__field">
            <span>Принадлежность</span>
            <input
              value={draft.affiliation}
              onChange={(e) => setField('affiliation', e.target.value)}
              placeholder="банда Серебряных Глаз"
              autoComplete="off"
            />
          </label>
          <label className="nri-modal__field">
            <span>Важность</span>
            <input
              value={draft.importance}
              onChange={(e) => setField('importance', e.target.value)}
              placeholder="топ / важный / массовка"
              autoComplete="off"
            />
          </label>
          <label className="nri-modal__field">
            <span>Вещи</span>
            <input
              value={draft.belongings}
              onChange={(e) => setField('belongings', e.target.value)}
              placeholder="пистолет, ключ-карта…"
              autoComplete="off"
            />
          </label>
          <label className="nri-modal__field">
            <span>Приметы</span>
            <input
              value={draft.marks}
              onChange={(e) => setField('marks', e.target.value)}
              placeholder="тату на лице"
              autoComplete="off"
            />
          </label>
          <label className="nri-modal__field">
            <span>Заметки</span>
            <textarea
              className="nri-notes__editor mono-text"
              rows={3}
              value={draft.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Что ещё важно помнить…"
            />
          </label>
          <div className="nri-deck-pda__sticky" role="group" aria-label="Действия досье">
            <button type="button" className="nri-lobby__close" onClick={cancelEdit}>
              <X size={16} /> Отмена
            </button>
            <button type="button" className="nri-modal__submit nri-deck-pda__primary" disabled={busy} onClick={saveDraft}>
              <Save size={16} /> Сохранить
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && !draft && (
        <p className="mono-text opacity-50 nri-chars__empty">Пока пусто — создайте карточку.</p>
      )}

      {!draft && (
        <ul className="nri-chars__list nri-deck-pda__list">
          {list.map((card) => (
            <li key={card.id} className="nri-chars__card nri-deck-pda__card">
              <button type="button" className="nri-chars__summary" onClick={() => startEdit(card)}>
                <span className="nri-chars__avatar">
                  <User size={16} />
                </span>
                <span className="nri-chars__names">
                  <strong>{card.name.trim() || 'Без имени'}</strong>
                  <span className="mono-text opacity-70">
                    {[card.affiliation, card.importance].filter(Boolean).join(' · ') || 'досье'}
                  </span>
                </span>
              </button>
              <div className="nri-chars__detail nri-field-dossiers__preview">
                {card.belongings && (
                  <p className="mono-text">
                    <span className="opacity-50">Вещи:</span> {card.belongings}
                  </p>
                )}
                {card.marks && (
                  <p className="mono-text">
                    <span className="opacity-50">Приметы:</span> {card.marks}
                  </p>
                )}
                {card.notes && <p className="mono-text opacity-80">{card.notes}</p>}
                <div className="nri-presets__actions">
                  <button type="button" className="nri-lobby__copy" onClick={() => startEdit(card)}>
                    Править
                  </button>
                  <button type="button" className="nri-lobby__close" disabled={busy} onClick={() => remove(card.id)}>
                    <Trash2 size={14} /> Удалить
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

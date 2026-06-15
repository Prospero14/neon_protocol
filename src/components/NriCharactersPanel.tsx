import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Save, User, X } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { nriFetchRoster, nriPatchPlayer, type NriRosterPlayer } from '../logic/nriApi';
import {
  applyMetaToSheet,
  ensureCompleteSheet,
  sheetToMetaDraft,
  type CharacterMetaDraft,
} from '../logic/nriCharacterGen';
import { getNriClass, type NriClassId } from '../logic/nriClasses';
import { parseNriSheet, type NriSheetData } from '../logic/nriNpcGenerator';
import { NriCharacterMetaForm } from './NriCharacterMetaForm';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';

type Props = {
  inviteCode: string;
};

function sheetForEdit(raw: unknown, classId: string, displayName: string): NriSheetData {
  const completed = ensureCompleteSheet(raw, classId as NriClassId, displayName);
  return parseNriSheet(completed) ?? completed;
}

export const NriCharactersPanel: React.FC<Props> = ({ inviteCode }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editSheet, setEditSheet] = useState<NriSheetData | null>(null);
  const [editMeta, setEditMeta] = useState<CharacterMetaDraft>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const list = await nriFetchRoster(authToken, inviteCode);
    if (list === null) {
      setErr('Не удалось загрузить чарников');
      return;
    }
    setErr(null);
    setRoster(list);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const startEdit = (p: NriRosterPlayer) => {
    const sheet = sheetForEdit(p.sheet, p.classId, p.displayName);
    setEditId(p.userId);
    setEditDisplayName(p.displayName);
    setEditSheet(sheet);
    setEditMeta(sheetToMetaDraft(sheet, p.displayName));
    setExpandedId(p.userId);
    setErr(null);
  };

  const saveEdit = async () => {
    if (!authToken || !editId) return;
    const p = roster.find((r) => r.userId === editId);
    if (!p) return;
    const base = editSheet ?? sheetForEdit(p.sheet, p.classId, editDisplayName);
    setBusy(true);
    setErr(null);
    const merged = applyMetaToSheet(base, editMeta);
    const res = await nriPatchPlayer(authToken, inviteCode, editId, {
      displayName: editDisplayName.trim() || editMeta.characterName || p.displayName,
      sheet: merged,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setEditId(null);
    await refresh();
  };

  const editingPlayer = editId ? roster.find((r) => r.userId === editId) : null;
  const previewSheet =
    editingPlayer && editId
      ? applyMetaToSheet(editSheet ?? sheetForEdit(editingPlayer.sheet, editingPlayer.classId, editDisplayName), editMeta)
      : null;

  return (
    <div className="nri-chars">
      <header className="nri-chars__head">
        <h3 className="mono-text">Чарники за столом</h3>
        <p className="mono-text opacity-70">
          Листы игроков. Мастер может править имя персонажа и бэкстори после создания.
        </p>
      </header>

      {err && <p className="nri-lobby__err mono-text">{err}</p>}

      {roster.length === 0 && !err && (
        <p className="mono-text opacity-50 nri-chars__empty">
          Пока никто не заполнил лист — игроки увидят форму после входа по ссылке.
        </p>
      )}

      <ul className="nri-chars__list">
        {roster.map((p) => {
          const cls = getNriClass(p.classId);
          const open = expandedId === p.userId;
          const editing = editId === p.userId;
          return (
            <li key={p.userId} className={`nri-chars__card ${open ? 'open' : ''}`}>
              <button
                type="button"
                className="nri-chars__summary"
                onClick={() => setExpandedId(open ? null : p.userId)}
              >
                <span className="nri-chars__avatar">
                  <User size={16} />
                </span>
                <span className="nri-chars__names">
                  <strong>{p.displayName}</strong>
                  <span className="mono-text opacity-70">
                    {cls?.name ?? p.classId} · @{p.username}
                  </span>
                </span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {open && (
                <div className="nri-chars__detail">
                  <div className="nri-presets__actions">
                    {!editing ? (
                      <button type="button" className="nri-lobby__copy" onClick={() => startEdit(p)}>
                        <Pencil size={14} /> Имя / бэкстори
                      </button>
                    ) : (
                      <>
                        <button type="button" className="nri-lobby__close" onClick={() => setEditId(null)}>
                          <X size={14} /> Отмена
                        </button>
                        <button type="button" className="nri-modal__submit" disabled={busy} onClick={saveEdit}>
                          <Save size={14} /> Сохранить
                        </button>
                      </>
                    )}
                  </div>
                  {editing && (
                    <div className="nri-presets__wizard nri-presets__wizard--compact">
                      <label className="nri-modal__field">
                        <span>Имя в лобби</span>
                        <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} />
                      </label>
                      <NriCharacterMetaForm
                        meta={editMeta}
                        sheet={editSheet ?? undefined}
                        onChange={(m) => {
                          setEditMeta(m);
                          if (editSheet) setEditSheet(applyMetaToSheet(editSheet, m));
                        }}
                      />
                    </div>
                  )}
                  <NriCharacterSheetContent
                    profile={{
                      displayName: editing ? editDisplayName : p.displayName,
                      classId: p.classId,
                      inventory: p.inventory,
                      sheet: editing && previewSheet ? previewSheet : p.sheet,
                      portraitUrl: p.portraitUrl,
                    }}
                    accountUsername={p.username}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

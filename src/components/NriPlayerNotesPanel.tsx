import React, { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { nriSavePlayerNotes, type NriPlayerProfile } from '../logic/nriApi';

type Props = {
  inviteCode: string;
  profile: NriPlayerProfile;
  onNotesUpdate?: (notes: string) => void;
};

export const NriPlayerNotesPanel: React.FC<Props> = ({ inviteCode, profile, onNotesUpdate }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [text, setText] = useState(profile.privateNotes ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(profile.privateNotes ?? '');
  }, [profile.privateNotes]);

  const persist = async (value: string) => {
    if (!authToken) return;
    setBusy(true);
    setErr(null);
    const res = await nriSavePlayerNotes(authToken, inviteCode, value);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setSavedAt(Date.now());
    onNotesUpdate?.(res.privateNotes);
  };

  const onChange = (value: string) => {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(value), 1200);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  return (
    <div className="nri-notes">
      <header className="nri-chars__head">
        <h3 className="mono-text">Заметки</h3>
        <p className="mono-text opacity-70">
          Личные заметки {profile.displayName} — видны только вам, не мастеру и не другим игрокам.
        </p>
      </header>

      <textarea
        className="nri-notes__editor mono-text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Подсказки, цели, пароли, договорённости с группой…"
        rows={16}
      />

      <div className="nri-notes__footer">
        <button type="button" className="nri-modal__submit" disabled={busy} onClick={() => persist(text)}>
          <Save size={14} /> {busy ? 'Сохранение…' : 'Сохранить'}
        </button>
        {savedAt && !busy && (
          <span className="mono-text opacity-50">Сохранено {new Date(savedAt).toLocaleTimeString()}</span>
        )}
      </div>
      {err && <p className="nri-lobby__err mono-text">{err}</p>}
    </div>
  );
};

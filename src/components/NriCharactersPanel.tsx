import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { nriFetchRoster, type NriRosterPlayer } from '../logic/nriApi';
import { getNriClass } from '../logic/nriClasses';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';

type Props = {
  inviteCode: string;
};

export const NriCharactersPanel: React.FC<Props> = ({ inviteCode }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [roster, setRoster] = useState<NriRosterPlayer[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  return (
    <div className="nri-chars">
      <header className="nri-chars__head">
        <h3 className="mono-text">Чарники за столом</h3>
        <p className="mono-text opacity-70">
          Листы персонажей игроков, создавших профиль при входе по ссылке.
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
                  <NriCharacterSheetContent
                    profile={{
                      displayName: p.displayName,
                      classId: p.classId,
                      inventory: p.inventory,
                      sheet: p.sheet,
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

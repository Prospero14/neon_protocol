import React from 'react';
import { LogOut } from 'lucide-react';

type Props = {
  username: string;
  onLogout: () => void;
  /** Компактный вид — только иконка + @user на узких экранах */
  compact?: boolean;
};

/** Глобальный выход из аккаунта — виден на экранах без верхней nav (NRI, gate, combat…). */
export const AppAccountLogout: React.FC<Props> = ({ username, onLogout, compact }) => (
  <button
    type="button"
    className="app-account-logout mono-text"
    onClick={onLogout}
    title={`Выйти из аккаунта @${username} (можно войти другим логином)`}
    aria-label={`Выйти из аккаунта ${username}`}
  >
    <LogOut size={14} aria-hidden />
    <span className="app-account-logout__user">@{username}</span>
    {!compact && <span className="app-account-logout__label">· Выйти</span>}
  </button>
);

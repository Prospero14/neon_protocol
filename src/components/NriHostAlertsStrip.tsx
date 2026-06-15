import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { nriFetchHostAlerts, type NriHostAlert } from '../logic/nriApi';

type Props = { inviteCode: string; variant?: 'compact' | 'chat' };

export const NriHostAlertsStrip: React.FC<Props> = ({ inviteCode, variant = 'compact' }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [alerts, setAlerts] = useState<NriHostAlert[]>([]);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const list = await nriFetchHostAlerts(authToken, inviteCode);
    setAlerts(list.slice(0, variant === 'chat' ? 48 : 12));
  }, [authToken, inviteCode, variant]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  if (alerts.length === 0 && variant === 'compact') return null;

  return (
    <aside className={`nri-host-alerts ${variant === 'chat' ? 'nri-host-alerts--chat' : ''}`}>
      <h4 className="mono-text">Служебные уведомления</h4>
      <p className="mono-text opacity-60">
        {variant === 'chat'
          ? 'Перемещения игроков и перегруз транспорта. Дублируются в личку мастера.'
          : 'Перемещения и перегруз транспорта — дублируются в личку мастера.'}
      </p>
      {alerts.length === 0 ? (
        <p className="mono-text opacity-50 nri-host-alerts__empty">Пока нет служебных событий.</p>
      ) : (
        <ul className="nri-host-alerts__list">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`nri-host-alerts__item ${a.kind === 'vehicle_overload' ? 'nri-host-alerts__item--warn' : ''}`}
            >
              <span className="mono-text opacity-50">
                {a.fromDisplayName ?? 'игрок'} · {new Date(a.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <p className="mono-text">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

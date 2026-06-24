import React, { useEffect } from 'react';
import type { NriAchievementUnlock } from '../logic/nriApi';

type Props = {
  unlocks: NriAchievementUnlock[];
  onDismiss: () => void;
};

export const NriAchievementToast: React.FC<Props> = ({ unlocks, onDismiss }) => {
  useEffect(() => {
    if (!unlocks.length) return;
    const t = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(t);
  }, [unlocks, onDismiss]);

  if (!unlocks.length) return null;

  return (
    <div className="nri-ach-toast" role="status">
      {unlocks.map((u) => (
        <div key={u.id} className="nri-ach-toast__item">
          <span className="nri-ach-toast__icon">{u.icon}</span>
          <div>
            <strong className="mono-text">Ачивка: {u.title}</strong>
            <p className="mono-text opacity-70">{u.blurb}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

import React from 'react';
import { Phone } from 'lucide-react';
import { parseNriSheet } from '../logic/nriNpcGenerator';
import type { NriPlayerProfile } from '../logic/nriApi';

type Props = {
  profile: NriPlayerProfile | null | undefined;
  onOpenChat?: () => void;
};

/** Входящий психоз-звонок мастера — пока encounter.active. */
export const NriPsychosisCallBanner: React.FC<Props> = ({ profile, onOpenChat }) => {
  const sheet = profile ? parseNriSheet(profile.sheet) : null;
  const active = !!sheet?.psychosisEncounter?.active;
  if (!active) return null;

  return (
    <aside className="nri-psychosis-call" role="status">
      <Phone size={18} className="nri-psychosis-call__icon" />
      <div>
        <strong>Входящий психоз-звонок</strong>
        <p className="mono-text opacity-80">Мастер на линии. Откройте личку и держите связь до конца энкаунтера.</p>
      </div>
      {onOpenChat && (
        <button type="button" className="nri-vault__send-btn" onClick={onOpenChat}>
          В чат
        </button>
      )}
    </aside>
  );
};

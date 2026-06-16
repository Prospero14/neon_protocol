import React, { useState } from 'react';
import { Dices, MapPin } from 'lucide-react';
import type { NriRosterPlayer } from '../logic/nriApi';
import { NriDicePanel } from './NriDicePanel';
import { NriTacticalMapPanel } from './NriTacticalMapPanel';
import type { VaultRecipient } from './NriVaultTab';

export type MasterToolsSection = 'tactical' | 'dice';

type Props = {
  inviteCode: string;
  authToken: string;
  roomId: string;
  roster: NriRosterPlayer[];
  recipients: VaultRecipient[];
  currentUserId?: string;
  onVaultCreated?: () => void;
};

const SECTIONS: { id: MasterToolsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'tactical', label: 'Схема боя', icon: <MapPin size={13} /> },
  { id: 'dice', label: 'Кубики', icon: <Dices size={13} /> },
];

export const NriMasterToolsHub: React.FC<Props> = ({
  inviteCode,
  authToken,
  roomId,
  roster,
  recipients,
  currentUserId,
  onVaultCreated,
}) => {
  const [section, setSection] = useState<MasterToolsSection>('tactical');

  return (
    <div className="nri-master-tools">
      <nav className="nri-people-subtabs" aria-label="Инструменты мастера">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={section === s.id ? 'active' : ''}
            onClick={() => setSection(s.id)}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </nav>
      <div className="nri-master-tools__body">
        {section === 'tactical' && (
          <NriTacticalMapPanel
            authToken={authToken}
            roomId={roomId}
            nriCode={inviteCode}
            roster={roster}
            recipients={recipients}
            currentUserId={currentUserId}
            onVaultCreated={onVaultCreated}
          />
        )}
        {section === 'dice' && (
          <NriDicePanel
            authToken={authToken}
            roomId={roomId}
            nriCode={inviteCode}
            recipients={recipients}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
};

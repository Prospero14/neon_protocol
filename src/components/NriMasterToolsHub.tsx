import React, { useState } from 'react';
import { Dices, MapPin, ScrollText, Skull, UserCircle, Users, AlertTriangle } from 'lucide-react';
import type { NriRosterPlayer } from '../logic/nriApi';
import { NriDicePanel } from './NriDicePanel';
import { NriTacticalMapPanel } from './NriTacticalMapPanel';
import { NriMasterStatusPanel } from './NriMasterStatusPanel';
import { NriPresetsPanel } from './NriPresetsPanel';
import { NriNpcsPanel } from './NriNpcsPanel';
import { NriCombatantsPanel } from './NriCombatantsPanel';
import { C2185_SKILLS } from '../logic/nriCarbon2185';
import { getBackstoryPoolSize } from '../logic/nriBackstories';
import type { VaultRecipient } from './NriVaultTab';

export type MasterToolsSection =
  | 'tactical'
  | 'dice'
  | 'status'
  | 'gen_players'
  | 'gen_npcs'
  | 'gen_combatants';

type Props = {
  inviteCode: string;
  authToken: string;
  roomId: string;
  roster: NriRosterPlayer[];
  recipients: VaultRecipient[];
  currentUserId?: string;
  onVaultCreated?: () => void;
};

const SECTIONS: { id: MasterToolsSection; label: string; icon: React.ReactNode; group?: string }[] = [
  { id: 'tactical', label: 'Схема боя', icon: <MapPin size={13} />, group: 'стол' },
  { id: 'dice', label: 'Кубики', icon: <Dices size={13} />, group: 'стол' },
  { id: 'status', label: 'Статусы', icon: <AlertTriangle size={13} />, group: 'стол' },
  { id: 'gen_players', label: 'Игроки', icon: <UserCircle size={13} />, group: 'ген' },
  { id: 'gen_npcs', label: 'НПС', icon: <Users size={13} />, group: 'ген' },
  { id: 'gen_combatants', label: 'Боевики', icon: <Skull size={13} />, group: 'ген' },
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
      <nav className="nri-people-subtabs nri-master-tools__nav" aria-label="Инструменты мастера">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={section === s.id ? 'active' : ''}
            onClick={() => setSection(s.id)}
            title={s.group === 'ген' ? 'Генерация персонажей' : undefined}
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
        {section === 'status' && (
          <NriMasterStatusPanel
            inviteCode={inviteCode}
            authToken={authToken}
            roomId={roomId}
            recipients={recipients}
            currentUserId={currentUserId}
          />
        )}
        {section === 'gen_players' && (
          <div className="nri-people-gen__block">
            <header className="nri-chars__head">
              <ScrollText size={16} />
              <div>
                <h3 className="mono-text">Персонажи для игроков</h3>
                <p className="mono-text opacity-70">
                  Всего в системе {C2185_SKILLS.length} навыков; класс выбирает 2 из своего пула. Биографий в генераторе: {getBackstoryPoolSize()}+.
                </p>
              </div>
            </header>
            <NriPresetsPanel inviteCode={inviteCode} mode="gen" />
          </div>
        )}
        {section === 'gen_npcs' && (
          <div className="nri-people-gen__block">
            <NriNpcsPanel inviteCode={inviteCode} mode="gen" selectedNpcId={null} onSelectNpc={() => {}} />
          </div>
        )}
        {section === 'gen_combatants' && (
          <div className="nri-people-gen__block">
            <NriCombatantsPanel inviteCode={inviteCode} />
          </div>
        )}
      </div>
    </div>
  );
};

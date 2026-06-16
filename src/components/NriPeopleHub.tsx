import React from 'react';
import { Dices, ScrollText, Skull, UserCircle, Users } from 'lucide-react';
import { NriCharactersPanel } from './NriCharactersPanel';
import { NriPresetsPanel } from './NriPresetsPanel';
import { NriNpcsPanel } from './NriNpcsPanel';
import { NriCombatantsPanel } from './NriCombatantsPanel';

export type PeopleSection = 'chars' | 'npcs' | 'combatants' | 'players' | 'gen';

type Props = {
  inviteCode: string;
  section: PeopleSection;
  onSectionChange: (s: PeopleSection) => void;
  selectedNpcId: string | null;
  onSelectNpc: (npc: { id: string; name: string; imageUrl?: string | null; archetype?: string } | null) => void;
  onOpenChat?: () => void;
};

const SECTIONS: { id: PeopleSection; label: string; icon: React.ReactNode }[] = [
  { id: 'chars', label: 'Чарники', icon: <ScrollText size={13} /> },
  { id: 'npcs', label: 'НПС', icon: <Users size={13} /> },
  { id: 'combatants', label: 'Боевики', icon: <Skull size={13} /> },
  { id: 'players', label: 'Игроки', icon: <UserCircle size={13} /> },
  { id: 'gen', label: 'Генерация', icon: <Dices size={13} /> },
];

export const NriPeopleHub: React.FC<Props> = ({
  inviteCode,
  section,
  onSectionChange,
  selectedNpcId,
  onSelectNpc,
  onOpenChat,
}) => (
  <div className="nri-people-hub">
    <nav className="nri-people-subtabs" aria-label="Раздел персонажей">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={section === s.id ? 'active' : ''}
          onClick={() => onSectionChange(s.id)}
        >
          {s.icon}
          {s.label}
        </button>
      ))}
    </nav>

    <div className="nri-people-hub__body">
      {section === 'chars' && <NriCharactersPanel inviteCode={inviteCode} />}
      {section === 'npcs' && (
        <NriNpcsPanel
          inviteCode={inviteCode}
          mode="list"
          selectedNpcId={selectedNpcId}
          onSelectNpc={onSelectNpc}
          onOpenChat={onOpenChat}
        />
      )}
      {section === 'combatants' && <NriCombatantsPanel inviteCode={inviteCode} />}
      {section === 'players' && <NriPresetsPanel inviteCode={inviteCode} mode="players" />}
      {section === 'gen' && (
        <div className="nri-people-gen">
          <section className="nri-people-gen__block">
            <h4 className="mono-text nri-people-gen__title">Персонажи для игроков</h4>
            <NriPresetsPanel inviteCode={inviteCode} mode="gen" />
          </section>
          <section className="nri-people-gen__block">
            <h4 className="mono-text nri-people-gen__title">НПС</h4>
            <NriNpcsPanel inviteCode={inviteCode} mode="gen" selectedNpcId={null} onSelectNpc={() => {}} />
          </section>
        </div>
      )}
    </div>
  </div>
);

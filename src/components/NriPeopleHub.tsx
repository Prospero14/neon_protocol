import React from 'react';
import { ScrollText, Users } from 'lucide-react';
import { NriCharactersPanel } from './NriCharactersPanel';
import { NriPresetsPanel } from './NriPresetsPanel';
import { NriNpcsPanel } from './NriNpcsPanel';

export type PeopleSection = 'chars' | 'npcs' | 'players';

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
  { id: 'players', label: 'Игроки', icon: <Users size={13} /> },
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

    <p className="mono-text nri-people-hub__hint opacity-60">
      Генерация, боевики и схема боя — во вкладке <strong>МАСТЕР</strong>.
    </p>

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
      {section === 'players' && <NriPresetsPanel inviteCode={inviteCode} mode="players" />}
    </div>
  </div>
);

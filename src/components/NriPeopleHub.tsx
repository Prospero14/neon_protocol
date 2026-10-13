import React, { useState } from 'react';
import { ScrollText, Skull, Users, UserCircle } from 'lucide-react';
import { NriCharactersPanel } from './NriCharactersPanel';
import { NriPresetsPanel } from './NriPresetsPanel';
import { NriNpcsPanel } from './NriNpcsPanel';
import { NriCombatantsPanel } from './NriCombatantsPanel';

export type PeopleSection = 'chars' | 'presets' | 'npcs' | 'combatants';

type GenKind = 'players' | 'npcs' | 'combatants';

type Props = {
  inviteCode: string;
  section: PeopleSection;
  onSectionChange: (s: PeopleSection) => void;
  selectedNpcId: string | null;
  onSelectNpc: (npc: { id: string; name: string; imageUrl?: string | null; archetype?: string } | null) => void;
  onOpenChat?: () => void;
};

const SECTIONS: { id: PeopleSection; label: string; icon: React.ReactNode }[] = [
  { id: 'presets', label: 'Генерация', icon: <UserCircle size={13} /> },
  { id: 'chars', label: 'Чарники', icon: <ScrollText size={13} /> },
  { id: 'npcs', label: 'НПС', icon: <Users size={13} /> },
  { id: 'combatants', label: 'Боевики', icon: <Skull size={13} /> },
];

const GEN_KINDS: { id: GenKind; label: string }[] = [
  { id: 'players', label: 'Игроки' },
  { id: 'npcs', label: 'НПС' },
  { id: 'combatants', label: 'Боевики' },
];

export const NriPeopleHub: React.FC<Props> = ({
  inviteCode,
  section,
  onSectionChange,
  selectedNpcId,
  onSelectNpc,
  onOpenChat,
}) => {
  const [genKind, setGenKind] = useState<GenKind>('players');

  return (
    <div className="nri-people-hub nri-deck-module">
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
        {section === 'presets' &&
          'Здесь собираете листы: игроки, НПС и боевики. Сохранённые — во вкладках «НПС» / «Боевики» / «Чарники».'}
        {section === 'chars' && 'Игроки за столом — листы без генерации.'}
        {section === 'npcs' &&
          'Список НПС стола. Новых создавайте во вкладке «Генерация» → НПС.'}
        {section === 'combatants' &&
          'Список боевиков для схемы боя. Новых — во вкладке «Генерация» → Боевики.'}
      </p>

      {section === 'presets' && (
        <nav className="nri-people-subtabs nri-people-subtabs--nested" aria-label="Что генерировать">
          {GEN_KINDS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={genKind === g.id ? 'active' : ''}
              onClick={() => setGenKind(g.id)}
            >
              {g.label}
            </button>
          ))}
        </nav>
      )}

      <div className="nri-people-hub__body">
        {section === 'presets' && genKind === 'players' && (
          <NriPresetsPanel inviteCode={inviteCode} mode="full" />
        )}
        {section === 'presets' && genKind === 'npcs' && (
          <NriNpcsPanel
            inviteCode={inviteCode}
            mode="gen"
            selectedNpcId={selectedNpcId}
            onSelectNpc={onSelectNpc}
            onOpenChat={onOpenChat}
          />
        )}
        {section === 'presets' && genKind === 'combatants' && (
          <NriCombatantsPanel inviteCode={inviteCode} mode="gen" />
        )}
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
        {section === 'combatants' && <NriCombatantsPanel inviteCode={inviteCode} mode="list" />}
      </div>
    </div>
  );
};

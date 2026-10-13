import React, { useState } from 'react';
import { ScrollText, StickyNote } from 'lucide-react';
import type { NriPlayerProfile } from '../logic/nriApi';
import type { NriFieldDossier } from '../../shared/nri-domain/fieldDossiers';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';
import { NriFieldDossiersPanel } from './NriFieldDossiersPanel';

type PlayerSection = 'mine' | 'dossiers';

type Props = {
  inviteCode: string;
  profile: NriPlayerProfile;
  accountUsername?: string;
  onProfileUpdate?: (profile: NriPlayerProfile) => void;
};

const SECTIONS: { id: PlayerSection; label: string; icon: React.ReactNode }[] = [
  { id: 'mine', label: 'Мой чарник', icon: <ScrollText size={14} /> },
  { id: 'dossiers', label: 'Досье', icon: <StickyNote size={14} /> },
];

export const NriPlayerCharactersHub: React.FC<Props> = ({
  inviteCode,
  profile,
  accountUsername,
  onProfileUpdate,
}) => {
  const [section, setSection] = useState<PlayerSection>('mine');

  return (
    <div className="nri-people-hub nri-deck-module">
      <nav className="nri-people-subtabs" aria-label="Персонажи игрока">
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

      <p className="mono-text nri-people-hub__hint nri-deck-module__hint">
        {section === 'mine' && 'Ваш лист. Полный ростер и генерация — у мастера.'}
        {section === 'dossiers' && 'Field-PDA: имя · принадлежность · важность · вещи · приметы.'}
      </p>

      <div className="nri-people-hub__body">
        {section === 'mine' && (
          <div className="nri-chars nri-deck-sheet">
            <header className="nri-chars__head nri-deck-sheet__head">
              <span className="nri-lobby__chip nri-lobby__chip--host">ПК</span>
              <div>
                <h3 className="nri-deck-sheet__title">{profile.displayName}</h3>
                <p className="mono-text opacity-70">Правки имени и бэкстори — через мастера.</p>
              </div>
            </header>
            <NriCharacterSheetContent
              profile={profile}
              accountUsername={accountUsername}
              gmView={false}
            />
          </div>
        )}
        {section === 'dossiers' && (
          <NriFieldDossiersPanel
            inviteCode={inviteCode}
            profile={profile}
            onUpdate={(fieldDossiers: NriFieldDossier[]) =>
              onProfileUpdate?.({ ...profile, fieldDossiers })
            }
          />
        )}
      </div>
    </div>
  );
};

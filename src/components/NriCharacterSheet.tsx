import React from 'react';
import { X } from 'lucide-react';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';
import type { NriPlayerProfile } from '../logic/nriApi';

type Props = {
  profile: NriPlayerProfile;
  onClose: () => void;
  title?: string;
};

export const NriCharacterSheet: React.FC<Props> = ({ profile, onClose, title }) => {
  return (
    <div className="nri-modal-overlay" onClick={onClose}>
      <div className="nri-modal nri-modal--sheet nri-modal--c2185" onClick={(e) => e.stopPropagation()}>
        <div className="nri-modal__head-row">
          <h2 className="nri-modal__title">{title ?? profile.displayName ?? 'Лист персонажа'}</h2>
          <button type="button" className="nri-modal__close-x" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        <div className="nri-modal__sheet-scroll">
          <NriCharacterSheetContent profile={profile} />
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { NriCharacterSheetContent } from './NriCharacterSheetContent';
import type { NriPlayerProfile } from '../logic/nriApi';

type Props = {
  profile: NriPlayerProfile;
  onClose: () => void;
};

export const NriCharacterSheet: React.FC<Props> = ({ profile, onClose }) => {
  return (
    <div className="nri-modal-overlay" onClick={onClose}>
      <div className="nri-modal nri-modal--sheet nri-modal--c2185" onClick={(e) => e.stopPropagation()}>
        <h2 className="nri-modal__title">Лист персонажа</h2>
        <NriCharacterSheetContent profile={profile} />
        <button type="button" className="nri-modal__submit" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};

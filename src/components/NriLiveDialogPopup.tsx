import React from 'react';
import type { ChatMessage } from '../logic/chatApi';

type Props = {
  message: ChatMessage | null;
  onClose: () => void;
};

/** Полноэкранный попап реплики НПС перед появлением в ленте чата. */
export const NriLiveDialogPopup: React.FC<Props> = ({ message, onClose }) => {
  if (!message?.isNpc) return null;
  const name = message.npcName ?? 'NPC';
  const typeLabel = message.npcArchetype;
  return (
    <div className="nri-live-dialog" role="dialog" aria-modal="true" aria-label={`Реплика: ${name}`}>
      <div className="nri-live-dialog__backdrop" onClick={onClose} />
      <div className="nri-live-dialog__frame">
        <div className="nri-live-dialog__portrait-wrap">
          {message.npcImageUrl ? (
            <img src={message.npcImageUrl} alt="" className="nri-live-dialog__portrait" />
          ) : (
            <span className="nri-live-dialog__portrait nri-live-dialog__portrait--ph">
              {typeLabel ? typeLabel.slice(0, 1).toUpperCase() : name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="nri-live-dialog__bubble">
          <span className="nri-live-dialog__name">{name}</span>
          {typeLabel ? <span className="nri-live-dialog__type mono-text">{typeLabel}</span> : null}
          <p className="nri-live-dialog__text">{message.text}</p>
          <button type="button" className="nri-live-dialog__next mono-text" onClick={onClose}>
            Далее ▶
          </button>
        </div>
      </div>
    </div>
  );
};

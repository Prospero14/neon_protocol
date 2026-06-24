import React from 'react';
import type { ChatMessage } from '../logic/chatApi';
import type { NriNpc } from '../logic/nriApi';
import { resolveNpcPortraitUrl } from '../../shared/nri-domain/npcPortrait';

type Props = {
  message: ChatMessage | null;
  variant?: 'full' | 'mini';
  interference?: boolean;
  onNext: () => void;
  tableNpcs?: Pick<NriNpc, 'id' | 'imageUrl' | 'sheet'>[];
};

function portraitForMessage(
  message: ChatMessage,
  tableNpcs?: Pick<NriNpc, 'id' | 'imageUrl' | 'sheet'>[],
): string | undefined {
  if (message.npcImageUrl?.trim()) return message.npcImageUrl.trim();
  if (!message.npcId || !tableNpcs?.length) return undefined;
  const npc = tableNpcs.find((n) => n.id === message.npcId);
  return resolveNpcPortraitUrl(npc);
}

/** Попап реплики НПС: полный у игроков, мини-превью у мастера. */
export const NriLiveDialogPopup: React.FC<Props> = ({
  message,
  variant = 'full',
  interference = false,
  onNext,
  tableNpcs,
}) => {
  if (!message?.isNpc) return null;
  const name = message.npcName ?? 'NPC';
  const typeLabel = message.npcArchetype;
  const portrait = portraitForMessage(message, tableNpcs);
  const isMini = variant === 'mini';

  const body = (
    <div className={`nri-live-dialog__frame ${isMini ? 'nri-live-dialog__frame--mini' : ''}`}>
      <div className={`nri-live-dialog__portrait-wrap ${isMini ? 'nri-live-dialog__portrait-wrap--mini' : ''}`}>
        {portrait ? (
          <img src={portrait} alt="" className="nri-live-dialog__portrait" />
        ) : (
          <span className="nri-live-dialog__portrait nri-live-dialog__portrait--ph">
            {typeLabel ? typeLabel.slice(0, 1).toUpperCase() : name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className={`nri-live-dialog__bubble ${isMini ? 'nri-live-dialog__bubble--mini' : ''}`}>
        {isMini && <span className="nri-live-dialog__mini-label mono-text">Превью у игроков</span>}
        <span className="nri-live-dialog__name">{name}</span>
        {typeLabel ? <span className="nri-live-dialog__type mono-text">{typeLabel}</span> : null}
        {interference ? (
          <p className="nri-live-dialog__text nri-live-dialog__text--static" aria-live="polite">
            ▓▒░ ПОМЕХИ ░▒▓
            <br />
            <span className="mono-text">Канал нестабилен. Ожидайте реплику или завершение диалога мастером.</span>
          </p>
        ) : (
          <p className="nri-live-dialog__text">{message.text}</p>
        )}
        {!isMini && (
          <button type="button" className="nri-live-dialog__next mono-text" onClick={onNext}>
            Далее ▶
          </button>
        )}
      </div>
    </div>
  );

  if (isMini) {
    return (
      <div className="nri-live-dialog nri-live-dialog--mini" aria-label={`Превью: ${name}`}>
        {body}
      </div>
    );
  }

  return (
    <div className="nri-live-dialog" role="dialog" aria-modal="true" aria-label={`Реплика: ${name}`}>
      <div className="nri-live-dialog__backdrop" />
      <div className="nri-live-dialog__frame-wrap">{body}</div>
    </div>
  );
};

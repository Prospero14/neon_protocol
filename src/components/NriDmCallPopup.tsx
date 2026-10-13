import React, { useEffect, useState } from 'react';
import { PhoneOff, X } from 'lucide-react';
import { NeonChatPanel } from './services/NeonChatPanel';
import { NEON_OPEN_DM_EVENT } from '../logic/nriPsychosis';
import type { NriNpc, NriPlayerProfile, NriRosterPlayer, NriVaultFile } from '../logic/nriApi';

type Peer = { userId: string; label?: string };

type Props = {
  nriInviteCode: string;
  tableRoomId?: string | null;
  dmRecipients?: { userId: string; label: string }[];
  isTableHost?: boolean;
  hostLabel?: string;
  vaultFiles?: NriVaultFile[];
  speakAsNpc?: { id: string; name: string; imageUrl?: string | null; archetype?: string } | null;
  onSpeakAsNpcChange?: (npc: { id: string; name: string; imageUrl?: string | null; archetype?: string } | null) => void;
  npcSpeakers?: { id: string; name: string; imageUrl?: string | null; archetype?: string }[];
  nriProfile?: NriPlayerProfile | null;
  tableNpcs?: NriNpc[];
  tableRoster?: NriRosterPlayer[];
  onNriProfileUpdate?: (p: NriPlayerProfile) => void;
};

/**
 * Всплывающий живой DM-чат (психоз-звонок и neon:open-dm с popup:true).
 * Слушает событие даже когда вкладка «Чат» не смонтирована.
 */
export const NriDmCallPopup: React.FC<Props> = ({
  nriInviteCode,
  tableRoomId,
  dmRecipients,
  isTableHost,
  hostLabel,
  vaultFiles,
  speakAsNpc,
  onSpeakAsNpcChange,
  npcSpeakers,
  nriProfile,
  tableNpcs,
  tableRoster,
  onNriProfileUpdate,
}) => {
  const [peer, setPeer] = useState<Peer | null>(null);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent<{ userId?: string; label?: string; popup?: boolean }>).detail;
      if (!detail?.userId) return;
      if (detail.popup === false) return;
      const label =
        detail.label ??
        dmRecipients?.find((r) => r.userId === detail.userId)?.label ??
        detail.userId;
      setPeer({ userId: detail.userId, label });
    };
    window.addEventListener(NEON_OPEN_DM_EVENT, onOpen);
    return () => window.removeEventListener(NEON_OPEN_DM_EVENT, onOpen);
  }, [dmRecipients]);

  if (!peer) return null;

  const title = peer.label ?? 'Игрок';

  return (
    <div className="nri-dm-call-popup" role="dialog" aria-modal="true" aria-label={`Звонок · ${title}`}>
      <button
        type="button"
        className="nri-dm-call-popup__backdrop"
        aria-label="Закрыть"
        onClick={() => setPeer(null)}
      />
      <div className="nri-dm-call-popup__panel">
        <header className="nri-dm-call-popup__head">
          <div>
            <p className="nri-dm-call-popup__kicker mono-text">личка · dm</p>
            <h3 className="nri-dm-call-popup__title">{title}</h3>
          </div>
          <button
            type="button"
            className="nri-dm-call-popup__close"
            onClick={() => setPeer(null)}
            title="Свернуть звонок"
          >
            <PhoneOff size={14} />
            <X size={14} />
          </button>
        </header>
        <div className="nri-dm-call-popup__body">
          <NeonChatPanel
            className="nri-dm-call-popup__chat"
            hideSidebar
            roomTitle={`Личка · ${title}`}
            fixedRoomId={tableRoomId ?? undefined}
            nriInviteCode={nriInviteCode}
            initialDmUserId={peer.userId}
            dmRecipients={dmRecipients}
            isTableHost={isTableHost}
            hostLabel={hostLabel}
            vaultFiles={vaultFiles}
            speakAsNpc={speakAsNpc}
            onSpeakAsNpcChange={onSpeakAsNpcChange}
            npcSpeakers={npcSpeakers}
            nriProfile={nriProfile}
            tableNpcs={tableNpcs}
            tableRoster={tableRoster}
            onNriProfileUpdate={onNriProfileUpdate}
          />
        </div>
      </div>
    </div>
  );
};

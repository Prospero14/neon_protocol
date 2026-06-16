import React, { useState } from 'react';
import { Send } from 'lucide-react';
import type { VaultRecipient } from './NriVaultTab';

type Props = {
  recipients: VaultRecipient[];
  currentUserId?: string;
  disabled?: boolean;
  busy?: boolean;
  label?: string;
  onSend: (target: { kind: 'table' } | { kind: 'dm'; userId: string }) => void;
};

export const NriChatSendBar: React.FC<Props> = ({
  recipients,
  currentUserId,
  disabled,
  busy,
  label = 'Отправить в чат',
  onSend,
}) => {
  const [channel, setChannel] = useState<'table' | 'dm'>('table');
  const [dmUserId, setDmUserId] = useState('');
  const dmList = recipients.filter((r) => r.userId !== currentUserId);

  const handleSend = () => {
    if (channel === 'dm') {
      if (!dmUserId) return;
      onSend({ kind: 'dm', userId: dmUserId });
      return;
    }
    onSend({ kind: 'table' });
  };

  return (
    <div className="nri-chat-send-bar">
      <label className="mono-text nri-chat-send-bar__field">
        Куда
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as 'table' | 'dm')}
          disabled={disabled || busy}
        >
          <option value="table">Чат стола</option>
          <option value="dm">Личка</option>
        </select>
      </label>
      {channel === 'dm' && (
        <label className="mono-text nri-chat-send-bar__field nri-chat-send-bar__field--grow">
          Игрок
          <select
            value={dmUserId}
            onChange={(e) => setDmUserId(e.target.value)}
            disabled={disabled || busy}
          >
            <option value="">—</option>
            {dmList.map((r) => (
              <option key={r.userId} value={r.userId}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        className="nri-modal__submit nri-chat-send-bar__btn"
        disabled={disabled || busy || (channel === 'dm' && !dmUserId)}
        onClick={handleSend}
      >
        <Send size={14} /> {busy ? '…' : label}
      </button>
    </div>
  );
};

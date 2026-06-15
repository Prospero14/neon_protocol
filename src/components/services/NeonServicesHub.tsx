import React, { useCallback, useEffect, useState } from 'react';
import { FileArchive, MessageSquare, Skull } from 'lucide-react';
import { useAuth } from '../../logic/AuthContext';
import { readNeonAuthToken } from '../../logic/authTokenStorage';
import {
  vaultCreateGlobal,
  vaultDeleteFile,
  vaultFetchGlobal,
  type NriVaultFile,
} from '../../logic/nriApi';
import { chatFetchUsers, chatGetSpamBot } from '../../logic/chatApi';
import { NeonChatPanel } from './NeonChatPanel';
import GibsonIceHack from '../games/GibsonIceHack';
import { NriVaultTab, type VaultRecipient } from '../NriVaultTab';

type Tab = 'chat' | 'ice' | 'vault';

type Props = {
  onIceReward: (bits: number) => void;
  onBack?: () => void;
};

export const NeonServicesHub: React.FC<Props> = ({ onIceReward, onBack }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [tab, setTab] = useState<Tab>(() => {
    const h = typeof window !== 'undefined' ? window.location.hash : '';
    if (h.includes('vault')) return 'vault';
    if (h.includes('ice')) return 'ice';
    return 'chat';
  });
  const [vaultFiles, setVaultFiles] = useState<NriVaultFile[]>([]);
  const [generalRoomId, setGeneralRoomId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<VaultRecipient[]>([]);

  const refreshVault = useCallback(async () => {
    if (!authToken) return;
    const files = await vaultFetchGlobal(authToken);
    setVaultFiles(files);
  }, [authToken]);

  const loadSendContext = useCallback(async () => {
    if (!authToken) return;
    const [spam, users] = await Promise.all([
      chatGetSpamBot(authToken),
      chatFetchUsers(authToken),
    ]);
    if (spam?.roomId) setGeneralRoomId(spam.roomId);
    setRecipients(users.map((u) => ({ userId: u.id, label: `@${u.username}` })));
  }, [authToken]);

  useEffect(() => {
    refreshVault();
    loadSendContext();
  }, [refreshVault, loadSendContext]);

  useEffect(() => {
    if (tab === 'vault') {
      refreshVault();
      loadSendContext();
    }
  }, [tab, refreshVault, loadSendContext]);

  const createGlobalFile = async (payload: {
    title: string;
    body: string;
    protected: boolean;
    gameId?: string;
    difficulty?: string;
  }) => {
    if (!authToken) return { ok: false as const, error: 'Нет авторизации' };
    const result = await vaultCreateGlobal(authToken, payload);
    if (result.ok) {
      setVaultFiles((prev) => [result.file, ...prev.filter((f) => f.id !== result.file.id)]);
    }
    return result;
  };

  return (
    <div className="neon-services">
      <header className="neon-services-head">
        <div>
          <h1 className="neon-services-title">NEON_SERVICES</h1>
          <p className="mono-text neon-services-sub">Микросервисы · чат + ICE arcade + vault</p>
        </div>
        {onBack && (
          <button type="button" className="neon-services-back" onClick={onBack}>
            ← В ИГРУ
          </button>
        )}
      </header>

      <nav className="neon-services-tabs">
        <button
          type="button"
          className={tab === 'chat' ? 'active' : ''}
          onClick={() => setTab('chat')}
        >
          <MessageSquare size={16} /> ЧАТ
        </button>
        <button
          type="button"
          className={tab === 'ice' ? 'active' : ''}
          onClick={() => setTab('ice')}
        >
          <Skull size={16} /> ICE RUN
        </button>
        <button
          type="button"
          className={tab === 'vault' ? 'active' : ''}
          onClick={() => setTab('vault')}
        >
          <FileArchive size={16} /> ФАЙЛОХРАНИЛИЩЕ
        </button>
      </nav>

      <div className="neon-services-body">
        {tab === 'chat' && (
          <NeonChatPanel
            showGeneralSpamToggle
            vaultFiles={vaultFiles}
          />
        )}
        {tab === 'ice' && (
          <GibsonIceHack
            onFinish={(bits) => {
              if (bits > 0) onIceReward(bits);
            }}
          />
        )}
        {tab === 'vault' && (
          <NriVaultTab
            files={vaultFiles}
            onCreate={createGlobalFile}
            onDelete={(fileId) => vaultDeleteFile(authToken!, fileId)}
            sendTarget={
              generalRoomId
                ? { roomId: generalRoomId, roomLabel: '#general' }
                : undefined
            }
            recipients={recipients}
          />
        )}
      </div>
    </div>
  );
};

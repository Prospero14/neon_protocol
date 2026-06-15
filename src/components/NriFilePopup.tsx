import React, { useEffect, useState } from 'react';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { vaultFetchFile, vaultUnlockFile, type NriVaultFile } from '../logic/nriApi';
import { IcebreakerRouter } from './games/IcebreakerRouter';
import type { IceDifficulty } from '../logic/nriGameCatalog';

type Props = {
  fileId: string;
  fileTitle?: string;
  fileProtected?: boolean;
  onClose: () => void;
};

export const NriFilePopup: React.FC<Props> = ({ fileId, fileTitle, fileProtected, onClose }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [file, setFile] = useState<NriVaultFile | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [iceMode, setIceMode] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;
    vaultFetchFile(authToken, fileId).then((data) => {
      if (!data) {
        setErr('Файл недоступен');
        return;
      }
      setFile(data.file);
      if (data.unlocked && data.body) {
        setUnlocked(true);
        setBody(data.body);
      } else if (!data.file.protected) {
        setUnlocked(true);
        setBody(data.file.body);
      }
    });
  }, [authToken, fileId]);

  const startIce = () => setIceMode(true);

  const onIceDone = async (won: boolean) => {
    setIceMode(false);
    if (!won || !authToken) return;
    const text = await vaultUnlockFile(authToken, fileId);
    if (text) {
      setUnlocked(true);
      setBody(text);
    } else {
      setErr('Не удалось разблокировать');
    }
  };

  if (iceMode && file?.gameId) {
    return (
      <div className="nri-modal-overlay">
        <div className="nri-modal nri-modal--ice">
          <IcebreakerRouter
            gameId={file.gameId}
            difficulty={(file.difficulty as IceDifficulty) ?? 'medium'}
            onComplete={onIceDone}
            onBack={() => setIceMode(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="nri-modal-overlay" onClick={onClose}>
      <div className="nri-modal nri-file-popup" onClick={(e) => e.stopPropagation()}>
        <h2 className="nri-modal__title">{file?.title ?? fileTitle ?? 'Файл'}</h2>
        {err && <p className="nri-lobby__err">{err}</p>}
        {!unlocked && (file?.protected ?? fileProtected) && (
          <div className="nri-file-popup__locked">
            <p className="mono-text">🔒 Защищённый файл — пройди icebreaker.</p>
            <button type="button" className="nri-modal__submit" onClick={startIce}>
              Запустить ICE
            </button>
          </div>
        )}
        {unlocked && body && (
          <pre className="nri-file-popup__body">{body}</pre>
        )}
        <button type="button" className="nri-modal__submit" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};

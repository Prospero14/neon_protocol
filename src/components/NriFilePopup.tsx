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
  const [icePassed, setIcePassed] = useState(false);
  const [rewardPassword, setRewardPassword] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);
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
      } else if (data.icePassed) {
        setIcePassed(true);
        if (data.rewardPassword) {
          setRewardPassword(data.rewardPassword);
          setPassword(data.rewardPassword);
        }
      }
    });
  }, [authToken, fileId]);

  const startIce = () => setIceMode(true);

  const onIceDone = async (won: boolean) => {
    setIceMode(false);
    if (!won || !authToken) return;
    const result = await vaultUnlockFile(authToken, fileId, { viaIce: true });
    if (result.body) {
      setUnlocked(true);
      setBody(result.body);
      setErr(null);
      return;
    }
    if (result.rewardPassword) {
      setIcePassed(true);
      setRewardPassword(result.rewardPassword);
      setPassword(result.rewardPassword);
      setErr(null);
      return;
    }
    setErr(result.error ?? 'Не удалось разблокировать');
  };

  const submitPassword = async () => {
    if (!authToken || !password.trim()) return;
    setUnlockBusy(true);
    setErr(null);
    const result = await vaultUnlockFile(authToken, fileId, { password });
    setUnlockBusy(false);
    if (result.body) {
      setUnlocked(true);
      setBody(result.body);
      setPassword('');
    } else {
      setErr(result.error ?? 'Неверный пароль');
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

  const locked = !unlocked && (file?.protected ?? fileProtected);
  const dualReward = file?.passwordIsIceReward === true;
  const showPasswordOnly = locked && file?.hasPassword && !dualReward;
  const showIce = locked && !!file?.gameId && !icePassed;
  const showCodeStep = locked && dualReward && icePassed;

  return (
    <div className="nri-modal-overlay" onClick={onClose}>
      <div className="nri-modal nri-file-popup" onClick={(e) => e.stopPropagation()}>
        <h2 className="nri-modal__title">{file?.title ?? fileTitle ?? 'Файл'}</h2>
        {err && <p className="nri-lobby__err">{err}</p>}
        {locked && (
          <div className="nri-file-popup__locked">
            <p className="mono-text">🔒 Защищённый файл</p>
            {dualReward && !icePassed && (
              <p className="mono-text opacity-70 nri-file-popup__hint">
                Пройди ICE — код доступа будет наградой за взлом.
              </p>
            )}
            {showIce && (
              <button type="button" className="nri-modal__submit" onClick={startIce}>
                Запустить ICE
              </button>
            )}
            {showCodeStep && rewardPassword && (
              <div className="nri-file-popup__reward mono-text">
                <span className="opacity-70">Код доступа извлечён:</span>
                <code>{rewardPassword}</code>
              </div>
            )}
            {(showPasswordOnly || showCodeStep) && (
              <div className="nri-file-popup__password">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={dualReward ? 'Код доступа' : 'Пароль'}
                  maxLength={64}
                  autoComplete="off"
                  onKeyDown={(e) => e.key === 'Enter' && submitPassword()}
                />
                <button type="button" className="nri-modal__submit" onClick={submitPassword} disabled={unlockBusy || !password.trim()}>
                  {unlockBusy ? '…' : 'Открыть'}
                </button>
              </div>
            )}
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

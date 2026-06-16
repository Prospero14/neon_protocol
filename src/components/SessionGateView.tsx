import React, { useState } from 'react';
import { MAP_NODES } from '../logic/mapData';
import type { SessionMode, CoopRole } from '../logic/sessionMode';
import { COOP_ROLES, COOP_ROLE_LABELS } from '../logic/sessionMode';
import type { CoopClassSave } from '../logic/coopClassProfiles';
import type { CreationResumeInfo } from '../logic/hooks/useGameState';

type Phase = 'mode' | 'roster';

export interface SessionGateViewProps {
  creationResume: CreationResumeInfo | null;
  playerName: string;
  homeDistrictId: string;
  coopClassProfiles: Partial<Record<CoopRole, CoopClassSave>>;
  pendingNriInvite?: string | null;
  nriGuestInviteCode?: string | null;
  soloCoopBlocked?: boolean;
  onEnterSolo: () => void;
  onEnterCoop: (role?: CoopRole) => void;
  onCreateNri: (title?: string) => void;
  onJoinNri: (code: string) => void;
  onOpenWizard: (mode: SessionMode) => void;
}

const SessionGateView: React.FC<SessionGateViewProps> = ({
  creationResume,
  playerName,
  homeDistrictId,
  coopClassProfiles,
  pendingNriInvite,
  nriGuestInviteCode,
  soloCoopBlocked = false,
  onEnterSolo,
  onEnterCoop,
  onCreateNri,
  onJoinNri,
  onOpenWizard,
}) => {
  const [phase, setPhase] = useState<Phase>('mode');
  const [pickedMode, setPickedMode] = useState<SessionMode | null>(null);
  const [nriTitle, setNriTitle] = useState('');
  const nriCodeHint = pendingNriInvite ?? nriGuestInviteCode ?? '';
  const [nriCodeInput, setNriCodeInput] = useState(nriCodeHint);

  const soloExists = creationResume?.soloPersonaExists ?? false;
  const coopExists = creationResume?.coopEstablished ?? false;
  const existingCoopRoles = COOP_ROLES.filter((r) => (coopClassProfiles[r]?.deckIds?.length ?? 0) > 0);
  const coopSlotsFull = existingCoopRoles.length >= COOP_ROLES.length;
  const homeLabel = MAP_NODES.find((n) => n.id === homeDistrictId)?.name ?? homeDistrictId;
  const displayName = playerName !== 'ID_НЕИЗВЕСТЕН' ? playerName : '—';

  const pickMode = (mode: SessionMode) => {
    if (soloCoopBlocked && (mode === 'solo' || mode === 'coop')) return;
    setPickedMode(mode);
    setPhase('roster');
  };

  const backToModes = () => {
    setPhase('mode');
    setPickedMode(null);
  };

  if (phase === 'mode') {
    return (
      <div className="session-resume-gate main-crt session-gate">
        <div className="session-resume-gate__panel session-gate__panel">
          <div className="session-resume-gate__kicker">NEON_PROTOCOL // СЕССИЯ</div>
          <h1 className="session-resume-gate__title">Выберите режим</h1>
          <p className="session-resume-gate__hint session-gate__hint">
            Затем — список персонажей этого режима и вход или создание нового профиля.
          </p>
          {soloCoopBlocked && (
            <div className="nri-dev-gate__banner mono-text">
              <strong>Solo</strong> и <strong>Co-op</strong> — <strong>в разработке</strong> для гостей по
              ссылке на НРИ-стол.
              {nriCodeHint ? (
                <>
                  {' '}
                  Вернитесь к столу <strong>{nriCodeHint}</strong> через режим НРИ.
                </>
              ) : (
                ' Используйте режим НРИ.'
              )}
            </div>
          )}
          {nriCodeHint && !soloCoopBlocked && (
            <div className="session-gate__nri-banner mono-text">
              Приглашение на стол <strong>{nriCodeHint}</strong> — выберите НРИ и войдите.
            </div>
          )}
          <div className="session-resume-gate__actions session-gate__mode-row session-gate__mode-row--3">
            <button
              type="button"
              className={`session-resume-btn session-resume-btn--solo session-gate__mode-btn ${soloExists ? 'session-gate__mode-btn--ready' : ''} ${soloCoopBlocked ? 'session-gate__mode-btn--disabled' : ''}`}
              disabled={soloCoopBlocked}
              onClick={() => pickMode('solo')}
            >
              <span className="session-gate__mode-title">SOLO</span>
              <span className="session-gate__mode-sub">
                {soloCoopBlocked ? 'в разработке' : soloExists ? 'персонаж в сети' : 'профиль ещё не создан'}
              </span>
            </button>
            <button
              type="button"
              className={`session-resume-btn session-resume-btn--coop session-gate__mode-btn ${coopExists ? 'session-gate__mode-btn--ready' : ''} ${soloCoopBlocked ? 'session-gate__mode-btn--disabled' : ''}`}
              disabled={soloCoopBlocked}
              onClick={() => pickMode('coop')}
            >
              <span className="session-gate__mode-title">CO-OP</span>
              <span className="session-gate__mode-sub">
                {soloCoopBlocked ? 'в разработке' : coopExists ? `${existingCoopRoles.length} класс(ов)` : 'профиль ещё не создан'}
              </span>
            </button>
            <button
              type="button"
              className="session-resume-btn session-gate__mode-btn session-gate__mode-btn--nri"
              onClick={() => pickMode('nri')}
            >
              <span className="session-gate__mode-title">НРИ</span>
              <span className="session-gate__mode-sub">
                {nriCodeHint ? `стол ${nriCodeHint}` : 'стол + чат по ссылке'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pickedMode === 'nri') {
    return (
      <div className="session-resume-gate main-crt session-gate">
        <div className="session-resume-gate__panel session-gate__panel">
          <button type="button" className="session-gate__back" onClick={backToModes}>
            ← режимы
          </button>
          <div className="session-resume-gate__kicker">NEON_PROTOCOL // НРИ</div>
          <h1 className="session-resume-gate__title">Настольный стол</h1>
          <p className="session-resume-gate__hint">
            Мастер создаёт стол и шлёт ссылку друзьям. Игроки авторизуются и попадают в общее лобби с чатом.
          </p>

          <div className="session-gate__nri-block">
            <h3 className="mono-text">Создать стол (мастер)</h3>
            <input
              className="session-gate__nri-input"
              placeholder="Название кампании (необязательно)"
              value={nriTitle}
              onChange={(e) => setNriTitle(e.target.value)}
              maxLength={80}
            />
            <button
              type="button"
              className="session-resume-btn session-gate__mode-btn--nri"
              onClick={() => onCreateNri(nriTitle.trim() || undefined)}
            >
              Создать и получить ссылку
            </button>
          </div>

          <div className="session-gate__nri-block">
            <h3 className="mono-text">Войти по коду / ссылке</h3>
            <input
              className="session-gate__nri-input"
              placeholder="NRI-XXXX"
              value={nriCodeInput}
              onChange={(e) => setNriCodeInput(e.target.value.toUpperCase())}
            />
            <button
              type="button"
              className="session-resume-btn session-gate__mode-btn--nri"
              disabled={!nriCodeInput.trim()}
              onClick={() => onJoinNri(nriCodeInput.trim().toUpperCase())}
            >
              Войти в лобби
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pickedMode === 'solo') {
    return (
      <div className="session-resume-gate main-crt session-gate">
        <div className="session-resume-gate__panel session-gate__panel">
          <button type="button" className="session-gate__back" onClick={backToModes}>
            ← режимы
          </button>
          <div className="session-resume-gate__kicker">NEON_PROTOCOL // SOLO</div>
          <h1 className="session-resume-gate__title">Соло-персонажи</h1>
          <ul className="session-gate__roster">
            {soloExists ? (
              <li className="session-gate__roster-card session-gate__roster-card--solo">
                <div>
                  <div className="session-gate__roster-name">{displayName}</div>
                  <div className="session-gate__roster-meta">{homeLabel}</div>
                </div>
                <button type="button" className="session-resume-btn session-resume-btn--solo" onClick={onEnterSolo}>
                  Войти
                </button>
              </li>
            ) : null}
          </ul>
          <div className="session-gate__roster-actions">
            <button type="button" className="session-resume-btn session-resume-btn--solo" onClick={() => onOpenWizard('solo')}>
              {soloExists ? 'Новый соло-персонаж (мастер)' : 'Создать соло-персонажа'}
            </button>
          </div>
          {soloExists && (
            <p className="session-resume-gate__hint session-gate__fine-print">
              Повторный мастер соло перезапишет стартовый профиль и колоду в сохранении.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* coop roster */
  return (
    <div className="session-resume-gate main-crt session-gate">
      <div className="session-resume-gate__panel session-gate__panel">
        <button type="button" className="session-gate__back" onClick={backToModes}>
          ← режимы
        </button>
        <div className="session-resume-gate__kicker">NEON_PROTOCOL // CO-OP</div>
        <h1 className="session-resume-gate__title">Классы коопа</h1>
        <p className="session-resume-gate__hint">Игрок: {displayName}</p>
        <ul className="session-gate__roster">
          {existingCoopRoles.map((role) => (
            <li key={role} className="session-gate__roster-card session-gate__roster-card--coop">
              <div>
                <div className="session-gate__roster-name">{COOP_ROLE_LABELS[role].title}</div>
                <div className="session-gate__roster-meta">
                  колода: {(coopClassProfiles[role]?.deckIds?.length ?? 0)} карт
                </div>
              </div>
              <button type="button" className="session-resume-btn session-resume-btn--coop" onClick={() => onEnterCoop(role)}>
                Войти
              </button>
            </li>
          ))}
        </ul>
        <div className="session-gate__roster-actions">
          <button
            type="button"
            className="session-resume-btn session-resume-btn--coop"
            disabled={coopSlotsFull}
            onClick={() => onOpenWizard('coop')}
          >
            {coopSlotsFull ? 'Все роли заняты' : 'Новый кооп-класс'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionGateView;

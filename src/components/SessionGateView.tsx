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
  onEnterSolo: () => void;
  onEnterCoop: (role?: CoopRole) => void;
  onOpenWizard: (mode: SessionMode) => void;
}

const SessionGateView: React.FC<SessionGateViewProps> = ({
  creationResume,
  playerName,
  homeDistrictId,
  coopClassProfiles,
  onEnterSolo,
  onEnterCoop,
  onOpenWizard,
}) => {
  const [phase, setPhase] = useState<Phase>('mode');
  const [pickedMode, setPickedMode] = useState<SessionMode | null>(null);

  const soloExists = creationResume?.soloPersonaExists ?? false;
  const coopExists = creationResume?.coopEstablished ?? false;
  const existingCoopRoles = COOP_ROLES.filter((r) => (coopClassProfiles[r]?.deckIds?.length ?? 0) > 0);
  const coopSlotsFull = existingCoopRoles.length >= COOP_ROLES.length;
  const homeLabel = MAP_NODES.find((n) => n.id === homeDistrictId)?.name ?? homeDistrictId;
  const displayName = playerName !== 'ID_НЕИЗВЕСТЕН' ? playerName : '—';

  const pickMode = (mode: SessionMode) => {
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
          <div className="session-resume-gate__actions session-gate__mode-row">
            <button
              type="button"
              className={`session-resume-btn session-resume-btn--solo session-gate__mode-btn ${soloExists ? 'session-gate__mode-btn--ready' : ''}`}
              onClick={() => pickMode('solo')}
            >
              <span className="session-gate__mode-title">SOLO</span>
              <span className="session-gate__mode-sub">
                {soloExists ? 'персонаж в сети' : 'профиль ещё не создан'}
              </span>
            </button>
            <button
              type="button"
              className={`session-resume-btn session-resume-btn--coop session-gate__mode-btn ${coopExists ? 'session-gate__mode-btn--ready' : ''}`}
              onClick={() => pickMode('coop')}
            >
              <span className="session-gate__mode-title">CO-OP</span>
              <span className="session-gate__mode-sub">
                {coopExists ? `${existingCoopRoles.length} класс(ов)` : 'профиль ещё не создан'}
              </span>
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

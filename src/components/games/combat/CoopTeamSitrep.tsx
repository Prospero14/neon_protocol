import React from 'react';
import type { CoopRole } from '../../../logic/sessionMode';
import { COOP_ROLE_LABELS } from '../../../logic/sessionMode';
import type { CoopSquadFill } from '../../../logic/coopTeamFlow';
import { CoopRoleBadge } from '../../CoopRoleBadge';
import type { CoopMatchSharedState } from '../../../logic/coopLobbyApi';

type Props = {
  coopRole: CoopRole;
  squadFill: CoopSquadFill;
  matchActiveRole?: string | null;
  isMyTurn?: boolean;
  stress: number;
  bugPoints: number;
  playerProgress: number;
  aiDeadline: number;
  aiProgress: number;
  mitigationBuffer: number;
  infraFilled: number;
  nextIntentName: string | null;
  lastAiActionName: string | null;
  matchShared?: CoopMatchSharedState | null;
};

const roleLabel = (r: CoopRole) => COOP_ROLE_LABELS[r].title;

export const CoopTeamSitrep: React.FC<Props> = ({
  coopRole,
  squadFill,
  matchActiveRole = null,
  isMyTurn = false,
  stress,
  bugPoints,
  playerProgress,
  aiDeadline,
  aiProgress,
  mitigationBuffer,
  infraFilled,
  nextIntentName,
  lastAiActionName,
  matchShared = null,
}) => {
  const slots = (['developer', 'qa', 'admin', 'pm'] as CoopRole[]).map((r) => ({
    role: r,
    you: r === coopRole,
    remote: squadFill === 'live_party' && r !== coopRole ? 'ПАТИ' : r !== coopRole ? 'БОТ' : null,
  }));

  return (
    <aside className="coop-team-sitrep mono-text" aria-label="Сводка команды и общий поток">
      <div className="coop-team-sitrep__head">КОМАНДА // ОБЩИЙ ПОТОК</div>
      {squadFill === 'live_party' && matchActiveRole && (
        <div className="coop-team-sitrep__plan-row" style={{ marginBottom: 8 }}>
          <span className="coop-team-sitrep__k">АКТИВНАЯ РОЛЬ</span>
          <span className="coop-team-sitrep__plan-v">
            {COOP_ROLE_LABELS[matchActiveRole as CoopRole]?.title ?? matchActiveRole}
            {isMyTurn ? ' · ВАШ ХОД' : ''}
          </span>
        </div>
      )}
      <ul className="coop-team-sitrep__roles">
        {slots.map(({ role, you, remote }) => (
          <li key={role} className={`coop-team-sitrep__role ${you ? 'coop-team-sitrep__role--you' : ''}`}>
            <CoopRoleBadge role={role} size={12} />
            <span className="coop-team-sitrep__role-name">{roleLabel(role)}</span>
            {you ? (
              <span className="coop-team-sitrep__tag coop-team-sitrep__tag--you">ВЫ</span>
            ) : (
              <span className="coop-team-sitrep__tag">{remote}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="coop-team-sitrep__grid">
        <div>
          <span className="coop-team-sitrep__k">СТРЕСС</span>
          <span className="coop-team-sitrep__v">{stress}</span>
        </div>
        <div>
          <span className="coop-team-sitrep__k">БАГИ</span>
          <span className="coop-team-sitrep__v">{bugPoints}</span>
        </div>
        <div>
          <span className="coop-team-sitrep__k">ПРОГРЕСС</span>
          <span className="coop-team-sitrep__v">{playerProgress}%</span>
        </div>
        <div>
          <span className="coop-team-sitrep__k">УГРОЗА</span>
          <span className="coop-team-sitrep__v">{aiProgress}%</span>
        </div>
        <div>
          <span className="coop-team-sitrep__k">ДЕДЛАЙН</span>
          <span className="coop-team-sitrep__v">{aiDeadline}</span>
        </div>
        <div>
          <span className="coop-team-sitrep__k">MITIGATION</span>
          <span className="coop-team-sitrep__v">{mitigationBuffer}</span>
        </div>
        <div className="coop-team-sitrep__span2">
          <span className="coop-team-sitrep__k">ИНФРА (слотов занято)</span>
          <span className="coop-team-sitrep__v">{infraFilled}/8</span>
        </div>
      </div>
      <div className="coop-team-sitrep__plan">
        <div className="coop-team-sitrep__plan-title">ПЛАН / УГРОЗЫ ОППОНЕНТА</div>
        {lastAiActionName && (
          <div className="coop-team-sitrep__plan-row">
            <span className="coop-team-sitrep__k">Последний удар</span>
            <span className="coop-team-sitrep__plan-v">{lastAiActionName}</span>
          </div>
        )}
        {nextIntentName && (
          <div className="coop-team-sitrep__plan-row">
            <span className="coop-team-sitrep__k">NEXT_INTENT</span>
            <span className="coop-team-sitrep__plan-v">{nextIntentName}</span>
          </div>
        )}
        {!lastAiActionName && !nextIntentName && (
          <div className="coop-team-sitrep__plan-muted">Ожидание сигнала ИИ…</div>
        )}
        {coopRole === 'pm' && (
          <>
            <p className="coop-team-sitrep__pm-hint">
              PM: здесь видно, куда бьёт оппонент по всей команде; ваши SOFT-карты разгружают стресс и подталкивают
              прогресс.
            </p>
            {squadFill === 'live_party' && matchShared && (
              <div className="coop-team-sitrep__pm-radar">
                {(Object.keys(COOP_ROLE_LABELS) as CoopRole[]).map((role) => {
                  const rs = Math.max(0, Math.min(100, matchShared.roleStress[role] ?? 0));
                  const rp = Math.max(0, Math.min(100, matchShared.roleTaskProgress[role] ?? 0));
                  return (
                    <div key={role} className="coop-team-sitrep__pm-row">
                      <span className="coop-team-sitrep__pm-role">{COOP_ROLE_LABELS[role].title}</span>
                      <div className="coop-team-sitrep__pm-bars">
                        <div className="coop-team-sitrep__pm-bar-wrap">
                          <div className="coop-team-sitrep__pm-bar coop-team-sitrep__pm-bar--stress" style={{ width: `${rs}%` }} />
                        </div>
                        <div className="coop-team-sitrep__pm-bar-wrap">
                          <div className="coop-team-sitrep__pm-bar coop-team-sitrep__pm-bar--progress" style={{ width: `${rp}%` }} />
                        </div>
                      </div>
                      <span className="coop-team-sitrep__pm-values">S{rs}/P{rp}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      {squadFill === 'synthetic_bots' && (
        <p className="coop-team-sitrep__foot">
          Остальные роли сейчас симулируются ботами — ходы союзников дают мелкие бонусы к общим метрикам. Сетевая
          синхронизация пати — впереди.
        </p>
      )}
      {squadFill === 'live_party' && (
        <p className="coop-team-sitrep__foot">
          Пати из игроков: в этом клиенте вы ведёте одну роль; общие метрики одни на весь бой.
        </p>
      )}
    </aside>
  );
};

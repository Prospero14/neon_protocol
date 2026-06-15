import React from 'react';
import type { CoopRole } from '../../../logic/sessionMode';
import { COOP_ROLE_LABELS } from '../../../logic/sessionMode';
import type { CoopSquadFill } from '../../../logic/coopTeamFlow';
import { CoopRoleBadge } from '../../CoopRoleBadge';
import type { CoopMatchSharedState } from '../../../logic/coopLobbyApi';
import type { CoopLinkedObjectiveRow } from '../../../logic/coopLinkedRoleObjectives';

type Props = {
  coopRole: CoopRole;
  /** GDD §1c: одна строка «задача боя» для выбранной роли. */
  roleMissionBlurb?: string;
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
  onPmSupportTarget?: ((targetRole: CoopRole) => void) | null;
  pmSupportBusy?: boolean;
  onQaSupportTarget?: ((targetRole: CoopRole) => void) | null;
  qaSupportBusy?: boolean;
  onAdminSupportTarget?: ((targetRole: CoopRole) => void) | null;
  adminSupportBusy?: boolean;
  supportFeed?: string[];
  onPmReleaseCheck?: (() => void) | null;
  pmReleaseBusy?: boolean;
  /** Кооп non-dev: цели, привязанные к длине ТЗ разработчика (локальный клиент). */
  coopLinkedRows?: CoopLinkedObjectiveRow[];
};

const roleLabel = (r: CoopRole) => COOP_ROLE_LABELS[r].title;

export const CoopTeamSitrep: React.FC<Props> = ({
  coopRole,
  roleMissionBlurb,
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
  onPmSupportTarget = null,
  pmSupportBusy = false,
  onQaSupportTarget = null,
  qaSupportBusy = false,
  onAdminSupportTarget = null,
  adminSupportBusy = false,
  supportFeed = [],
  onPmReleaseCheck = null,
  pmReleaseBusy = false,
  coopLinkedRows = [],
}) => {
  const pmCd = Math.max(0, Math.floor(matchShared?.supportCooldownByRole?.pm ?? 0));
  const qaCd = Math.max(0, Math.floor(matchShared?.supportCooldownByRole?.qa ?? 0));
  const adminCd = Math.max(0, Math.floor(matchShared?.supportCooldownByRole?.admin ?? 0));
  const slots = (['developer', 'qa', 'admin', 'pm'] as CoopRole[]).map((r) => ({
    role: r,
    you: r === coopRole,
    remote: squadFill === 'live_party' && r !== coopRole ? 'ПАТИ' : r !== coopRole ? 'БОТ' : null,
  }));

  return (
    <aside className="coop-team-sitrep mono-text" aria-label="Сводка команды и общий поток">
      <div className="coop-team-sitrep__head">КОМАНДА // ОБЩИЙ ПОТОК</div>
      {roleMissionBlurb && (
        <div className="coop-team-sitrep__mission" style={{ fontSize: 11, opacity: 0.88, lineHeight: 1.45, marginBottom: 10 }}>
          {roleMissionBlurb}
        </div>
      )}
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
        {squadFill === 'live_party' && matchShared && (
          <div>
            <span className="coop-team-sitrep__k">INTENSITY</span>
            <span className="coop-team-sitrep__v">T{matchShared.missionIntensityTier} / {matchShared.missionStepTarget} steps</span>
          </div>
        )}
        <div className="coop-team-sitrep__span2">
          <span className="coop-team-sitrep__k">ИНФРА (слотов занято)</span>
          <span className="coop-team-sitrep__v">{infraFilled}/8</span>
        </div>
      </div>
      <div className="coop-team-sitrep__plan">
        {coopLinkedRows.length > 0 && (
          <div className="coop-team-sitrep__linked" aria-label="Подзадачи спринта под ТЗ разработчика">
            <div className="coop-team-sitrep__linked-title">ВКЛАД В РЕЛИЗ (ТЗ DEV)</div>
            <ul className="coop-team-sitrep__linked-list">
              {coopLinkedRows.map((row) => (
                <li
                  key={row.id}
                  className={`coop-team-sitrep__linked-item ${row.done ? 'coop-team-sitrep__linked-item--done' : ''}`}
                >
                  <span className="coop-team-sitrep__linked-mark">{row.done ? '✓' : '○'}</span>
                  <span className="coop-team-sitrep__linked-text">{row.label}</span>
                  {!row.done && (
                    <span className="coop-team-sitrep__linked-meter">
                      {Math.min(row.current, row.target)}/{row.target}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
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
            {squadFill === 'live_party' && onPmSupportTarget && (
              <div className="coop-team-sitrep__pm-actions">
                <button type="button" className="coop-team-sitrep__pm-btn" disabled={pmSupportBusy || pmCd > 0} onClick={() => onPmSupportTarget('developer')}>
                  SUPPORT DEV{pmCd > 0 ? ` [CD:${pmCd}]` : ''}
                </button>
                <button type="button" className="coop-team-sitrep__pm-btn" disabled={pmSupportBusy || pmCd > 0} onClick={() => onPmSupportTarget('qa')}>
                  SUPPORT QA{pmCd > 0 ? ` [CD:${pmCd}]` : ''}
                </button>
                <button type="button" className="coop-team-sitrep__pm-btn" disabled={pmSupportBusy || pmCd > 0} onClick={() => onPmSupportTarget('admin')}>
                  SUPPORT ADMIN{pmCd > 0 ? ` [CD:${pmCd}]` : ''}
                </button>
              </div>
            )}
            {squadFill === 'live_party' && onPmReleaseCheck && (
              <div className="coop-team-sitrep__pm-actions" style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className="coop-team-sitrep__pm-btn"
                  disabled={pmReleaseBusy}
                  onClick={onPmReleaseCheck}
                >
                  RELEASE_CHECK
                </button>
              </div>
            )}
          </>
        )}
        {coopRole === 'qa' && squadFill === 'live_party' && onQaSupportTarget && (
          <div className="coop-team-sitrep__pm-actions">
            <button type="button" className="coop-team-sitrep__pm-btn" disabled={qaSupportBusy || qaCd > 0} onClick={() => onQaSupportTarget('developer')}>
              QA{'->'}DEV{qaCd > 0 ? ` [CD:${qaCd}]` : ''}
            </button>
            <button type="button" className="coop-team-sitrep__pm-btn" disabled={qaSupportBusy || qaCd > 0} onClick={() => onQaSupportTarget('admin')}>
              QA{'->'}ADMIN{qaCd > 0 ? ` [CD:${qaCd}]` : ''}
            </button>
            <button type="button" className="coop-team-sitrep__pm-btn" disabled={qaSupportBusy || qaCd > 0} onClick={() => onQaSupportTarget('pm')}>
              QA{'->'}PM{qaCd > 0 ? ` [CD:${qaCd}]` : ''}
            </button>
          </div>
        )}
        {coopRole === 'admin' && squadFill === 'live_party' && onAdminSupportTarget && (
          <div className="coop-team-sitrep__pm-actions">
            <button type="button" className="coop-team-sitrep__pm-btn" disabled={adminSupportBusy || adminCd > 0} onClick={() => onAdminSupportTarget('developer')}>
              OPS{'->'}DEV{adminCd > 0 ? ` [CD:${adminCd}]` : ''}
            </button>
            <button type="button" className="coop-team-sitrep__pm-btn" disabled={adminSupportBusy || adminCd > 0} onClick={() => onAdminSupportTarget('qa')}>
              OPS{'->'}QA{adminCd > 0 ? ` [CD:${adminCd}]` : ''}
            </button>
            <button type="button" className="coop-team-sitrep__pm-btn" disabled={adminSupportBusy || adminCd > 0} onClick={() => onAdminSupportTarget('pm')}>
              OPS{'->'}PM{adminCd > 0 ? ` [CD:${adminCd}]` : ''}
            </button>
          </div>
        )}
        {squadFill === 'live_party' && supportFeed.length > 0 && (
          <div className="coop-team-sitrep__support-feed">
            {supportFeed.slice(0, 3).map((line, idx) => (
              <div key={`${idx}_${line}`} className="coop-team-sitrep__support-line">
                {line}
              </div>
            ))}
          </div>
        )}
        {squadFill === 'live_party' && matchShared && (
          <div className="coop-team-sitrep__support-line">
            PRESSURE +BUG {matchShared.pressurePulse.bug} / +STRESS {matchShared.pressurePulse.stress} / -INFRA {matchShared.pressurePulse.infra}
          </div>
        )}
        {squadFill === 'live_party' && matchShared?.lastReleaseCheck && (
          <div className={`coop-team-sitrep__support-line ${matchShared.lastReleaseCheck.ok ? '' : 'coop-team-sitrep__support-line--bad'}`}>
            {matchShared.lastReleaseCheck.note}
          </div>
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

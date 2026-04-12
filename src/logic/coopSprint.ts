/**
 * Кооп-режим: спринт стартапа — краткое ТЗ, 3 попытки на «релиз», оценки по критериям ролей.
 * Оценки считаются по метрикам боя (один клиент = ваша роль акцентируется, остальные — синтетический «отчёт команды»).
 */

import type { CoopRole, DevLanguageStack } from './sessionMode';

export const COOP_SPRINT_MAX_ATTEMPTS = 3;

export interface CoopSprintMetrics {
  won: boolean;
  stressEnd: number;
  bugPointsEnd: number;
  playerProgressEnd: number;
  aiProgressEnd: number;
  aiDeadlineEnd: number;
  chainLength: number;
  deploymentOk: boolean;
}

export function shouldLiquidateStartup(consecutiveLosses: number): boolean {
  return consecutiveLosses >= COOP_SPRINT_MAX_ATTEMPTS;
}

/** Краткое ТЗ перед боем (кооп). */
export function getCoopBriefTz(startupName: string, missionName: string): string {
  const s = startupName.trim() || 'UNNAMED_LAB';
  return (
    `СТАРТАП «${s}». Итерация релиза: ${missionName}. ` +
    `Цель: довести PROJECT до 100%, удержать THREAT и не допустить перегрузки. ` +
    `На стабилизации обнуляйте баги до деплоя. Максимум ${COOP_SPRINT_MAX_ATTEMPTS} попытки на этот спринт.`
  );
}

/** Критерии (для UI и расчёта весов). */
export const COOP_CRITERIA_LABELS: Record<
  CoopRole,
  { id: string; label: string; weight: number }[]
> = {
  developer: [
    { id: 'delivery', label: 'Поставка фич (прогресс)', weight: 0.35 },
    { id: 'clean', label: 'Чистота шины (баги)', weight: 0.35 },
    { id: 'sustain', label: 'Устойчивость (стресс)', weight: 0.3 },
  ],
  qa: [
    { id: 'bugs', label: 'Обнуление багов к деплою', weight: 0.45 },
    { id: 'verify', label: 'Верификация (прогресс)', weight: 0.3 },
    { id: 'pressure', label: 'Работа под давлением', weight: 0.25 },
  ],
  admin: [
    { id: 'control', label: 'Периметр и угроза (THREAT)', weight: 0.38 },
    { id: 'resources', label: 'Серты / LB / прокси (стресс)', weight: 0.32 },
    { id: 'release', label: 'Готовность контура к релизу', weight: 0.3 },
  ],
  pm: [
    { id: 'timebox', label: 'Укладывание в срок', weight: 0.4 },
    { id: 'scope', label: 'Баланс scope/риск', weight: 0.35 },
    { id: 'burn', label: 'Выгорание команды (стресс)', weight: 0.25 },
  ],
};

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function hashSeed(role: CoopRole, stack: DevLanguageStack | null, salt: number): number {
  const s = `${role}|${stack ?? 'role_only'}|${salt}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

/** Оценка 0–100 для роли игрока по метрикам боя. */
export function scorePlayerRole(playerRole: CoopRole, m: CoopSprintMetrics): number {
  const stressScore = clamp(100 - m.stressEnd * 0.85, 0, 100);
  const bugScore = m.won ? clamp(100 - m.bugPointsEnd * 14, 0, 100) : clamp(40 - m.bugPointsEnd * 10, 0, 100);
  const progressScore = clamp(m.playerProgressEnd, 0, 100);
  const threatScore = clamp(100 - m.aiProgressEnd * 0.95, 0, 100);
  const deadlineScore = clamp(55 + m.aiDeadlineEnd * 5, 0, 100);
  const chainScore = clamp(Math.min(100, 35 + m.chainLength * 8), 0, 100);
  const deployScore = m.deploymentOk ? 92 : 55;

  switch (playerRole) {
    case 'developer':
      return clamp(progressScore * 0.38 + bugScore * 0.32 + stressScore * 0.2 + chainScore * 0.1, 0, 100);
    case 'qa':
      return clamp(bugScore * 0.42 + progressScore * 0.28 + stressScore * 0.3, 0, 100);
    case 'admin':
      return clamp(threatScore * 0.34 + deadlineScore * 0.22 + stressScore * 0.32 + deployScore * 0.12, 0, 100);
    case 'pm':
      return clamp(deadlineScore * 0.34 + threatScore * 0.28 + stressScore * 0.28 + progressScore * 0.1, 0, 100);
    default:
      return clamp((progressScore + stressScore) / 2, 0, 100);
  }
}

export interface CriterionScore {
  label: string;
  score: number;
  blurb: string;
}

function criteriaForRole(role: CoopRole, m: CoopSprintMetrics, overall: number): CriterionScore[] {
  const stressScore = clamp(100 - m.stressEnd * 0.85, 0, 100);
  const bugScore = clamp(100 - m.bugPointsEnd * 12, 0, 100);
  const progressScore = clamp(m.playerProgressEnd, 0, 100);
  const threatScore = clamp(100 - m.aiProgressEnd, 0, 100);

  const mk = (label: string, score: number, blurb: string): CriterionScore => ({ label, score: Math.round(score), blurb });

  switch (role) {
    case 'developer':
      return [
        mk('Прогресс поставки', progressScore, m.won ? 'Фича доведена до деплоя.' : 'Релиз не завершён.'),
        mk('Качество шины', bugScore, m.bugPointsEnd === 0 ? 'Нет висящих дефектов.' : `Накоплено дефектов: ${m.bugPointsEnd}.`),
        mk('Нагрузка', stressScore, m.stressEnd < 70 ? 'В норме.' : 'Высокий стресс команды.'),
      ];
    case 'qa':
      return [
        mk('Чистота к релизу', bugScore, 'Баги на стабилизации.'),
        mk('Покрытие прогресса', progressScore, 'Соответствие ТЗ по шагам.'),
        mk('Stress-тест себя', stressScore, 'Работа в красной зоне.'),
      ];
    case 'admin':
      return [
        mk('Периметр', threatScore, 'Контур угрозы.'),
        mk('Стабильность', stressScore, 'Нет коллапса под нагрузкой.'),
        mk('Готовность релиза', m.deploymentOk ? 90 : 48, m.deploymentOk ? 'Ресурсы сошлись.' : 'Риск по ресурсам.'),
      ];
    case 'pm':
      return [
        mk('Таймбокс', clamp(55 + m.aiDeadlineEnd * 5, 0, 100), 'Укладывание в дедлайн спринта.'),
        mk('Баланс рисков', (threatScore + progressScore) / 2, 'Scope vs угроза.'),
        mk('Здоровье команды', stressScore, 'Выгорание.'),
      ];
    default:
      return [mk('Общая оценка', overall, 'Сводный балл.')];
  }
}

/** Синтетические оценки «команды» (для одиночного клиента): стабильные от метрик и стека. */
export function squadSyntheticScores(
  playerRole: CoopRole,
  stack: DevLanguageStack | null,
  m: CoopSprintMetrics
): { role: CoopRole; score: number }[] {
  const roles: CoopRole[] = ['developer', 'qa', 'admin', 'pm'];
  const base = scorePlayerRole(playerRole, m);
  return roles.map((r, i) => {
    if (r === playerRole) return { role: r, score: Math.round(base) };
    const h = hashSeed(r, stack, m.bugPointsEnd + m.stressEnd + i);
    const jitter = (h % 17) - 8;
    const sim = clamp(base * 0.78 + jitter + (m.won ? 6 : -12), 22, 96);
    return { role: r, score: Math.round(sim) };
  });
}

export interface CoopSprintReport {
  overall: number;
  playerRole: CoopRole;
  playerCriteria: CriterionScore[];
  squad: { role: CoopRole; score: number }[];
  summaryLine: string;
}

export function buildCoopSprintReport(
  playerRole: CoopRole,
  stack: DevLanguageStack | null,
  m: CoopSprintMetrics
): CoopSprintReport {
  const overall = Math.round(scorePlayerRole(playerRole, m));
  const playerCriteria = criteriaForRole(playerRole, m, overall);
  const squad = squadSyntheticScores(playerRole, stack, m);
  const summaryLine = m.won
    ? `Спринт закрыт. Сводный фокус роли: ${overall}/100.`
    : `Релиз сорван. Сохраните очки для ретро: ${overall}/100 (штраф за поражение).`;

  return { overall, playerRole, playerCriteria, squad, summaryLine };
}

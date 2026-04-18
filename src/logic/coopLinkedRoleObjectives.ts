/**
 * Кооп: для QA / Admin / PM — подзадачи, привязанные к объёму ТЗ разработчика (число шагов миссии).
 * Выполнение даёт бонус к общему playerProgress (вклад в «релиз» на шине).
 */
import type { TechnicalTask } from './combatTasks';
import type { CoopRole } from './sessionMode';

export type CoopLinkedKind =
  | 'admin_infra_deploys'
  | 'admin_infra_unique'
  | 'qa_ice_clears'
  | 'qa_bug_metric_cut'
  | 'pm_soft_arch_placed'
  | 'pm_soft_dev_placed'
  | 'pm_ritual_soft';

export interface CoopLinkedObjectiveDef {
  id: string;
  kind: CoopLinkedKind;
  label: string;
  target: number;
}

export type CoopLinkedTrack = {
  adminInfra: number;
  adminInfraIds: Set<string>;
  qaIceClears: number;
  qaBugCutSum: number;
  pmSoftArch: number;
  /** PM в параллельном окне без ARCHITECTURE — SOFT в DEVELOPMENT. */
  pmSoftDevPlaced: number;
  pmRitualSoft: number;
};

export function emptyCoopLinkedTrack(): CoopLinkedTrack {
  return {
    adminInfra: 0,
    adminInfraIds: new Set(),
    qaIceClears: 0,
    qaBugCutSum: 0,
    pmSoftArch: 0,
    pmSoftDevPlaced: 0,
    pmRitualSoft: 0,
  };
}

/** SOFT, которые явно двигают спринт / ритуалы (PM). */
export const PM_RITUAL_SOFT_IDS = new Set<string>([
  'soft_pair_programming',
  'soft_recursive_logic',
  'soft_agile_ceremony',
  'soft_daily_sync',
  'soft_retro_action',
  'soft_sprint_goal',
  'soft_dev_pairing',
  'soft_backlog_refine',
]);

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function coopLinkedProgressRewardPct(stepCount: number): number {
  const n = Math.max(1, stepCount);
  return clamp(3 + Math.floor(n / 5), 3, 9);
}

export function objectiveCurrent(kind: CoopLinkedKind, track: CoopLinkedTrack): number {
  switch (kind) {
    case 'admin_infra_deploys':
      return track.adminInfra;
    case 'admin_infra_unique':
      return track.adminInfraIds.size;
    case 'qa_ice_clears':
      return track.qaIceClears;
    case 'qa_bug_metric_cut':
      return track.qaBugCutSum;
    case 'pm_soft_arch_placed':
      return track.pmSoftArch;
    case 'pm_soft_dev_placed':
      return track.pmSoftDevPlaced;
    case 'pm_ritual_soft':
      return track.pmRitualSoft;
    default:
      return 0;
  }
}

/**
 * Две цели на роль; пороги масштабируются длиной ТЗ разработчика (steps).
 */
export type CoopLinkedMissionOpts = { skipArchitecture?: boolean };

export function buildCoopLinkedRoleObjectives(
  mission: TechnicalTask,
  role: CoopRole,
  opts?: CoopLinkedMissionOpts
): CoopLinkedObjectiveDef[] {
  if (role === 'developer') return [];
  const stepCount = Math.max(1, mission.steps?.length ?? 1);
  const mid = mission.id;

  if (role === 'admin') {
    const tInfra = clamp(Math.ceil(stepCount / 3), 2, 5);
    const tUnique = clamp(Math.ceil(stepCount / 4), 2, 4);
    return [
      {
        id: `linked_${mid}_admin_infra`,
        kind: 'admin_infra_deploys',
        label: `Снабдить контур: развернуть ${tInfra} INFRA (ТЗ dev: ${stepCount} шаг.)`,
        target: tInfra,
      },
      {
        id: `linked_${mid}_admin_mix`,
        kind: 'admin_infra_unique',
        label: `Разнообразить поставку: ${tUnique} разных типов INFRA`,
        target: tUnique,
      },
    ];
  }

  if (role === 'qa') {
    const tIce = clamp(Math.ceil(stepCount / 3), 2, 6);
    const tBug = clamp(3 + Math.floor(stepCount / 2), 4, 18);
    return [
      {
        id: `linked_${mid}_qa_ice`,
        kind: 'qa_ice_clears',
        label: `Снять ${tIce} ICE/BUG на шине (под ТЗ из ${stepCount} шагов)`,
        target: tIce,
      },
      {
        id: `linked_${mid}_qa_metric`,
        kind: 'qa_bug_metric_cut',
        label: `Срезать ≥${tBug} ед. с баг-метрики расследованием`,
        target: tBug,
      },
    ];
  }

  if (role === 'pm') {
    const tArch = clamp(Math.ceil(stepCount / 4), 2, 5);
    const tRitual = clamp(Math.ceil(stepCount / 5), 2, 4);
    const skipArch = Boolean(opts?.skipArchitecture);
    return [
      skipArch
        ? {
            id: `linked_${mid}_pm_dev_soft`,
            kind: 'pm_soft_dev_placed',
            label: `Заложить ${tArch} SOFT в DEVELOPMENT (параллельное окно, ТЗ ${stepCount} шаг.)`,
            target: tArch,
          }
        : {
            id: `linked_${mid}_pm_arch`,
            kind: 'pm_soft_arch_placed',
            label: `Заложить ${tArch} SOFT в фазе ARCHITECTURE (под ${stepCount}-шаговое ТЗ)`,
            target: tArch,
          },
      {
        id: `linked_${mid}_pm_ritual`,
        kind: 'pm_ritual_soft',
        label: `Провести ${tRitual} «релизных» SOFT (пары/ритуалы/фокус на спринт)`,
        target: tRitual,
      },
    ];
  }

  return [];
}

export type CoopLinkedObjectiveRow = {
  id: string;
  label: string;
  current: number;
  target: number;
  done: boolean;
};

export function computeCoopLinkedRows(
  mission: TechnicalTask,
  role: CoopRole,
  track: CoopLinkedTrack,
  awarded: ReadonlySet<string>,
  opts?: CoopLinkedMissionOpts
): CoopLinkedObjectiveRow[] {
  return buildCoopLinkedRoleObjectives(mission, role, opts).map((d) => ({
    id: d.id,
    label: d.label,
    current: objectiveCurrent(d.kind, track),
    target: d.target,
    done: awarded.has(d.id),
  }));
}

export function nextCoopLinkedAwards(
  mission: TechnicalTask,
  role: CoopRole,
  track: CoopLinkedTrack,
  awarded: ReadonlySet<string>,
  opts?: CoopLinkedMissionOpts
): { newAwarded: string[]; progressDelta: number; rewardLines: string[] } {
  if (role === 'developer') return { newAwarded: [], progressDelta: 0, rewardLines: [] };
  const defs = buildCoopLinkedRoleObjectives(mission, role, opts);
  const stepCount = Math.max(1, mission.steps?.length ?? 1);
  const rewardEach = coopLinkedProgressRewardPct(stepCount);
  const newAwarded: string[] = [];
  for (const d of defs) {
    if (awarded.has(d.id)) continue;
    if (objectiveCurrent(d.kind, track) >= d.target) newAwarded.push(d.id);
  }
  const progressDelta = newAwarded.length * rewardEach;
  const rewardLines = newAwarded.map((id) => {
    const def = defs.find((x) => x.id === id);
    const tag = role.toUpperCase();
    return `[СПРИНТ:${tag}] Цель выполнена: ${def?.label ?? id} (+${rewardEach}% к прогрессу релиза).`;
  });
  return { newAwarded, progressDelta, rewardLines };
}

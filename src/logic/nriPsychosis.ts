/** Клиентский фасад киберпсихоза. */

export {
  PSYCHOSIS_THRESHOLDS,
  PSYCHOSIS_SCAR_MODS,
  MAX_PSYCHOSIS_SCAR,
  CONDITION_PSYCHOSIS_STRESS,
  computePsychosis,
  applyPsychosisScarMods,
  markPsychosisPendingIfNeeded,
  syncPsychosisFlags,
  startPsychosisEncounter,
  resolvePsychosisEncounter,
  psychosisTierLabel,
  sanitizePsychosisHistory,
  psychosisTier,
  type PsychosisBreakdown,
  type PsychosisEvent,
  type PsychosisEncounter,
  type PsychosisTier,
} from '../../shared/nri-domain/psychosisLogic';

export const NEON_OPEN_DM_EVENT = 'neon:open-dm';

export type OpenDmDetail = {
  userId: string;
  label?: string;
  /** true/undefined → всплывающий live-чат; false → только вкладка Чат */
  popup?: boolean;
};

export function requestOpenDm(userId: string, opts?: Omit<OpenDmDetail, 'userId'>): void {
  if (typeof window === 'undefined' || !userId) return;
  window.dispatchEvent(
    new CustomEvent(NEON_OPEN_DM_EVENT, {
      detail: { userId, label: opts?.label, popup: opts?.popup ?? true } satisfies OpenDmDetail,
    })
  );
}

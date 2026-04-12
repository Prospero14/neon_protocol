/**
 * Визуальные «поля» боя: в соло — ротация по дню/району/ноде;
 * в коопе — отдельный акцент рабочей зоны (pipeline) на роль.
 * Общие элементы (HUD, оппонент, дедлайн, угроза) не перекрашиваются под роль — см. класс nb2-opponent-lane--shared.
 */

import type { CoopRole, SessionMode } from './sessionMode';

export type SoloFieldVariant = 'circuit' | 'matrix' | 'shard' | 'pulse';

const SOLO_ORDER: SoloFieldVariant[] = ['circuit', 'matrix', 'shard', 'pulse'];

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Стабильная смена поля в соло: день + район + активная нода (миссия). */
export function resolveSoloFieldVariant(
  worldDay: number,
  districtId: string,
  barNode?: string | null
): SoloFieldVariant {
  const key = `${districtId}|${worldDay}|${barNode ?? ''}`;
  return SOLO_ORDER[simpleHash(key) % SOLO_ORDER.length];
}

/** Корневой класс на `.combat-v2`: фон/атмосфера. */
export function getCombatFieldOuterClass(
  sessionMode: SessionMode,
  coopRole: CoopRole | null,
  soloVariant: SoloFieldVariant
): string {
  if (sessionMode === 'coop' && coopRole) {
    return `combat-field-outer--coop combat-field-coop-shell--${coopRole}`;
  }
  return `combat-field-outer--solo combat-field-solo--${soloVariant}`;
}

/** Класс на `.nb2-pipeline-area`: личная/ролевая зона кода и SDLC-рейки. */
export function getPipelineFieldClass(
  sessionMode: SessionMode,
  coopRole: CoopRole | null,
  soloVariant: SoloFieldVariant
): string {
  if (sessionMode === 'coop' && coopRole) {
    return `nb2-field--coop-${coopRole}`;
  }
  return `nb2-field--solo-${soloVariant}`;
}

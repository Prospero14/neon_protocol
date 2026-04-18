/**
 * Определение фаз жизненного цикла разработки (SDLC) в бою.
 */

import type { CoopRole, SessionMode } from './sessionMode';

export type CombatPhase = 'ARCHITECTURE' | 'DEVELOPMENT' | 'VERIFICATION' | 'DEPLOYMENT';

/** Полный цикл (4 фазы). Кооп dev/qa/pm пропускают ARCHITECTURE — INFRA ведёт только admin в общей модели команды. */
export const SDLC_PHASE_IDS_FULL: CombatPhase[] = ['ARCHITECTURE', 'DEVELOPMENT', 'VERIFICATION', 'DEPLOYMENT'];

/**
 * Кооп по GDD: единый спринт-бой — без отдельных гейтов ARCH / VER как в соло.
 * Все роли стартуют в DEVELOPMENT с параллельными типами карт; к SHIP — прямо в DEPLOYMENT.
 */
export function coopUnifiedSprintCombat(sessionMode: SessionMode, coopRole: CoopRole | null): boolean {
  return sessionMode === 'coop' && Boolean(coopRole);
}

/** Порядок фаз на рельсе HUD. */
export function sdlcRailPhaseOrder(sessionMode: SessionMode, coopRole: CoopRole | null): CombatPhase[] {
  if (coopUnifiedSprintCombat(sessionMode, coopRole)) {
    return ['DEVELOPMENT', 'DEPLOYMENT'];
  }
  return SDLC_PHASE_IDS_FULL;
}

/** Кооп: отдельная фаза ARCHITECTURE не используется (инфра у admin — в том же DEVELOPMENT). */
export function coopSkipsArchitecturePhase(sessionMode: SessionMode, coopRole: CoopRole | null): boolean {
  return coopUnifiedSprintCombat(sessionMode, coopRole);
}

export interface PhaseRules {
  id: CombatPhase;
  name: string;
  description: string;
  allowedTypes: string[]; 
  nextPhaseId: CombatPhase | null;
  targetProgress?: number;
}

export const SDLC_PHASES: Record<CombatPhase, PhaseRules> = {
  ARCHITECTURE: {
    id: 'ARCHITECTURE',
    name: 'ФАЗА 1: СНАБЖЕНИЕ',
    description:
      'Карточный дро: только инфраструктура из колоды. Разверните CPU/RAM; софт и реакции — на следующих этапах.',
    allowedTypes: ['INFRASTRUCTURE', 'SPECIAL'],
    nextPhaseId: 'DEVELOPMENT',
  },
  DEVELOPMENT: {
    id: 'DEVELOPMENT',
    name: 'ФАЗА 2: ПАЗЗЛ КОДА',
    description:
      'Палитра языка и библиотек (всегда доступна) + одноразовые SCRIPT из колоды. Соберите шину; новых карт с колоды не приходит.',
    allowedTypes: ['SYNTAX', 'FUNCTION', 'HARD', 'NETWORK', 'COLLECTIONS', 'SPRING', 'SPECIAL', 'SCRIPT'],
    nextPhaseId: 'VERIFICATION',
    targetProgress: 70,
  },
  VERIFICATION: {
    id: 'VERIFICATION',
    name: 'ФАЗА 3: СТАБИЛИЗАЦИЯ',
    description:
      'Снова дро с колоды: реакции, защита, софт-скиллы, статусы. Патчи на шине, снятие багов, буферы.',
    allowedTypes: ['DEFENSIVE', 'REACTION', 'SOFT', 'STATUS', 'SPECIAL'],
    nextPhaseId: 'DEPLOYMENT',
    targetProgress: 100,
  },
  DEPLOYMENT: {
    id: 'DEPLOYMENT',
    name: 'ФАЗА 4: ДЕПЛОЙ',
    description: 'Финальный запуск. Проверка ресурсов и соответствия ТЗ.',
    allowedTypes: [],
    nextPhaseId: null,
  },
};

/**
 * Кооп: стадии идут параллельно — в бою разрешены типы из снабжения + кода + стабилизации одновременно
 * (колода игрока и так ролевая).
 */
export const SDLC_COOP_PARALLEL_ALLOWED_TYPES: readonly string[] = Array.from(
  new Set([
    ...SDLC_PHASES.ARCHITECTURE.allowedTypes,
    ...SDLC_PHASES.DEVELOPMENT.allowedTypes,
    ...SDLC_PHASES.VERIFICATION.allowedTypes,
  ])
);

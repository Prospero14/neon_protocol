/**
 * Определение фаз жизненного цикла разработки (SDLC) в бою.
 */

export type CombatPhase = 'ARCHITECTURE' | 'DEVELOPMENT' | 'VERIFICATION' | 'DEPLOYMENT';

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

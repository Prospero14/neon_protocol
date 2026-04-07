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
    name: 'ФАЗА 1: АРХИТЕКТУРА',
    description: 'Развертывание ресурсов. Установите INFRASTRUCTURE и SOFT-модули для обеспечения CPU/RAM.',
    allowedTypes: ['INFRASTRUCTURE', 'SOFT', 'SPECIAL', 'SCRIPT'],
    nextPhaseId: 'DEVELOPMENT',
  },
  DEVELOPMENT: {
    id: 'DEVELOPMENT',
    name: 'ФАЗА 2: РАЗРАБОТКА',
    description: 'Написание кода. Выкладывайте SYNTAX и FUNCTION на шину. Остерегайтесь атак ИИ.',
    allowedTypes: ['SYNTAX', 'FUNCTION', 'HARD', 'NETWORK', 'COLLECTIONS', 'SPRING', 'SPECIAL', 'REACTION', 'SCRIPT'],
    nextPhaseId: 'VERIFICATION',
    targetProgress: 70,
  },
  VERIFICATION: {
    id: 'VERIFICATION',
    name: 'ФАЗА 3: ТЕСТИРОВАНИЕ',
    description: 'Code Freeze. Исправление ошибок. Используйте DEFENSIVE и REACTION для очистки шины.',
    allowedTypes: ['DEFENSIVE', 'REACTION', 'SPECIAL'],
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

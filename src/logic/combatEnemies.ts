/**
 * БИБЛИОТЕКА БАГОВ (ВРАГОВ) [V5.0 - SDLC]
 * Враги теперь строят свой "проект" (Progress) и создают "Проблемы" (Problem Cards) для игрока.
 */

export type BugProblemType = 'FATIGUE' | 'TECH_DEBT' | 'SYNTAX_ERROR' | 'LOGIC_GAP' | 'MEMORY_LEAK';

export interface BugAction {
  id: string;
  name: string;
  description: string;
  /** Прогресс, который ИИ добавляет своему проекту за ход. */
  progressPoints: number;
  /** Количество багов, которые ИИ добавляет в систему за ход. */
  bugPoints: number;
  /** Прямой урон стабильности игрока (HP). */
  damage: number;
  /** Тип проблемы, которую ИИ создает (влияет на тип Reaction-карты для отбития). */
  problemType?: BugProblemType;
  /** Карта, которая спавнится на шине. */
  spawnId?: string;
  /** ID карты-статуса (STATUS), которая добавляется игроку (мусорная легаси-карта и т.д.) */
  injectStatusId?: string;
  /** Куда добавить карту-статус. По умолчанию 'discard', чтобы потом она пришла в руку. */
  injectDestination?: 'hand' | 'deck' | 'discard';
}

export interface BugEnemy {
  id: string;
  name: string;
  hp: number; 
  maxHp: number;
  /** Целевой прогресс ИИ для успешного релиза. */
  targetProgress: number;
  /** Тип визуализации врага. */
  visualType: 'ICE' | 'DEVELOPER' | 'AI';
  actions: BugAction[];
}

export const BUGS: BugEnemy[] = [
  {
    id: 'enemy_legacy',
    name: 'The Legacy Monolith (AI)',
    hp: 40,
    maxHp: 40,
    targetProgress: 60,
    visualType: 'AI',
    actions: [
      {
        id: 'leg_spaghetti',
        name: 'Spaghetti Injection',
        description: 'Легаси: Подкидывает карту Spaghetti Code вам в сброс.',
        progressPoints: 5,
        bugPoints: 5,
        damage: 2,
        injectStatusId: 'status_spaghetti',
        injectDestination: 'discard'
      },
      {
        id: 'leg_deprecate',
        name: 'Deprecate API',
        description: 'Устаревание: кидает Deprecated Dependency вам прямо в руку.',
        progressPoints: 10,
        bugPoints: 10,
        damage: 0,
        injectStatusId: 'status_deprecated',
        injectDestination: 'hand'
      }
    ]
  },
  {
    id: 'enemy_vague',
    name: 'The Vague Client (AI)',
    hp: 60,
    maxHp: 60,
    targetProgress: 80,
    visualType: 'ICE',
    actions: [
      {
        id: 'vag_change',
        name: 'Scope Creep',
        description: 'Изменение требований: Вызывает FATIGUE (усталость) у разработчика.',
        progressPoints: 15,
        bugPoints: 5,
        damage: 0,
        problemType: 'FATIGUE'
      },
      {
        id: 'vag_blocker',
        name: 'Merge Conflict',
        description: 'Конфликт слияния: Блокирует фазу DESIGN.',
        progressPoints: 5,
        bugPoints: 15,
        damage: 5,
        problemType: 'LOGIC_GAP',
        spawnId: 'bug_card_glitch'
      }
    ]
  }
];

export const getRandomBugAction = (bug: BugEnemy): BugAction => {
  return bug.actions[Math.floor(Math.random() * bug.actions.length)];
};

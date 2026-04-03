import { SCRIPT_KIDDIE_TASKS } from './script-kiddie';
import { JUNIOR_TASKS } from './junior';
import { MID_TASKS } from './mid';
import { SENIOR_TASKS } from './senior';
import type { TechnicalTask } from '../../logic/combatTasks';
import type { SkillMode } from '../../logic/skillMode';

export const ALL_TASKS: TechnicalTask[] = [
  ...SCRIPT_KIDDIE_TASKS,
  ...JUNIOR_TASKS,
  ...MID_TASKS,
  ...SENIOR_TASKS
];

export function getTasksByRank(rank: SkillMode): TechnicalTask[] {
  switch (rank) {
    case 'script-kiddie': return SCRIPT_KIDDIE_TASKS;
    case 'junior': return JUNIOR_TASKS;
    case 'mid': return MID_TASKS;
    case 'senior': return SENIOR_TASKS;
    default: return SCRIPT_KIDDIE_TASKS;
  }
}

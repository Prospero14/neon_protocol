import { getStepCardIds, type TechnicalTask } from './combatTasks';
import { CARD_LIBRARY } from './combatCards';
import {
  DEVELOPER_STACKS_UNION_IDS,
  ROLE_ACCENT_PACKS,
  ROLE_SPECIALTY_IDS,
} from './decks/deckCatalog';

export interface CoopCoverageIssue {
  missionId: string;
  stepId: string;
  requiredCardIds: string[];
  reason: 'NO_ROLE_COVERAGE' | 'NO_EXECUTOR_COVERAGE';
}

function buildRoleCatalog(role: 'qa' | 'pm' | 'admin'): Set<string> {
  const out = new Set<string>(ROLE_SPECIALTY_IDS[role] ?? []);
  for (const pack of Object.values(ROLE_ACCENT_PACKS[role] ?? {})) {
    for (const id of pack.cardIds) out.add(id);
  }
  return out;
}

const ADMIN_SET = buildRoleCatalog('admin');
const QA_SET = buildRoleCatalog('qa');
const PM_SET = buildRoleCatalog('pm');
const DEV_SET = new Set<string>([...DEVELOPER_STACKS_UNION_IDS]);
const ALL_CARD_IDS = new Set<string>(CARD_LIBRARY.map((c) => c.id));
const EXECUTOR_SET = new Set<string>([...DEV_SET, ...ADMIN_SET, ...ALL_CARD_IDS]);
const TEAM_SET = new Set<string>([...DEV_SET, ...ADMIN_SET, ...QA_SET, ...PM_SET, ...ALL_CARD_IDS]);

export function validateCoopMissionCardCoverage(tasks: TechnicalTask[]): CoopCoverageIssue[] {
  const out: CoopCoverageIssue[] = [];
  for (const t of tasks) {
    if (t.districtId !== 'coop_yard') continue;
    for (const step of t.steps) {
      const ids = getStepCardIds(step);
      if (ids.length === 0) continue;
      const teamCovered = ids.some((id) => TEAM_SET.has(id));
      if (!teamCovered) {
        out.push({ missionId: t.id, stepId: step.id, requiredCardIds: ids, reason: 'NO_ROLE_COVERAGE' });
        continue;
      }
      const executorCovered = ids.some((id) => EXECUTOR_SET.has(id));
      if (!executorCovered) {
        out.push({ missionId: t.id, stepId: step.id, requiredCardIds: ids, reason: 'NO_EXECUTOR_COVERAGE' });
      }
    }
  }
  return out;
}


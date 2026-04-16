/**
 * «Переигрыш» оппонента: снятие бага подходящим классом инструмента (как в реальной отладке).
 */

import type { BugProblemType } from './combatEnemies';
import type { CombatCard } from './combatCards';

const REFACTOR_IDS = new Set(['react_refactoring', 'react_hotfix', 'react_rollback']);
const TEST_IDS = new Set([
  'react_unit_test',
  'react_integration_test',
  'sp_web_mvctest',
  'sp_mock_mvc',
]);
const DEFENSIVE_IDS = new Set(['def_validator']);
const PM_BUSINESS_IDS = new Set([
  'soft_agile_ceremony',
  'soft_daily_sync',
  'soft_retro_action',
  'soft_scope_cut',
  'soft_stakeholder_alignment',
  'soft_risk_register',
  'soft_release_train',
  'soft_backlog_refine',
  'soft_priority_matrix',
  'soft_team_health',
  'soft_crisis_room',
  'soft_business_case',
  'soft_kpi_dashboard',
  'soft_wip_limit',
  'soft_sprint_goal',
  'soft_unblock_channel',
]);

/** Сильный контр: карта тематически бьёт в тип проблемы на шине. */
export function isOutplayCounter(card: CombatCard, problemType: BugProblemType | undefined): boolean {
  if (!problemType) return false;
  if (card.type === 'DEFENSIVE' || DEFENSIVE_IDS.has(card.id)) {
    if (problemType === 'SYNTAX_ERROR' || problemType === 'LOGIC_GAP') return true;
  }
  if (card.type === 'REACTION') {
    if (problemType === 'TECH_DEBT' && REFACTOR_IDS.has(card.id)) return true;
    if (
      (problemType === 'SYNTAX_ERROR' || problemType === 'LOGIC_GAP' || problemType === 'MEMORY_LEAK') &&
      (TEST_IDS.has(card.id) || card.id === 'react_emergency_flush')
    )
      return true;
    if (problemType === 'FATIGUE' && (card.id === 'react_hotfix' || card.id === 'react_trace_jam')) return true;
  }
  if (card.type === 'SCRIPT') {
    if (problemType === 'LOGIC_GAP' && (card.id === 'script_auth' || card.id === 'script_ping')) return true;
  }
  if (card.type === 'SOFT') {
    if (problemType === 'BUSINESS_RISK' && PM_BUSINESS_IDS.has(card.id)) return true;
  }
  return false;
}

export function problemTypeLabelRu(pt: BugProblemType): string {
  const m: Record<BugProblemType, string> = {
    FATIGUE: 'усталость / перегруз',
    TECH_DEBT: 'техдолг',
    SYNTAX_ERROR: 'синтаксис / контракт',
    LOGIC_GAP: 'логика / ветвление',
    MEMORY_LEAK: 'утечка / ресурсы',
    BUSINESS_RISK: 'бизнес-риск / скоуп',
  };
  return m[pt] ?? pt;
}

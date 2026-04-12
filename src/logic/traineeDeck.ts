import type { CombatCard } from './combatCards';
import { getCardById } from './combatCards';

/**
 * Базовая стартовая колода (соло / дефолт).
 * Колоды четырёх кооп-ролей (dev + язык, QA/PM/Admin + акценты) — в sessionMode + decks/deckCatalog.
 */
export function buildTraineeDeck(): CombatCard[] {
  const starterIds = [
    'script_ping', 'script_grep', 'script_wash_logs', 'script_sudo_fix',
    'script_ls', 'script_cat', 'script_auth',
    'soft_coffee', 'soft_ai_ask',
    'infra_old_hw', 'infra_edge_cache',
    'react_unit_test',
    'react_emergency_flush',
    'react_trace_jam',
    'react_firewall_patch',
    'react_refactoring',
    'def_validator',
  ];
  return starterIds.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
}

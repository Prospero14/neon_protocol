/**
 * Режим сессии: соло или кооп (роль + стартовая колода для коопа).
 * Spring и прочие «библиотеки» в коопе — как у dev: пакеты в deckCatalog; доп. карты выдаются за сегменты полигона (см. coopLobbyRewards).
 */

import type { CombatCard } from './combatCards';
import { getCardById } from './combatCards';
import { buildTraineeDeck } from './traineeDeck';
import {
  DEV_DEFAULT_LIB_PACK,
  LANGUAGE_CORE_IDS,
  LANGUAGE_LIBRARY_PACKS,
  ROLE_SPECIALTY_IDS,
  type DevLanguageStack,
} from './decks/deckCatalog';

export type { DevLanguageStack };
export { DEV_LANGUAGE_STACKS, DEV_LANGUAGE_LABELS } from './decks/deckCatalog';

export type SessionMode = 'solo' | 'coop';

/** Роль в коопе; в соло не используется (null). Минимальная «продуктовая» четвёрка. */
export type CoopRole = 'developer' | 'qa' | 'admin' | 'pm';

/** Порядок: периметр → код → качество → процесс. */
export const COOP_ROLES: CoopRole[] = ['admin', 'developer', 'qa', 'pm'];

/** Только разработчик собирает колоду из языкового ядра / пакетов. */
export const COOP_ROLES_WITH_LANGUAGE_STACK: CoopRole[] = ['developer'];

export const COOP_ROLE_LABELS: Record<CoopRole, { title: string; blurb: string }> = {
  developer: {
    title: 'DEVELOPER',
    blurb:
      'Код и логика (в духе kata/LeetCode): шина, цепочки, прогресс фичи. ИИ давит на ревью и темп поставки.',
  },
  qa: {
    title: 'QA',
    blurb: 'Снятие багов разных классов, реакции и верификация. ИИ чаще давит дефектами и «ICE» на шине.',
  },
  admin: {
    title: 'ADMIN',
    blurb:
      'Инфраструктура: серты, балансировка, прокси, фаерволы, карантин. ИИ бьёт по периметру и стрессу чуть мягче, чем по коду.',
  },
  pm: {
    title: 'PM',
    blurb:
      'Agile-софт: кофе, фокус, парное программирование, буферы. Поддержка команды картами процесса; ИИ давит дедлайном и шумом.',
  },
};

/** Стартовые id карт по роли (Script-Kiddo / Junior, совместимо с ранним боем). */
const COOP_STARTER_IDS: Record<CoopRole, string[]> = {
  developer: [
    'script_ls',
    'script_cat',
    'script_grep',
    'script_auth',
    'script_rm',
    'script_wash_logs',
    'soft_coffee',
    'soft_ai_ask',
    'infra_old_hw',
    'react_refactoring',
    'react_unit_test',
    'react_emergency_flush',
  ],
  qa: [
    'react_unit_test',
    'react_emergency_flush',
    'react_firewall_patch',
    'react_trace_jam',
    'react_null_packet',
    'def_validator',
    'script_grep',
    'script_cat',
    'script_ping',
    'soft_coffee',
    'soft_ai_ask',
    'react_refactoring',
  ],
  admin: [
    'script_ping',
    'script_ssh',
    'script_curl',
    'script_sudo_fix',
    'script_nc',
    'script_auth',
    'script_chmod',
    'script_rm',
    'infra_old_hw',
    'infra_edge_cache',
    'infra_safe_proxy',
    'infra_dns_resolver',
    'infra_basic_pod',
    'infra_quarantine_vm',
    'script_wash_logs',
    'script_ls',
    'soft_coffee',
    'react_firewall_patch',
    'react_trace_jam',
    'def_validator',
  ],
  pm: [
    'soft_coffee',
    'soft_ai_ask',
    'soft_focus',
    'soft_pair_programming',
    'soft_buffer_flush',
    'script_ls',
    'script_cat',
    'script_auth',
    'infra_old_hw',
    'react_unit_test',
    'def_validator',
    'script_ping',
  ],
};

const MAX_COOP_STARTER_CARDS = 14;

function mergeUniqueIdLists(chunks: string[][], max: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const chunk of chunks) {
    for (const id of chunk) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= max) return out;
    }
  }
  return out;
}

/** Только DEVELOPER собирает колоду из языкового ядра / акцентов. */
function coopStarterIdsWithStack(coopRole: CoopRole, stack: DevLanguageStack): string[] {
  if (coopRole === 'developer') {
    const packKey = DEV_DEFAULT_LIB_PACK[stack];
    const pack = LANGUAGE_LIBRARY_PACKS[stack][packKey];
    if (!pack) return COOP_STARTER_IDS.developer;
    return mergeUniqueIdLists([LANGUAGE_CORE_IDS[stack], pack.cardIds], MAX_COOP_STARTER_CARDS);
  }

  return COOP_STARTER_IDS[coopRole];
}

/**
 * @param devLanguageStack — только для developer: Java/Kotlin/Python/Go. Для qa/pm/admin не задаётся.
 */
export function buildStarterDeckForSession(
  mode: SessionMode,
  coopRole: CoopRole | null,
  devLanguageStack?: DevLanguageStack | null
): CombatCard[] {
  if (mode === 'solo' || !coopRole) {
    return buildTraineeDeck();
  }
  let ids: string[];
  if (devLanguageStack != null && coopRole === 'developer') {
    ids = coopStarterIdsWithStack(coopRole, devLanguageStack);
  } else if (coopRole === 'admin' || coopRole === 'qa' || coopRole === 'pm') {
    ids = mergeUniqueIdLists([ROLE_SPECIALTY_IDS[coopRole], COOP_STARTER_IDS[coopRole]], MAX_COOP_STARTER_CARDS);
  } else {
    ids = COOP_STARTER_IDS[coopRole];
  }
  return ids.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
}

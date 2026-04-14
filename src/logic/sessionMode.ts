/**
 * Режим сессии: соло или кооп (роль + стартовая колода для коопа).
 * Spring и прочие «библиотеки» в коопе — как у dev: пакеты в deckCatalog; доп. карты выдаются за сегменты полигона (см. coopLobbyRewards).
 */

import type { CombatCard } from './combatCards';
import { getCardById } from './combatCards';
import { buildTraineeDeck } from './traineeDeck';
import {
  DEV_DEFAULT_LIB_PACK,
  DEVELOPER_STACK_BROWSE_IDS,
  DEVELOPER_STACKS_UNION_IDS,
  LANGUAGE_CORE_IDS,
  LANGUAGE_LIBRARY_PACKS,
  ROLE_ACCENT_PACKS,
  ROLE_DEFAULT_ACCENT,
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
      'Код и терминал по выбранному стеку (Java / Kotlin / Python / Go); без инфры, софта и тестовых реакций — это зоны других ролей. ИИ давит на ревью и темп.',
  },
  qa: {
    title: 'QA',
    blurb:
      'Реакции и тестовая обвязка: юнит, интеграция, валидатор (REACTION / DEFENSIVE — только QA). ИИ давит дефектами и ICE.',
  },
  admin: {
    title: 'ADMIN',
    blurb:
      'Периметр и инфра: shell, прокси, кластеры, карантин (карты инфры и скриптов — только эта роль). ИИ бьёт по периметру.',
  },
  pm: {
    title: 'PM',
    blurb:
      'Процесс и софт-скиллы: дедлайны, буферы, фокус команды (карты SOFT — только PM). ИИ давит сроками и шумом.',
  },
};

/** Стартовые id карт по роли (Script-Kiddo / Junior, совместимо с ранним боем). */
const COOP_STARTER_IDS: Record<CoopRole, string[]> = {
  /** Код и терминал: без инфры, софта, реакций и DEFENSIVE. */
  developer: [
    'script_ls',
    'script_cat',
    'script_grep',
    'script_auth',
    'script_rm',
    'script_wash_logs',
    'syntax_package',
    'syntax_class_decl',
    'syntax_if',
    'fn_sysout_print',
    'syntax_try_catch',
    'syntax_foreach',
  ],
  /** Только REACTION + DEFENSIVE. */
  qa: [
    'react_unit_test',
    'react_emergency_flush',
    'react_firewall_patch',
    'react_trace_jam',
    'react_null_packet',
    'def_validator',
    'react_refactoring',
    'react_integration_test',
    'react_hotfix',
    'react_decoy_ping',
    'react_log_mask',
  ],
  /** Только SCRIPT + INFRASTRUCTURE (периметр, shell). */
  admin: [
    'script_ping',
    'script_ssh',
    'script_curl',
    'script_sudo_fix',
    'script_nc',
    'script_auth',
    'script_chmod',
    'script_rm',
    'script_wash_logs',
    'script_ls',
    'infra_old_hw',
    'infra_edge_cache',
    'infra_safe_proxy',
    'infra_dns_resolver',
    'infra_basic_pod',
    'infra_quarantine_vm',
  ],
  /** Только SOFT. */
  pm: [
    'soft_coffee',
    'soft_ai_ask',
    'soft_focus',
    'soft_pair_programming',
    'soft_buffer_flush',
    'soft_critical_thinking',
    'soft_signal_prediction',
    'soft_deadline_trance',
    'soft_recursive_logic',
    'soft_async_request',
    'soft_throw_ex',
    'soft_finally',
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

/** QA / PM / Admin: specialty + тематический акцент (аналог «библиотеки» у dev) + база роли. */
function coopStarterIdsWithAccent(role: 'qa' | 'pm' | 'admin'): string[] {
  const key = ROLE_DEFAULT_ACCENT[role];
  const pack = ROLE_ACCENT_PACKS[role][key];
  if (!pack) {
    return mergeUniqueIdLists([ROLE_SPECIALTY_IDS[role], COOP_STARTER_IDS[role]], MAX_COOP_STARTER_CARDS);
  }
  return mergeUniqueIdLists(
    [ROLE_SPECIALTY_IDS[role], pack.cardIds, COOP_STARTER_IDS[role]],
    MAX_COOP_STARTER_CARDS
  );
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
    ids = coopStarterIdsWithAccent(coopRole);
  } else {
    ids = COOP_STARTER_IDS[coopRole];
  }
  return ids.map((id) => getCardById(id)).filter((c): c is CombatCard => Boolean(c));
}

function mergeCoopNonDevCatalogIds(role: 'qa' | 'pm' | 'admin'): Set<string> {
  const out = new Set<string>(COOP_STARTER_IDS[role]);
  for (const id of ROLE_SPECIALTY_IDS[role]) out.add(id);
  for (const pack of Object.values(ROLE_ACCENT_PACKS[role])) {
    for (const id of pack.cardIds) out.add(id);
  }
  return out;
}

/** Каталог конструктора / наград: все id, доступные роли QA в коопе. */
export const COOP_QA_CATALOG_IDS: ReadonlySet<string> = mergeCoopNonDevCatalogIds('qa');

/** Каталог конструктора / наград: все id, доступные роли PM в коопе. */
export const COOP_PM_CATALOG_IDS: ReadonlySet<string> = mergeCoopNonDevCatalogIds('pm');

/** Каталог конструктора / наград: все id, доступные роли Admin в коопе. */
export const COOP_ADMIN_CATALOG_IDS: ReadonlySet<string> = mergeCoopNonDevCatalogIds('admin');

/** Объединение QA+PM+Admin: награды вне этих трёх каталогов в конструкторе не скрываются. */
export const COOP_NON_DEV_CATALOG_UNION_IDS: ReadonlySet<string> = new Set<string>([
  ...COOP_QA_CATALOG_IDS,
  ...COOP_PM_CATALOG_IDS,
  ...COOP_ADMIN_CATALOG_IDS,
]);

/** Каталог карт для конструктора колоды в коопе по роли (разработчик — по языковому стеку). */
export function getCoopRoleCatalogIds(
  role: CoopRole,
  devLanguageStack: DevLanguageStack | null
): ReadonlySet<string> {
  if (role === 'developer') {
    return DEVELOPER_STACK_BROWSE_IDS[devLanguageStack ?? 'java'];
  }
  if (role === 'qa') return COOP_QA_CATALOG_IDS;
  if (role === 'pm') return COOP_PM_CATALOG_IDS;
  return COOP_ADMIN_CATALOG_IDS;
}

/** Объединение каталогов для «чужих» dev-стеков vs награды вне стека. */
export function getCoopDeckCatalogUnionIds(role: CoopRole): ReadonlySet<string> {
  return role === 'developer' ? DEVELOPER_STACKS_UNION_IDS : COOP_NON_DEV_CATALOG_UNION_IDS;
}

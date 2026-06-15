/**
 * Режим сессии: соло или кооп (роль + стартовая колода для коопа).
 * Spring и прочие «библиотеки» в коопе — как у dev: пакеты в deckCatalog; доп. карты выдаются за сегменты полигона (см. coopLobbyRewards).
 */

import type { CombatCard } from './combatCards';
import { CARD_LIBRARY, getCardById } from './combatCards';
import { buildTraineeDeck } from './traineeDeck';
import { SPRING_CARD_LIBRARY } from './springCards';
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

export type SessionMode = 'solo' | 'coop' | 'nri';

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
      'Интеграции и контур: БД, кэш, mesh, k8s, балансировка (Nginx / RR / parallel), серты через CI, горизонталь и ресурсы; скрипты — только проводка к инфре.',
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
  /** Инфраструктура в приоритете; скрипты — короткий набор под проводку и синергию PING→SSH. */
  admin: [
    'infra_postgres',
    'infra_db_cluster',
    'infra_redis',
    'infra_kafka_bridge',
    'infra_basic_pod',
    'infra_k8s_cluster',
    'infra_mesh_relay',
    'infra_h_scaling',
    'infra_lb_nginx',
    'infra_lb_round_robin',
    'infra_lb_parallel',
    'infra_dns_resolver',
    'infra_safe_proxy',
    'infra_edge_cache',
    'infra_vpc_network',
    'infra_quarantine_vm',
    'infra_actions_ci',
    'infra_cicd',
    'infra_prometheus',
    'infra_cdn_edge',
    'infra_log_aggregator',
    'infra_s3_bucket',
    'infra_raid_array',
    'infra_docker',
    'infra_old_hw',
    'infra_street_fusion',
    'infra_orbital_uplink',
    'script_ping',
    'script_ssh',
    'script_curl',
    'script_auth',
    'script_grep',
  ],
  /** Только SOFT — упор на снятие стресса и буферы (в коопе это единственный источник карточного релифа). */
  pm: [
    'soft_coffee',
    'soft_tactical_breath',
    'soft_buffer_flush',
    'soft_finally',
    'soft_team_health',
    'soft_pizza_party',
    'soft_crisis_room',
    'soft_support_rotation',
    'soft_release_freeze',
    'soft_cross_team_sync',
    'soft_wip_limit',
    'soft_agile_ceremony',
    'soft_daily_sync',
    'soft_retro_action',
    'soft_backlog_refine',
    'soft_sprint_goal',
    'soft_unblock_channel',
    'soft_stakeholder_alignment',
    'soft_priority_matrix',
    'soft_scope_cut',
    'soft_release_train',
    'soft_risk_register',
    'soft_kpi_dashboard',
    'soft_business_case',
    'soft_dev_pairing',
    'soft_qa_handoff',
    'soft_ops_priority',
    'soft_hard_tradeoff',
    'soft_ai_ask',
    'soft_focus',
    'soft_pair_programming',
    'soft_critical_thinking',
    'soft_signal_prediction',
    'soft_recursive_logic',
    'soft_async_request',
    'soft_throw_ex',
    'soft_deadline_trance',
    'soft_patch_drill',
  ],
};

/** Минимальный размер стартовой колоды в коопе (каждая роль). */
export const COOP_DECK_MIN_CARDS = 30;

/** Верхний предел размера колоды в коопе (конструктор и стартовый набор). */
export const COOP_DECK_MAX_CARDS = 200;

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

/** Добиваем колоду до min уникальных+дублей (до maxPerId копий), только id с реальной картой в билде. */
function padIdsToMinCount(
  baseIds: string[],
  fillerCandidates: string[],
  min: number,
  maxPerId = 3
): string[] {
  const out = [...baseIds];
  const counts = new Map<string, number>();
  for (const id of out) counts.set(id, (counts.get(id) ?? 0) + 1);
  const pool = fillerCandidates.filter((id) => getCardById(id));
  if (pool.length === 0) return out;
  let i = 0;
  let guard = 0;
  while (out.length < min && guard < min * pool.length * 2) {
    guard += 1;
    const id = pool[i % pool.length];
    i += 1;
    const c = counts.get(id) ?? 0;
    if (c >= maxPerId) continue;
    out.push(id);
    counts.set(id, c + 1);
  }
  return out;
}

function finalizeCoopDeckIds(uniqueOrdered: string[], fillerSorted: string[]): string[] {
  const resolvable = uniqueOrdered.filter((id) => getCardById(id));
  if (resolvable.length >= COOP_DECK_MIN_CARDS) {
    return resolvable.slice(0, COOP_DECK_MAX_CARDS);
  }
  const padded = padIdsToMinCount(resolvable, fillerSorted, COOP_DECK_MIN_CARDS);
  return padded.slice(0, COOP_DECK_MAX_CARDS);
}

function collectDeveloperStackIdChunks(stack: DevLanguageStack): string[][] {
  const chunks: string[][] = [LANGUAGE_CORE_IDS[stack], COOP_STARTER_IDS.developer];
  const packKey = DEV_DEFAULT_LIB_PACK[stack];
  const packs = LANGUAGE_LIBRARY_PACKS[stack];
  const primary = packs[packKey];
  if (primary) chunks.push(primary.cardIds);
  for (const key of Object.keys(packs).sort()) {
    if (key === packKey) continue;
    chunks.push(packs[key].cardIds);
  }
  chunks.push([...DEVELOPER_STACK_BROWSE_IDS[stack]].sort());
  return chunks;
}

/** Только DEVELOPER собирает колоду из языкового ядра / акцентов. */
function coopStarterIdsWithStack(coopRole: CoopRole, stack: DevLanguageStack): string[] {
  if (coopRole !== 'developer') return COOP_STARTER_IDS[coopRole];
  const unique = mergeUniqueIdLists(collectDeveloperStackIdChunks(stack), 9999);
  const filler = [...DEVELOPER_STACK_BROWSE_IDS[stack]].sort();
  return finalizeCoopDeckIds(unique, filler);
}

function collectNonDevIdChunks(role: 'qa' | 'pm' | 'admin'): string[][] {
  /** Админ: сначала все тематические пакеты интеграций, потом specialty и база — чтобы в колоде доминировала INFRA. */
  if (role === 'admin') {
    const accentOrder = [
      'storage_backup',
      'messaging',
      'cluster_mesh',
      'ingress_lb',
      'perimeter_hardening',
      'incident_response',
    ] as const;
    const chunks: string[][] = [];
    for (const pk of accentOrder) {
      const pack = ROLE_ACCENT_PACKS.admin[pk as keyof typeof ROLE_ACCENT_PACKS.admin];
      if (pack) chunks.push(pack.cardIds);
    }
    for (const pk of Object.keys(ROLE_ACCENT_PACKS.admin)) {
      if ((accentOrder as readonly string[]).includes(pk)) continue;
      chunks.push(ROLE_ACCENT_PACKS.admin[pk as keyof typeof ROLE_ACCENT_PACKS.admin].cardIds);
    }
    chunks.push(ROLE_SPECIALTY_IDS.admin);
    chunks.push(COOP_STARTER_IDS.admin);
    chunks.push([...mergeCoopNonDevCatalogIds(role)].sort());
    return chunks;
  }

  const chunks: string[][] = [ROLE_SPECIALTY_IDS[role], COOP_STARTER_IDS[role]];
  const key = ROLE_DEFAULT_ACCENT[role];
  const primary = ROLE_ACCENT_PACKS[role][key];
  if (primary) chunks.push(primary.cardIds);
  for (const pk of Object.keys(ROLE_ACCENT_PACKS[role]).sort()) {
    if (pk === key) continue;
    chunks.push(ROLE_ACCENT_PACKS[role][pk].cardIds);
  }
  chunks.push([...mergeCoopNonDevCatalogIds(role)].sort());
  return chunks;
}

/** QA / PM / Admin: specialty + тематический акцент (аналог «библиотеки» у dev) + база роли. */
function coopStarterIdsWithAccent(role: 'qa' | 'pm' | 'admin'): string[] {
  const unique = mergeUniqueIdLists(collectNonDevIdChunks(role), 9999);
  const filler = [...mergeCoopNonDevCatalogIds(role)].sort();
  return finalizeCoopDeckIds(unique, filler);
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
  if (coopRole === 'developer') {
    ids = coopStarterIdsWithStack(coopRole, devLanguageStack ?? 'java');
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

/**
 * Все карты из билда, попадающие в кооп-каталог роли (для справочника: показать запись / замок).
 * У developer в пул добавляется Spring-библиотека, если id есть в каталоге стека.
 */
export function buildCoopProtocolDocCards(
  role: CoopRole,
  devLanguageStack: DevLanguageStack | null
): CombatCard[] {
  const stack = role === 'developer' ? (devLanguageStack ?? 'java') : null;
  const cat = getCoopRoleCatalogIds(role, stack);
  const pool: CombatCard[] = [...CARD_LIBRARY];
  if (role === 'developer') pool.push(...SPRING_CARD_LIBRARY);
  const seen = new Set<string>();
  const out: CombatCard[] = [];
  for (const c of pool) {
    if (!cat.has(c.id) || seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return out;
}

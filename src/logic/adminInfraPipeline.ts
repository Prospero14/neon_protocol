/**
 * Порядок карт INFRA для фазы снабжения админа: «сервер и периметр» → данные → вынос → релизный контур.
 * Id не из колоды просто пропускаются при сортировке.
 */

import type { CombatCard } from './combatCards';

export const ADMIN_SUPPLY_PIPELINE_ORDER: string[] = [
  'infra_old_hw',
  'infra_quarantine_vm',
  'infra_vpc_network',
  'infra_docker',
  'infra_basic_pod',
  'infra_k8s_cluster',
  'infra_mesh_relay',
  'infra_h_scaling',
  'infra_dns_resolver',
  'infra_safe_proxy',
  'infra_edge_cache',
  'infra_postgres',
  'infra_db_cluster',
  'infra_redis',
  'infra_kafka_bridge',
  'infra_lb_round_robin',
  'infra_lb_parallel',
  'infra_lb_nginx',
  'infra_cdn_edge',
  'infra_actions_ci',
  'infra_cicd',
  'infra_prometheus',
  'infra_log_aggregator',
  'infra_s3_bucket',
  'infra_raid_array',
  'infra_street_fusion',
  'infra_orbital_uplink',
];

export function sortInfraCardsForAdminSupply(cards: CombatCard[]): CombatCard[] {
  const rank = (id: string) => {
    const i = ADMIN_SUPPLY_PIPELINE_ORDER.indexOf(id);
    return i === -1 ? 800 : i;
  };
  return [...cards].sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}

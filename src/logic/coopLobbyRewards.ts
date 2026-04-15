/**
 * Награды кооп-полигона: каждые COOP_SEGMENT_SIZE обычных миссий текущего ранга — пак карт для роли.
 * До COOP_MILESTONE_MAX_SEGMENTS сегментов на ранг (5×6 = 30 миссий до босса).
 */

import type { CoopRole } from './sessionMode';
import type { SkillMode } from './skillMode';
import { bossTaskIdForTier, tierRankToMissionPrefix } from './coopYardRuntime';

export const COOP_SEGMENT_SIZE = 5;
export const COOP_MILESTONE_MAX_SEGMENTS = 6;

/** Число обычных миссий полигона для данного ранга (без босса). */
export function coopRegularClearCountForTier(ids: string[], tierRank: SkillMode): number {
  const p = tierRankToMissionPrefix(tierRank);
  const re = new RegExp(`^coop_yard_${p}_\\d{3}$`);
  return ids.filter((id) => re.test(id)).length;
}

/** Карты за сегмент s ∈ [0 .. COOP_MILESTONE_MAX_SEGMENTS-1]; Spring — как одна из библиотек в ротации dev. */
export function coopRewardCardIdsForSegment(role: CoopRole, segmentIndex: number): string[] {
  const s = Math.max(0, Math.min(COOP_MILESTONE_MAX_SEGMENTS - 1, segmentIndex));
  if (role === 'developer') {
    const devRot: string[][] = [
      ['lib_spring_repo', 'script_curl'],
      ['lib_lombok_data', 'script_auth'],
      ['mid_stream_map', 'mid_stream_filter'],
      ['mid_stream_collect', 'script_grep'],
      ['lib_commons_blank', 'script_wash_logs'],
      ['mid_stream_collect', 'script_scp'],
    ];
    return devRot[s] ?? devRot[0];
  }
  if (role === 'qa') {
    const qa: string[][] = [
      ['react_integration_test', 'react_null_packet'],
      ['react_trace_jam', 'def_validator'],
      ['react_firewall_patch', 'react_refactoring'],
      ['react_emergency_flush', 'react_unit_test'],
      ['react_spoof_id', 'react_log_mask'],
      ['react_integration_test', 'react_firewall_patch'],
    ];
    return qa[s] ?? qa[0];
  }
  if (role === 'admin') {
    const ad: string[][] = [
      ['infra_quarantine_vm', 'infra_vpc_network'],
      ['infra_safe_proxy', 'infra_dns_resolver'],
      ['infra_mesh_relay', 'infra_basic_pod'],
      ['script_chmod', 'script_rm'],
      ['infra_edge_cache', 'infra_old_hw'],
      ['infra_log_aggregator', 'infra_actions_ci'],
    ];
    return ad[s] ?? ad[0];
  }
  if (role === 'pm') {
    const pm: string[][] = [
      ['soft_deadline_trance', 'soft_signal_prediction'],
      ['soft_critical_thinking', 'soft_buffer_flush'],
      ['soft_pair_programming', 'soft_focus'],
      ['soft_tactical_breath', 'soft_patch_drill'],
      ['soft_coffee', 'soft_ai_ask'],
      ['soft_recursive_logic', 'soft_async_request'],
    ];
    return pm[s] ?? pm[0];
  }
  return [];
}

export function shouldGrantCoopSegmentReward(
  missionTaskId: string,
  prevIds: string[],
  nextIds: string[],
  tierRank: SkillMode
): { segmentIndex: number } | null {
  if (missionTaskId === bossTaskIdForTier(tierRank)) return null;
  const prevC = coopRegularClearCountForTier(prevIds, tierRank);
  const nextC = coopRegularClearCountForTier(nextIds, tierRank);
  if (nextC <= prevC) return null;
  if (nextC % COOP_SEGMENT_SIZE !== 0) return null;
  if (nextC > COOP_SEGMENT_SIZE * COOP_MILESTONE_MAX_SEGMENTS) return null;
  const segmentIndex = nextC / COOP_SEGMENT_SIZE - 1;
  return { segmentIndex };
}

/** Множитель ранга для Bits за сегмент (не «золотой дождь»: магазины коопа дорогие). */
const COOP_TIER_BIT_MULT: Record<SkillMode, number> = {
  'script-kiddie': 1,
  junior: 1.12,
  mid: 1.28,
  senior: 1.45,
};

/**
 * Дополнительные Bits при закрытии сегмента (наряду с картами).
 * Формула: база растёт с номером сегмента, затем × множитель ранга, floor — целые Bits.
 */
export function coopSegmentBitsBonus(tierRank: SkillMode, segmentIndex: number): number {
  const s = Math.max(0, Math.min(COOP_MILESTONE_MAX_SEGMENTS - 1, segmentIndex));
  const base = 38 + s * 22;
  const m = COOP_TIER_BIT_MULT[tierRank] ?? 1;
  return Math.floor(base * m);
}

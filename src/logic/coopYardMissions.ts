/**
 * Пул из 100 сгенерированных ТЗ для CO-OP YARD (25 на ранг) + босс на ранг.
 * После первых 10 junior-миссий включается codewars source (long-run).
 */

import { CODEWARS_TEMPLATES } from './coopCodewarsPool';
import { CARD_LIBRARY } from './combatCards';

const YARD = 'coop_yard' as const;
type Rank = 'script-kiddie' | 'junior' | 'mid' | 'senior';

interface TZStep {
  id: string;
  name: string;
  requiredCardId?: string;
  requiredCardIds?: string[];
}

interface GenTask {
  id: string;
  name: string;
  description: string;
  steps: TZStep[];
  rank: Rank;
  isExecutionChain?: boolean;
  districtId?: string;
  source?: 'coop_yard' | 'codewars';
  track?: string;
  intensityTier?: 1 | 2 | 3 | 4;
}

const RANKS: Rank[] = ['script-kiddie', 'junior', 'mid', 'senior'];
const PER_RANK = 25;
const JUNIOR_INTRO_MISSIONS = 10;

const STEP_TARGET: Record<Rank, number> = {
  'script-kiddie': 10,
  junior: 10,
  mid: 12,
  senior: 16,
};
const KNOWN_CARD_IDS = new Set<string>(CARD_LIBRARY.map((c) => c.id));
const RANK_FALLBACK_CARD: Record<Rank, string> = {
  'script-kiddie': 'script_ls',
  junior: 'syntax_class_decl',
  mid: 'syntax_method_decl',
  senior: 'syntax_method_decl',
};

const JUNIOR_INTRO_CHAINS: TZStep[][] = [
  [
    { id: 'a', name: 'PACKAGE', requiredCardIds: ['syntax_package'] },
    { id: 'b', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'c', name: 'MAIN', requiredCardIds: ['syntax_main_method'] },
    { id: 'd', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
    { id: 'e', name: 'IF_GUARD', requiredCardIds: ['syntax_if'] },
    { id: 'f', name: 'LOOP', requiredCardIds: ['syntax_foreach'] },
    { id: 'g', name: 'STREAM_INIT', requiredCardIds: ['mid_stream_init'] },
    { id: 'h', name: 'STREAM_FILTER', requiredCardIds: ['mid_stream_filter'] },
    { id: 'i', name: 'STREAM_COLLECT', requiredCardIds: ['mid_stream_collect'] },
    { id: 'j', name: 'OUTPUT', requiredCardIds: ['fn_sysout_print', 'lib_commons_blank'] },
  ],
  [
    { id: 'a', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'b', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
    { id: 'c', name: 'TRY', requiredCardIds: ['syntax_try_catch'] },
    { id: 'd', name: 'IF_GUARD', requiredCardIds: ['syntax_if'] },
    { id: 'e', name: 'MAP_PUT', requiredCardIds: ['fn_map_put'] },
    { id: 'f', name: 'SET_ADD', requiredCardIds: ['fn_set_add'] },
    { id: 'g', name: 'IMPORT_NETWORK', requiredCardIds: ['lib_network'] },
    { id: 'h', name: 'PING_GATEWAY', requiredCardIds: ['fn_ping'] },
    { id: 'i', name: 'LOG_SCAN', requiredCardIds: ['script_grep', 'script_cat'] },
    { id: 'j', name: 'OUT', requiredCardIds: ['fn_sysout_print'] },
  ],
  [
    { id: 'a', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'b', name: 'EXTENDS', requiredCardIds: ['oop_extends'] },
    { id: 'c', name: 'SUPER', requiredCardIds: ['oop_super_call'] },
    { id: 'd', name: 'INTERFACE', requiredCardIds: ['oop_interface'] },
    { id: 'e', name: 'IMPLEMENTS', requiredCardIds: ['syntax_implements'] },
    { id: 'f', name: 'OVERRIDE', requiredCardIds: ['syntax_override'] },
    { id: 'g', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
    { id: 'h', name: 'ANNOT', requiredCardIds: ['syntax_annotation'] },
    { id: 'i', name: 'COND', requiredCardIds: ['syntax_if'] },
    { id: 'j', name: 'RETURN', requiredCardIds: ['syntax_return_true', 'syntax_return_false'] },
  ],
];

const RANK_BASE_PATTERNS: Record<Rank, TZStep[][]> = {
  'script-kiddie': [
    [
      { id: 'a', name: 'LS', requiredCardIds: ['script_ls'] },
      { id: 'b', name: 'CAT', requiredCardIds: ['script_cat'] },
      { id: 'c', name: 'GREP', requiredCardIds: ['script_grep'] },
    ],
    [
      { id: 'a', name: 'SSH', requiredCardIds: ['script_ssh'] },
      { id: 'b', name: 'AUTH', requiredCardIds: ['script_auth'] },
      { id: 'c', name: 'CURL', requiredCardIds: ['script_curl'] },
      { id: 'd', name: 'WASH', requiredCardIds: ['script_wash_logs'] },
    ],
  ],
  junior: JUNIOR_INTRO_CHAINS,
  mid: [
    [
      { id: 'a', name: 'IFACE', requiredCardIds: ['oop_interface'] },
      { id: 'b', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'c', name: 'IMPL', requiredCardIds: ['syntax_implements'] },
      { id: 'd', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
      { id: 'e', name: 'OVERRIDE', requiredCardIds: ['syntax_override'] },
      { id: 'f', name: 'SOCKET', requiredCardIds: ['fn_socket'] },
    ],
  ],
  senior: [
    [
      { id: 'a', name: 'IFACE', requiredCardIds: ['oop_interface'] },
      { id: 'b', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'c', name: 'IMPL', requiredCardIds: ['syntax_implements'] },
      { id: 'd', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
      { id: 'e', name: 'FOREACH', requiredCardIds: ['syntax_foreach'] },
      { id: 'f', name: 'RETURN', requiredCardIds: ['syntax_return_true', 'syntax_return_false'] },
      { id: 'g', name: 'SOCKET', requiredCardIds: ['fn_socket'] },
      { id: 'h', name: 'EXPLOIT', requiredCardIds: ['fn_exploit'] },
    ],
  ],
};

const BOSS_STEPS: Record<Rank, TZStep[]> = {
  'script-kiddie': [
    { id: 'b1', name: 'PROXY', requiredCardIds: ['infra_safe_proxy', 'infra_edge_cache'] },
    { id: 'b2', name: 'LS', requiredCardIds: ['script_ls'] },
    { id: 'b3', name: 'GREP', requiredCardIds: ['script_grep'] },
    { id: 'b4', name: 'CAT', requiredCardIds: ['script_cat'] },
    { id: 'b5', name: 'EXFIL', requiredCardIds: ['script_scp', 'script_curl', 'script_ssh'] },
    { id: 'b6', name: 'FIX', requiredCardIds: ['script_sudo_fix', 'script_auth'] },
    { id: 'b7', name: 'CLEANUP', requiredCardIds: ['script_wash_logs', 'script_rm'] },
    { id: 'b8', name: 'VERIFY', requiredCardIds: ['script_ping', 'script_nc'] },
    { id: 'b9', name: 'MASK', requiredCardIds: ['script_sed', 'script_chmod'] },
    { id: 'b10', name: 'CLOSE', requiredCardIds: ['script_cat'] },
  ],
  junior: [
    { id: 'b1', name: 'PKG', requiredCardIds: ['syntax_package'] },
    { id: 'b2', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'b3', name: 'MAIN', requiredCardIds: ['syntax_main_method'] },
    { id: 'b4', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
    { id: 'b5', name: 'LOOP', requiredCardIds: ['syntax_foreach'] },
    { id: 'b6', name: 'IF', requiredCardIds: ['syntax_if'] },
    { id: 'b7', name: 'NET', requiredCardIds: ['lib_network'] },
    { id: 'b8', name: 'FILTER', requiredCardIds: ['mid_stream_filter', 'script_grep'] },
    { id: 'b9', name: 'COLLECT', requiredCardIds: ['mid_stream_collect'] },
    { id: 'b10', name: 'OUT', requiredCardIds: ['fn_sysout_print'] },
  ],
  mid: [
    { id: 'b1', name: 'IFACE', requiredCardIds: ['oop_interface'] },
    { id: 'b2', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'b3', name: 'IMPL', requiredCardIds: ['syntax_implements'] },
    { id: 'b4', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
    { id: 'b5', name: 'OVERRIDE', requiredCardIds: ['syntax_override'] },
    { id: 'b6', name: 'TRY', requiredCardIds: ['syntax_try_catch'] },
    { id: 'b7', name: 'MAP', requiredCardIds: ['fn_map_put'] },
    { id: 'b8', name: 'SET', requiredCardIds: ['fn_set_add'] },
    { id: 'b9', name: 'SOCKET', requiredCardIds: ['fn_socket'] },
    { id: 'b10', name: 'STREAM_INIT', requiredCardIds: ['mid_stream_init'] },
    { id: 'b11', name: 'STREAM_MAP', requiredCardIds: ['mid_stream_map'] },
    { id: 'b12', name: 'STREAM_COLLECT', requiredCardIds: ['mid_stream_collect'] },
  ],
  senior: [
    { id: 'b1', name: 'IFACE', requiredCardIds: ['oop_interface'] },
    { id: 'b2', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'b3', name: 'IMPL', requiredCardIds: ['syntax_implements'] },
    { id: 'b4', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
    { id: 'b5', name: 'FOREACH', requiredCardIds: ['syntax_foreach'] },
    { id: 'b6', name: 'IF', requiredCardIds: ['syntax_if'] },
    { id: 'b7', name: 'SET', requiredCardIds: ['fn_set_add'] },
    { id: 'b8', name: 'CONTAINS', requiredCardIds: ['fn_set_contains'] },
    { id: 'b9', name: 'MAP', requiredCardIds: ['fn_map_put'] },
    { id: 'b10', name: 'STREAM_INIT', requiredCardIds: ['mid_stream_init'] },
    { id: 'b11', name: 'STREAM_FILTER', requiredCardIds: ['mid_stream_filter'] },
    { id: 'b12', name: 'STREAM_MAP', requiredCardIds: ['mid_stream_map'] },
    { id: 'b13', name: 'STREAM_COLLECT', requiredCardIds: ['mid_stream_collect'] },
    { id: 'b14', name: 'SYNC', requiredCardIds: ['syntax_synchronized'] },
    { id: 'b15', name: 'SOCKET', requiredCardIds: ['fn_socket'] },
    { id: 'b16', name: 'EXPLOIT', requiredCardIds: ['fn_exploit'] },
  ],
};

function rankTag(r: Rank): string {
  if (r === 'script-kiddie') return 'sk';
  if (r === 'junior') return 'ju';
  if (r === 'mid') return 'mi';
  return 'se';
}

function normalizeRequiredIds(rank: Rank, ids: string[] | undefined): string[] {
  const valid = (ids ?? []).filter((id) => KNOWN_CARD_IDS.has(id));
  if (valid.length > 0) return valid;
  return [RANK_FALLBACK_CARD[rank]];
}

function inflateSteps(base: TZStep[], target: number, offset: number, rank: Rank): TZStep[] {
  const out: TZStep[] = [];
  let i = 0;
  while (out.length < target) {
    const src = base[i % base.length];
    out.push({
      ...src,
      id: `${src.id}_${offset}_${i}`,
      requiredCardIds: normalizeRequiredIds(rank, src.requiredCardIds),
    });
    i += 1;
  }
  return out;
}

function buildCodewarsSteps(rank: Rank, missionIndex: number): { steps: TZStep[]; track: string; intensityTier: 1 | 2 | 3 | 4; title: string; summary: string } {
  const pool = CODEWARS_TEMPLATES.filter((t) => t.rank === rank);
  const tpl = pool[missionIndex % pool.length] ?? CODEWARS_TEMPLATES[0];
  const targetLen = STEP_TARGET[rank];
  const steps = inflateSteps(
    tpl.stepCardGroups.map((g, idx) => ({ id: `cw_${idx}`, name: `CW_STEP_${idx + 1}`, requiredCardIds: g })),
    targetLen,
    missionIndex,
    rank,
  );
  return { steps, track: tpl.track, intensityTier: tpl.intensityTier, title: tpl.kataTitle, summary: tpl.kataSummary };
}

/** 100 обычных + 4 боссовых ТЗ для полигона. */
export function generateCoopYardMissionPool(): GenTask[] {
  const out: GenTask[] = [];
  for (const rank of RANKS) {
    const patterns = RANK_BASE_PATTERNS[rank];
    for (let i = 0; i < PER_RANK; i++) {
      const missionNo = i + 1;
      const id = `coop_yard_${rankTag(rank)}_${String(missionNo).padStart(3, '0')}`;
      const isJuniorIntro = rank === 'junior' && missionNo <= JUNIOR_INTRO_MISSIONS;
      if (isJuniorIntro) {
        const base = patterns[i % patterns.length];
        out.push({
          id,
          name: `YARD_${rankTag(rank).toUpperCase()}_INTRO_${String(missionNo).padStart(3, '0')}`,
          rank,
          districtId: YARD,
          isExecutionChain: true,
          source: 'coop_yard',
          track: 'junior_foundation',
          intensityTier: 2,
          description: `Intro-цепочка junior ${missionNo}/${JUNIOR_INTRO_MISSIONS}: расширенный onboarding на 10+ шагов перед длинными катами.`,
          steps: inflateSteps(base, STEP_TARGET.junior, i, rank),
        });
        continue;
      }
      const cw = buildCodewarsSteps(rank, i);
      out.push({
        id,
        name: `CW_${rankTag(rank).toUpperCase()}_${String(missionNo).padStart(3, '0')} :: ${cw.title}`,
        rank,
        districtId: YARD,
        isExecutionChain: true,
        source: 'codewars',
        track: cw.track,
        intensityTier: cw.intensityTier,
        description: `[Codewars/${rank}] ${cw.summary}`,
        steps: cw.steps,
      });
    }
    const br = rankTag(rank);
    out.push({
      id: `coop_yard_boss_${br}`,
      name: `YARD_BOSS_${br.toUpperCase()}_GATE`,
      rank,
      districtId: YARD,
      isExecutionChain: true,
      source: 'coop_yard',
      track: 'release_gate',
      intensityTier: rank === 'senior' ? 4 : rank === 'mid' ? 3 : 2,
      description: `БОСС-СМЕНА [${rank}]: после ${PER_RANK} миссий команда проходит «ворота релиза». Один длинный прогон.`,
      steps: BOSS_STEPS[rank].map((s, j) => ({
        ...s,
        id: `boss_${br}_${j}`,
        requiredCardIds: normalizeRequiredIds(rank, s.requiredCardIds),
      })),
    });
  }
  return out;
}

export const COOP_YARD_MISSIONS_PER_TIER = PER_RANK;
export const COOP_YARD_JUNIOR_INTRO_MISSIONS = JUNIOR_INTRO_MISSIONS;

/** Ноды полигона → срез индексов миссий 0..24 в отсортированном списке тира. */
export const COOP_NODE_MISSION_SLICES: Record<string, [number, number]> = {
  coop_cp_light: [0, 6],
  coop_cp_medium: [6, 12],
  coop_cp_heavy: [12, 18],
  coop_cp_elite: [18, 25],
};

/**
 * Пул из 100 сгенерированных ТЗ для CO-OP YARD (25 на ранг) + босс на ранг.
 * Типы дублируют форму TechnicalTask, чтобы не импортировать combatTasks (цикл).
 */

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
}

const RANKS: Rank[] = ['script-kiddie', 'junior', 'mid', 'senior'];
const PER_RANK = 25;

/** Шаблоны шагов по рангам (циклически). */
const PATTERNS: Record<Rank, TZStep[][]> = {
  'script-kiddie': [
    [
      { id: 'a', name: 'LS', requiredCardIds: ['script_ls'] },
      { id: 'b', name: 'CAT', requiredCardIds: ['script_cat'] },
    ],
    [
      { id: 'a', name: 'LS', requiredCardIds: ['script_ls'] },
      { id: 'b', name: 'GREP', requiredCardIds: ['script_grep', 'def_validator', 'script_ping'] },
      { id: 'c', name: 'CAT', requiredCardIds: ['script_cat'] },
    ],
    [
      { id: 'a', name: 'PING', requiredCardIds: ['script_ping'] },
      { id: 'b', name: 'GREP', requiredCardIds: ['script_grep'] },
    ],
    [
      { id: 'a', name: 'SSH', requiredCardIds: ['script_ssh'] },
      { id: 'b', name: 'AUTH', requiredCardIds: ['script_auth'] },
      { id: 'c', name: 'CAT', requiredCardIds: ['script_cat'] },
    ],
    [
      { id: 'a', name: 'EDGE', requiredCardIds: ['infra_old_hw', 'infra_edge_cache', 'infra_safe_proxy'] },
      { id: 'b', name: 'LS', requiredCardIds: ['script_ls'] },
      { id: 'c', name: 'FIX', requiredCardIds: ['script_sudo_fix', 'script_auth'] },
    ],
  ],
  junior: [
    [
      { id: 'a', name: 'PACKAGE', requiredCardIds: ['syntax_package'] },
      { id: 'b', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'c', name: 'MAIN', requiredCardIds: ['syntax_main_method'] },
    ],
    [
      { id: 'a', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'b', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
      { id: 'c', name: 'OUT', requiredCardIds: ['fn_sysout_print', 'lib_commons_blank'] },
    ],
    [
      { id: 'a', name: 'IMPORT', requiredCardIds: ['lib_network'] },
      { id: 'b', name: 'PING', requiredCardIds: ['fn_ping'] },
    ],
    [
      { id: 'a', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'b', name: 'OVERRIDE', requiredCardIds: ['syntax_override'] },
    ],
    [
      { id: 'a', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'b', name: 'EXTENDS', requiredCardIds: ['oop_extends'] },
      { id: 'c', name: 'SUPER', requiredCardIds: ['oop_super_call'] },
    ],
  ],
  mid: [
    [
      { id: 'a', name: 'IFACE', requiredCardIds: ['oop_interface'] },
      { id: 'b', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'c', name: 'IMPL', requiredCardIds: ['syntax_implements'] },
    ],
    [
      { id: 'a', name: 'SOCKET', requiredCardIds: ['fn_socket'] },
    ],
    [
      { id: 'a', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'b', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
      { id: 'c', name: 'OVERRIDE', requiredCardIds: ['syntax_override'] },
    ],
    [
      { id: 'a', name: 'ANNOT', requiredCardIds: ['syntax_annotation'] },
      { id: 'b', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
    ],
    [
      { id: 'a', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'b', name: 'FOREACH', requiredCardIds: ['syntax_foreach'] },
      { id: 'c', name: 'IF', requiredCardIds: ['syntax_if'] },
    ],
  ],
  senior: [
    [
      { id: 'a', name: 'IFACE', requiredCardIds: ['oop_interface'] },
      { id: 'b', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'c', name: 'IMPL', requiredCardIds: ['syntax_implements'] },
    ],
    [
      { id: 'a', name: 'EXPLOIT', requiredCardIds: ['fn_exploit'] },
    ],
    [
      { id: 'a', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'b', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
      { id: 'c', name: 'RETURN', requiredCardIds: ['syntax_return_true'] },
      { id: 'd', name: 'LOOP', requiredCardIds: ['syntax_foreach'] },
    ],
    [
      { id: 'a', name: 'REFL', requiredCardIds: ['syntax_annotation'] },
      { id: 'b', name: 'INVOKE', requiredCardIds: ['syntax_method_decl'] },
    ],
    [
      { id: 'a', name: 'SECURE', requiredCardIds: ['fn_socket'] },
      { id: 'b', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
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
  ],
  junior: [
    { id: 'b1', name: 'PKG', requiredCardIds: ['syntax_package'] },
    { id: 'b2', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'b3', name: 'MAIN', requiredCardIds: ['syntax_main_method'] },
    { id: 'b4', name: 'NET', requiredCardIds: ['lib_network'] },
    { id: 'b5', name: 'OUT', requiredCardIds: ['fn_sysout_print'] },
  ],
  mid: [
    { id: 'b1', name: 'IFACE', requiredCardIds: ['oop_interface'] },
    { id: 'b2', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'b3', name: 'IMPL', requiredCardIds: ['syntax_implements'] },
    { id: 'b4', name: 'SOCKET', requiredCardIds: ['fn_socket'] },
    { id: 'b5', name: 'OVERRIDE', requiredCardIds: ['syntax_override'] },
  ],
  senior: [
    { id: 'b1', name: 'IFACE', requiredCardIds: ['oop_interface'] },
    { id: 'b2', name: 'CLASS', requiredCardIds: ['syntax_class_decl'] },
    { id: 'b3', name: 'IMPL', requiredCardIds: ['syntax_implements'] },
    { id: 'b4', name: 'EXPLOIT', requiredCardIds: ['fn_exploit'] },
    { id: 'b5', name: 'CHAIN', requiredCardIds: ['syntax_method_decl', 'syntax_foreach'] },
  ],
};

function rankTag(r: Rank): string {
  switch (r) {
    case 'script-kiddie':
      return 'sk';
    case 'junior':
      return 'ju';
    case 'mid':
      return 'mi';
    case 'senior':
      return 'se';
    default:
      return 'sk';
  }
}

/** 100 обычных + 4 боссовых ТЗ для полигона. */
export function generateCoopYardMissionPool(): GenTask[] {
  const out: GenTask[] = [];
  let n = 0;
  for (const rank of RANKS) {
    const patterns = PATTERNS[rank];
    for (let i = 0; i < PER_RANK; i++) {
      n += 1;
      const pat = patterns[i % patterns.length];
      const steps = pat.map((s, j) => ({ ...s, id: `${s.id}_${i}_${j}` }));
      out.push({
        id: `coop_yard_${rankTag(rank)}_${String(i + 1).padStart(3, '0')}`,
        name: `YARD_${rankTag(rank).toUpperCase()}_RUN_${String(i + 1).padStart(3, '0')}`,
        rank,
        districtId: YARD,
        isExecutionChain: true,
        description: `Спринт-полигон [${rank}] — миссия ${i + 1}/${PER_RANK}. Выполните цепочку на шине без срыва контракта.`,
        steps,
      });
    }
    const br = rankTag(rank);
    out.push({
      id: `coop_yard_boss_${br}`,
      name: `YARD_BOSS_${br.toUpperCase()}_GATE`,
      rank,
      districtId: YARD,
      isExecutionChain: true,
      description: `БОСС-СМЕНА [${rank}]: после ${PER_RANK} миссий команда проходит «ворота релиза». Один длинный прогон.`,
      steps: BOSS_STEPS[rank].map((s, j) => ({ ...s, id: `boss_${br}_${j}` })),
    });
  }
  return out;
}

export const COOP_YARD_MISSIONS_PER_TIER = PER_RANK;

/** Ноды полигона → срез индексов миссий 0..24 в отсортированном списке тира. */
export const COOP_NODE_MISSION_SLICES: Record<string, [number, number]> = {
  coop_cp_light: [0, 6],
  coop_cp_medium: [6, 12],
  coop_cp_heavy: [12, 18],
  coop_cp_elite: [18, 25],
};
